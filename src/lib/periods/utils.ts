import type { OrganizationPeriod } from './types';

export const VIRTUAL_ACTIVE_PERIOD_ID = 'virtual-active-period';

const MONTH_NAMES = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'Mei',
  'Jun',
  'Jul',
  'Agt',
  'Sep',
  'Okt',
  'Nov',
  'Des',
];

function readErrorField(error: unknown, field: 'code' | 'message'): string {
  if (!error || typeof error !== 'object') return '';
  const record = error as Record<string, unknown>;
  const val = record[field];
  return typeof val === 'string' ? val : '';
}

/**
 * Mendeteksi error skema/kolom belum tersedia agar aplikasi tetap aman sebelum SQL tahap 20 dijalankan.
 */
export function isSchemaMissingError(error: unknown): boolean {
  if (!error) return false;
  const code = readErrorField(error, 'code');
  const msg = (
    error instanceof Error ? error.message : readErrorField(error, 'message')
  ).toLowerCase();

  return (
    code === '42P01' ||
    code === 'PGRST205' ||
    code === '42703' ||
    code === 'PGRST204' ||
    msg.includes('does not exist') ||
    msg.includes('could not find the table') ||
    msg.includes('schema cache')
  );
}

/**
 * Mendeteksi penolakan mutasi karena periode berstatus locked.
 */
export function isPeriodLockedError(error: unknown): boolean {
  if (!error) return false;
  const code = readErrorField(error, 'code');
  const msg = (
    error instanceof Error ? error.message : readErrorField(error, 'message')
  ).toLowerCase();

  if (msg.includes('period_locked') || msg.includes('period_delete_forbidden')) {
    return true;
  }

  return code === '42501' && (msg.includes('periode') || msg.includes('dikunci'));
}

export function formatPeriodErrorMessage(error: unknown, fallback: string): string {
  if (isPeriodLockedError(error)) {
    return 'Periode ini sudah dikunci permanen dan tidak dapat diubah lagi.';
  }
  if (error instanceof Error && error.message) {
    return error.message;
  }
  const msg = readErrorField(error, 'message');
  return msg || fallback;
}

export function inferDefaultPeriodInfo(now: Date = new Date()): {
  code: string;
  name: string;
  startYear: number;
  endYear: number;
  startDate: string;
  endDate: string;
} {
  const month = now.getMonth() + 1;
  let startYear = month >= 7 ? now.getFullYear() : now.getFullYear() - 1;
  if (startYear < 2025) startYear = 2025;
  const endYear = startYear + 1;
  const code = `${startYear}/${endYear}`;
  return {
    code,
    name: `Periode ${code}`,
    startYear,
    endYear,
    startDate: `${startYear}-07-01`,
    endDate: `${endYear}-06-30`,
  };
}

export function suggestNextPeriod(
  current?: Pick<OrganizationPeriod, 'start_year' | 'end_year' | 'code'> | null
): {
  code: string;
  name: string;
  startYear: number;
  endYear: number;
  startDate: string;
  endDate: string;
} {
  if (!current) {
    return inferDefaultPeriodInfo();
  }
  const startYear = Number(current.start_year) + 1;
  const endYear = startYear + 1;
  const code = `${startYear}/${endYear}`;
  return {
    code,
    name: `Periode ${code}`,
    startYear,
    endYear,
    startDate: `${startYear}-07-01`,
    endDate: `${endYear}-06-30`,
  };
}

export function validateNewPeriodInput(
  input: {
    newCode: string;
    newName: string;
    startYear: number;
    endYear: number;
    startDate: string;
    endDate: string;
  },
  existingPeriods: Array<Pick<OrganizationPeriod, 'code'>>
): string | null {
  const code = input.newCode.trim();
  const name = input.newName.trim();

  if (!/^\d{4}\/\d{4}$/.test(code)) {
    return 'Kode periode harus menggunakan format YYYY/YYYY (contoh: 2027/2028).';
  }
  if (name.length < 4) {
    return 'Nama periode minimal 4 karakter.';
  }

  const [codeStart, codeEnd] = code.split('/').map(Number);
  if (codeStart !== input.startYear || codeEnd !== input.endYear) {
    return 'Kode periode harus selaras dengan tahun mulai dan tahun berakhir.';
  }
  if (input.endYear !== input.startYear + 1) {
    return 'Tahun berakhir harus tepat 1 tahun setelah tahun mulai.';
  }
  if (!input.startDate || !input.endDate || input.endDate <= input.startDate) {
    return 'Tanggal berakhir periode harus lebih lambat daripada tanggal mulai.';
  }
  if (existingPeriods.some((p) => p.code.trim() === code)) {
    return `Periode ${code} sudah ada di sistem.`;
  }

  return null;
}

export function generateMonthsForPeriod(
  startYear: number,
  endYear: number = startYear + 1
): Array<{ month: number; year: number; label: string }> {
  const months: Array<{ month: number; year: number; label: string }> = [];
  for (let i = 0; i < 12; i++) {
    const m = ((6 + i) % 12) + 1; // 7..12, lalu 1..6
    const y = m >= 7 ? startYear : endYear;
    months.push({
      month: m,
      year: y,
      label: `${MONTH_NAMES[m - 1]} ${String(y).slice(2)}`,
    });
  }
  return months;
}

export function buildVirtualFallbackPeriod(now: Date = new Date()): OrganizationPeriod {
  const info = inferDefaultPeriodInfo(now);
  const nowIso = now.toISOString();
  return {
    id: VIRTUAL_ACTIVE_PERIOD_ID,
    code: info.code,
    name: info.name,
    cabinet_name: 'Kepengurusan UKM Pilar Bangsa',
    theme: null,
    start_year: info.startYear,
    end_year: info.endYear,
    start_date: info.startDate,
    end_date: info.endDate,
    status: 'active',
    visi_misi: null,
    struktur_pimpinan: null,
    locked_at: null,
    locked_by: null,
    lock_notes: null,
    created_at: nowIso,
    updated_at: nowIso,
  };
}

const DIVISI_ROLES = new Set(['divisi', 'admin_divisi', 'riset', 'penalaran', 'pengabdian']);
const DIVISI_EMAIL_KEYWORDS = ['riset', 'penalaran', 'pengabdian', 'divisi', 'wakilketua'];

export function resolveEffectiveRole(
  rawRole: string | null | undefined,
  email: string | null | undefined
): string {
  const normalizedEmail = (email || '').toLowerCase();
  const normalizedRole = (rawRole || '').toLowerCase();

  if (normalizedEmail.includes('humas') || normalizedRole === 'humas') {
    return 'humas';
  }
  if (
    DIVISI_ROLES.has(normalizedRole) ||
    DIVISI_EMAIL_KEYWORDS.some((kw) => normalizedEmail.includes(kw))
  ) {
    return 'divisi';
  }
  if (normalizedRole) {
    return normalizedRole;
  }
  return 'ketua';
}

export function canManagePeriodsRole(role: string): boolean {
  const normalized = role.toLowerCase();
  return normalized === 'ketua' || normalized === 'sekretaris';
}

export function getDefaultDashboardPath(role: string): string {
  switch (role.toLowerCase()) {
    case 'sekretaris':
      return '/dashboard/sekretaris';
    case 'bendahara':
      return '/dashboard/bendahara';
    case 'humas':
      return '/dashboard/humas/berita';
    case 'ketua':
    default:
      return '/dashboard/ketua';
  }
}

function matchesRoutePrefix(pathname: string, prefix: string): boolean {
  return pathname === prefix || pathname.startsWith(`${prefix}/`);
}

export function canAccessDashboardPath(role: string, pathname: string): boolean {
  if (matchesRoutePrefix(pathname, '/dashboard/profil')) {
    return true;
  }
  if (matchesRoutePrefix(pathname, '/dashboard/periode')) {
    return canManagePeriodsRole(role);
  }
  if (matchesRoutePrefix(pathname, '/dashboard/kedisiplinan')) {
    return canManagePeriodsRole(role);
  }

  switch (role.toLowerCase()) {
    case 'ketua':
      return (
        matchesRoutePrefix(pathname, '/dashboard/ketua') ||
        matchesRoutePrefix(pathname, '/dashboard/sekretaris/anggota') ||
        matchesRoutePrefix(pathname, '/dashboard/sekretaris/agenda') ||
        matchesRoutePrefix(pathname, '/dashboard/bendahara/laporan') ||
        matchesRoutePrefix(pathname, '/dashboard/humas/twibbon') ||
        matchesRoutePrefix(pathname, '/dashboard/humas/momen')
      );
    case 'sekretaris':
      return matchesRoutePrefix(pathname, '/dashboard/sekretaris');
    case 'bendahara':
      return matchesRoutePrefix(pathname, '/dashboard/bendahara');
    case 'humas':
      return matchesRoutePrefix(pathname, '/dashboard/humas');
    case 'divisi':
      return true;
    default:
      return false;
  }
}
