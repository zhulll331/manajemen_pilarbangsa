import crypto from 'node:crypto';
import zlib from 'node:zlib';
import {
  ADMIN_FRAME_REQUIRED_HEIGHT,
  ADMIN_FRAME_REQUIRED_WIDTH,
  type AdminFrameValidationResult,
  analyzeFrameRgbaPixels,
  validateAdminFrameHeader,
} from './validation.ts';

export interface ServerVerifiedPngFrame extends AdminFrameValidationResult {
  checksum?: string;
  byteSize: number;
  mimeType: 'image/png';
}

function paethPredictor(a: number, b: number, c: number): number {
  const p = a + b - c;
  const pa = Math.abs(p - a);
  const pb = Math.abs(p - b);
  const pc = Math.abs(p - c);
  if (pa <= pb && pa <= pc) return a;
  if (pb <= pc) return b;
  return c;
}

/**
 * Dekoder PNG murni berbasis node:zlib untuk mengekstrak buffer RGBA 1080x1080
 * tanpa bergantung pada binary eksternal, dilengkapi batas anti-decompression-bomb.
 */
function decodePngToRgbaWithZlib(bytes: Uint8Array): {
  width: number;
  height: number;
  rgba: Uint8Array;
} | null {
  let offset = 8;
  let width = 0;
  let height = 0;
  let bitDepth = 0;
  let colorType = 0;
  let interlace = 0;
  let palette: Uint8Array | null = null;
  let trns: Uint8Array | null = null;
  const idatParts: Uint8Array[] = [];

  while (offset + 8 <= bytes.length) {
    const view = new DataView(bytes.buffer, bytes.byteOffset + offset, 8);
    const length = view.getUint32(0, false);
    const type = String.fromCharCode(
      bytes[offset + 4],
      bytes[offset + 5],
      bytes[offset + 6],
      bytes[offset + 7]
    );
    const dataStart = offset + 8;
    const dataEnd = dataStart + length;
    if (dataEnd + 4 > bytes.length) break;

    if (type === 'IHDR' && length >= 13) {
      const ihdr = new DataView(bytes.buffer, bytes.byteOffset + dataStart, 13);
      width = ihdr.getUint32(0, false);
      height = ihdr.getUint32(4, false);
      bitDepth = bytes[dataStart + 8];
      colorType = bytes[dataStart + 9];
      interlace = bytes[dataStart + 12];
    } else if (type === 'PLTE') {
      palette = bytes.subarray(dataStart, dataEnd);
    } else if (type === 'tRNS') {
      trns = bytes.subarray(dataStart, dataEnd);
    } else if (type === 'IDAT') {
      idatParts.push(bytes.subarray(dataStart, dataEnd));
    } else if (type === 'IEND') {
      break;
    }

    offset = dataEnd + 4;
  }

  if (
    width !== ADMIN_FRAME_REQUIRED_WIDTH ||
    height !== ADMIN_FRAME_REQUIRED_HEIGHT ||
    interlace !== 0 ||
    bitDepth !== 8 ||
    idatParts.length === 0
  ) {
    return null;
  }

  const channels =
    colorType === 6 ? 4 : colorType === 2 ? 3 : colorType === 4 ? 2 : colorType === 0 || colorType === 3 ? 1 : 0;
  if (channels === 0) return null;

  const totalIdatLen = idatParts.reduce((sum, p) => sum + p.byteLength, 0);
  const compressed = new Uint8Array(totalIdatLen);
  let pos = 0;
  for (const part of idatParts) {
    compressed.set(part, pos);
    pos += part.byteLength;
  }

  const stride = width * channels;
  const expectedRawSize = height * (1 + stride);
  const raw = zlib.inflateSync(compressed, {
    maxOutputLength: expectedRawSize + 1024,
  });

  if (raw.byteLength < expectedRawSize) {
    return null;
  }

  const recon = new Uint8Array(height * stride);
  for (let y = 0; y < height; y++) {
    const filterType = raw[y * (1 + stride)];
    const scanStart = y * (1 + stride) + 1;
    const rowOut = y * stride;
    const prevRowOut = (y - 1) * stride;

    for (let x = 0; x < stride; x++) {
      const filt = raw[scanStart + x];
      const a = x >= channels ? recon[rowOut + x - channels] : 0;
      const b = y > 0 ? recon[prevRowOut + x] : 0;
      const c = y > 0 && x >= channels ? recon[prevRowOut + x - channels] : 0;

      let val = filt;
      if (filterType === 1) {
        val = (filt + a) & 0xff;
      } else if (filterType === 2) {
        val = (filt + b) & 0xff;
      } else if (filterType === 3) {
        val = (filt + ((a + b) >> 1)) & 0xff;
      } else if (filterType === 4) {
        val = (filt + paethPredictor(a, b, c)) & 0xff;
      }
      recon[rowOut + x] = val;
    }
  }

  const rgba = new Uint8Array(width * height * 4);
  if (colorType === 6) {
    rgba.set(recon);
  } else if (colorType === 2) {
    // RGB + optional tRNS key color
    const hasTrnsKey = trns && trns.length >= 6;
    const trR = hasTrnsKey ? trns![1] : -1;
    const trG = hasTrnsKey ? trns![3] : -1;
    const trB = hasTrnsKey ? trns![5] : -1;
    for (let i = 0, j = 0; i < recon.length; i += 3, j += 4) {
      const r = recon[i];
      const g = recon[i + 1];
      const b = recon[i + 2];
      rgba[j] = r;
      rgba[j + 1] = g;
      rgba[j + 2] = b;
      rgba[j + 3] = r === trR && g === trG && b === trB ? 0 : 255;
    }
  } else if (colorType === 4) {
    // Grayscale + Alpha
    for (let i = 0, j = 0; i < recon.length; i += 2, j += 4) {
      const v = recon[i];
      rgba[j] = v;
      rgba[j + 1] = v;
      rgba[j + 2] = v;
      rgba[j + 3] = recon[i + 1];
    }
  } else if (colorType === 3 && palette) {
    // Indexed palette + tRNS alpha table
    for (let i = 0, j = 0; i < recon.length; i++, j += 4) {
      const idx = recon[i];
      const pIdx = idx * 3;
      rgba[j] = palette[pIdx] ?? 0;
      rgba[j + 1] = palette[pIdx + 1] ?? 0;
      rgba[j + 2] = palette[pIdx + 2] ?? 0;
      rgba[j + 3] = trns && idx < trns.length ? trns[idx] : 255;
    }
  } else if (colorType === 0) {
    // Pure grayscale without alpha
    for (let i = 0, j = 0; i < recon.length; i++, j += 4) {
      const v = recon[i];
      rgba[j] = v;
      rgba[j + 1] = v;
      rgba[j + 2] = v;
      rgba[j + 3] = 255;
    }
  }

  return { width, height, rgba };
}

/**
 * Validasi penuh berkas PNG bingkai admin di sisi server (backend):
 * 1. Memeriksa ukuran <= 5 MiB, magic byte PNG, IHDR 1080x1080, dan ketiadaan acTL (APNG).
 * 2. Mendekode piksel RGBA menggunakan dekoder Zlib atau Sharp untuk menganalisis kanal alpha.
 * 3. Menolak PNG 100% opak atau 100% transparan, serta menghitung SHA-256 checksum.
 */
export async function validateAdminFramePngOnServer(
  bytes: Uint8Array
): Promise<ServerVerifiedPngFrame> {
  const byteSize = bytes?.byteLength ?? 0;
  const headerResult = validateAdminFrameHeader(bytes, byteSize);
  if (!headerResult.valid) {
    return {
      ...headerResult,
      byteSize,
      mimeType: 'image/png',
    };
  }

  let rgbaBuffer: Uint8Array | null = null;
  let decodedWidth = ADMIN_FRAME_REQUIRED_WIDTH;
  let decodedHeight = ADMIN_FRAME_REQUIRED_HEIGHT;

  try {
    // Coba dekode murni dengan zlib terlebih dahulu
    const zlibDecoded = decodePngToRgbaWithZlib(bytes);
    if (zlibDecoded) {
      rgbaBuffer = zlibDecoded.rgba;
      decodedWidth = zlibDecoded.width;
      decodedHeight = zlibDecoded.height;
    } else {
      // Fallback ke sharp untuk PNG interlaced atau bit-depth 16
      const sharpMod = await import('sharp');
      const sharpFn = sharpMod.default || sharpMod;
      const { data, info } = await sharpFn(Buffer.from(bytes))
        .ensureAlpha()
        .raw()
        .toBuffer({ resolveWithObject: true });

      rgbaBuffer = new Uint8Array(data.buffer, data.byteOffset, data.byteLength);
      decodedWidth = info.width;
      decodedHeight = info.height;
    }
  } catch {
    return {
      valid: false,
      errorCode: 'FRAME_CORRUPT',
      errorMessage: 'Berkas PNG bingkai rusak atau gagal didekode di server.',
      hasTransparencyWarning: false,
      byteSize,
      mimeType: 'image/png',
    };
  }

  const pixelAnalysis = analyzeFrameRgbaPixels(rgbaBuffer, decodedWidth, decodedHeight);
  if (!pixelAnalysis.valid) {
    return {
      ...pixelAnalysis,
      byteSize,
      mimeType: 'image/png',
    };
  }

  const checksum = crypto.createHash('sha256').update(bytes).digest('hex');

  return {
    ...pixelAnalysis,
    checksum,
    byteSize,
    mimeType: 'image/png',
  };
}

