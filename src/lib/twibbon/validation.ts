import { parseImageHeader, getExifNormalizedDimensions, type ExifOrientation } from './exif.ts';
import { validateCaptionTemplates } from './caption.ts';

export const PARTICIPANT_MAX_BYTES = 15 * 1024 * 1024; // 15 MiB = 15.728.640 byte
export const PARTICIPANT_MIN_DIMENSION = 200;
export const PARTICIPANT_MAX_DIMENSION = 12000;
export const PARTICIPANT_MAX_MEGAPIXELS = 48_000_000; // 48 MP
export const PARTICIPANT_LOW_QUALITY_THRESHOLD = 1080;

export const ADMIN_FRAME_MAX_BYTES = 5 * 1024 * 1024; // 5 MiB = 5.242.880 byte
export const ADMIN_FRAME_REQUIRED_WIDTH = 1080;
export const ADMIN_FRAME_REQUIRED_HEIGHT = 1080;

export const RESERVED_CAMPAIGN_SLUGS = new Set([
  'admin',
  'api',
  'new',
  'baru',
  'edit',
  'preview',
  'publish',
  'archive',
  'login',
  'dashboard',
  'kegiatan',
  'twibbon',
]);

export interface ParticipantPhotoValidationResult {
  valid: boolean;
  errorCode?:
    | 'FILE_EMPTY'
    | 'FILE_TOO_LARGE'
    | 'UNSUPPORTED_FORMAT'
    | 'ANIMATED_NOT_SUPPORTED'
    | 'DIMENSION_TOO_SMALL'
    | 'DIMENSION_TOO_LARGE'
    | 'DECODE_FAILED';
  errorMessage?: string;
  lowQualityWarning: boolean;
  warningMessage?: string;
  format?: 'png' | 'jpeg' | 'webp';
  rawWidth?: number;
  rawHeight?: number;
  normalizedWidth?: number;
  normalizedHeight?: number;
  exifOrientation: ExifOrientation;
}

/**
 * Validasi awal berkas foto peserta dari header biner sebelum decode penuh.
 * Sesuai PRD Bagian 10.2 & 20:
 * - Maksimum 15 MiB (15.728.640 byte)
 * - Format JPEG, PNG statis, WebP statis
 * - Tolak HEIC/HEIF, GIF, APNG, WebP animasi, SVG, ekstensi palsu
 * - Kedua sisi >= 200 px, sisi terpanjang <= 12.000 px, total <= 48 MP
 * - Peringatan kualitas jika salah satu sisi < 1080 px (tidak memblokir)
 */
export function validateParticipantPhotoBytes(
  bytes: Uint8Array,
  byteSize: number = bytes.byteLength
): ParticipantPhotoValidationResult {
  if (!bytes || byteSize <= 0) {
    return {
      valid: false,
      errorCode: 'FILE_EMPTY',
      errorMessage: 'Foto belum bisa dibuka. Gunakan JPG, PNG, atau WebP.',
      lowQualityWarning: false,
      exifOrientation: 1,
    };
  }

  if (byteSize > PARTICIPANT_MAX_BYTES) {
    return {
      valid: false,
      errorCode: 'FILE_TOO_LARGE',
      errorMessage: 'Foto maksimal 15 MiB. Pilih foto yang lebih kecil.',
      lowQualityWarning: false,
      exifOrientation: 1,
    };
  }

  const header = parseImageHeader(bytes);

  if (header.format === 'heic' || header.format === 'svg' || header.format === 'unknown') {
    return {
      valid: false,
      errorCode: 'UNSUPPORTED_FORMAT',
      errorMessage: 'Foto belum bisa dibuka. Gunakan JPG, PNG, atau WebP.',
      lowQualityWarning: false,
      exifOrientation: 1,
    };
  }

  if (header.format === 'gif' || header.isAnimated) {
    return {
      valid: false,
      errorCode: 'ANIMATED_NOT_SUPPORTED',
      errorMessage: 'Gambar animasi tidak didukung. Gunakan foto statis JPG, PNG, atau WebP.',
      lowQualityWarning: false,
      exifOrientation: 1,
    };
  }

  if (header.width !== null && header.height !== null) {
    const dimCheck = validateParticipantDimensions(
      header.width,
      header.height,
      header.exifOrientation
    );
    if (!dimCheck.valid) {
      return dimCheck;
    }
    return {
      ...dimCheck,
      format: header.format,
    };
  }

  return {
    valid: true,
    lowQualityWarning: false,
    format: header.format,
    exifOrientation: header.exifOrientation,
  };
}

export function validateParticipantDimensions(
  rawWidth: number,
  rawHeight: number,
  exifOrientation: ExifOrientation = 1
): ParticipantPhotoValidationResult {
  if (
    !Number.isFinite(rawWidth) ||
    !Number.isFinite(rawHeight) ||
    rawWidth <= 0 ||
    rawHeight <= 0
  ) {
    return {
      valid: false,
      errorCode: 'DECODE_FAILED',
      errorMessage: 'Foto belum bisa dibuka. Gunakan JPG, PNG, atau WebP.',
      lowQualityWarning: false,
      exifOrientation,
    };
  }

  const { width: normalizedWidth, height: normalizedHeight } = getExifNormalizedDimensions(
    rawWidth,
    rawHeight,
    exifOrientation
  );

  if (
    normalizedWidth < PARTICIPANT_MIN_DIMENSION ||
    normalizedHeight < PARTICIPANT_MIN_DIMENSION
  ) {
    return {
      valid: false,
      errorCode: 'DIMENSION_TOO_SMALL',
      errorMessage: 'Ukuran foto terlalu kecil (minimal 200 × 200 piksel). Pilih foto yang lebih jelas.',
      lowQualityWarning: false,
      rawWidth,
      rawHeight,
      normalizedWidth,
      normalizedHeight,
      exifOrientation,
    };
  }

  const longestSide = Math.max(normalizedWidth, normalizedHeight);
  const totalPixels = normalizedWidth * normalizedHeight;

  if (longestSide > PARTICIPANT_MAX_DIMENSION || totalPixels > PARTICIPANT_MAX_MEGAPIXELS) {
    return {
      valid: false,
      errorCode: 'DIMENSION_TOO_LARGE',
      errorMessage:
        'Foto ini terlalu berat untuk diproses di perangkatmu. Coba versi lebih kecil.',
      lowQualityWarning: false,
      rawWidth,
      rawHeight,
      normalizedWidth,
      normalizedHeight,
      exifOrientation,
    };
  }

  const lowQualityWarning =
    normalizedWidth < PARTICIPANT_LOW_QUALITY_THRESHOLD ||
    normalizedHeight < PARTICIPANT_LOW_QUALITY_THRESHOLD;

  return {
    valid: true,
    lowQualityWarning,
    warningMessage: lowQualityWarning
      ? 'Foto bisa terlihat kurang tajam saat diunduh.'
      : undefined,
    rawWidth,
    rawHeight,
    normalizedWidth,
    normalizedHeight,
    exifOrientation,
  };
}

export interface AdminFrameValidationResult {
  valid: boolean;
  errorCode?:
    | 'FRAME_TOO_LARGE'
    | 'FRAME_NOT_PNG'
    | 'FRAME_ANIMATED'
    | 'FRAME_WRONG_DIMENSIONS'
    | 'FRAME_FULLY_OPAQUE'
    | 'FRAME_FULLY_TRANSPARENT'
    | 'FRAME_CORRUPT';
  errorMessage?: string;
  width?: number;
  height?: number;
  transparentRatio?: number;
  opaqueRatio?: number;
  hasTransparencyWarning: boolean;
  warningMessage?: string;
}

/**
 * Validasi header PNG bingkai admin (sebelum atau bersama pemeriksaan piksel RGBA).
 * Sesuai PRD Bagian 10.1:
 * - Hanya PNG statis tepat 1080 x 1080
 * - Maksimum 5 MiB (5.242.880 byte)
 * - Tolak JPEG, SVG, GIF, APNG animasi, WebP, file rusak, ekstensi palsu
 */
export function validateAdminFrameHeader(
  bytes: Uint8Array,
  byteSize: number = bytes.byteLength
): AdminFrameValidationResult {
  if (!bytes || byteSize <= 0) {
    return {
      valid: false,
      errorCode: 'FRAME_CORRUPT',
      errorMessage: 'Berkas bingkai kosong atau rusak.',
      hasTransparencyWarning: false,
    };
  }

  if (byteSize > ADMIN_FRAME_MAX_BYTES) {
    return {
      valid: false,
      errorCode: 'FRAME_TOO_LARGE',
      errorMessage: 'Ukuran bingkai maksimal 5 MiB (5.242.880 byte).',
      hasTransparencyWarning: false,
    };
  }

  const header = parseImageHeader(bytes);

  if (header.format !== 'png') {
    return {
      valid: false,
      errorCode: 'FRAME_NOT_PNG',
      errorMessage: 'Bingkai harus berupa file PNG transparan (bukan JPG, WebP, GIF, atau SVG).',
      hasTransparencyWarning: false,
    };
  }

  if (header.isAnimated) {
    return {
      valid: false,
      errorCode: 'FRAME_ANIMATED',
      errorMessage: 'Bingkai APNG (animasi) tidak didukung. Gunakan PNG statis 1080 × 1080.',
      hasTransparencyWarning: false,
    };
  }

  if (
    header.width !== ADMIN_FRAME_REQUIRED_WIDTH ||
    header.height !== ADMIN_FRAME_REQUIRED_HEIGHT
  ) {
    return {
      valid: false,
      errorCode: 'FRAME_WRONG_DIMENSIONS',
      errorMessage: `Dimensi bingkai harus tepat 1080 × 1080 piksel (terdeteksi ${
        header.width ?? '?'
      } × ${header.height ?? '?'} piksel).`,
      width: header.width ?? undefined,
      height: header.height ?? undefined,
      hasTransparencyWarning: false,
    };
  }

  return {
    valid: true,
    width: header.width,
    height: header.height,
    hasTransparencyWarning: false,
  };
}

/**
 * Menganalisis piksel RGBA dari kanvas/decoder bingkai 1080x1080:
 * - Menolak PNG yang sepenuhnya opak (tidak ada lubang foto)
 * - Menolak PNG yang sepenuhnya transparan (kosong)
 * - Memberi peringatan jika area transparan sangat kecil (< 5% dari luas kanvas)
 */
export function analyzeFrameRgbaPixels(
  rgbaBytes: Uint8Array | Uint8ClampedArray,
  width: number = ADMIN_FRAME_REQUIRED_WIDTH,
  height: number = ADMIN_FRAME_REQUIRED_HEIGHT
): AdminFrameValidationResult {
  if (width !== ADMIN_FRAME_REQUIRED_WIDTH || height !== ADMIN_FRAME_REQUIRED_HEIGHT) {
    return {
      valid: false,
      errorCode: 'FRAME_WRONG_DIMENSIONS',
      errorMessage: `Dimensi bingkai harus tepat 1080 × 1080 piksel (terdeteksi ${width} × ${height}).`,
      width,
      height,
      hasTransparencyWarning: false,
    };
  }

  const totalPixels = width * height;
  if (rgbaBytes.length < totalPixels * 4) {
    return {
      valid: false,
      errorCode: 'FRAME_CORRUPT',
      errorMessage: 'Data piksel bingkai PNG tidak lengkap atau gagal didekode.',
      width,
      height,
      hasTransparencyWarning: false,
    };
  }

  let transparentPixels = 0; // alpha < 250 (area di mana foto peserta terlihat)
  let fullyTransparentPixels = 0; // alpha <= 16
  let visibleDesignPixels = 0; // alpha >= 32

  for (let i = 3; i < totalPixels * 4; i += 4) {
    const alpha = rgbaBytes[i];
    if (alpha < 250) {
      transparentPixels++;
    }
    if (alpha <= 16) {
      fullyTransparentPixels++;
    }
    if (alpha >= 32) {
      visibleDesignPixels++;
    }
  }

  const transparentRatio = transparentPixels / totalPixels;
  const fullyTransparentRatio = fullyTransparentPixels / totalPixels;
  const opaqueRatio = visibleDesignPixels / totalPixels;

  if (transparentPixels === 0) {
    return {
      valid: false,
      errorCode: 'FRAME_FULLY_OPAQUE',
      errorMessage:
        'Bingkai PNG sepenuhnya opak (tidak memiliki area transparan untuk foto peserta). Pastikan bagian lubang foto diekspor sebagai transparan.',
      width,
      height,
      transparentRatio: 0,
      opaqueRatio: 1,
      hasTransparencyWarning: false,
    };
  }

  if (visibleDesignPixels === 0) {
    return {
      valid: false,
      errorCode: 'FRAME_FULLY_TRANSPARENT',
      errorMessage:
        'Bingkai PNG sepenuhnya transparan/kosong dan tidak memiliki elemen desain yang terlihat.',
      width,
      height,
      transparentRatio: 1,
      opaqueRatio: 0,
      hasTransparencyWarning: false,
    };
  }

  const hasTransparencyWarning = fullyTransparentRatio < 0.05 || opaqueRatio < 0.02;

  return {
    valid: true,
    width,
    height,
    transparentRatio: Number(transparentRatio.toFixed(4)),
    opaqueRatio: Number(opaqueRatio.toFixed(4)),
    hasTransparencyWarning,
    warningMessage: hasTransparencyWarning
      ? 'Area transparan pada bingkai sangat kecil (< 5%). Pastikan ruang wajah peserta tidak tertutup desain pada pratinjau contoh.'
      : undefined,
  };
}

export function validateCampaignSlug(slug: string): { valid: boolean; error?: string } {
  const clean = (slug || '').trim();
  if (clean.length < 3 || clean.length > 80) {
    return { valid: false, error: 'Slug harus terdiri dari 3 hingga 80 karakter.' };
  }
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(clean)) {
    return {
      valid: false,
      error: 'Slug hanya boleh menggunakan huruf kecil, angka, dan tanda hubung (-).',
    };
  }
  if (RESERVED_CAMPAIGN_SLUGS.has(clean.toLowerCase())) {
    return {
      valid: false,
      error: `Slug "${clean}" adalah nama rute sistem yang dicadangkan. Gunakan slug lain.`,
    };
  }
  return { valid: true };
}

export function validateAdminCampaignFields(params: {
  title: string;
  slug: string;
  description: string;
  captionDefault: string;
  captionTemplate: string;
  requireReadyForPublish: boolean;
  hasValidFrame: boolean;
}): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  const title = (params.title || '').trim();
  if (title.length < 5 || title.length > 120) {
    errors.push('Judul kampanye harus berisi 5 hingga 120 karakter.');
  }

  const slugCheck = validateCampaignSlug(params.slug);
  if (!slugCheck.valid && slugCheck.error) {
    errors.push(slugCheck.error);
  }

  const desc = (params.description || '').trim();
  if (desc.length > 500) {
    errors.push('Ringkasan kampanye maksimal 500 karakter.');
  }

  if (params.requireReadyForPublish) {
    if (!params.hasValidFrame) {
      errors.push('Bingkai PNG transparan 1080 × 1080 wajib diunggah dan lolos validasi sebelum publikasi.');
    }
    const captionCheck = validateCaptionTemplates(params.captionDefault, params.captionTemplate);
    if (!captionCheck.valid) {
      errors.push(...captionCheck.errors);
    }
  } else {
    // Saat simpan draft, tetap cegah melebihi batas karakter
    if ((params.captionDefault || '').length > 2000) {
      errors.push('Caption umum maksimal 2.000 karakter.');
    }
    if ((params.captionTemplate || '').length > 2000) {
      errors.push('Caption personal maksimal 2.000 karakter.');
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}


export function normalizeCampaignSlug(input: string): string {
  return (input || '')
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 80);
}

