'use server';

import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { invalidateKnowledgeCache } from '@/lib/ai/knowledge';
import {
  PERIOD_COOKIE_NAME,
  type PeriodAuditLog,
  type PeriodClosingSummary,
  type TransitionPeriodPayload,
} from '@/lib/periods/types';
import {
  assertPeriodManager,
  getActivePeriod,
  getAllPeriods,
  getAuthenticatedDashboardContext,
} from '@/lib/periods/server';
import { isSchemaMissingError, validateNewPeriodInput } from '@/lib/periods/utils';
import { createClient } from '@/utils/supabase/server';

export async function selectDashboardPeriodAction(periodId: string): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    await getAuthenticatedDashboardContext();
    const { periods, schemaReady } = await getAllPeriods();

    if (!schemaReady) {
      return { success: true };
    }

    const found = periods.find((p) => p.id === periodId);
    if (!found) {
      return { success: false, error: 'Periode yang dipilih tidak ditemukan.' };
    }

    const cookieStore = await cookies();
    cookieStore.set(PERIOD_COOKIE_NAME, found.id, {
      httpOnly: true,
      sameSite: 'lax',
      path: '/',
    });

    revalidatePath('/dashboard', 'layout');
    return { success: true };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Gagal memilih periode.',
    };
  }
}

export async function getClosingSummaryAction(periodId?: string): Promise<{
  data?: PeriodClosingSummary;
  schemaReady: boolean;
  error?: string;
}> {
  try {
    await assertPeriodManager();
    const { period: activePeriod, periods, schemaReady } = await getActivePeriod();
    const targetPeriod = periodId
      ? periods.find((p) => p.id === periodId) || activePeriod
      : activePeriod;

    if (!schemaReady) {
      return {
        schemaReady: false,
        data: {
          period: targetPeriod,
          counts: {
            membersActive: 0,
            membersDismissed: 0,
            membersTotal: 0,
            programsTotal: 0,
            agendasTotal: 0,
            lettersTotal: 0,
            minutesTotal: 0,
            transactionsTotal: 0,
            momentPhotosTotal: 0,
            publicEventsTotal: 0,
          },
          financialIncome: 0,
          financialExpense: 0,
          financialBalance: 0,
        },
      };
    }

    const supabase = await createClient();
    const pid = targetPeriod.id;

    const [
      membersRes,
      programsRes,
      agendasRes,
      lettersRes,
      minutesRes,
      financeRes,
      momentsRes,
      eventsRes,
    ] = await Promise.all([
      supabase.from('members').select('status').eq('period_id', pid),
      supabase.from('programs').select('id', { count: 'exact', head: true }).eq('period_id', pid),
      supabase.from('agendas').select('id', { count: 'exact', head: true }).eq('period_id', pid),
      supabase.from('letters').select('id', { count: 'exact', head: true }).eq('period_id', pid),
      supabase.from('minutes').select('id', { count: 'exact', head: true }).eq('period_id', pid),
      supabase.from('finance_transactions').select('type, amount').eq('period_id', pid),
      supabase.from('moment_photos').select('id', { count: 'exact', head: true }).eq('period_id', pid),
      supabase.from('public_events').select('id', { count: 'exact', head: true }).eq('period_id', pid),
    ]);

    const memberRows = membersRes.data || [];
    const membersDismissed = memberRows.filter((m) => m.status === 'Diberhentikan').length;
    const membersActive = memberRows.filter(
      (m) => !m.status || m.status === 'Aktif' || m.status === 'Pengurus Aktif' || m.status === 'Cuti'
    ).length;

    const financeRows = financeRes.data || [];
    let financialIncome = 0;
    let financialExpense = 0;
    for (const tx of financeRows) {
      const amount = Number(tx.amount) || 0;
      if (tx.type === 'Pemasukan') {
        financialIncome += amount;
      } else {
        financialExpense += amount;
      }
    }

    return {
      schemaReady: true,
      data: {
        period: targetPeriod,
        counts: {
          membersActive,
          membersDismissed,
          membersTotal: memberRows.length,
          programsTotal: programsRes.count || 0,
          agendasTotal: agendasRes.count || 0,
          lettersTotal: lettersRes.count || 0,
          minutesTotal: minutesRes.count || 0,
          transactionsTotal: financeRows.length,
          momentPhotosTotal: momentsRes.count || 0,
          publicEventsTotal: eventsRes.count || 0,
        },
        financialIncome,
        financialExpense,
        financialBalance: financialIncome - financialExpense,
      },
    };
  } catch (err) {
    return {
      schemaReady: false,
      error: err instanceof Error ? err.message : 'Gagal memuat ringkasan periode.',
    };
  }
}

export async function transitionActivePeriodAction(
  payload: TransitionPeriodPayload
): Promise<{
  success: boolean;
  newPeriodId?: string;
  newPeriodCode?: string;
  summary?: Record<string, unknown>;
  error?: string;
}> {
  try {
    const { supabase } = await assertPeriodManager();
    const { period: activePeriod, periods, schemaReady } = await getActivePeriod();

    if (!schemaReady) {
      return {
        success: false,
        error:
          'Tabel multi-periode belum diinisialisasi di Supabase. Jalankan file SQL tahap 20 terlebih dahulu.',
      };
    }

    const expectedConfirm = `KUNCI ${activePeriod.code}`.toUpperCase();
    if (payload.confirmCode.trim().toUpperCase() !== expectedConfirm) {
      return {
        success: false,
        error: `Konfirmasi tidak sesuai. Ketik tepat: ${expectedConfirm}`,
      };
    }

    const validationError = validateNewPeriodInput(
      {
        newCode: payload.newCode,
        newName: payload.newName,
        startYear: payload.startYear,
        endYear: payload.endYear,
        startDate: payload.startDate,
        endDate: payload.endDate,
      },
      periods
    );
    if (validationError) {
      return { success: false, error: validationError };
    }

    const { data, error } = await supabase.rpc('fn_transition_active_period', {
      p_new_code: payload.newCode.trim(),
      p_new_name: payload.newName.trim(),
      p_start_year: payload.startYear,
      p_end_year: payload.endYear,
      p_start_date: payload.startDate,
      p_end_date: payload.endDate,
      p_cabinet_name: payload.cabinetName?.trim() || null,
      p_theme: payload.theme?.trim() || null,
      p_lock_notes: payload.lockNotes?.trim() || null,
      p_carry_over_members: payload.carryOver.members,
      p_carry_over_hero: payload.carryOver.heroSlides,
      p_carry_over_moments: payload.carryOver.momentPhotos,
      p_carry_over_visi_misi: payload.carryOver.visiMisi,
      p_carry_over_struktur: payload.carryOver.strukturPimpinan,
    });

    if (error) {
      return { success: false, error: error.message };
    }

    const rpcResult = (data || {}) as {
      new_period_id?: string;
      new_period_code?: string;
      summary?: Record<string, unknown>;
    };

    if (rpcResult.new_period_id) {
      const cookieStore = await cookies();
      cookieStore.set(PERIOD_COOKIE_NAME, rpcResult.new_period_id, {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
      });
    }

    invalidateKnowledgeCache();
    revalidatePath('/', 'layout');
    revalidatePath('/dashboard', 'layout');

    return {
      success: true,
      newPeriodId: rpcResult.new_period_id,
      newPeriodCode: rpcResult.new_period_code,
      summary: rpcResult.summary || {},
    };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Gagal menjalankan pergantian periode.',
    };
  }
}

export async function getPeriodAuditLogsAction(): Promise<{
  logs: PeriodAuditLog[];
  error?: string;
}> {
  try {
    const { supabase } = await getAuthenticatedDashboardContext();
    const { data, error } = await supabase
      .from('period_audit_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(20);

    if (error) {
      if (isSchemaMissingError(error)) {
        return { logs: [] };
      }
      return { logs: [], error: error.message };
    }

    return { logs: (data || []) as PeriodAuditLog[] };
  } catch (err) {
    return {
      logs: [],
      error: err instanceof Error ? err.message : 'Gagal memuat riwayat audit periode.',
    };
  }
}
