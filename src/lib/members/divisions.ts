export const MEMBER_DIVISION_FILTERS = [
  'Pengurus Inti',
  'Divisi Humas',
  'Divisi Advokasi',
  'Divisi PKM',
  'Divisi Riset',
] as const;

export type MemberDivisionFilter = (typeof MEMBER_DIVISION_FILTERS)[number];

export const MEMBER_DIVISION_SUGGESTIONS = [
  'Ketua Umum',
  'Sekretaris 1',
  'Sekretaris 2',
  'Bendahara 1',
  'Bendahara 2',
  'Pengurus Inti',
  'Divisi Humas',
  'Divisi Advokasi',
  'Divisi PKM',
  'Divisi Riset',
  'Penalaran & PKM',
  'Riset & Penelitian',
] as const;

/**
 * Mencocokkan nilai kolom `division` anggota/pengurus terhadap opsi filter divisi standar.
 * - "Pengurus Inti" mencakup Pengurus Inti, BPH, Ketua Umum, Wakil Ketua, Sekretaris 1/2, Bendahara 1/2.
 * - "Divisi Humas" mencakup variasi Humas / Hubungan Masyarakat.
 * - "Divisi Advokasi" mencakup variasi Advokasi.
 * - "Divisi PKM" mencakup variasi PKM / Penalaran & PKM.
 * - "Divisi Riset" mencakup variasi Riset / Riset & Penelitian.
 */
export function matchesDivisionFilter(
  memberDivision: string | null | undefined,
  filterValue: string
): boolean {
  if (!filterValue || filterValue === 'Semua' || filterValue === 'Semua Divisi') {
    return true;
  }

  const raw = (memberDivision || '').toLowerCase().trim();
  if (!raw) return false;

  switch (filterValue) {
    case 'Pengurus Inti': {
      if (
        raw.includes('pengurus inti') ||
        /\bbph\b/.test(raw) ||
        raw.includes('ketua umum') ||
        /\bketum\b/.test(raw)
      ) {
        return true;
      }
      // Jangan masukkan "Ketua Divisi ..." atau "Sekretaris Divisi ..." ke Pengurus Inti
      if (raw.includes('divisi')) {
        return false;
      }
      return /\b(wakil\s*ketua|ketua|sekretaris(\s*(umum|1|2|i|ii))?|bendahara(\s*(umum|1|2|i|ii))?)\b/.test(
        raw
      );
    }
    case 'Divisi Humas':
      return raw.includes('humas') || raw.includes('hubungan masyarakat');
    case 'Divisi Advokasi':
      return raw.includes('advokasi');
    case 'Divisi PKM':
      return raw.includes('pkm') || raw.includes('penalaran');
    case 'Divisi Riset':
      return raw.includes('riset') || raw.includes('penelitian');
    default:
      return raw === filterValue.toLowerCase().trim();
  }
}
