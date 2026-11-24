export interface DismissibleMemberCandidate {
  id: string;
  name: string;
  nim: string;
  division: string;
  status: string;
}

export interface AiMatchedDismissal {
  member_id: string;
  reason: string;
  matched_from: string;
}

export interface AiUnmatchedDismissal {
  raw_name: string;
  reason: string;
  note: string;
}

export interface AiDismissalParseResult {
  matched: AiMatchedDismissal[];
  unmatched: AiUnmatchedDismissal[];
}

export interface BulkDismissItem {
  memberId: string;
  reason: string;
}

const MAX_REASON_LENGTH = 300;
const MAX_INPUT_TEXT_LENGTH = 8000;

export function sanitizeDismissalReason(reason: unknown): string {
  if (typeof reason !== 'string') return '';
  return reason.replace(/\s+/g, ' ').trim().slice(0, MAX_REASON_LENGTH);
}

export function validateDismissalInputText(rawText: string): string | null {
  const trimmed = rawText.trim();
  if (trimmed.length < 3) {
    return 'Tempel minimal satu nama anggota beserta keterangan pemberhentian.';
  }
  if (trimmed.length > MAX_INPUT_TEXT_LENGTH) {
    return `Teks terlalu panjang (maksimal ${MAX_INPUT_TEXT_LENGTH} karakter per proses).`;
  }
  return null;
}

export function buildDismissalAiPrompts(
  rawText: string,
  candidates: DismissibleMemberCandidate[]
): { systemPrompt: string; userMessage: string } {
  const activeCatalog = candidates
    .filter((m) => m.status !== 'Diberhentikan')
    .map((m) => ({
      id: m.id,
      name: m.name,
      nim: m.nim,
      division: m.division,
      status: m.status,
    }));

  const systemPrompt = [
    'Anda adalah asisten administrasi Sekretaris UKM Pilar Bangsa.',
    'Tugas Anda: memetakan teks daftar pemberhentian anggota ke daftar anggota resmi organisasi dan mengekstrak keterangan pemberhentian spesifik untuk masing-masing anggota.',
    '',
    'ATURAN KETAT:',
    '1. Jawab HANYA dengan objek JSON mentah yang valid tanpa teks pembuka/penutup.',
    '2. Skema JSON wajib:',
    '{"matched":[{"member_id":"<uuid exact>","reason":"<alasan spesifik anggota ini>","matched_from":"<teks asli>"}],"unmatched":[{"raw_name":"<nama/baris input>","reason":"<alasan jika ada>","note":"<alasan gagal cocok>"}]}',
    '3. member_id HARUS menyalin persis field "id" dari daftar anggota yang diberikan. Dilarang mengarang ID.',
    '4. Setiap anggota bisa memiliki alasan yang BERBEDA; ekstrak alasan khusus masing-masing. Jika satu baris tidak menulis alasan khusus, tulis string kosong "".',
    '5. Jika nama ambigu (>1 kandidat mirip) atau tidak ditemukan di daftar, masukkan ke "unmatched" dan jelaskan di "note".',
    '6. Satu member_id hanya boleh muncul maksimal 1 kali di "matched".',
  ].join('\n');

  const userMessage = [
    'DAFTAR ANGGOTA PERIODE SAAT INI (JSON):',
    JSON.stringify(activeCatalog),
    '',
    'TEKS PEMBERHENTIAN DARI SEKRETARIS:',
    rawText.trim(),
  ].join('\n');

  return { systemPrompt, userMessage };
}

export function extractJsonObjectFromAiText(rawAiText: string): string {
  const stripped = rawAiText
    .replace(/```json\s*/gi, '')
    .replace(/```\s*/g, '')
    .trim();

  const firstBrace = stripped.indexOf('{');
  const lastBrace = stripped.lastIndexOf('}');
  if (firstBrace === -1 || lastBrace === -1 || lastBrace <= firstBrace) {
    throw new Error('AI tidak mengembalikan objek JSON yang valid.');
  }

  return stripped.slice(firstBrace, lastBrace + 1);
}

export function normalizeAiDismissalResponse(
  rawAiText: string,
  candidates: DismissibleMemberCandidate[]
): AiDismissalParseResult {
  const jsonText = extractJsonObjectFromAiText(rawAiText);
  let parsed: unknown;
  try {
    parsed = JSON.parse(jsonText);
  } catch {
    throw new Error('Format JSON dari AI tidak dapat diurai. Silakan coba lagi.');
  }

  if (!parsed || typeof parsed !== 'object') {
    throw new Error('Respons AI tidak berbentuk objek JSON.');
  }

  const record = parsed as Record<string, unknown>;
  const rawMatched = Array.isArray(record.matched) ? record.matched : [];
  const rawUnmatched = Array.isArray(record.unmatched) ? record.unmatched : [];

  const candidateMap = new Map(candidates.map((c) => [c.id, c]));
  const seenIds = new Set<string>();
  const matched: AiMatchedDismissal[] = [];
  const unmatched: AiUnmatchedDismissal[] = [];

  for (const item of rawMatched) {
    if (!item || typeof item !== 'object') continue;
    const entry = item as Record<string, unknown>;
    const memberId = typeof entry.member_id === 'string' ? entry.member_id.trim() : '';
    const reason = sanitizeDismissalReason(entry.reason);
    const matchedFrom =
      typeof entry.matched_from === 'string' ? entry.matched_from.trim().slice(0, 120) : '';

    if (!memberId) continue;
    const candidate = candidateMap.get(memberId);
    if (!candidate) {
      unmatched.push({
        raw_name: matchedFrom || memberId,
        reason,
        note: 'ID kandidat dari AI tidak cocok dengan anggota periode saat ini.',
      });
      continue;
    }

    if (candidate.status === 'Diberhentikan') {
      unmatched.push({
        raw_name: candidate.name,
        reason,
        note: 'Anggota sudah berstatus Diberhentikan.',
      });
      continue;
    }

    if (seenIds.has(memberId)) {
      const existing = matched.find((m) => m.member_id === memberId);
      if (existing && !existing.reason && reason) {
        existing.reason = reason;
      }
      continue;
    }

    seenIds.add(memberId);
    matched.push({
      member_id: memberId,
      reason,
      matched_from: matchedFrom || candidate.name,
    });
  }

  for (const item of rawUnmatched) {
    if (!item || typeof item !== 'object') continue;
    const entry = item as Record<string, unknown>;
    const rawName =
      typeof entry.raw_name === 'string' ? entry.raw_name.trim().slice(0, 140) : '';
    if (!rawName) continue;
    unmatched.push({
      raw_name: rawName,
      reason: sanitizeDismissalReason(entry.reason),
      note:
        typeof entry.note === 'string' && entry.note.trim()
          ? entry.note.trim().slice(0, 180)
          : 'Tidak ditemukan pada daftar anggota aktif periode ini.',
    });
  }

  return { matched, unmatched };
}

export function normalizeBulkDismissItems(items: BulkDismissItem[]): BulkDismissItem[] {
  const byId = new Map<string, string>();
  for (const item of items) {
    if (!item || typeof item.memberId !== 'string') continue;
    const id = item.memberId.trim();
    if (!id) continue;
    const cleanReason = sanitizeDismissalReason(item.reason);
    if (!byId.has(id) || (!byId.get(id) && cleanReason)) {
      byId.set(id, cleanReason);
    }
  }
  return Array.from(byId.entries()).map(([memberId, reason]) => ({
    memberId,
    reason,
  }));
}
