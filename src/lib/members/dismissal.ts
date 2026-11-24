export type MemberTargetStatus = 'Diberhentikan' | 'Alumni' | 'Cuti';

export interface DismissibleMemberCandidate {
  id: string;
  name: string;
  nim: string;
  division: string;
  faculty?: string | null;
  study_program?: string | null;
  status: string;
}

export interface AiMatchedDismissal {
  member_id: string;
  target_status: MemberTargetStatus;
  reason: string;
  matched_from: string;
}

export interface AiUnmatchedDismissal {
  raw_name: string;
  target_status?: MemberTargetStatus;
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
  targetStatus?: MemberTargetStatus;
}

const MAX_REASON_LENGTH = 300;
const MAX_INPUT_TEXT_LENGTH = 8000;

export function normalizeTargetStatus(raw: unknown): MemberTargetStatus {
  if (typeof raw !== 'string') return 'Diberhentikan';
  const lower = raw.toLowerCase().trim();
  if (lower.includes('alumni') || lower.includes('lulus') || lower.includes('demisioner')) {
    return 'Alumni';
  }
  if (lower.includes('cuti')) {
    return 'Cuti';
  }
  return 'Diberhentikan';
}

export function sanitizeDismissalReason(reason: unknown): string {
  if (typeof reason !== 'string') return '';
  return reason.replace(/\s+/g, ' ').trim().slice(0, MAX_REASON_LENGTH);
}

export function validateDismissalInputText(rawText: string): string | null {
  const trimmed = rawText.trim();
  if (trimmed.length < 3) {
    return 'Tempel minimal satu nama anggota beserta keterangan atau status tujuannya.';
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
  const catalog = candidates.map((m) => ({
    id: m.id,
    name: m.name,
    nim: m.nim || '',
    division: m.division || '',
    prodi: m.study_program || '',
    status: m.status,
  }));

  const systemPrompt = [
    'Anda adalah asisten administrasi Sekretaris UKM Pilar Bangsa.',
    'Tugas Anda: memetakan teks daftar perubahan status anggota (Diberhentikan, Alumni, atau Cuti) ke daftar anggota resmi organisasi dan mengekstrak status tujuan + keterangan masing-masing anggota.',
    '',
    'ATURAN KETAT:',
    '1. Jawab HANYA dengan objek JSON mentah yang valid tanpa markdown/reasoning/teks pembuka/penutup.',
    '2. Skema JSON wajib:',
    '{"matched":[{"member_id":"<uuid exact>","target_status":"Diberhentikan|Alumni|Cuti","reason":"<alasan khusus anggota ini atau kosong>","matched_from":"<teks asli>"}],"unmatched":[{"raw_name":"<nama/baris input>","target_status":"Diberhentikan|Alumni|Cuti","reason":"<alasan jika ada>","note":"<alasan gagal cocok>"}]}',
    '3. member_id HARUS menyalin persis field "id" dari daftar anggota yang diberikan. Dilarang mengarang ID.',
    '4. Mendukung format sebaris (mis. "1. Intan Nur Aini (Sejarah) - diberhentikan" atau "13. Ahmad Ali - alumni") MAUPUN format berkelompok dengan judul bagian (mis. "Diberhentikan:\\n1. ..." dan "Alumni:\\n1. ...").',
    '5. Teks di dalam kurung seperti "(Sejarah)" adalah petunjuk prodi/jurusan/fakultas bila ada nama mirip; jangan dianggap gagal cocok jika nama intinya sama.',
    '6. Jika keterangan hanya menulis status ("diberhentikan", "alumni", "cuti"), isi "target_status" sesuai status tsb dan biarkan "reason" kosong "". Jika ada alasan tambahan (mis. "mengundurkan diri"), tulis di "reason".',
    '7. Jika nama tidak ditemukan di daftar anggota atau ambigu (>1 kandidat tanpa petunjuk pembeda), masukkan ke "unmatched" dengan note "Data tidak ditemukan pada daftar anggota periode ini."',
    '8. Satu member_id hanya boleh muncul maksimal 1 kali di "matched".',
  ].join('\n');

  const userMessage = [
    'DAFTAR ANGGOTA PERIODE SAAT INI (JSON):',
    JSON.stringify(catalog),
    '',
    'TEKS DAFTAR PERUBAHAN STATUS DARI SEKRETARIS:',
    rawText.trim(),
  ].join('\n');

  return { systemPrompt, userMessage };
}

export function extractJsonObjectFromAiText(rawAiText: string): string {
  const withoutThink = rawAiText.replace(/<think>[\s\S]*?<\/think>/gi, '');
  const stripped = withoutThink
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
    const targetStatus = normalizeTargetStatus(entry.target_status ?? entry.status);
    const reason = sanitizeDismissalReason(entry.reason);
    const matchedFrom =
      typeof entry.matched_from === 'string' ? entry.matched_from.trim().slice(0, 120) : '';

    if (!memberId) continue;
    const candidate = candidateMap.get(memberId);
    if (!candidate) {
      unmatched.push({
        raw_name: matchedFrom || memberId,
        target_status: targetStatus,
        reason,
        note: 'Data tidak ditemukan pada daftar anggota periode ini.',
      });
      continue;
    }

    if (candidate.status === targetStatus) {
      unmatched.push({
        raw_name: candidate.name,
        target_status: targetStatus,
        reason,
        note: `Anggota sudah berstatus ${targetStatus}.`,
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
      target_status: targetStatus,
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
      target_status:
        entry.target_status !== undefined || entry.status !== undefined
          ? normalizeTargetStatus(entry.target_status ?? entry.status)
          : undefined,
      reason: sanitizeDismissalReason(entry.reason),
      note:
        typeof entry.note === 'string' && entry.note.trim()
          ? entry.note.trim().slice(0, 180)
          : 'Data tidak ditemukan pada daftar anggota periode ini.',
    });
  }

  return { matched, unmatched };
}

function normalizeMatchText(value: string): string {
  return value
    .toLowerCase()
    .replace(/['’`]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function stripParentheses(value: string): string {
  return value.replace(/\([^)]*\)/g, ' ').replace(/\s+/g, ' ').trim();
}

function levenshtein(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  if (m === 0) return n;
  if (n === 0) return m;
  const dp: number[] = Array.from({ length: n + 1 }, (_, j) => j);
  for (let i = 1; i <= m; i++) {
    let prev = i - 1;
    dp[0] = i;
    for (let j = 1; j <= n; j++) {
      const temp = dp[j];
      if (a[i - 1] === b[j - 1]) {
        dp[j] = prev;
      } else {
        dp[j] = Math.min(prev, dp[j - 1], dp[j]) + 1;
      }
      prev = temp;
    }
  }
  return dp[n];
}

function extractHints(leftPart: string): { cleanName: string; hints: string[] } {
  const hints: string[] = [];
  const cleanName = leftPart
    .replace(/\(([^)]+)\)/g, (_, inner: string) => {
      const h = normalizeMatchText(inner);
      if (h) hints.push(h);
      return ' ';
    })
    .replace(/\s+/g, ' ')
    .trim();
  return { cleanName, hints };
}

function findBestCandidate(
  cleanName: string,
  hints: string[],
  candidates: DismissibleMemberCandidate[]
): { candidate: DismissibleMemberCandidate | null; ambiguous: boolean } {
  const queryNorm = normalizeMatchText(cleanName);
  if (!queryNorm) return { candidate: null, ambiguous: false };

  const narrowByHints = (
    pool: DismissibleMemberCandidate[]
  ): DismissibleMemberCandidate[] => {
    if (pool.length <= 1 || hints.length === 0) return pool;
    const filtered = pool.filter((c) => {
      const haystack = normalizeMatchText(
        `${c.name} ${c.study_program || ''} ${c.faculty || ''} ${c.division || ''} ${c.nim || ''}`
      );
      return hints.some((h) => haystack.includes(h));
    });
    return filtered.length > 0 ? filtered : pool;
  };

  // 1. Exact NIM atau exact nama lengkap (termasuk jika nama DB mengandung tanda kurung)
  const exactMatches = narrowByHints(
    candidates.filter((c) => {
      const cNim = normalizeMatchText(c.nim || '');
      const cName = normalizeMatchText(c.name);
      const cNameNoParen = normalizeMatchText(stripParentheses(c.name));
      return (
        (cNim && cNim === queryNorm) ||
        cName === queryNorm ||
        cNameNoParen === queryNorm
      );
    })
  );
  if (exactMatches.length === 1) return { candidate: exactMatches[0], ambiguous: false };
  if (exactMatches.length > 1) return { candidate: null, ambiguous: true };

  // 2. Seluruh kata pada input muncul berurutan / sebagai kata utuh di nama resmi
  const queryTokens = queryNorm.split(' ').filter(Boolean);
  if (queryTokens.length > 0) {
    const tokenMatches = narrowByHints(
      candidates.filter((c) => {
        const cTokens = normalizeMatchText(stripParentheses(c.name))
          .split(' ')
          .filter(Boolean);
        return queryTokens.every((qt) => cTokens.includes(qt));
      })
    );
    if (tokenMatches.length === 1) {
      return { candidate: tokenMatches[0], ambiguous: false };
    }
    if (tokenMatches.length > 1) {
      return { candidate: null, ambiguous: true };
    }
  }

  // 3. Toleransi typo ringan (Levenshtein) jika cukup panjang dan unik
  const maxDist = queryNorm.length >= 8 ? 2 : queryNorm.length >= 5 ? 1 : 0;
  if (maxDist > 0) {
    let bestDist = Infinity;
    let bestPool: DismissibleMemberCandidate[] = [];
    for (const c of candidates) {
      const cNorm = normalizeMatchText(stripParentheses(c.name));
      const d = levenshtein(queryNorm, cNorm);
      if (d <= maxDist) {
        if (d < bestDist) {
          bestDist = d;
          bestPool = [c];
        } else if (d === bestDist) {
          bestPool.push(c);
        }
      }
    }
    bestPool = narrowByHints(bestPool);
    if (bestPool.length === 1) {
      return { candidate: bestPool[0], ambiguous: false };
    }
    if (bestPool.length > 1) {
      return { candidate: null, ambiguous: true };
    }
  }

  return { candidate: null, ambiguous: false };
}

function detectSectionHeader(line: string): MemberTargetStatus | null {
  const cleaned = line
    .replace(/^[*_#\s-]+/, '')
    .replace(/[*_:\s-]+$/, '')
    .trim()
    .toLowerCase();
  if (!cleaned) return null;

  if (
    /^(?:daftar\s+)?(?:anggota\s+)?(diberhentikan|dipecat|pemberhentian|keluar|nonaktif)$/.test(
      cleaned
    )
  ) {
    return 'Diberhentikan';
  }
  if (/^(?:daftar\s+)?(?:anggota\s+)?(alumni|lulus|demisioner)$/.test(cleaned)) {
    return 'Alumni';
  }
  if (/^(?:daftar\s+)?(?:anggota\s+)?cuti$/.test(cleaned)) {
    return 'Cuti';
  }
  return null;
}

function parseStatusAndReason(
  rightPart: string,
  fallbackStatus: MemberTargetStatus
): { targetStatus: MemberTargetStatus; reason: string } {
  const trimmed = rightPart.trim();
  if (!trimmed) {
    return { targetStatus: fallbackStatus, reason: '' };
  }

  const pureMatch = trimmed.match(
    /^(diberhentikan|dipecat|alumni|lulus|demisioner|cuti)\s*(?:[-–—:,]\s*(.*))?$/i
  );
  if (pureMatch) {
    return {
      targetStatus: normalizeTargetStatus(pureMatch[1]),
      reason: sanitizeDismissalReason(pureMatch[2] || ''),
    };
  }

  return {
    targetStatus: fallbackStatus,
    reason: sanitizeDismissalReason(trimmed),
  };
}

/**
 * Parser deterministik lokal agar proses pemilahan nama tetap berhasil walaupun
 * provider AI sedang limit, lambat, atau mengembalikan format non-JSON.
 */
export function fallbackParseMemberStatusList(
  rawText: string,
  candidates: DismissibleMemberCandidate[]
): AiDismissalParseResult {
  const lines = rawText.split(/\r?\n/);
  let currentSectionStatus: MemberTargetStatus = 'Diberhentikan';

  const seenIds = new Set<string>();
  const matched: AiMatchedDismissal[] = [];
  const unmatched: AiUnmatchedDismissal[] = [];

  for (const rawLine of lines) {
    const trimmedLine = rawLine.trim();
    if (!trimmedLine) continue;

    const headerStatus = detectSectionHeader(trimmedLine);
    if (headerStatus) {
      currentSectionStatus = headerStatus;
      continue;
    }

    const withoutBullet = trimmedLine
      .replace(/^\d+[.)]\s*/, '')
      .replace(/^[-•*]\s+/, '')
      .trim();
    if (!withoutBullet) continue;

    let leftPart = withoutBullet;
    let rightPart = '';
    const delimMatch = withoutBullet.match(/^(.+?)\s+(?:[-–—]+|:)\s*(.+)$/);
    if (delimMatch) {
      leftPart = delimMatch[1].trim();
      rightPart = delimMatch[2].trim();
    } else {
      const colonMatch = withoutBullet.match(/^([^:]+):\s*(.+)$/);
      if (colonMatch) {
        leftPart = colonMatch[1].trim();
        rightPart = colonMatch[2].trim();
      }
    }

    const { targetStatus, reason } = parseStatusAndReason(
      rightPart,
      currentSectionStatus
    );
    const { cleanName, hints } = extractHints(leftPart);
    const { candidate, ambiguous } = findBestCandidate(cleanName, hints, candidates);

    if (!candidate) {
      unmatched.push({
        raw_name: withoutBullet.slice(0, 140),
        target_status: targetStatus,
        reason,
        note: ambiguous
          ? 'Nama ambigu (lebih dari satu anggota cocok), silakan pilih manual.'
          : 'Data tidak ditemukan pada daftar anggota periode ini.',
      });
      continue;
    }

    if (candidate.status === targetStatus) {
      unmatched.push({
        raw_name: candidate.name,
        target_status: targetStatus,
        reason,
        note: `Anggota sudah berstatus ${targetStatus}.`,
      });
      continue;
    }

    if (seenIds.has(candidate.id)) {
      const existing = matched.find((m) => m.member_id === candidate.id);
      if (existing && !existing.reason && reason) {
        existing.reason = reason;
      }
      continue;
    }

    seenIds.add(candidate.id);
    matched.push({
      member_id: candidate.id,
      target_status: targetStatus,
      reason,
      matched_from: withoutBullet.slice(0, 120),
    });
  }

  return { matched, unmatched };
}

export function normalizeBulkDismissItems(items: BulkDismissItem[]): Array<{
  memberId: string;
  reason: string;
  targetStatus: MemberTargetStatus;
}> {
  const byId = new Map<
    string,
    { reason: string; targetStatus: MemberTargetStatus }
  >();
  for (const item of items) {
    if (!item || typeof item.memberId !== 'string') continue;
    const id = item.memberId.trim();
    if (!id) continue;
    const cleanReason = sanitizeDismissalReason(item.reason);
    const targetStatus = normalizeTargetStatus(item.targetStatus);
    const existing = byId.get(id);
    if (!existing) {
      byId.set(id, { reason: cleanReason, targetStatus });
    } else if (!existing.reason && cleanReason) {
      byId.set(id, { reason: cleanReason, targetStatus: existing.targetStatus });
    }
  }
  return Array.from(byId.entries()).map(([memberId, info]) => ({
    memberId,
    reason: info.reason,
    targetStatus: info.targetStatus,
  }));
}
