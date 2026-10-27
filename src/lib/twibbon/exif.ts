export type DetectedImageFormat =
  | 'png'
  | 'jpeg'
  | 'webp'
  | 'gif'
  | 'heic'
  | 'svg'
  | 'unknown';

export type ExifOrientation = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;

export interface ParsedImageHeader {
  format: DetectedImageFormat;
  width: number | null;
  height: number | null;
  isAnimated: boolean;
  exifOrientation: ExifOrientation;
}

const PNG_SIGNATURE = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];

function readAscii(bytes: Uint8Array, offset: number, length: number): string {
  if (offset < 0 || offset + length > bytes.length) return '';
  let out = '';
  for (let i = 0; i < length; i++) {
    out += String.fromCharCode(bytes[offset + i]);
  }
  return out;
}

function readUInt32BE(bytes: Uint8Array, offset: number): number {
  return (
    ((bytes[offset] << 24) >>> 0) +
    ((bytes[offset + 1] << 16) | (bytes[offset + 2] << 8) | bytes[offset + 3])
  ) >>> 0;
}

function readUInt16BE(bytes: Uint8Array, offset: number): number {
  return (bytes[offset] << 8) | bytes[offset + 1];
}

function readUInt16LE(bytes: Uint8Array, offset: number): number {
  return bytes[offset] | (bytes[offset + 1] << 8);
}

function readUInt32LE(bytes: Uint8Array, offset: number): number {
  return (
    (bytes[offset] |
      (bytes[offset + 1] << 8) |
      (bytes[offset + 2] << 16) |
      ((bytes[offset + 3] << 24) >>> 0)) >>>
    0
  );
}

export function detectImageFormat(bytes: Uint8Array): DetectedImageFormat {
  if (bytes.length >= 8) {
    let isPng = true;
    for (let i = 0; i < 8; i++) {
      if (bytes[i] !== PNG_SIGNATURE[i]) {
        isPng = false;
        break;
      }
    }
    if (isPng) return 'png';
  }

  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    return 'jpeg';
  }

  if (
    bytes.length >= 12 &&
    readAscii(bytes, 0, 4) === 'RIFF' &&
    readAscii(bytes, 8, 4) === 'WEBP'
  ) {
    return 'webp';
  }

  if (
    bytes.length >= 6 &&
    (readAscii(bytes, 0, 6) === 'GIF87a' || readAscii(bytes, 0, 6) === 'GIF89a')
  ) {
    return 'gif';
  }

  if (bytes.length >= 12 && readAscii(bytes, 4, 4) === 'ftyp') {
    const brand = readAscii(bytes, 8, 4).toLowerCase();
    if (
      brand === 'heic' ||
      brand === 'heix' ||
      brand === 'hevc' ||
      brand === 'hevx' ||
      brand === 'mif1' ||
      brand === 'msf1' ||
      brand === 'avif'
    ) {
      return 'heic';
    }
  }

  // Check SVG text header
  if (bytes.length >= 5) {
    const headText = new TextDecoder('utf-8', { fatal: false })
      .decode(bytes.subarray(0, Math.min(bytes.length, 512)))
      .trimStart()
      .toLowerCase();
    if (headText.startsWith('<svg') || (headText.startsWith('<?xml') && headText.includes('<svg'))) {
      return 'svg';
    }
  }

  return 'unknown';
}

function parsePngHeader(bytes: Uint8Array): {
  width: number | null;
  height: number | null;
  isAnimated: boolean;
} {
  if (bytes.length < 24) {
    return { width: null, height: null, isAnimated: false };
  }

  let width: number | null = null;
  let height: number | null = null;
  let isAnimated = false;

  let offset = 8;
  while (offset + 8 <= bytes.length) {
    const chunkLength = readUInt32BE(bytes, offset);
    const chunkType = readAscii(bytes, offset + 4, 4);
    const dataOffset = offset + 8;

    if (chunkType === 'IHDR' && dataOffset + 8 <= bytes.length) {
      width = readUInt32BE(bytes, dataOffset);
      height = readUInt32BE(bytes, dataOffset + 4);
    } else if (chunkType === 'acTL') {
      isAnimated = true;
    } else if (chunkType === 'IDAT' || chunkType === 'IEND') {
      // acTL in valid APNG must appear before IDAT
      break;
    }

    const nextOffset = dataOffset + chunkLength + 4;
    if (nextOffset <= offset) break;
    offset = nextOffset;
  }

  return { width, height, isAnimated };
}

function parseExifFromApp1(bytes: Uint8Array, app1DataStart: number, app1DataLength: number): ExifOrientation {
  const end = Math.min(bytes.length, app1DataStart + app1DataLength);
  if (app1DataStart + 6 > end) return 1;

  if (readAscii(bytes, app1DataStart, 4) !== 'Exif') return 1;
  const tiffStart = app1DataStart + 6;
  if (tiffStart + 8 > end) return 1;

  const byteOrder = readAscii(bytes, tiffStart, 2);
  const littleEndian = byteOrder === 'II';
  if (!littleEndian && byteOrder !== 'MM') return 1;

  const readU16 = (pos: number) =>
    littleEndian ? readUInt16LE(bytes, pos) : readUInt16BE(bytes, pos);
  const readU32 = (pos: number) =>
    littleEndian ? readUInt32LE(bytes, pos) : readUInt32BE(bytes, pos);

  const magic = readU16(tiffStart + 2);
  if (magic !== 0x002a) return 1;

  const ifd0Offset = readU32(tiffStart + 4);
  const ifd0Start = tiffStart + ifd0Offset;
  if (ifd0Start + 2 > end) return 1;

  const entries = readU16(ifd0Start);
  for (let i = 0; i < entries; i++) {
    const entryOffset = ifd0Start + 2 + i * 12;
    if (entryOffset + 12 > end) break;
    const tag = readU16(entryOffset);
    if (tag === 0x0112) {
      const value = readU16(entryOffset + 8);
      if (value >= 1 && value <= 8) {
        return value as ExifOrientation;
      }
      return 1;
    }
  }

  return 1;
}

function parseJpegHeader(bytes: Uint8Array): {
  width: number | null;
  height: number | null;
  exifOrientation: ExifOrientation;
} {
  let width: number | null = null;
  let height: number | null = null;
  let exifOrientation: ExifOrientation = 1;

  let offset = 2;
  while (offset + 4 <= bytes.length) {
    if (bytes[offset] !== 0xff) {
      offset++;
      continue;
    }
    // Skip fill bytes 0xFF
    while (offset < bytes.length && bytes[offset] === 0xff) {
      offset++;
    }
    if (offset >= bytes.length) break;

    const marker = bytes[offset];
    offset++;

    // Standalone markers without length
    if (marker === 0xd8 || marker === 0x01 || (marker >= 0xd0 && marker <= 0xd7)) {
      continue;
    }
    if (marker === 0xd9 || marker === 0xda) {
      // EOI or SOS
      break;
    }

    if (offset + 2 > bytes.length) break;
    const segmentLength = readUInt16BE(bytes, offset);
    if (segmentLength < 2) break;

    const segmentDataStart = offset + 2;
    const segmentDataLength = segmentLength - 2;

    if (marker === 0xe1 && exifOrientation === 1) {
      exifOrientation = parseExifFromApp1(bytes, segmentDataStart, segmentDataLength);
    }

    // SOF0..SOF15 (except DHT=0xC4, JPG=0xC8, DAC=0xCC)
    const isSof =
      marker >= 0xc0 &&
      marker <= 0xcf &&
      marker !== 0xc4 &&
      marker !== 0xc8 &&
      marker !== 0xcc;

    if (isSof && segmentDataStart + 5 <= bytes.length) {
      height = readUInt16BE(bytes, segmentDataStart + 1);
      width = readUInt16BE(bytes, segmentDataStart + 3);
      if (width > 0 && height > 0) {
        break;
      }
    }

    offset += segmentLength;
  }

  return { width, height, exifOrientation };
}

function parseWebpHeader(bytes: Uint8Array): {
  width: number | null;
  height: number | null;
  isAnimated: boolean;
} {
  if (bytes.length < 30) {
    return { width: null, height: null, isAnimated: false };
  }

  const chunkType = readAscii(bytes, 12, 4);
  if (chunkType === 'VP8X') {
    const flags = bytes[20];
    const isAnimated = (flags & 0x02) !== 0;
    const widthMinusOne = bytes[24] | (bytes[25] << 8) | (bytes[26] << 16);
    const heightMinusOne = bytes[27] | (bytes[28] << 8) | (bytes[29] << 16);
    return {
      width: widthMinusOne + 1,
      height: heightMinusOne + 1,
      isAnimated,
    };
  }

  if (chunkType === 'VP8 ') {
    // Lossy WebP frame header starts at offset 20; check start code 0x9d 0x01 0x2a at 23..25
    if (bytes[23] === 0x9d && bytes[24] === 0x01 && bytes[25] === 0x2a) {
      const width = readUInt16LE(bytes, 26) & 0x3fff;
      const height = readUInt16LE(bytes, 28) & 0x3fff;
      return { width, height, isAnimated: false };
    }
  }

  if (chunkType === 'VP8L') {
    // Lossless WebP signature 0x2f at offset 20
    if (bytes[20] === 0x2f && bytes.length >= 25) {
      const b1 = bytes[21];
      const b2 = bytes[22];
      const b3 = bytes[23];
      const b4 = bytes[24];
      const width = 1 + (((b2 & 0x3f) << 8) | b1);
      const height = 1 + (((b4 & 0x0f) << 10) | (b3 << 2) | ((b2 & 0xc0) >> 6));
      return { width, height, isAnimated: false };
    }
  }

  return { width: null, height: null, isAnimated: false };
}

export function parseImageHeader(bytes: Uint8Array): ParsedImageHeader {
  const format = detectImageFormat(bytes);

  if (format === 'png') {
    const { width, height, isAnimated } = parsePngHeader(bytes);
    return { format, width, height, isAnimated, exifOrientation: 1 };
  }

  if (format === 'jpeg') {
    const { width, height, exifOrientation } = parseJpegHeader(bytes);
    return { format, width, height, isAnimated: false, exifOrientation };
  }

  if (format === 'webp') {
    const { width, height, isAnimated } = parseWebpHeader(bytes);
    return { format, width, height, isAnimated, exifOrientation: 1 };
  }

  if (format === 'gif') {
    const width = bytes.length >= 10 ? readUInt16LE(bytes, 6) : null;
    const height = bytes.length >= 10 ? readUInt16LE(bytes, 8) : null;
    return { format, width, height, isAnimated: true, exifOrientation: 1 };
  }

  return {
    format,
    width: null,
    height: null,
    isAnimated: false,
    exifOrientation: 1,
  };
}

/**
 * Returns whether an EXIF orientation (5, 6, 7, 8) swaps width and height after normalization.
 */
export function doesExifSwapDimensions(orientation: ExifOrientation): boolean {
  return orientation >= 5 && orientation <= 8;
}

/**
 * Returns the dimensions after applying EXIF orientation normalization once.
 */
export function getExifNormalizedDimensions(
  rawWidth: number,
  rawHeight: number,
  orientation: ExifOrientation
): { width: number; height: number } {
  if (doesExifSwapDimensions(orientation)) {
    return { width: rawHeight, height: rawWidth };
  }
  return { width: rawWidth, height: rawHeight };
}

/**
 * Computes the working bitmap dimensions (longest side capped at maxSide=2560, never upscaling smaller sources).
 */
export function computeWorkingDimensions(
  normalizedWidth: number,
  normalizedHeight: number,
  maxSide: number = 2560
): { width: number; height: number; downscaled: boolean } {
  const longest = Math.max(normalizedWidth, normalizedHeight);
  if (longest <= maxSide || longest <= 0) {
    return { width: normalizedWidth, height: normalizedHeight, downscaled: false };
  }
  const ratio = maxSide / longest;
  return {
    width: Math.max(1, Math.round(normalizedWidth * ratio)),
    height: Math.max(1, Math.round(normalizedHeight * ratio)),
    downscaled: true,
  };
}

