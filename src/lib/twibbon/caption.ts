export const MAX_CAPTION_LENGTH = 2000;
export const MAX_NAMA_LENGTH = 80;
export const MAX_PRODI_LENGTH = 100;

export const DEFAULT_DIKLAT_CAPTION_UMUM = `Siap belajar, bertumbuh, dan mengambil peran bersama UKM Pilar Bangsa!
Sampai bertemu di Diklat Kepemimpinan pada 1 November 2026.
@ukmpilarbangsa
#DiklatPilarBangsa2026 #UKMPilarBangsa #UntagBanyuwangi`;

export const DEFAULT_DIKLAT_CAPTION_PERSONAL = `Saya {{nama}} dari {{prodi}}, siap belajar dan mengambil peran bersama UKM Pilar Bangsa!
Sampai bertemu di Diklat Kepemimpinan pada 1 November 2026.
@ukmpilarbangsa
#DiklatPilarBangsa2026 #UKMPilarBangsa #UntagBanyuwangi`;

export interface CaptionValidationResult {
  valid: boolean;
  errors: string[];
}

/**
 * Membersihkan input personal (nama/prodi) di sisi lokal:
 * - Pangkas spasi tepi
 * - Hilangkan karakter kontrol baris baru
 * - Batasi panjang maksimum
 * - Tidak mengeksekusi atau menyusun HTML
 */
export function sanitizePersonalTokenInput(value: string, maxLength: number): string {
  if (typeof value !== 'string') return '';
  return value
    .replace(/[\r\n\t]+/g, ' ')
    .replace(/\s{2,}/g, ' ')
    .trim()
    .slice(0, maxLength);
}

/**
 * Memeriksa sintaks template caption saat admin menyimpan/mempublikasikan.
 * Sesuai PRD Bagian 11 (F11, T15, T16):
 * - Maksimum 2.000 karakter.
 * - Caption umum (caption_default) tidak boleh mengandung token {{...}} agar jika nama/prodi kosong tidak ada token tersisa.
 * - Caption personal (caption_template) hanya boleh memakai token {{nama}} dan {{prodi}}.
 * - Token tidak dikenal (mis. {{nim}}) atau kurung kurawal tidak lengkap (mis. {{nama atau nama}}) ditolak.
 */
export function validateCaptionTemplates(
  captionDefault: string,
  captionTemplate: string
): CaptionValidationResult {
  const errors: string[] = [];

  const cleanDefault = (captionDefault || '').trim();
  const cleanTemplate = (captionTemplate || '').trim();

  if (!cleanDefault) {
    errors.push('Caption umum wajib diisi.');
  } else if (cleanDefault.length > MAX_CAPTION_LENGTH) {
    errors.push(`Caption umum maksimal ${MAX_CAPTION_LENGTH} karakter.`);
  }

  if (!cleanTemplate) {
    errors.push('Caption personal wajib diisi.');
  } else if (cleanTemplate.length > MAX_CAPTION_LENGTH) {
    errors.push(`Caption personal maksimal ${MAX_CAPTION_LENGTH} karakter.`);
  }

  // Periksa kurung kurawal di captionDefault (tidak boleh ada token di caption umum)
  if (/\{\{|\}\}/.test(cleanDefault)) {
    errors.push(
      'Caption umum tidak boleh mengandung token {{...}} karena dipakai saat peserta mengosongkan nama atau prodi.'
    );
  }

  // Periksa token dan kurung kurawal tidak seimbang di captionTemplate
  const tokenRegex = /\{\{([^{}]*)\}\}/g;
  let match: RegExpExecArray | null;
  const foundTokens: string[] = [];

  while ((match = tokenRegex.exec(cleanTemplate)) !== null) {
    const tokenName = match[1].trim();
    foundTokens.push(tokenName);
    if (tokenName !== 'nama' && tokenName !== 'prodi') {
      errors.push(
        `Token "{{${tokenName}}}" tidak didukung. Hanya token {{nama}} dan {{prodi}} yang diizinkan pada rilis ini.`
      );
    }
  }

  // Hapus token valid dari salinan string untuk mengecek apakah masih ada '{' atau '}' yatim
  const stripped = cleanTemplate.replace(/\{\{\s*(nama|prodi)\s*\}\}/g, '');
  if (/[{}]/.test(stripped)) {
    errors.push(
      'Terdapat sintaks kurung kurawal yang tidak lengkap atau tidak valid pada caption personal. Gunakan format {{nama}} dan {{prodi}}.'
    );
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Menghasilkan teks caption akhir secara lokal di perangkat peserta.
 * Sesuai PRD Bagian 11:
 * - Jika kedua isian (nama DAN prodi) lengkap setelah trim, gunakan caption_template.
 * - Jika salah satu atau keduanya kosong, gunakan caption_default utuh sehingga tidak ada token tersisa atau kalimat janggal.
 */
export function renderParticipantCaption(params: {
  captionDefault: string;
  captionTemplate: string;
  nama?: string;
  prodi?: string;
}): {
  text: string;
  variant: 'personal' | 'default';
  sanitizedNama: string;
  sanitizedProdi: string;
} {
  const sanitizedNama = sanitizePersonalTokenInput(params.nama || '', MAX_NAMA_LENGTH);
  const sanitizedProdi = sanitizePersonalTokenInput(params.prodi || '', MAX_PRODI_LENGTH);

  const hasBoth = sanitizedNama.length > 0 && sanitizedProdi.length > 0;
  const fallbackText = (params.captionDefault || DEFAULT_DIKLAT_CAPTION_UMUM).slice(
    0,
    MAX_CAPTION_LENGTH
  );

  if (!hasBoth || !params.captionTemplate?.trim()) {
    return {
      text: fallbackText,
      variant: 'default',
      sanitizedNama,
      sanitizedProdi,
    };
  }

  // Gunakan fungsi replacer agar nilai input yang mengandung '$&' atau '{{prodi}}' tidak memicu injeksi token kedua
  const rendered = params.captionTemplate.replace(
    /\{\{\s*(nama|prodi)\s*\}\}/g,
    (_full, token: string) => {
      if (token === 'nama') return sanitizedNama;
      if (token === 'prodi') return sanitizedProdi;
      return '';
    }
  );

  return {
    text: rendered.slice(0, MAX_CAPTION_LENGTH),
    variant: 'personal',
    sanitizedNama,
    sanitizedProdi,
  };
}


export const DIKLAT_2026_CAMPAIGN_SLUG = 'diklat-kepemimpinan-2026';

export const DEFAULT_DIKLAT_2026_CAMPAIGN = {
  title: 'Twibbon Diklat Kepemimpinan UKM Pilar Bangsa 2026',
  slug: DIKLAT_2026_CAMPAIGN_SLUG,
  description:
    'Pasang bingkai Twibbon resmi 1080×1080 dan salin caption Diklat Kepemimpinan UKM Pilar Bangsa Periode 2026/2027 (Minggu, 1 November 2026 di Mondoluko Farm, Desa Taman Suruh).',
  caption_default: DEFAULT_DIKLAT_CAPTION_UMUM,
  caption_template: DEFAULT_DIKLAT_CAPTION_PERSONAL,
};

