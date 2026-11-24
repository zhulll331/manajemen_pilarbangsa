export const SP1_ALPA_THRESHOLD = 3; // Terkena SP 1 apabila Alpa > 3 (minimal 4 Alpa)
export const SP2_ALPA_AFTER_SP1_THRESHOLD = 1; // Terkena SP 2 apabila menambah >= 1 Alpa setelah SP 1
export const DISCIPLINE_ELIGIBLE_STATUSES = ['Aktif', 'Pengurus Aktif'] as const;

export type WarningLevel = 'none' | 'sp1' | 'sp2';
export type DisciplineAction = 'sp1_issued' | 'sp1_revoked' | 'sp2_dismissed';
export type DisciplineSource = 'auto_recap' | 'manual' | 'ai_import';

export interface DisciplineMemberInput {
  id: string;
  name: string;
  nim?: string | null;
  division?: string | null;
  faculty?: string | null;
  generation?: string | null;
  status: string;
  status_note?: string | null;
  warning_level?: string | null;
  sp1_issued_at?: string | null;
  sp1_note?: string | null;
  sp2_issued_at?: string | null;
  sp2_note?: string | null;
}

export interface DisciplineAgendaInput {
  id: string;
  title: string;
  date: string;
}

export interface DisciplineAttendanceInput {
  agenda_id: string;
  member_id: string;
  status: string;
}

export interface PeriodQuarter {
  key: 'q1' | 'q2' | 'q3' | 'q4';
  index: 1 | 2 | 3 | 4;
  label: string;
  shortLabel: string;
  startDate: string;
  endDate: string;
}

export type MemberDisciplineEvalStatus =
  | 'eligible_sp2'
  | 'eligible_sp1'
  | 'active_sp1'
  | 'dismissed_sp2'
  | 'normal';

export interface AlpaAgendaDetail {
  id: string;
  title: string;
  date: string;
}

export interface MemberDisciplineEvaluation {
  memberId: string;
  name: string;
  nim: string;
  division: string;
  faculty: string;
  generation: string;
  status: string;
  warningLevel: WarningLevel;
  sp1IssuedAt: string | null;
  sp1Note: string | null;
  sp2IssuedAt: string | null;
  sp2Note: string | null;
  hadirCount: number;
  izinCount: number;
  sakitCount: number;
  alpaInWindow: number;
  alpaAfterSp1: number;
  alpaAgendasInWindow: AlpaAgendaDetail[];
  alpaAgendasAfterSp1: AlpaAgendaDetail[];
  evalStatus: MemberDisciplineEvalStatus;
  priorityOrder: number;
}

export interface DisciplineEvaluationSummary {
  eligibleSp1: number;
  activeSp1: number;
  eligibleSp2: number;
  dismissedSp2: number;
  totalEvaluated: number;
}

export interface AiMatchedSp1 {
  member_id: string;
  note: string;
  matched_from: string;
}

export interface AiUnmatchedSp1 {
  raw_name: string;
  note: string;
}

export interface AiSp1ParseResult {
  matched: AiMatchedSp1[];
  unmatched: AiUnmatchedSp1[];
}

export interface BulkDisciplineItem {
  memberId: string;
  note: string;
  alpaCount: number;
}

const MAX_NOTE_LENGTH = 300;
const MAX_INPUT_TEXT_LENGTH = 8000;

export function getTodayWibDateString(now: Date = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Jakarta',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(now);
}

export function getYesterdayWibDateString(now: Date = new Date()): string {
  const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  return getTodayWibDateString(yesterday);
}

export function normalizeWarningLevel(raw: unknown): WarningLevel {
  if (raw === 'sp1' || raw === 'sp2') return raw;
  return 'none';
}

export function isValidIsoDateString(value: string | null | undefined): boolean {
  if (!value || typeof value !== 'string') return false;
  return /^\d{4}-\d{2}-\d{2}$/.test(value.trim());
}

export function buildPeriodQuarters(period: {
  start_year: number;
  end_year: number;
  start_date?: string;
  end_date?: string;
}): PeriodQuarter[] {
  const sy = Number(period.start_year);
  const ey = Number(period.end_year) || sy + 1;

  return [
    {
      key: 'q1',
      index: 1,
      label: `Triwulan 1 (Jul–Sep ${sy})`,
      shortLabel: `TW 1 (Jul–Sep ${sy})`,
      startDate: `${sy}-07-01`,
      endDate: `${sy}-09-30`,
    },
    {
      key: 'q2',
      index: 2,
      label: `Triwulan 2 (Okt–Des ${sy})`,
      shortLabel: `TW 2 (Okt–Des ${sy})`,
      startDate: `${sy}-10-01`,
      endDate: `${sy}-12-31`,
    },
    {
      key: 'q3',
      index: 3,
      label: `Triwulan 3 (Jan–Mar ${ey})`,
      shortLabel: `TW 3 (Jan–Mar ${ey})`,
      startDate: `${ey}-01-01`,
      endDate: `${ey}-03-31`,
    },
    {
      key: 'q4',
      index: 4,
      label: `Triwulan 4 (Apr–Jun ${ey})`,
      shortLabel: `TW 4 (Apr–Jun ${ey})`,
      startDate: `${ey}-04-01`,
      endDate: `${ey}-06-30`,
    },
  ];
}

export function getDefaultQuarterKey(
  quarters: PeriodQuarter[],
  todayWib: string = getTodayWibDateString()
): PeriodQuarter['key'] {
  if (quarters.length === 0) return 'q1';
  const match = quarters.find((q) => todayWib >= q.startDate && todayWib <= q.endDate);
  if (match) return match.key;
  if (todayWib > quarters[quarters.length - 1].endDate) {
    return quarters[quarters.length - 1].key;
  }
  return quarters[0].key;
}

const PRIORITY_MAP: Record<MemberDisciplineEvalStatus, number> = {
  eligible_sp2: 1,
  eligible_sp1: 2,
  active_sp1: 3,
  normal: 4,
  dismissed_sp2: 5,
};

export function evaluateAttendanceDiscipline(params: {
  members: DisciplineMemberInput[];
  agendas: DisciplineAgendaInput[];
  attendance: DisciplineAttendanceInput[];
  rangeStart: string;
  rangeEnd: string;
  includeDismissedSp2?: boolean;
}): {
  rows: MemberDisciplineEvaluation[];
  summary: DisciplineEvaluationSummary;
} {
  const {
    members,
    agendas,
    attendance,
    rangeStart,
    rangeEnd,
    includeDismissedSp2 = true,
  } = params;

  const agendaMap = new Map<string, DisciplineAgendaInput>();
  for (const a of agendas) {
    if (a && a.id) {
      agendaMap.set(a.id, a);
    }
  }

  // Deduplikasi catatan absensi per pasangan (agenda_id, member_id)
  const dedupedByMember = new Map<string, Map<string, string>>();
  for (const rec of attendance) {
    if (!rec || !rec.agenda_id || !rec.member_id) continue;
    let perAgenda = dedupedByMember.get(rec.member_id);
    if (!perAgenda) {
      perAgenda = new Map<string, string>();
      dedupedByMember.set(rec.member_id, perAgenda);
    }
    perAgenda.set(rec.agenda_id, rec.status);
  }

  const eligibleSet = new Set<string>(DISCIPLINE_ELIGIBLE_STATUSES);
  const rows: MemberDisciplineEvaluation[] = [];
  const summary: DisciplineEvaluationSummary = {
    eligibleSp1: 0,
    activeSp1: 0,
    eligibleSp2: 0,
    dismissedSp2: 0,
    totalEvaluated: 0,
  };

  for (const member of members) {
    const warningLevel = normalizeWarningLevel(member.warning_level);
    const isActiveScope = eligibleSet.has(member.status);
    const isDismissedSp2 =
      member.status === 'Diberhentikan' && warningLevel === 'sp2';

    if (!isActiveScope && !(includeDismissedSp2 && isDismissedSp2)) {
      continue;
    }

    const sp1IssuedAt = isValidIsoDateString(member.sp1_issued_at)
      ? String(member.sp1_issued_at).trim()
      : null;

    let hadirCount = 0;
    let izinCount = 0;
    let sakitCount = 0;
    let alpaInWindow = 0;
    let alpaAfterSp1 = 0;
    const alpaAgendasInWindow: AlpaAgendaDetail[] = [];
    const alpaAgendasAfterSp1: AlpaAgendaDetail[] = [];

    const memberAttendance = dedupedByMember.get(member.id);
    if (memberAttendance) {
      for (const [agendaId, attStatus] of memberAttendance.entries()) {
        const agenda = agendaMap.get(agendaId);
        if (!agenda || !isValidIsoDateString(agenda.date)) continue;

        const agendaDate = agenda.date.trim();
        const inWindow =
          (!rangeStart || agendaDate >= rangeStart) &&
          (!rangeEnd || agendaDate <= rangeEnd);

        if (inWindow) {
          if (attStatus === 'Hadir') hadirCount += 1;
          else if (attStatus === 'Izin') izinCount += 1;
          else if (attStatus === 'Sakit') sakitCount += 1;
          else if (attStatus === 'Alpa') {
            alpaInWindow += 1;
            alpaAgendasInWindow.push({
              id: agenda.id,
              title: agenda.title,
              date: agendaDate,
            });
          }
        }

        // Untuk anggota SP 1 aktif, lacak Alpa sepanjang periode setelah tanggal SP 1 berlaku
        if (isActiveScope && warningLevel === 'sp1' && attStatus === 'Alpa') {
          const isAfterSp1 = sp1IssuedAt ? agendaDate > sp1IssuedAt : inWindow;
          if (isAfterSp1) {
            alpaAfterSp1 += 1;
            alpaAgendasAfterSp1.push({
              id: agenda.id,
              title: agenda.title,
              date: agendaDate,
            });
          }
        }
      }
    }

    alpaAgendasInWindow.sort((a, b) => b.date.localeCompare(a.date));
    alpaAgendasAfterSp1.sort((a, b) => b.date.localeCompare(a.date));

    let evalStatus: MemberDisciplineEvalStatus = 'normal';
    if (isDismissedSp2) {
      evalStatus = 'dismissed_sp2';
      summary.dismissedSp2 += 1;
    } else if (
      warningLevel === 'sp1' &&
      alpaAfterSp1 >= SP2_ALPA_AFTER_SP1_THRESHOLD
    ) {
      evalStatus = 'eligible_sp2';
      summary.eligibleSp2 += 1;
      summary.activeSp1 += 1;
    } else if (warningLevel === 'sp1') {
      evalStatus = 'active_sp1';
      summary.activeSp1 += 1;
    } else if (warningLevel === 'none' && alpaInWindow > SP1_ALPA_THRESHOLD) {
      evalStatus = 'eligible_sp1';
      summary.eligibleSp1 += 1;
    }

    if (isActiveScope) {
      summary.totalEvaluated += 1;
    }

    rows.push({
      memberId: member.id,
      name: member.name,
      nim: member.nim || '-',
      division: member.division || '-',
      faculty: member.faculty || '-',
      generation: member.generation || '-',
      status: member.status,
      warningLevel,
      sp1IssuedAt,
      sp1Note: member.sp1_note || null,
      sp2IssuedAt: isValidIsoDateString(member.sp2_issued_at)
        ? String(member.sp2_issued_at).trim()
        : null,
      sp2Note: member.sp2_note || null,
      hadirCount,
      izinCount,
      sakitCount,
      alpaInWindow,
      alpaAfterSp1,
      alpaAgendasInWindow,
      alpaAgendasAfterSp1,
      evalStatus,
      priorityOrder: PRIORITY_MAP[evalStatus],
    });
  }

  rows.sort((a, b) => {
    if (a.priorityOrder !== b.priorityOrder) {
      return a.priorityOrder - b.priorityOrder;
    }
    if (a.alpaAfterSp1 !== b.alpaAfterSp1) {
      return b.alpaAfterSp1 - a.alpaAfterSp1;
    }
    if (a.alpaInWindow !== b.alpaInWindow) {
      return b.alpaInWindow - a.alpaInWindow;
    }
    return a.name.localeCompare(b.name, 'id');
  });

  return { rows, summary };
}

export function detectSp2AlertsForAgenda(params: {
  agendaDate: string;
  members: DisciplineMemberInput[];
  attendanceMap: Record<string, string>;
}): Array<{
  id: string;
  name: string;
  division: string | null;
  sp1IssuedAt: string | null;
}> {
  const { agendaDate, members, attendanceMap } = params;
  const cleanAgendaDate = isValidIsoDateString(agendaDate)
    ? agendaDate.trim()
    : '';

  const alerts: Array<{
    id: string;
    name: string;
    division: string | null;
    sp1IssuedAt: string | null;
  }> = [];

  for (const m of members) {
    if (normalizeWarningLevel(m.warning_level) !== 'sp1') continue;
    if (attendanceMap[m.id] !== 'Alpa') continue;

    const sp1Date = isValidIsoDateString(m.sp1_issued_at)
      ? String(m.sp1_issued_at).trim()
      : null;

    if (!sp1Date || !cleanAgendaDate || cleanAgendaDate > sp1Date) {
      alerts.push({
        id: m.id,
        name: m.name,
        division: m.division || null,
        sp1IssuedAt: sp1Date,
      });
    }
  }

  return alerts;
}

export function sanitizeDisciplineNote(note: unknown): string {
  if (typeof note !== 'string') return '';
  return note.replace(/\s+/g, ' ').trim().slice(0, MAX_NOTE_LENGTH);
}

export function validateSp1InputText(rawText: string): string | null {
  const trimmed = rawText.trim();
  if (trimmed.length < 3) {
    return 'Tempel minimal satu nama anggota/pengurus yang terkena SP 1.';
  }
  if (trimmed.length > MAX_INPUT_TEXT_LENGTH) {
    return `Teks terlalu panjang (maksimal ${MAX_INPUT_TEXT_LENGTH} karakter per proses).`;
  }
  return null;
}

export function buildSp1AiPrompts(
  rawText: string,
  candidates: DisciplineMemberInput[]
): { systemPrompt: string; userMessage: string } {
  const eligibleSet = new Set<string>(DISCIPLINE_ELIGIBLE_STATUSES);
  const activeCatalog = candidates
    .filter(
      (m) =>
        eligibleSet.has(m.status) &&
        normalizeWarningLevel(m.warning_level) === 'none'
    )
    .map((m) => ({
      id: m.id,
      name: m.name,
      nim: m.nim || '',
      division: m.division || '',
      status: m.status,
    }));

  const systemPrompt = [
    'Anda adalah asisten administrasi Sekretaris & Ketua UKM Pilar Bangsa.',
    'Tugas Anda: mencocokkan teks daftar anggota/pengurus yang terkena SP 1 (Surat Peringatan 1) hasil rekapan absensi dengan daftar anggota aktif resmi, serta mengekstrak keterangan/alasan/jumlah alpa jika tertulis.',
    '',
    'ATURAN KETAT:',
    '1. Jawab HANYA dengan objek JSON mentah yang valid tanpa markdown/teks tambahan.',
    '2. Skema JSON wajib:',
    '{"matched":[{"member_id":"<uuid exact>","note":"<keterangan/jumlah alpa bila ada>","matched_from":"<teks asli>"}],"unmatched":[{"raw_name":"<nama/baris input>","note":"<alasan gagal cocok>"}]}',
    '3. member_id HARUS menyalin persis field "id" dari daftar anggota yang diberikan. Dilarang mengarang ID.',
    '4. Jika teks menyebut jumlah alpa atau keterangan (mis. "4x alpa", "alpa 5 kali", "SP 1 rapat divisi"), masukkan ke field "note". Jika tidak ada keterangan, isi "".',
    '5. Jika nama ambigu atau tidak ditemukan di daftar, masukkan ke "unmatched" dan jelaskan alasannya di "note".',
    '6. Satu member_id hanya boleh muncul maksimal 1 kali di "matched".',
  ].join('\n');

  const userMessage = [
    'DAFTAR ANGGOTA & PENGURUS AKTIF BELUM SP 1 (JSON):',
    JSON.stringify(activeCatalog),
    '',
    'TEKS DAFTAR SP 1 DARI PENGURUS:',
    rawText.trim(),
  ].join('\n');

  return { systemPrompt, userMessage };
}

function extractJsonObject(rawAiText: string): string {
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

export function normalizeAiSp1Response(
  rawAiText: string,
  candidates: DisciplineMemberInput[]
): AiSp1ParseResult {
  const jsonText = extractJsonObject(rawAiText);
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
  const eligibleSet = new Set<string>(DISCIPLINE_ELIGIBLE_STATUSES);
  const seenIds = new Set<string>();
  const matched: AiMatchedSp1[] = [];
  const unmatched: AiUnmatchedSp1[] = [];

  for (const item of rawMatched) {
    if (!item || typeof item !== 'object') continue;
    const entry = item as Record<string, unknown>;
    const memberId = typeof entry.member_id === 'string' ? entry.member_id.trim() : '';
    const note = sanitizeDisciplineNote(entry.note);
    const matchedFrom =
      typeof entry.matched_from === 'string'
        ? entry.matched_from.trim().slice(0, 120)
        : '';

    if (!memberId) continue;
    const candidate = candidateMap.get(memberId);
    if (!candidate) {
      unmatched.push({
        raw_name: matchedFrom || memberId,
        note: 'ID kandidat dari AI tidak cocok dengan anggota periode saat ini.',
      });
      continue;
    }

    if (!eligibleSet.has(candidate.status)) {
      unmatched.push({
        raw_name: candidate.name,
        note: `Anggota berstatus ${candidate.status}, bukan anggota/pengurus aktif.`,
      });
      continue;
    }

    const level = normalizeWarningLevel(candidate.warning_level);
    if (level === 'sp1') {
      unmatched.push({
        raw_name: candidate.name,
        note: 'Sudah tercatat berstatus SP 1 aktif.',
      });
      continue;
    }
    if (level === 'sp2') {
      unmatched.push({
        raw_name: candidate.name,
        note: 'Sudah berstatus SP 2 (Diberhentikan).',
      });
      continue;
    }

    if (seenIds.has(memberId)) {
      const existing = matched.find((m) => m.member_id === memberId);
      if (existing && !existing.note && note) {
        existing.note = note;
      }
      continue;
    }

    seenIds.add(memberId);
    matched.push({
      member_id: memberId,
      note,
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
      note:
        sanitizeDisciplineNote(entry.note) ||
        'Tidak ditemukan pada daftar anggota aktif belum SP 1.',
    });
  }

  return { matched, unmatched };
}

export function normalizeBulkDisciplineItems(
  items: Array<{ memberId: string; note?: string; alpaCount?: number }>
): BulkDisciplineItem[] {
  const byId = new Map<string, BulkDisciplineItem>();
  for (const item of items) {
    if (!item || typeof item.memberId !== 'string') continue;
    const memberId = item.memberId.trim();
    if (!memberId) continue;

    const cleanNote = sanitizeDisciplineNote(item.note);
    const alpaCount =
      typeof item.alpaCount === 'number' && Number.isFinite(item.alpaCount)
        ? Math.max(0, Math.floor(item.alpaCount))
        : 0;

    const existing = byId.get(memberId);
    if (!existing) {
      byId.set(memberId, { memberId, note: cleanNote, alpaCount });
    } else {
      if (!existing.note && cleanNote) existing.note = cleanNote;
      if (alpaCount > existing.alpaCount) existing.alpaCount = alpaCount;
    }
  }
  return Array.from(byId.values());
}

function normalizeSp1MatchText(value: string): string {
  return value
    .toLowerCase()
    .replace(/['’`]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function fallbackParseSp1List(
  rawText: string,
  candidates: DisciplineMemberInput[]
): AiSp1ParseResult {
  const lines = rawText.split(/\r?\n/);
  const eligibleSet = new Set<string>(DISCIPLINE_ELIGIBLE_STATUSES);
  const seenIds = new Set<string>();
  const matched: AiMatchedSp1[] = [];
  const unmatched: AiUnmatchedSp1[] = [];

  for (const rawLine of lines) {
    const trimmedLine = rawLine.trim();
    if (!trimmedLine) continue;
    if (/^(?:daftar\s+)?(?:anggota\s+)?sp\s*1\b.*:?$/i.test(trimmedLine)) {
      continue;
    }

    const withoutBullet = trimmedLine
      .replace(/^\d+[.)]\s*/, '')
      .replace(/^[-•*]\s+/, '')
      .trim();
    if (!withoutBullet) continue;

    let leftPart = withoutBullet;
    let notePart = '';
    const delimMatch = withoutBullet.match(/^(.+?)\s+(?:[-–—]+|:)\s*(.+)$/);
    if (delimMatch) {
      leftPart = delimMatch[1].trim();
      notePart = sanitizeDisciplineNote(delimMatch[2]);
    } else {
      const parenTail = withoutBullet.match(/^(.+?)\s+\(([^)]*alpa[^)]*)\)$/i);
      if (parenTail) {
        leftPart = parenTail[1].trim();
        notePart = sanitizeDisciplineNote(parenTail[2]);
      }
    }

    const hints: string[] = [];
    const cleanName = leftPart
      .replace(/\(([^)]+)\)/g, (_, inner: string) => {
        const h = normalizeSp1MatchText(inner);
        if (h) hints.push(h);
        return ' ';
      })
      .replace(/\s+/g, ' ')
      .trim();

    const queryNorm = normalizeSp1MatchText(cleanName);
    if (!queryNorm) continue;

    const narrow = (pool: DisciplineMemberInput[]) => {
      if (pool.length <= 1 || hints.length === 0) return pool;
      const filtered = pool.filter((c) => {
        const hay = normalizeSp1MatchText(
          `${c.name} ${c.division || ''} ${c.faculty || ''} ${c.nim || ''}`
        );
        return hints.some((h) => hay.includes(h));
      });
      return filtered.length > 0 ? filtered : pool;
    };

    const exact = narrow(
      candidates.filter((c) => {
        const cNim = normalizeSp1MatchText(c.nim || '');
        const cName = normalizeSp1MatchText(c.name.replace(/\([^)]*\)/g, ' '));
        return (cNim && cNim === queryNorm) || cName === queryNorm;
      })
    );

    let chosen: DisciplineMemberInput | null = exact.length === 1 ? exact[0] : null;
    let ambiguous = exact.length > 1;

    if (!chosen && !ambiguous) {
      const qTokens = queryNorm.split(' ').filter(Boolean);
      const tokenMatches = narrow(
        candidates.filter((c) => {
          const cTokens = normalizeSp1MatchText(c.name.replace(/\([^)]*\)/g, ' '))
            .split(' ')
            .filter(Boolean);
          return qTokens.every((qt) => cTokens.includes(qt));
        })
      );
      if (tokenMatches.length === 1) chosen = tokenMatches[0];
      else if (tokenMatches.length > 1) ambiguous = true;
    }

    if (!chosen) {
      unmatched.push({
        raw_name: withoutBullet.slice(0, 140),
        note: ambiguous
          ? 'Nama ambigu (lebih dari satu anggota cocok), silakan pilih manual.'
          : 'Data tidak ditemukan pada daftar anggota periode ini.',
      });
      continue;
    }

    if (!eligibleSet.has(chosen.status)) {
      unmatched.push({
        raw_name: chosen.name,
        note: `Anggota berstatus ${chosen.status}, bukan anggota/pengurus aktif.`,
      });
      continue;
    }

    const level = normalizeWarningLevel(chosen.warning_level);
    if (level === 'sp1') {
      unmatched.push({
        raw_name: chosen.name,
        note: 'Sudah tercatat berstatus SP 1 aktif.',
      });
      continue;
    }
    if (level === 'sp2') {
      unmatched.push({
        raw_name: chosen.name,
        note: 'Sudah berstatus SP 2 (Diberhentikan).',
      });
      continue;
    }

    if (seenIds.has(chosen.id)) continue;
    seenIds.add(chosen.id);
    matched.push({
      member_id: chosen.id,
      note: notePart,
      matched_from: withoutBullet.slice(0, 120),
    });
  }

  return { matched, unmatched };
}
