import { cookies } from 'next/headers';
import { createClient } from '@/utils/supabase/server';
import { requireAuthUser } from '@/utils/auth-guard';
import { PERIOD_COOKIE_NAME, type OrganizationPeriod } from './types';
import {
  buildVirtualFallbackPeriod,
  canManagePeriodsRole,
  isSchemaMissingError,
  resolveEffectiveRole,
  VIRTUAL_ACTIVE_PERIOD_ID,
} from './utils';

export async function getAllPeriods(): Promise<{
  periods: OrganizationPeriod[];
  schemaReady: boolean;
}> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('periods')
    .select('*')
    .order('start_year', { ascending: false })
    .order('created_at', { ascending: false });

  if (error) {
    if (isSchemaMissingError(error)) {
      return {
        periods: [buildVirtualFallbackPeriod()],
        schemaReady: false,
      };
    }
    throw new Error(`Gagal memuat daftar periode: ${error.message}`);
  }

  const periods = (data || []) as OrganizationPeriod[];
  if (periods.length === 0) {
    return {
      periods: [buildVirtualFallbackPeriod()],
      schemaReady: false,
    };
  }

  return { periods, schemaReady: true };
}

export async function getActivePeriod(): Promise<{
  period: OrganizationPeriod;
  periods: OrganizationPeriod[];
  schemaReady: boolean;
}> {
  const { periods, schemaReady } = await getAllPeriods();
  const active =
    periods.find((p) => p.status === 'active') ||
    periods[0] ||
    buildVirtualFallbackPeriod();

  return {
    period: active,
    periods,
    schemaReady,
  };
}

export async function getSelectedPeriodForDashboard(): Promise<{
  selectedPeriod: OrganizationPeriod;
  activePeriod: OrganizationPeriod;
  periods: OrganizationPeriod[];
  isLocked: boolean;
  schemaReady: boolean;
}> {
  const [{ period: activePeriod, periods, schemaReady }, cookieStore] = await Promise.all([
    getActivePeriod(),
    cookies(),
  ]);

  const cookiePeriodId = cookieStore.get(PERIOD_COOKIE_NAME)?.value;
  const selectedPeriod =
    (cookiePeriodId ? periods.find((p) => p.id === cookiePeriodId) : undefined) ||
    activePeriod;

  return {
    selectedPeriod,
    activePeriod,
    periods,
    isLocked: schemaReady && selectedPeriod.status === 'locked',
    schemaReady,
  };
}

export async function getAuthenticatedDashboardContext() {
  const user = await requireAuthUser();
  const supabase = await createClient();

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, email, full_name, division_name')
    .eq('id', user.id)
    .maybeSingle();

  const email = user.email || profile?.email || '';
  const role = resolveEffectiveRole(profile?.role, email);

  return {
    supabase,
    user,
    role,
    email,
    name: profile?.full_name || email || 'Pengurus',
    divisionName: profile?.division_name || null,
  };
}

export async function canManagePeriods(): Promise<boolean> {
  try {
    const { role } = await getAuthenticatedDashboardContext();
    return canManagePeriodsRole(role);
  } catch {
    return false;
  }
}

export async function assertPeriodManager() {
  const ctx = await getAuthenticatedDashboardContext();
  if (!canManagePeriodsRole(ctx.role)) {
    throw new Error(
      'Akses ditolak. Hanya Ketua atau Sekretaris yang memiliki wewenang mengelola periode kepengurusan.'
    );
  }
  return ctx;
}

/**
 * Validasi wajib sebelum operasi tulis di dashboard.
 * Memastikan user login, skema tersedia (atau fallback pre-SQL), dan target periode tidak terkunci.
 */
export async function requireWritablePeriod(explicitPeriodId?: string | null): Promise<{
  periodId: string | null;
  schemaReady: boolean;
  period: OrganizationPeriod;
}> {
  await requireAuthUser();
  const { selectedPeriod, activePeriod, periods, schemaReady } =
    await getSelectedPeriodForDashboard();

  if (!schemaReady || activePeriod.id === VIRTUAL_ACTIVE_PERIOD_ID) {
    return {
      periodId: null,
      schemaReady: false,
      period: activePeriod,
    };
  }

  const targetPeriod = explicitPeriodId
    ? periods.find((p) => p.id === explicitPeriodId)
    : selectedPeriod;

  if (!targetPeriod) {
    throw new Error('Periode target tidak ditemukan di database.');
  }

  if (targetPeriod.status === 'locked') {
    throw new Error(
      `PERIOD_LOCKED: Periode ${targetPeriod.code} berstatus terkunci permanen. Pindah ke periode aktif (${activePeriod.code}) untuk menambah atau mengubah data.`
    );
  }

  return {
    periodId: targetPeriod.id,
    schemaReady: true,
    period: targetPeriod,
  };
}
