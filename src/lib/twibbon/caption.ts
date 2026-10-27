export const MAX_CAPTION_LENGTH = 2000;
export const MAX_NAMA_LENGTH = 80;
export const MAX_PRODI_LENGTH = 100;
export const MAX_TOKEN_VALUE_LENGTH = 100;
export const MAX_CUSTOM_TOKENS = 10;

export const DEFAULT_DIKLAT_CAPTION_UMUM = `Siap belajar, bertumbuh, dan mengambil peran bersama UKM Pilar Bangsa!
Sampai bertemu di Diklat Kepemimpinan pada 1 November 2026.
@ukmpilarbangsa
#DiklatPilarBangsa2026 #UKMPilarBangsa #UntagBanyuwangi`;

export const DEFAULT_DIKLAT_CAPTION_PERSONAL = `Saya {{nama}} dari {{prodi}}, siap belajar dan mengambil peran bersama UKM Pilar Bangsa!
Sampai bertemu di Diklat Kepemimpinan pada 1 November 2026.
@ukmpilarbangsa
#DiklatPilarBangsa2026 #UKMPilarBangsa #UntagBanyuwangi`;

export const DIKLAT_2026_CAMPAIGN_SLUG = 'diklat-kepemimpinan-2026';

export const DEFAULT_DIKLAT_2026_CAMPAIGN = {
  title: 'Twibbon Diklat Kepemimpinan UKM Pilar Bangsa 2026',
  slug: DIKLAT_2026_CAMPAIGN_SLUG,
  description:
    'Pasang bingkai Twibbon resmi 1080×1080 dan salin caption Diklat Kepemimpinan UKM Pilar Bangsa Periode 2026/2027 (Minggu, 1 November 2026 di Mondoluko Farm, Desa Taman Suruh).',
  caption_default: DEFAULT_DIKLAT_CAPTION_UMUM,
  caption_template: DEFAULT_DIKLAT_CAPTION_PERSONAL,
};

export interface CaptionTokenMetadata {
  /** Kunci terstandarisasi huruf kecil dengan underscore, mis. 'nama', 'fakultas', 'asal_sekolah' */
  key: string;
  /** Label ramah pengguna pada form peserta & simulasi admin */
  label: string;
  /** Placeholder pada input form */
  placeholder: string;
  /** Nilai contoh untuk pratinjau simulasi di panel admin */
  sampleValue: string;
  /** Batas panjang karakter input peserta */
  maxLength: number;
}

const PRESET_TOKEN_DICTIONARY: Record<string, Omit<CaptionTokenMetadata, 'key'>> = {
  nama: {
    label: 'Nama Lengkap',
    placeholder: 'Contoh: Budi Santoso',
    sampleValue: 'Budi Santoso',
    maxLength: MAX_NAMA_LENGTH,
  },
  nama_lengkap: {
    label: 'Nama Lengkap',
    placeholder: 'Contoh: Budi Santoso',
    sampleValue: 'Budi Santoso',
    maxLength: MAX_NAMA_LENGTH,
  },
  fakultas: {
    label: 'Fakultas',
    placeholder: 'Contoh: Fakultas Teknik',
    sampleValue: 'Fakultas Teknik',
    maxLength: MAX_TOKEN_VALUE_LENGTH,
  },
  nama_fakultas: {
    label: 'Fakultas',
    placeholder: 'Contoh: Fakultas Teknik',
    sampleValue: 'Fakultas Teknik',
    maxLength: MAX_TOKEN_VALUE_LENGTH,
  },
  prodi: {
    label: 'Program Studi',
    placeholder: 'Contoh: Teknik Informatika',
    sampleValue: 'Teknik Informatika',
    maxLength: MAX_PRODI_LENGTH,
  },
  program_studi: {
    label: 'Program Studi',
    placeholder: 'Contoh: Teknik Informatika',
    sampleValue: 'Teknik Informatika',
    maxLength: MAX_PRODI_LENGTH,
  },
  asal_sekolah: {
    label: 'Asal Sekolah',
    placeholder: 'Contoh: SMAN 1 Banyuwangi',
    sampleValue: 'SMAN 1 Banyuwangi',
    maxLength: MAX_TOKEN_VALUE_LENGTH,
  },
  sekolah: {
    label: 'Nama Sekolah',
    placeholder: 'Contoh: SMAN 1 Banyuwangi',
    sampleValue: 'SMAN 1 Banyuwangi',
    maxLength: MAX_TOKEN_VALUE_LENGTH,
  },
  nama_sekolah: {
    label: 'Nama Sekolah',
    placeholder: 'Contoh: SMAN 1 Banyuwangi',
    sampleValue: 'SMAN 1 Banyuwangi',
    maxLength: MAX_TOKEN_VALUE_LENGTH,
  },
  kelas: {
    label: 'Kelas',
    placeholder: 'Contoh: XII MIPA 1',
    sampleValue: 'XII MIPA 1',
    maxLength: 50,
  },
  jurusan: {
    label: 'Jurusan',
    placeholder: 'Contoh: IPA / Rekayasa Perangkat Lunak',
    sampleValue: 'IPA',
    maxLength: MAX_TOKEN_VALUE_LENGTH,
  },
  instansi: {
    label: 'Asal Instansi / Kampus',
    placeholder: 'Contoh: Untag Banyuwangi',
    sampleValue: 'Untag Banyuwangi',
    maxLength: MAX_TOKEN_VALUE_LENGTH,
  },
  asal_instansi: {
    label: 'Asal Instansi',
    placeholder: 'Contoh: Untag Banyuwangi',
    sampleValue: 'Untag Banyuwangi',
    maxLength: MAX_TOKEN_VALUE_LENGTH,
  },
  kampus: {
    label: 'Asal Kampus',
    placeholder: 'Contoh: Universitas 17 Agustus 1945 Banyuwangi',
    sampleValue: 'Untag Banyuwangi',
    maxLength: MAX_TOKEN_VALUE_LENGTH,
  },
  angkatan: {
    label: 'Angkatan',
    placeholder: 'Contoh: 2026',
    sampleValue: '2026',
    maxLength: 40,
  },
  kelompok: {
    label: 'Kelompok / Gugus',
    placeholder: 'Contoh: Kelompok 1 (Garuda)',
    sampleValue: 'Kelompok 1',
    maxLength: 60,
  },
  daerah: {
    label: 'Asal Daerah / Kota',
    placeholder: 'Contoh: Banyuwangi',
    sampleValue: 'Banyuwangi',
    maxLength: 80,
  },
};

/**
 * Daftar preset variabel cepat yang dapat ditambahkan Humas dengan 1 klik di editor Admin.
 */
export const QUICK_CAPTION_TOKEN_PRESETS: CaptionTokenMetadata[] = [
  { key: 'nama', ...PRESET_TOKEN_DICTIONARY.nama },
  { key: 'fakultas', ...PRESET_TOKEN_DICTIONARY.fakultas },
  { key: 'prodi', ...PRESET_TOKEN_DICTIONARY.prodi },
  { key: 'asal_sekolah', ...PRESET_TOKEN_DICTIONARY.asal_sekolah },
  { key: 'kelas', ...PRESET_TOKEN_DICTIONARY.kelas },
  { key: 'jurusan', ...PRESET_TOKEN_DICTIONARY.jurusan },
  { key: 'instansi', ...PRESET_TOKEN_DICTIONARY.instansi },
  { key: 'kelompok', ...PRESET_TOKEN_DICTIONARY.kelompok },
];

/**
 * Menstandarkan nama token (mis. "Nama Fakultas" -> "nama_fakultas").
 * Mengembalikan string kosong jika nama token mengandung karakter berbahaya/tidak valid.
 */
export function normalizeTokenKey(raw: string): string {
  if (typeof raw !== 'string') return '';
  const trimmed = raw.trim().toLowerCase();
  if (!trimmed || trimmed.length > 40) return '';
  // Hanya izinkan huruf, angka, spasi, underscore, dan tanda hubung
  if (!/^[a-z0-9_ -]+$/.test(trimmed)) return '';
  const normalized = trimmed
    .replace(/[\s-]+/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '');
  if (!normalized || !/^[a-z][a-z0-9_]*$/.test(normalized)) return '';
  return normalized;
}

/**
 * Mengubah kunci token menjadi metadata lengkap (Label, Placeholder, Sample, MaxLength).
 */
export function getCaptionTokenMetadata(rawKey: string): CaptionTokenMetadata {
  const key = normalizeTokenKey(rawKey) || rawKey.trim().toLowerCase();
  const preset = PRESET_TOKEN_DICTIONARY[key];
  if (preset) {
    return { key, ...preset };
  }

  const humanizedLabel = key
    .split('_')
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

  const label = humanizedLabel || 'Isian Peserta';
  return {
    key,
    label,
    placeholder: `Masukkan ${label}`,
    sampleValue: `Contoh ${label}`,
    maxLength: MAX_TOKEN_VALUE_LENGTH,
  };
}

/**
 * Mengekstrak daftar token unik (berurutan sesuai kemunculan pertama) dari template caption.
 */
export function extractCaptionTokens(captionTemplate: string | null | undefined): CaptionTokenMetadata[] {
  if (!captionTemplate || typeof captionTemplate !== 'string') return [];

  const tokenRegex = /\{\{([^{}]*)\}\}/g;
  const seen = new Set<string>();
  const result: CaptionTokenMetadata[] = [];
  let match: RegExpExecArray | null;

  while ((match = tokenRegex.exec(captionTemplate)) !== null) {
    const key = normalizeTokenKey(match[1]);
    if (key && !seen.has(key)) {
      seen.add(key);
      result.push(getCaptionTokenMetadata(key));
    }
  }

  return result;
}

/**
 * Mendeteksi placeholder kurung siku seperti `[nama fakultas]` atau `[asal sekolah]`
 * yang sering disalin Humas dari Google Docs/Word agar dapat dikonversi menjadi `{{...}}` dengan 1 klik.
 */
export function detectSquareBracketPlaceholders(
  captionTemplate: string | null | undefined
): Array<{ rawBracket: string; suggestedTokenKey: string }> {
  if (!captionTemplate || typeof captionTemplate !== 'string') return [];
  const regex = /\[([^\[\]\r\n]{2,40})\]/g;
  const seen = new Set<string>();
  const suggestions: Array<{ rawBracket: string; suggestedTokenKey: string }> = [];
  let match: RegExpExecArray | null;

  while ((match = regex.exec(captionTemplate)) !== null) {
    const rawBracket = match[0];
    const inside = match[1].trim();
    // Jika diawali "nama " dan bukan "nama lengkap", misal "[nama fakultas]" -> "fakultas"
    const cleanedInside = inside.replace(/^nama\s+(?!lengkap)/i, '');
    const suggestedTokenKey = normalizeTokenKey(cleanedInside) || normalizeTokenKey(inside);
    if (suggestedTokenKey && !seen.has(rawBracket)) {
      seen.add(rawBracket);
      suggestions.push({ rawBracket, suggestedTokenKey });
    }
  }

  return suggestions;
}

export interface CaptionValidationResult {
  valid: boolean;
  errors: string[];
}

/**
 * Membersihkan input personal di sisi lokal:
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
 * Mendukung token fleksibel `{{nama_variabel}}` (mahasiswa, siswa, umum) yang dapat
 * ditambah atau dikurangi oleh Humas:
 * - Maksimum 2.000 karakter.
 * - Caption umum (`caption_default`) wajib diisi dan tidak boleh mengandung token `{{...}}`.
 * - Caption personal (`caption_template`) opsional (jika dikosongkan, otomatis menyalin `caption_default`).
 * - Setiap token `{{...}}` di `caption_template` harus memiliki nama variabel yang valid (huruf/angka/underscore, maks 40 karakter) dan kurung kurawal harus seimbang.
 */
export function validateCaptionTemplates(
  captionDefault: string,
  captionTemplate?: string | null
): CaptionValidationResult {
  const errors: string[] = [];

  const cleanDefault = (captionDefault || '').trim();
  const cleanTemplate = (captionTemplate ?? '').trim();

  if (!cleanDefault) {
    errors.push('Caption umum wajib diisi.');
  } else if (cleanDefault.length > MAX_CAPTION_LENGTH) {
    errors.push(`Caption umum maksimal ${MAX_CAPTION_LENGTH} karakter.`);
  }

  if (cleanTemplate.length > MAX_CAPTION_LENGTH) {
    errors.push(`Caption personal maksimal ${MAX_CAPTION_LENGTH} karakter.`);
  }

  // Periksa kurung kurawal di captionDefault (tidak boleh ada token di caption umum)
  if (/\{\{|\}\}/.test(cleanDefault)) {
    errors.push(
      'Caption umum tidak boleh mengandung token {{...}} karena dipakai saat peserta mengosongkan isian personal.'
    );
  }

  if (cleanTemplate) {
    const tokenRegex = /\{\{([^{}]*)\}\}/g;
    let match: RegExpExecArray | null;
    const distinctKeys = new Set<string>();

    while ((match = tokenRegex.exec(cleanTemplate)) !== null) {
      const rawToken = match[1];
      const normalized = normalizeTokenKey(rawToken);
      if (!normalized) {
        errors.push(
          `Format variabel "{{${rawToken}}}" tidak valid. Gunakan huruf/angka/underscore seperti {{nama}}, {{fakultas}}, {{prodi}}, atau {{asal_sekolah}}.`
        );
      } else {
        distinctKeys.add(normalized);
      }
    }

    if (distinctKeys.size > MAX_CUSTOM_TOKENS) {
      errors.push(`Maksimal ${MAX_CUSTOM_TOKENS} variabel berbeda dalam satu template caption.`);
    }

    // Hapus seluruh blok {{...}} untuk mengecek apakah masih ada kurung kurawal '{' atau '}' yang tidak seimbang
    const stripped = cleanTemplate.replace(/\{\{[^{}]*\}\}/g, '');
    if (/[{}]/.test(stripped)) {
      errors.push(
        'Terdapat sintaks kurung kurawal yang tidak lengkap atau tidak seimbang pada caption personal. Pastikan setiap variabel ditutup dengan dua kurung kurawal seperti {{nama}}.'
      );
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Menghasilkan teks caption akhir secara lokal di perangkat peserta.
 * Mendukung baik peta `values: Record<string, string>` yang fleksibel maupun parameter `nama` & `prodi`:
 * - Jika `caption_template` memiliki token `{{...}}` dan SELURUH token yang dibutuhkan telah diisi peserta, gunakan `caption_template`.
 * - Jika salah satu token masih kosong atau `caption_template` tidak memiliki token, gunakan `caption_default` utuh sehingga tidak pernah ada token `{{...}}` mentah yang tersisa.
 */
export function renderParticipantCaption(params: {
  captionDefault: string;
  captionTemplate?: string | null;
  values?: Record<string, string>;
  nama?: string;
  prodi?: string;
}): {
  text: string;
  variant: 'personal' | 'default';
  sanitizedValues: Record<string, string>;
  sanitizedNama: string;
  sanitizedProdi: string;
  tokens: CaptionTokenMetadata[];
} {
  const mergedRawValues: Record<string, string> = {
    ...(params.values || {}),
  };
  if (params.nama !== undefined && mergedRawValues.nama === undefined) {
    mergedRawValues.nama = params.nama;
  }
  if (params.prodi !== undefined && mergedRawValues.prodi === undefined) {
    mergedRawValues.prodi = params.prodi;
  }

  const tokens = extractCaptionTokens(params.captionTemplate);
  const sanitizedValues: Record<string, string> = {};

  for (const tokenMeta of tokens) {
    const rawVal = mergedRawValues[tokenMeta.key] ?? '';
    sanitizedValues[tokenMeta.key] = sanitizePersonalTokenInput(rawVal, tokenMeta.maxLength);
  }

  const sanitizedNama =
    sanitizedValues.nama ?? sanitizePersonalTokenInput(params.nama || '', MAX_NAMA_LENGTH);
  const sanitizedProdi =
    sanitizedValues.prodi ?? sanitizePersonalTokenInput(params.prodi || '', MAX_PRODI_LENGTH);

  const fallbackText = (params.captionDefault || DEFAULT_DIKLAT_CAPTION_UMUM).slice(
    0,
    MAX_CAPTION_LENGTH
  );

  // Jika tidak ada template personal atau tidak ada token di dalamnya, atau belum semua token diisi
  const allTokensFilled =
    tokens.length > 0 && tokens.every((t) => (sanitizedValues[t.key] || '').length > 0);

  if (!params.captionTemplate?.trim() || !allTokensFilled) {
    return {
      text: fallbackText,
      variant: 'default',
      sanitizedValues,
      sanitizedNama,
      sanitizedProdi,
      tokens,
    };
  }

  // Ganti seluruh token {{...}} menggunakan fungsi replacer agar aman dari injeksi token kedua
  const rendered = params.captionTemplate.replace(/\{\{([^{}]*)\}\}/g, (fullMatch, rawKey: string) => {
    const key = normalizeTokenKey(rawKey);
    if (!key) return fullMatch;
    return sanitizedValues[key] ?? '';
  });

  return {
    text: rendered.slice(0, MAX_CAPTION_LENGTH),
    variant: 'personal',
    sanitizedValues,
    sanitizedNama,
    sanitizedProdi,
    tokens,
  };
}
