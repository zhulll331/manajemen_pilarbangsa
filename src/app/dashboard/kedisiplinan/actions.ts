'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/utils/supabase/server';
import { executeAiChatWithFailover } from '@/lib/ai/router';
import { invalidateKnowledgeCache } from '@/lib/ai/knowledge';
import {
  buildSp1AiPrompts,
  fallbackParseSp1List,
  getTodayWibDateString,
  isValidIsoDateString,
  normalizeAiSp1Response,
  normalizeBulkDisciplineItems,
  sanitizeDisciplineNote,
  validateSp1InputText,
  type AiMatchedSp1,
  type AiUnmatchedSp1,
  type DisciplineMemberInput,
  type DisciplineSource,
} from '@/lib/members/discipline';
import {
  getAuthenticatedDashboardContext,
  requireWritablePeriod,
} from '@/lib/periods/server';
import {
  canManagePeriodsRole,
  formatPeriodErrorMessage,
  isSchemaMissingError,
} from '@/lib/periods/utils';

const MIGRATION_HINT =
  'Skema SP & Kedisiplinan belum tersedia. Silakan jalankan file supabase_tahap21_sp_kedisiplinan.sql di Supabase SQL Editor terlebih dahulu.';

async function requireDisciplineManager() {
  const ctx = await getAuthenticatedDashboardContext();
  if (!canManagePeriodsRole(ctx.role)) {
    throw new Error(
      'Akses ditolak. Hanya Ketua atau Sekretaris yang berwenang mengelola Rekap Absensi & SP.'
    );
  }
  return ctx;
}

export async function parseDaftarSp1AI(rawText: string): Promise<{
  success: boolean;
  provider?: string;
  model?: string;
  matched?: AiMatchedSp1[];
  unmatched?: AiUnmatchedSp1[];
  error?: string;
}> {
  try {
    await requireDisciplineManager();
    const { periodId, schemaReady } = await requireWritablePeriod();

    const validationError = validateSp1InputText(rawText);
    if (validationError) {
      return { success: false, error: validationError };
    }

    const supabase = await createClient();
    let query = supabase
      .from('members')
      .select('*')
      .order('name', { ascending: true });

    if (schemaReady && periodId) {
      query = query.eq('period_id', periodId);
    }

    const { data, error } = await query;
    if (error) {
      return {
        success: false,
        error: formatPeriodErrorMessage(error, 'Gagal memuat daftar anggota.'),
      };
    }

    const candidates: DisciplineMemberInput[] = ((data || []) as Record<string, unknown>[]).map(
      (row) => ({
        id: String(row.id),
        name: String(row.name || ''),
        nim: typeof row.nim === 'string' ? row.nim : '',
        division: typeof row.division === 'string' ? row.division : '',
        status: String(row.status || 'Aktif'),
        warning_level:
          typeof row.warning_level === 'string' ? row.warning_level : 'none',
      })
    );

    const hasAiKey = Boolean(
      process.env.GEMINI_API_KEY ||
        process.env.GROQ_API_KEY ||
        process.env.OPENROUTER_API_KEY
    );

    if (hasAiKey) {
      try {
        const { systemPrompt, userMessage } = buildSp1AiPrompts(rawText, candidates);
        const aiResult = await executeAiChatWithFailover({
          systemPrompt,
          userMessage,
          history: [],
          jsonMode: true,
          maxTokens: 4096,
          validateResponse: (text) => {
            try {
              normalizeAiSp1Response(text, candidates);
              return true;
            } catch {
              return false;
            }
          },
        });

        const parsed = normalizeAiSp1Response(aiResult.text, candidates);
        return {
          success: true,
          provider: aiResult.provider,
          model: aiResult.model,
          matched: parsed.matched,
          unmatched: parsed.unmatched,
        };
      } catch (aiErr) {
        console.warn('[AI-Pilah-SP1] Semua provider AI gagal, beralih ke parser lokal:', aiErr);
      }
    }

    const fallback = fallbackParseSp1List(rawText, candidates);
    return {
      success: true,
      provider: 'Pencocokan Cerdas Lokal',
      model: 'auto-fallback',
      matched: fallback.matched,
      unmatched: fallback.unmatched,
    };
  } catch (err) {
    return {
      success: false,
      error: formatPeriodErrorMessage(
        err,
        'Gagal memilah daftar SP 1 dengan AI.'
      ),
    };
  }
}

export async function terbitkanSp1Massal(input: {
  items: { memberId: string; note?: string; alpaCount?: number }[];
  effectiveDate: string;
  quarterLabel?: string;
  source: DisciplineSource;
}): Promise<{ success: boolean; updatedCount: number }> {
  const actor = await requireDisciplineManager();
  const { periodId, schemaReady } = await requireWritablePeriod();

  const effectiveDate = isValidIsoDateString(input.effectiveDate)
    ? input.effectiveDate.trim()
    : getTodayWibDateString();

  const normalized = normalizeBulkDisciplineItems(input.items || []);
  if (normalized.length === 0) {
    throw new Error('Pilih minimal satu anggota atau pengurus untuk diberi SP 1.');
  }
  if (normalized.length > 200) {
    throw new Error('Maksimal 200 anggota dapat diproses dalam satu batch.');
  }

  const quarterLabel = sanitizeDisciplineNote(input.quarterLabel) || null;
  const supabase = await createClient();

  const CHUNK_SIZE = 10;
  for (let i = 0; i < normalized.length; i += CHUNK_SIZE) {
    const chunk = normalized.slice(i, i + CHUNK_SIZE);
    await Promise.all(
      chunk.map(async (item) => {
        const noteText =
          item.note ||
          (item.alpaCount > 0
            ? `SP 1 — Tercatat ${item.alpaCount} kali Alpa pada rekapan 3 bulanan`
            : 'SP 1 — Hasil rekapan absensi pengurus');

        let q = supabase
          .from('members')
          .update({
            warning_level: 'sp1',
            sp1_issued_at: effectiveDate,
            sp1_note: noteText,
          })
          .eq('id', item.memberId);

        if (schemaReady && periodId) {
          q = q.eq('period_id', periodId);
        }

        const { error } = await q;
        if (error) {
          if (isSchemaMissingError(error)) {
            throw new Error(MIGRATION_HINT);
          }
          throw new Error(formatPeriodErrorMessage(error, error.message));
        }
      })
    );
  }

  const logRows = normalized.map((item) => ({
    ...(schemaReady && periodId ? { period_id: periodId } : {}),
    member_id: item.memberId,
    action: 'sp1_issued',
    quarter_label: quarterLabel,
    alpa_count: item.alpaCount,
    effective_date: effectiveDate,
    source: input.source || 'manual',
    note:
      item.note ||
      (item.alpaCount > 0
        ? `SP 1 — Tercatat ${item.alpaCount} kali Alpa pada rekapan 3 bulanan`
        : 'SP 1 — Hasil rekapan absensi pengurus'),
    actor_id: actor.user.id,
    actor_name: actor.name,
    actor_role: actor.role,
  }));

  const { error: logError } = await supabase
    .from('member_disciplinary_logs')
    .insert(logRows);

  if (logError) {
    if (isSchemaMissingError(logError)) {
      throw new Error(MIGRATION_HINT);
    }
    throw new Error(formatPeriodErrorMessage(logError, logError.message));
  }

  invalidateKnowledgeCache();
  revalidatePath('/dashboard', 'layout');
  return { success: true, updatedCount: normalized.length };
}

export async function cabutSp1(input: {
  memberId: string;
  reason: string;
}): Promise<{ success: boolean }> {
  const actor = await requireDisciplineManager();
  const { periodId, schemaReady } = await requireWritablePeriod();

  const memberId = typeof input.memberId === 'string' ? input.memberId.trim() : '';
  const reason = sanitizeDisciplineNote(input.reason);

  if (!memberId) {
    throw new Error('Anggota tidak valid.');
  }
  if (reason.length < 3) {
    throw new Error('Masukkan alasan/dasar pencabutan SP 1 (minimal 3 karakter).');
  }

  const supabase = await createClient();
  let q = supabase
    .from('members')
    .update({
      warning_level: 'none',
      sp1_issued_at: null,
      sp1_note: null,
    })
    .eq('id', memberId)
    .eq('warning_level', 'sp1');

  if (schemaReady && periodId) {
    q = q.eq('period_id', periodId);
  }

  const { error } = await q;
  if (error) {
    if (isSchemaMissingError(error)) {
      throw new Error(MIGRATION_HINT);
    }
    throw new Error(formatPeriodErrorMessage(error, error.message));
  }

  const { error: logError } = await supabase
    .from('member_disciplinary_logs')
    .insert({
      ...(schemaReady && periodId ? { period_id: periodId } : {}),
      member_id: memberId,
      action: 'sp1_revoked',
      quarter_label: 'Pencabutan Status SP 1',
      alpa_count: 0,
      effective_date: getTodayWibDateString(),
      source: 'manual',
      note: reason,
      actor_id: actor.user.id,
      actor_name: actor.name,
      actor_role: actor.role,
    });

  if (logError) {
    if (isSchemaMissingError(logError)) {
      throw new Error(MIGRATION_HINT);
    }
    throw new Error(formatPeriodErrorMessage(logError, logError.message));
  }

  invalidateKnowledgeCache();
  revalidatePath('/dashboard', 'layout');
  return { success: true };
}

export async function eksekusiSp2Massal(input: {
  items: { memberId: string; note?: string; alpaCount?: number }[];
  effectiveDate: string;
  quarterLabel?: string;
  source?: DisciplineSource;
}): Promise<{ success: boolean; updatedCount: number }> {
  const actor = await requireDisciplineManager();
  const { periodId, schemaReady } = await requireWritablePeriod();

  const effectiveDate = isValidIsoDateString(input.effectiveDate)
    ? input.effectiveDate.trim()
    : getTodayWibDateString();

  const normalized = normalizeBulkDisciplineItems(input.items || []);
  if (normalized.length === 0) {
    throw new Error('Pilih minimal satu anggota berstatus SP 1 untuk eksekusi SP 2.');
  }
  if (normalized.length > 200) {
    throw new Error('Maksimal 200 anggota dapat diproses dalam satu batch.');
  }

  const quarterLabel = sanitizeDisciplineNote(input.quarterLabel) || null;
  const nowIso = new Date().toISOString();
  const supabase = await createClient();

  const CHUNK_SIZE = 10;
  for (let i = 0; i < normalized.length; i += CHUNK_SIZE) {
    const chunk = normalized.slice(i, i + CHUNK_SIZE);
    await Promise.all(
      chunk.map(async (item) => {
        const rawNote =
          item.note ||
          (item.alpaCount > 0
            ? `Alpa ${item.alpaCount}x setelah berstatus SP 1`
            : 'Alpa kembali setelah menerima SP 1');
        const sp2Note = /^sp\s*2/i.test(rawNote) ? rawNote : `SP 2 — ${rawNote}`;

        let q = supabase
          .from('members')
          .update({
            warning_level: 'sp2',
            sp2_issued_at: effectiveDate,
            sp2_note: sp2Note,
            status: 'Diberhentikan',
            status_note: sp2Note,
            status_updated_at: nowIso,
          })
          .eq('id', item.memberId);

        if (schemaReady && periodId) {
          q = q.eq('period_id', periodId);
        }

        const { error } = await q;
        if (error) {
          if (isSchemaMissingError(error)) {
            throw new Error(MIGRATION_HINT);
          }
          throw new Error(formatPeriodErrorMessage(error, error.message));
        }
      })
    );
  }

  const logRows = normalized.map((item) => {
    const rawNote =
      item.note ||
      (item.alpaCount > 0
        ? `Alpa ${item.alpaCount}x setelah berstatus SP 1`
        : 'Alpa kembali setelah menerima SP 1');
    const sp2Note = /^sp\s*2/i.test(rawNote) ? rawNote : `SP 2 — ${rawNote}`;
    return {
      ...(schemaReady && periodId ? { period_id: periodId } : {}),
      member_id: item.memberId,
      action: 'sp2_dismissed',
      quarter_label: quarterLabel,
      alpa_count: item.alpaCount,
      effective_date: effectiveDate,
      source: input.source || 'auto_recap',
      note: sp2Note,
      actor_id: actor.user.id,
      actor_name: actor.name,
      actor_role: actor.role,
    };
  });

  const { error: logError } = await supabase
    .from('member_disciplinary_logs')
    .insert(logRows);

  if (logError) {
    if (isSchemaMissingError(logError)) {
      throw new Error(MIGRATION_HINT);
    }
    throw new Error(formatPeriodErrorMessage(logError, logError.message));
  }

  invalidateKnowledgeCache();
  revalidatePath('/dashboard', 'layout');
  return { success: true, updatedCount: normalized.length };
}
