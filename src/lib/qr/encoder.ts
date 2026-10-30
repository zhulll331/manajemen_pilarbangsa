/**
 * ISO/IEC 18004 Standard QR Code Matrix Encoder (Versions 1..40, Mode Byte UTF-8).
 *
 * Menghasilkan matriks QR Code murni secara lokal (tanpa pihak ketiga / tanpa redirect)
 * sehingga ketika di-scan oleh kamera HP, pengguna langsung diarahkan ke URL tujuan asli.
 */

export type QrEccLevel = 'L' | 'M' | 'Q' | 'H';

export interface QrMatrix {
  size: number;
  version: number;
  ecc: QrEccLevel;
  modules: Uint8Array; // 1 = gelap, 0 = terang (ukuran size * size)
  isFunction: Uint8Array; // 1 = pola fungsi (finder/timing/alignment/format), 0 = modul data/EC
}

// Urutan level koreksi kesalahan dan bit formatnya (ISO/IEC 18004 Tabel 25)
const ECC_FORMAT_BITS: Record<QrEccLevel, number> = {
  L: 1, // 01
  M: 0, // 00
  Q: 3, // 11
  H: 2, // 10
};

const ECC_INDEX: Record<QrEccLevel, number> = {
  L: 0,
  M: 1,
  Q: 2,
  H: 3,
};

// Jumlah codeword koreksi kesalahan per blok untuk versi 1..40 pada level L, M, Q, H
const EC_CODEWORDS_PER_BLOCK: number[][] = [
  // L,  M,  Q,  H
  [-1, -1, -1, -1],
  [7, 10, 13, 17],
  [10, 16, 22, 28],
  [15, 26, 18, 22],
  [20, 18, 26, 16],
  [26, 24, 18, 22],
  [18, 16, 24, 28],
  [20, 18, 18, 26],
  [24, 22, 22, 26],
  [30, 22, 20, 24],
  [18, 26, 24, 28],
  [20, 30, 28, 24],
  [24, 22, 26, 28],
  [26, 22, 24, 22],
  [30, 24, 20, 24],
  [22, 24, 30, 24],
  [24, 28, 24, 30],
  [28, 28, 28, 28],
  [30, 26, 28, 28],
  [28, 26, 26, 26],
  [28, 26, 30, 28],
  [28, 26, 28, 30],
  [28, 28, 30, 24],
  [30, 28, 30, 30],
  [30, 28, 30, 30],
  [26, 28, 30, 30],
  [28, 28, 28, 30],
  [30, 28, 30, 30],
  [30, 28, 30, 30],
  [30, 28, 30, 30],
  [30, 28, 30, 30],
  [30, 28, 30, 30],
  [30, 28, 30, 30],
  [30, 28, 30, 30],
  [30, 28, 30, 30],
  [30, 28, 30, 30],
  [30, 28, 30, 30],
  [30, 28, 30, 30],
  [30, 28, 30, 30],
  [30, 28, 30, 30],
  [30, 28, 30, 30],
];

// Jumlah blok koreksi kesalahan untuk versi 1..40 pada level L, M, Q, H
const NUM_ERROR_CORRECTION_BLOCKS: number[][] = [
  // L, M, Q, H
  [-1, -1, -1, -1],
  [1, 1, 1, 1],
  [1, 1, 1, 1],
  [1, 1, 2, 2],
  [1, 2, 2, 4],
  [1, 2, 4, 4],
  [2, 4, 4, 4],
  [2, 4, 6, 5],
  [2, 4, 6, 6],
  [2, 5, 8, 8],
  [4, 5, 8, 8],
  [4, 5, 8, 11],
  [4, 8, 10, 11],
  [4, 9, 12, 16],
  [4, 9, 16, 16],
  [6, 10, 12, 18],
  [6, 10, 17, 16],
  [6, 11, 16, 19],
  [6, 13, 18, 21],
  [7, 14, 21, 25],
  [8, 16, 20, 25],
  [8, 17, 23, 25],
  [9, 17, 23, 34],
  [9, 18, 25, 30],
  [10, 20, 27, 32],
  [12, 21, 29, 35],
  [12, 23, 34, 37],
  [12, 25, 34, 40],
  [13, 26, 35, 42],
  [14, 28, 38, 45],
  [15, 29, 40, 48],
  [16, 31, 43, 51],
  [17, 33, 45, 54],
  [18, 35, 48, 57],
  [19, 37, 51, 60],
  [19, 38, 53, 63],
  [20, 40, 56, 66],
  [21, 43, 59, 70],
  [22, 45, 62, 74],
  [24, 47, 65, 77],
  [25, 49, 68, 81],
];

function getNumRawDataModules(version: number): number {
  const size = version * 4 + 17;
  let result = size * size;
  result -= 8 * 8 * 3; // 3 finder patterns + separators
  result -= 15 * 2 + 1; // format info + dark module
  result -= (size - 16) * 2; // timing patterns

  if (version >= 2) {
    const numAlign = Math.floor(version / 7) + 2;
    result -= (numAlign - 1) * (numAlign - 1) * 25;
    result += (numAlign - 2) * 2 * 5; // tumpang tindih dengan timing pattern
    if (version >= 7) {
      result -= 6 * 3 * 2; // version info
    }
  }
  return result;
}

function getNumDataCodewords(version: number, ecc: QrEccLevel): number {
  const rawBytes = Math.floor(getNumRawDataModules(version) / 8);
  const idx = ECC_INDEX[ecc];
  return rawBytes - EC_CODEWORDS_PER_BLOCK[version][idx] * NUM_ERROR_CORRECTION_BLOCKS[version][idx];
}

function getAlignmentPatternPositions(version: number): number[] {
  if (version === 1) return [];
  const numAlign = Math.floor(version / 7) + 2;
  const step =
    version === 32 ? 26 : Math.ceil((version * 4 + 4) / (numAlign * 2 - 2)) * 2;
  const result = [6];
  for (let pos = version * 4 + 10; result.length < numAlign; pos -= step) {
    result.splice(1, 0, pos);
  }
  return result;
}

// Perkalian di Galois Field GF(256) dengan polinomial primitif 0x11D
function reedSolomonMultiply(x: number, y: number): number {
  let z = 0;
  for (let i = 7; i >= 0; i--) {
    z = (z << 1) ^ ((z >>> 7) * 0x11d);
    z ^= ((y >>> i) & 1) * x;
  }
  return z;
}

function reedSolomonComputeDivisor(degree: number): Uint8Array {
  const result = new Uint8Array(degree);
  result[degree - 1] = 1;
  let root = 1;
  for (let i = 0; i < degree; i++) {
    for (let j = 0; j < degree; j++) {
      result[j] = reedSolomonMultiply(result[j], root);
      if (j + 1 < degree) {
        result[j] ^= result[j + 1];
      }
    }
    root = reedSolomonMultiply(root, 0x02);
  }
  return result;
}

function reedSolomonComputeRemainder(
  data: Uint8Array,
  divisor: Uint8Array
): Uint8Array {
  const result = new Uint8Array(divisor.length);
  for (let i = 0; i < data.length; i++) {
    const factor = data[i] ^ result[0];
    result.copyWithin(0, 1);
    result[result.length - 1] = 0;
    for (let j = 0; j < divisor.length; j++) {
      result[j] ^= reedSolomonMultiply(divisor[j], factor);
    }
  }
  return result;
}

function addEccAndInterleave(
  data: Uint8Array,
  version: number,
  ecc: QrEccLevel
): Uint8Array {
  const idx = ECC_INDEX[ecc];
  const numBlocks = NUM_ERROR_CORRECTION_BLOCKS[version][idx];
  const blockEcLen = EC_CODEWORDS_PER_BLOCK[version][idx];
  const rawCodewords = Math.floor(getNumRawDataModules(version) / 8);
  const numShortBlocks = numBlocks - (rawCodewords % numBlocks);
  const shortBlockLen = Math.floor(rawCodewords / numBlocks);

  const blocks: Uint8Array[] = [];
  const rsDiv = reedSolomonComputeDivisor(blockEcLen);

  for (let i = 0, k = 0; i < numBlocks; i++) {
    const datLen = shortBlockLen - blockEcLen + (i < numShortBlocks ? 0 : 1);
    const dat = data.subarray(k, k + datLen);
    k += datLen;

    const ec = reedSolomonComputeRemainder(dat, rsDiv);
    const block = new Uint8Array(datLen + blockEcLen);
    block.set(dat, 0);
    block.set(ec, datLen);
    blocks.push(block);
  }

  const result = new Uint8Array(rawCodewords);
  let outIdx = 0;
  const maxDataLen = shortBlockLen - blockEcLen + 1;

  for (let i = 0; i < maxDataLen; i++) {
    for (let j = 0; j < blocks.length; j++) {
      if (i === shortBlockLen - blockEcLen && j < numShortBlocks) continue;
      const datLen = shortBlockLen - blockEcLen + (j < numShortBlocks ? 0 : 1);
      if (i < datLen) {
        result[outIdx++] = blocks[j][i];
      }
    }
  }

  for (let i = 0; i < blockEcLen; i++) {
    for (let j = 0; j < blocks.length; j++) {
      const datLen = shortBlockLen - blockEcLen + (j < numShortBlocks ? 0 : 1);
      result[outIdx++] = blocks[j][datLen + i];
    }
  }

  return result;
}

function getBit(x: number, i: number): boolean {
  return ((x >>> i) & 1) !== 0;
}

function drawFunctionPatterns(
  version: number,
  size: number,
  modules: Uint8Array,
  isFunction: Uint8Array
) {
  const setFunctionModule = (x: number, y: number, isDark: boolean) => {
    const idx = y * size + x;
    modules[idx] = isDark ? 1 : 0;
    isFunction[idx] = 1;
  };

  // Timing patterns
  for (let i = 0; i < size; i++) {
    setFunctionModule(6, i, i % 2 === 0);
    setFunctionModule(i, 6, i % 2 === 0);
  }

  // Finder patterns (3 pojok) + separator putih
  const drawFinderPattern = (cx: number, cy: number) => {
    for (let dy = -4; dy <= 4; dy++) {
      for (let dx = -4; dx <= 4; dx++) {
        const dist = Math.max(Math.abs(dx), Math.abs(dy));
        const xx = cx + dx;
        const yy = cy + dy;
        if (xx >= 0 && xx < size && yy >= 0 && yy < size) {
          setFunctionModule(xx, yy, dist !== 2 && dist !== 4);
        }
      }
    }
  };

  drawFinderPattern(3, 3);
  drawFinderPattern(size - 4, 3);
  drawFinderPattern(3, size - 4);

  // Alignment patterns
  const alignPos = getAlignmentPatternPositions(version);
  const numAlign = alignPos.length;
  for (let i = 0; i < numAlign; i++) {
    for (let j = 0; j < numAlign; j++) {
      if (
        (i === 0 && j === 0) ||
        (i === 0 && j === numAlign - 1) ||
        (i === numAlign - 1 && j === 0)
      ) {
        continue;
      }
      const cx = alignPos[i];
      const cy = alignPos[j];
      for (let dy = -2; dy <= 2; dy++) {
        for (let dx = -2; dx <= 2; dx++) {
          setFunctionModule(
            cx + dx,
            cy + dy,
            Math.max(Math.abs(dx), Math.abs(dy)) !== 1
          );
        }
      }
    }
  }

  // Reserve format bits + dark module
  for (let i = 0; i <= 8; i++) {
    if (i !== 6) {
      setFunctionModule(8, i, false);
      setFunctionModule(i, 8, false);
    }
  }
  for (let i = 0; i < 8; i++) {
    setFunctionModule(size - 1 - i, 8, false);
    setFunctionModule(8, size - 1 - i, false);
  }
  setFunctionModule(8, size - 8, true); // Dark module

  // Version info (versi >= 7)
  if (version >= 7) {
    let rem = version;
    for (let i = 0; i < 12; i++) {
      rem = (rem << 1) ^ ((rem >>> 11) * 0x1f25);
    }
    const bits = (version << 12) | rem;
    for (let i = 0; i < 18; i++) {
      const bit = getBit(bits, i);
      const a = size - 11 + (i % 3);
      const b = Math.floor(i / 3);
      setFunctionModule(a, b, bit);
      setFunctionModule(b, a, bit);
    }
  }
}

function drawFormatBits(
  ecc: QrEccLevel,
  mask: number,
  size: number,
  modules: Uint8Array,
  isFunction: Uint8Array
) {
  const setFunctionModule = (x: number, y: number, isDark: boolean) => {
    const idx = y * size + x;
    modules[idx] = isDark ? 1 : 0;
    isFunction[idx] = 1;
  };

  const data = (ECC_FORMAT_BITS[ecc] << 3) | mask;
  let rem = data;
  for (let i = 0; i < 10; i++) {
    rem = (rem << 1) ^ ((rem >>> 9) * 0x537);
  }
  const bits = ((data << 10) | rem) ^ 0x5412;

  for (let i = 0; i <= 5; i++) setFunctionModule(8, i, getBit(bits, i));
  setFunctionModule(8, 7, getBit(bits, 6));
  setFunctionModule(8, 8, getBit(bits, 7));
  setFunctionModule(7, 8, getBit(bits, 8));
  for (let i = 9; i < 15; i++) setFunctionModule(14 - i, 8, getBit(bits, i));

  for (let i = 0; i < 8; i++) setFunctionModule(size - 1 - i, 8, getBit(bits, i));
  for (let i = 8; i < 15; i++) setFunctionModule(8, size - 15 + i, getBit(bits, i));
  setFunctionModule(8, size - 8, true);
}

function drawCodewords(
  codewords: Uint8Array,
  size: number,
  modules: Uint8Array,
  isFunction: Uint8Array
) {
  let i = 0;
  for (let right = size - 1; right >= 1; right -= 2) {
    if (right === 6) right = 5;
    for (let vert = 0; vert < size; vert++) {
      for (let j = 0; j < 2; j++) {
        const x = right - j;
        const upward = ((right + 1) & 2) === 0;
        const y = upward ? size - 1 - vert : vert;
        const idx = y * size + x;
        if (!isFunction[idx] && i < codewords.length * 8) {
          const dark = getBit(codewords[i >>> 3], 7 - (i & 7));
          modules[idx] = dark ? 1 : 0;
          i++;
        }
      }
    }
  }
}

function applyMask(
  mask: number,
  size: number,
  modules: Uint8Array,
  isFunction: Uint8Array
) {
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const idx = y * size + x;
      if (isFunction[idx]) continue;
      let invert = false;
      switch (mask) {
        case 0:
          invert = (x + y) % 2 === 0;
          break;
        case 1:
          invert = y % 2 === 0;
          break;
        case 2:
          invert = x % 3 === 0;
          break;
        case 3:
          invert = (x + y) % 3 === 0;
          break;
        case 4:
          invert = (Math.floor(x / 3) + Math.floor(y / 2)) % 2 === 0;
          break;
        case 5:
          invert = ((x * y) % 2) + ((x * y) % 3) === 0;
          break;
        case 6:
          invert = (((x * y) % 2) + ((x * y) % 3)) % 2 === 0;
          break;
        case 7:
          invert = (((x + y) % 2) + ((x * y) % 3)) % 2 === 0;
          break;
      }
      if (invert) {
        modules[idx] ^= 1;
      }
    }
  }
}

function computePenaltyScore(size: number, modules: Uint8Array): number {
  let score = 0;

  // Aturan 1: 5+ modul berurutan berwarna sama pada baris/kolom
  for (let y = 0; y < size; y++) {
    let runColor = modules[y * size];
    let runLen = 1;
    for (let x = 1; x < size; x++) {
      const c = modules[y * size + x];
      if (c === runColor) {
        runLen++;
        if (runLen === 5) score += 3;
        else if (runLen > 5) score += 1;
      } else {
        runColor = c;
        runLen = 1;
      }
    }
  }

  for (let x = 0; x < size; x++) {
    let runColor = modules[x];
    let runLen = 1;
    for (let y = 1; y < size; y++) {
      const c = modules[y * size + x];
      if (c === runColor) {
        runLen++;
        if (runLen === 5) score += 3;
        else if (runLen > 5) score += 1;
      } else {
        runColor = c;
        runLen = 1;
      }
    }
  }

  // Aturan 2: Blok 2x2 berwarna sama
  for (let y = 0; y < size - 1; y++) {
    for (let x = 0; x < size - 1; x++) {
      const c = modules[y * size + x];
      if (
        c === modules[y * size + x + 1] &&
        c === modules[(y + 1) * size + x] &&
        c === modules[(y + 1) * size + x + 1]
      ) {
        score += 3;
      }
    }
  }

  // Aturan 4: Keseimbangan modul gelap dan terang
  let dark = 0;
  for (let i = 0; i < modules.length; i++) {
    if (modules[i]) dark++;
  }
  const total = size * size;
  const k = Math.ceil((Math.abs(dark * 20 - total * 10) + total - 1) / total) - 1;
  score += Math.max(0, k) * 10;

  return score;
}

/**
 * Mengenkode string UTF-8 menjadi matriks QR Code standar ISO/IEC 18004.
 */
export function encodeQrMatrix(
  text: string,
  preferredEcc: QrEccLevel = 'H'
): QrMatrix {
  const cleanText = text || 'https://www.pilarbangsa.my.id';
  const utf8Bytes = new TextEncoder().encode(cleanText);

  let chosenVersion = -1;
  let chosenEcc: QrEccLevel = preferredEcc;

  // Jika teks sangat panjang dan tidak muat di level H, turunkan otomatis ke Q -> M -> L
  const fallbackLevels: QrEccLevel[] =
    preferredEcc === 'H'
      ? ['H', 'Q', 'M', 'L']
      : preferredEcc === 'Q'
      ? ['Q', 'M', 'L']
      : preferredEcc === 'M'
      ? ['M', 'L']
      : ['L'];

  for (const ecc of fallbackLevels) {
    for (let ver = 1; ver <= 40; ver++) {
      const capacityBytes = getNumDataCodewords(ver, ecc);
      const countBits = ver <= 9 ? 8 : 16;
      const neededBits = 4 + countBits + utf8Bytes.length * 8;
      if ( neededBits <= capacityBytes * 8) {
        chosenVersion = ver;
        chosenEcc = ecc;
        break;
      }
    }
    if (chosenVersion !== -1) break;
  }

  if (chosenVersion === -1) {
    throw new Error('Teks atau tautan terlalu panjang untuk dimuat ke dalam QR Code.');
  }

  const dataCapacityBytes = getNumDataCodewords(chosenVersion, chosenEcc);
  const countBits = chosenVersion <= 9 ? 8 : 16;

  // Susun bit stream (Byte mode = 0100)
  const bitBuffer: number[] = [];
  const appendBits = (val: number, len: number) => {
    for (let i = len - 1; i >= 0; i--) {
      bitBuffer.push((val >>> i) & 1);
    }
  };

  appendBits(0b0100, 4);
  appendBits(utf8Bytes.length, countBits);
  for (let i = 0; i < utf8Bytes.length; i++) {
    appendBits(utf8Bytes[i], 8);
  }

  // Terminator (maks 4 bit 0)
  const capacityBits = dataCapacityBytes * 8;
  appendBits(0, Math.min(4, capacityBits - bitBuffer.length));

  // Pad ke batas byte (kelipatan 8)
  appendBits(0, (8 - (bitBuffer.length % 8)) % 8);

  // Pad bytes bergantian 0xEC dan 0x11
  for (let padByte = 0xec; bitBuffer.length < capacityBits; padByte ^= 0xec ^ 0x11) {
    appendBits(padByte, 8);
  }

  const dataCodewords = new Uint8Array(dataCapacityBytes);
  for (let i = 0; i < bitBuffer.length; i++) {
    dataCodewords[i >>> 3] |= bitBuffer[i] << (7 - (i & 7));
  }

  const allCodewords = addEccAndInterleave(dataCodewords, chosenVersion, chosenEcc);
  const size = chosenVersion * 4 + 17;

  let bestMask = 0;
  let minPenalty = Infinity;
  let bestModules = new Uint8Array(size * size);
  let bestIsFunction = new Uint8Array(size * size);

  for (let mask = 0; mask < 8; mask++) {
    const modules = new Uint8Array(size * size);
    const isFunction = new Uint8Array(size * size);

    drawFunctionPatterns(chosenVersion, size, modules, isFunction);
    drawCodewords(allCodewords, size, modules, isFunction);
    applyMask(mask, size, modules, isFunction);
    drawFormatBits(chosenEcc, mask, size, modules, isFunction);

    const penalty = computePenaltyScore(size, modules);
    if (penalty < minPenalty) {
      minPenalty = penalty;
      bestMask = mask;
      bestModules = modules;
      bestIsFunction = isFunction;
    }
  }

  return {
    size,
    version: chosenVersion,
    ecc: chosenEcc,
    modules: bestModules,
    isFunction: bestIsFunction,
  };
}

/**
 * Mengecek apakah koordinat modul `(x, y)` berada di dalam salah satu dari 3 Finder Eye (7x7).
 */
export function isFinderEyeModule(x: number, y: number, size: number): boolean {
  const inTopLeft = x >= 0 && x < 7 && y >= 0 && y < 7;
  const inTopRight = x >= size - 7 && x < size && y >= 0 && y < 7;
  const inBottomLeft = x >= 0 && x < 7 && y >= size - 7 && y < size;
  return inTopLeft || inTopRight || inBottomLeft;
}

/**
 * Menormalkan input tautan/tujuan agar ketika di-scan kamera HP langsung membuka tujuan.
 */
export function buildDirectQrPayload(params: {
  mode: 'url' | 'whatsapp' | 'gmaps' | 'email' | 'wifi';
  url?: string;
  waPhone?: string;
  waMessage?: string;
  gmapsQuery?: string;
  emailTo?: string;
  emailSubject?: string;
  emailBody?: string;
  wifiSsid?: string;
  wifiPassword?: string;
  wifiSecurity?: 'WPA' | 'WEP' | 'nopass';
}): string {
  switch (params.mode) {
    case 'whatsapp': {
      const digits = (params.waPhone || '').replace(/[^\d]/g, '');
      const normalizedPhone = digits.startsWith('0')
        ? `62${digits.slice(1)}`
        : digits.startsWith('8')
        ? `62${digits}`
        : digits || '6285607851580';
      const msg = (params.waMessage || '').trim();
      return msg
        ? `https://wa.me/${normalizedPhone}?text=${encodeURIComponent(msg)}`
        : `https://wa.me/${normalizedPhone}`;
    }

    case 'gmaps': {
      const q = (params.gmapsQuery || '').trim();
      if (!q) return 'https://maps.app.goo.gl/Kqw7VtiUXvSuqFFS6';
      if (/^https?:\/\//i.test(q)) return q;
      return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}`;
    }

    case 'email': {
      const to = (params.emailTo || '').trim() || 'ukmpilarbangsa@gmail.com';
      const queryParts: string[] = [];
      if (params.emailSubject?.trim()) {
        queryParts.push(`subject=${encodeURIComponent(params.emailSubject.trim())}`);
      }
      if (params.emailBody?.trim()) {
        queryParts.push(`body=${encodeURIComponent(params.emailBody.trim())}`);
      }
      return queryParts.length > 0 ? `mailto:${to}?${queryParts.join('&')}` : `mailto:${to}`;
    }

    case 'wifi': {
      const ssid = (params.wifiSsid || 'UKM Pilar Bangsa').replace(/([\\;,:])/g, '\\$1');
      const pass = (params.wifiPassword || '').replace(/([\\;,:])/g, '\\$1');
      const sec = params.wifiSecurity || 'WPA';
      return `WIFI:T:${sec};S:${ssid};P:${pass};;`;
    }

    case 'url':
    default: {
      const raw = (params.url || '').trim();
      if (!raw) return 'https://www.pilarbangsa.my.id';
      if (/^(https?:\/\/|mailto:|tel:|wifi:)/i.test(raw)) {
        return raw;
      }
      // Jika terlihat seperti domain (contoh: pilarbangsa.my.id/twibbon), tambahkan https:// otomatis
      if (/^[a-z0-9.-]+\.[a-z]{2,}(\/.*)?$/i.test(raw)) {
        return `https://${raw}`;
      }
      return raw;
    }
  }
}
