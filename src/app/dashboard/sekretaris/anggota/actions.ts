'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/utils/supabase/server';
import { executeAiChatWithFailover } from '@/lib/ai/router';
import { invalidateKnowledgeCache } from '@/lib/ai/knowledge';
import {
  buildDismissalAiPrompts,
  fallbackParseMemberStatusList,
  normalizeAiDismissalResponse,
  normalizeBulkDismissItems,
  sanitizeDismissalReason,
  validateDismissalInputText,
  type AiMatchedDismissal,
  type AiUnmatchedDismissal,
  type BulkDismissItem,
  type DismissibleMemberCandidate,
  type MemberTargetStatus,
} from '@/lib/members/dismissal';
import { requireWritablePeriod } from '@/lib/periods/server';
import { formatPeriodErrorMessage, isSchemaMissingError } from '@/lib/periods/utils';

function optionalText(value: FormDataEntryValue | null): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed || null;
}

export async function tambahAnggota(formData: FormData) {
  const { periodId, schemaReady } = await requireWritablePeriod();
  const supabase = await createClient();

  const name = String(formData.get('name') || '').trim();
  if (!name || name.length > 255) throw new Error('Nama tidak valid');

  const status = String(formData.get('status') || 'Aktif').trim() || 'Aktif';
  const statusNote =
    status === 'Diberhentikan' ? sanitizeDismissalReason(formData.get('status_note')) : '';

  const basePayload: Record<string, unknown> = {
    name,
    nim: optionalText(formData.get('nim')),
    faculty: optionalText(formData.get('faculty')),
    study_program: optionalText(formData.get('study_program')),
    generation: optionalText(formData.get('generation')),
    phone: String(formData.get('phone') || '').trim().substring(0, 50) || null,
    division: optionalText(formData.get('division')),
    status,
  };

  if (schemaReady && periodId) {
    basePayload.period_id = periodId;
    if (status === 'Diberhentikan') {
      basePayload.status_note = statusNote || null;
      basePayload.status_updated_at = new Date().toISOString();
    }
  }

  const { error } = await supabase.from('members').insert(basePayload);
  if (error) {
    throw new Error(formatPeriodErrorMessage(error, error.message));
  }

  invalidateKnowledgeCache();
  revalidatePath('/dashboard', 'layout');
}

export async function editAnggota(id: string, formData: FormData) {
  const { periodId, schemaReady } = await requireWritablePeriod();
  const supabase = await createClient();

  const name = String(formData.get('name') || '').trim();
  if (!name || name.length > 255) throw new Error('Nama tidak valid');

  const status = String(formData.get('status') || 'Aktif').trim() || 'Aktif';
  const statusNote = sanitizeDismissalReason(formData.get('status_note'));

  const updatePayload: Record<string, unknown> = {
    name,
    nim: optionalText(formData.get('nim')),
    faculty: optionalText(formData.get('faculty')),
    study_program: optionalText(formData.get('study_program')),
    generation: optionalText(formData.get('generation')),
    phone: String(formData.get('phone') || '').trim().substring(0, 50) || null,
    division: optionalText(formData.get('division')),
    status,
  };

  if (schemaReady) {
    updatePayload.status_note = status === 'Diberhentikan' ? statusNote || null : null;
    updatePayload.status_updated_at =
      status === 'Diberhentikan' ? new Date().toISOString() : null;
  }

  let query = supabase.from('members').update(updatePayload).eq('id', id);
  if (schemaReady && periodId) {
    query = query.eq('period_id', periodId);
  }

  const { error } = await query;
  if (error) {
    throw new Error(formatPeriodErrorMessage(error, error.message));
  }

  invalidateKnowledgeCache();
  revalidatePath('/dashboard', 'layout');
}

export async function hapusAnggota(id: string) {
  const { periodId, schemaReady } = await requireWritablePeriod();
  const supabase = await createClient();

  let query = supabase.from('members').delete().eq('id', id);
  if (schemaReady && periodId) {
    query = query.eq('period_id', periodId);
  }

  const { error } = await query;
  if (error) {
    throw new Error(formatPeriodErrorMessage(error, error.message));
  }

  invalidateKnowledgeCache();
  revalidatePath('/dashboard', 'layout');
}

function readImportCell(item: Record<string, unknown>, ...keys: string[]): string {
  for (const key of keys) {
    const val = item[key];
    if (val !== undefined && val !== null && String(val).trim() !== '') {
      return String(val).trim();
    }
  }
  return '';
}

export async function importAnggotaBatch(data: Record<string, unknown>[]) {
  const { periodId, schemaReady } = await requireWritablePeriod();
  const supabase = await createClient();

  const rawData = data
    .map((item) => ({
      name: readImportCell(item, 'Nama', 'name'),
      nim: readImportCell(item, 'NIM', 'nim') || null,
      faculty: readImportCell(item, 'Fakultas', 'faculty') || null,
      study_program: readImportCell(item, 'Prodi', 'study_program') || null,
      generation: readImportCell(item, 'Angkatan', 'generation') || null,
      phone: readImportCell(item, 'Telepon', 'phone') || null,
      division: readImportCell(item, 'Divisi', 'division') || null,
      status: readImportCell(item, 'Status', 'status') || 'Aktif',
      ...(schemaReady && periodId ? { period_id: periodId } : {}),
    }))
    .filter((item) => item.name);

  const uniqueMap = new Map<string, (typeof rawData)[number]>();
  for (const item of rawData) {
    const key = item.nim ? item.nim.trim() : item.name.toLowerCase().trim();
    if (!uniqueMap.has(key)) {
      uniqueMap.set(key, item);
    }
  }
  const formattedData = Array.from(uniqueMap.values());

  if (formattedData.length === 0) {
    throw new Error('Tidak ada data yang valid untuk diimpor.');
  }

  let existingQuery = supabase.from('members').select('nim, name');
  if (schemaReady && periodId) {
    existingQuery = existingQuery.eq('period_id', periodId);
  }
  const { data: existingMembers, error: fetchError } = await existingQuery;
  if (fetchError) {
    throw new Error(formatPeriodErrorMessage(fetchError, fetchError.message));
  }

  const existingKeys = new Set<string>();
  for (const member of existingMembers || []) {
    if (member.nim) existingKeys.add(String(member.nim).trim());
    if (member.name) existingKeys.add(String(member.name).toLowerCase().trim());
  }

  const newDataToInsert = formattedData.filter((item) => {
    const nimKey = item.nim ? item.nim.trim() : null;
    const nameKey = item.name.toLowerCase().trim();
    if (nimKey && existingKeys.has(nimKey)) return false;
    if (existingKeys.has(nameKey)) return false;
    return true;
  });

  if (newDataToInsert.length === 0) {
    revalidatePath('/dashboard', 'layout');
    return;
  }

  const { error } = await supabase.from('members').insert(newDataToInsert);
  if (error) {
    throw new Error(formatPeriodErrorMessage(error, error.message));
  }

  invalidateKnowledgeCache();
  revalidatePath('/dashboard', 'layout');
}

export async function parsePemberhentianAnggotaAI(rawText: string): Promise<{
  success: boolean;
  provider?: string;
  model?: string;
  matched?: AiMatchedDismissal[];
  unmatched?: AiUnmatchedDismissal[];
  error?: string;
}> {
  try {
    const { periodId, schemaReady } = await requireWritablePeriod();

    const validationError = validateDismissalInputText(rawText);
    if (validationError) {
      return { success: false, error: validationError };
    }

    const supabase = await createClient();
    let query = supabase
      .from('members')
      .select('id, name, nim, faculty, study_program, division, status')
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

    const candidates: DismissibleMemberCandidate[] = (data || []).map((row) => ({
      id: String(row.id),
      name: String(row.name || ''),
      nim: String(row.nim || ''),
      faculty: row.faculty ? String(row.faculty) : '',
      study_program: row.study_program ? String(row.study_program) : '',
      division: String(row.division || ''),
      status: String(row.status || 'Aktif'),
    }));

    const hasAiKey = Boolean(
      process.env.GEMINI_API_KEY ||
        process.env.GROQ_API_KEY ||
        process.env.OPENROUTER_API_KEY
    );

    if (hasAiKey) {
      try {
        const { systemPrompt, userMessage } = buildDismissalAiPrompts(rawText, candidates);
        const aiResult = await executeAiChatWithFailover({
          systemPrompt,
          userMessage,
          history: [],
          jsonMode: true,
          maxTokens: 4096,
          validateResponse: (text) => {
            try {
              normalizeAiDismissalResponse(text, candidates);
              return true;
            } catch {
              return false;
            }
          },
        });

        const parsed = normalizeAiDismissalResponse(aiResult.text, candidates);
        return {
          success: true,
          provider: aiResult.provider,
          model: aiResult.model,
          matched: parsed.matched,
          unmatched: parsed.unmatched,
        };
      } catch (aiErr) {
        console.warn('[AI-Pilah-Status] Semua provider AI gagal, beralih ke parser lokal:', aiErr);
      }
    }

    const fallback = fallbackParseMemberStatusList(rawText, candidates);
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
        'Gagal memilah daftar perubahan status anggota.'
      ),
    };
  }
}

export async function berhentikanAnggotaMassal(items: BulkDismissItem[]): Promise<{
  success: boolean;
  updatedCount: number;
  statusCounts: Record<MemberTargetStatus, number>;
}> {
  const { periodId, schemaReady } = await requireWritablePeriod();
  const normalized = normalizeBulkDismissItems(items);

  if (normalized.length === 0) {
    throw new Error('Pilih minimal satu anggota untuk diproses.');
  }
  if (normalized.length > 200) {
    throw new Error('Maksimal 200 anggota dapat diproses sekaligus dalam satu batch.');
  }

  const supabase = await createClient();
  const nowIso = new Date().toISOString();

  const statusCounts: Record<MemberTargetStatus, number> = {
    Diberhentikan: 0,
    Alumni: 0,
    Cuti: 0,
  };
  for (const item of normalized) {
    statusCounts[item.targetStatus] += 1;
  }

  const allSameTargetAndReason = normalized.every(
    (i) =>
      i.targetStatus === normalized[0].targetStatus &&
      i.reason === normalized[0].reason
  );

  if (allSameTargetAndReason) {
    const ids = normalized.map((i) => i.memberId);
    const targetStatus = normalized[0].targetStatus;
    const targetNote =
      targetStatus === 'Diberhentikan' ? normalized[0].reason || null : null;
    const payload: Record<string, unknown> = schemaReady
      ? {
          status: targetStatus,
          status_note: targetNote,
          status_updated_at: targetStatus === 'Diberhentikan' ? nowIso : null,
        }
      : { status: targetStatus };

    let query = supabase.from('members').update(payload).in('id', ids);
    if (schemaReady && periodId) {
      query = query.eq('period_id', periodId);
    }

    let { error } = await query;
    if (error && isSchemaMissingError(error)) {
      const retry = await supabase
        .from('members')
        .update({ status: targetStatus })
        .in('id', ids);
      error = retry.error;
    }

    if (error) {
      throw new Error(formatPeriodErrorMessage(error, error.message));
    }
  } else {
    const CHUNK_SIZE = 10;
    for (let i = 0; i < normalized.length; i += CHUNK_SIZE) {
      const chunk = normalized.slice(i, i + CHUNK_SIZE);
      await Promise.all(
        chunk.map(async (item) => {
          const targetStatus = item.targetStatus;
          const targetNote =
            targetStatus === 'Diberhentikan' ? item.reason || null : null;
          const payload: Record<string, unknown> = schemaReady
            ? {
                status: targetStatus,
                status_note: targetNote,
                status_updated_at:
                  targetStatus === 'Diberhentikan' ? nowIso : null,
              }
            : { status: targetStatus };

          let q = supabase.from('members').update(payload).eq('id', item.memberId);
          if (schemaReady && periodId) {
            q = q.eq('period_id', periodId);
          }

          let { error } = await q;
          if (error && isSchemaMissingError(error)) {
            const retry = await supabase
              .from('members')
              .update({ status: targetStatus })
              .eq('id', item.memberId);
            error = retry.error;
          }

          if (error) {
            throw new Error(formatPeriodErrorMessage(error, error.message));
          }
        })
      );
    }
  }

  invalidateKnowledgeCache();
  revalidatePath('/dashboard', 'layout');
  return { success: true, updatedCount: normalized.length, statusCounts };
}
