import test from 'node:test';
import assert from 'node:assert/strict';

import {
  buildPeriodQuarters,
  buildSp1AiPrompts,
  detectSp2AlertsForAgenda,
  evaluateAttendanceDiscipline,
  fallbackParseSp1List,
  getDefaultQuarterKey,
  normalizeAiSp1Response,
  normalizeBulkDisciplineItems,
} from '../src/lib/members/discipline.ts';

test('buildPeriodQuarters splits management period into 4 sequential 3-month quarters', () => {
  const quarters = buildPeriodQuarters({ start_year: 2026, end_year: 2027 });
  assert.equal(quarters.length, 4);
  assert.equal(quarters[0].startDate, '2026-07-01');
  assert.equal(quarters[0].endDate, '2026-09-30');
  assert.equal(quarters[1].startDate, '2026-10-01');
  assert.equal(quarters[1].endDate, '2026-12-31');
  assert.equal(quarters[2].startDate, '2027-01-01');
  assert.equal(quarters[2].endDate, '2027-03-31');
  assert.equal(quarters[3].startDate, '2027-04-01');
  assert.equal(quarters[3].endDate, '2027-06-30');

  assert.equal(getDefaultQuarterKey(quarters, '2026-08-15'), 'q1');
  assert.equal(getDefaultQuarterKey(quarters, '2026-11-24'), 'q2');
  assert.equal(getDefaultQuarterKey(quarters, '2027-02-01'), 'q3');
  assert.equal(getDefaultQuarterKey(quarters, '2027-05-10'), 'q4');
  assert.equal(getDefaultQuarterKey(quarters, '2026-06-20'), 'q1');
  assert.equal(getDefaultQuarterKey(quarters, '2027-07-10'), 'q4');
});

test('evaluateAttendanceDiscipline detects SP1 (>3 Alpa) and SP2 (+1 Alpa strictly after SP1 date) across Aktif & Pengurus Aktif', () => {
  const members = [
    { id: 'm-3alpa', name: 'Andi Tiga', status: 'Aktif', warning_level: 'none' },
    { id: 'm-4alpa-anggota', name: 'Budi Empat', status: 'Aktif', warning_level: 'none' },
    { id: 'm-4alpa-pengurus', name: 'Citra Pengurus', status: 'Pengurus Aktif', warning_level: 'none' },
    { id: 'm-sp1-aman', name: 'Deni SP1 Aman', status: 'Aktif', warning_level: 'sp1', sp1_issued_at: '2026-11-20' },
    { id: 'm-sp1-kena-sp2', name: 'Eka SP1 Langgar', status: 'Pengurus Aktif', warning_level: 'sp1', sp1_issued_at: '2026-11-20' },
    { id: 'm-sp2-done', name: 'Fajar Berhenti', status: 'Diberhentikan', warning_level: 'sp2', sp2_issued_at: '2026-11-18' },
    { id: 'm-cuti', name: 'Gita Cuti', status: 'Cuti', warning_level: 'none' },
  ];

  const agendas = [
    { id: 'a1', title: 'Rapat 1', date: '2026-10-05' },
    { id: 'a2', title: 'Rapat 2', date: '2026-10-19' },
    { id: 'a3', title: 'Rapat 3', date: '2026-11-02' },
    { id: 'a4', title: 'Rapat 4', date: '2026-11-16' },
    { id: 'a5', title: 'Rapat Hari SP1', date: '2026-11-20' },
    { id: 'a6', title: 'Rapat Pasca SP1 (TW berikutnya)', date: '2027-01-10' },
  ];

  const attendance = [
    // Andi: tepat 3 Alpa -> belum SP 1
    { agenda_id: 'a1', member_id: 'm-3alpa', status: 'Alpa' },
    { agenda_id: 'a2', member_id: 'm-3alpa', status: 'Alpa' },
    { agenda_id: 'a3', member_id: 'm-3alpa', status: 'Alpa' },
    { agenda_id: 'a4', member_id: 'm-3alpa', status: 'Hadir' },

    // Budi (Aktif): 4 Alpa (>3) -> Kandidat SP 1
    { agenda_id: 'a1', member_id: 'm-4alpa-anggota', status: 'Alpa' },
    { agenda_id: 'a2', member_id: 'm-4alpa-anggota', status: 'Alpa' },
    { agenda_id: 'a3', member_id: 'm-4alpa-anggota', status: 'Alpa' },
    { agenda_id: 'a4', member_id: 'm-4alpa-anggota', status: 'Alpa' },

    // Citra (Pengurus Aktif): 4 Alpa (>3) -> Kandidat SP 1
    { agenda_id: 'a1', member_id: 'm-4alpa-pengurus', status: 'Alpa' },
    { agenda_id: 'a2', member_id: 'm-4alpa-pengurus', status: 'Alpa' },
    { agenda_id: 'a3', member_id: 'm-4alpa-pengurus', status: 'Alpa' },
    { agenda_id: 'a4', member_id: 'm-4alpa-pengurus', status: 'Alpa' },

    // Deni (SP 1 tgl 20 Nov): Alpa pada/sebelum 20 Nov tidak boleh memicu SP 2
    { agenda_id: 'a4', member_id: 'm-sp1-aman', status: 'Alpa' },
    { agenda_id: 'a5', member_id: 'm-sp1-aman', status: 'Alpa' },
    { agenda_id: 'a6', member_id: 'm-sp1-aman', status: 'Hadir' },

    // Eka (SP 1 tgl 20 Nov): Alpa 1x pada 10 Jan (di luar TW 2, tetap kena sepanjang periode) -> Siap SP 2
    { agenda_id: 'a6', member_id: 'm-sp1-kena-sp2', status: 'Alpa' },

    // Gita (Cuti): diabaikan
    { agenda_id: 'a1', member_id: 'm-cuti', status: 'Alpa' },
    { agenda_id: 'a2', member_id: 'm-cuti', status: 'Alpa' },
    { agenda_id: 'a3', member_id: 'm-cuti', status: 'Alpa' },
    { agenda_id: 'a4', member_id: 'm-cuti', status: 'Alpa' },
  ];

  const { rows, summary } = evaluateAttendanceDiscipline({
    members,
    agendas,
    attendance,
    rangeStart: '2026-10-01',
    rangeEnd: '2026-12-31',
  });

  const byId = new Map(rows.map((r) => [r.memberId, r]));

  assert.equal(byId.get('m-3alpa')?.evalStatus, 'normal');
  assert.equal(byId.get('m-3alpa')?.alpaInWindow, 3);
  assert.equal(byId.get('m-4alpa-anggota')?.evalStatus, 'eligible_sp1');
  assert.equal(byId.get('m-4alpa-pengurus')?.evalStatus, 'eligible_sp1');
  assert.equal(byId.get('m-sp1-aman')?.evalStatus, 'active_sp1');
  assert.equal(byId.get('m-sp1-aman')?.alpaAfterSp1, 0);
  assert.equal(byId.get('m-sp1-kena-sp2')?.evalStatus, 'eligible_sp2');
  assert.equal(byId.get('m-sp1-kena-sp2')?.alpaAfterSp1, 1);
  assert.equal(byId.get('m-sp2-done')?.evalStatus, 'dismissed_sp2');
  assert.equal(byId.has('m-cuti'), false);

  assert.deepEqual(summary, {
    eligibleSp1: 2,
    activeSp1: 2,
    eligibleSp2: 1,
    dismissedSp2: 1,
    totalEvaluated: 5,
  });

  // Prioritas paling atas harus eligible_sp2
  assert.equal(rows[0].memberId, 'm-sp1-kena-sp2');
});

test('detectSp2AlertsForAgenda triggers only for SP1 members marked Alpa strictly after sp1_issued_at', () => {
  const members = [
    { id: '1', name: 'SP1 Kena', division: 'Sosial', status: 'Aktif', warning_level: 'sp1', sp1_issued_at: '2026-11-23' },
    { id: '2', name: 'SP1 Hadir', division: 'Sosial', status: 'Aktif', warning_level: 'sp1', sp1_issued_at: '2026-11-23' },
    { id: '3', name: 'SP1 Tanggal Sama', division: 'Pendidikan', status: 'Aktif', warning_level: 'sp1', sp1_issued_at: '2026-11-24' },
    { id: '4', name: 'Belum SP1', division: 'Pendidikan', status: 'Aktif', warning_level: 'none' },
  ];

  const alerts = detectSp2AlertsForAgenda({
    agendaDate: '2026-11-24',
    members,
    attendanceMap: { '1': 'Alpa', '2': 'Hadir', '3': 'Alpa', '4': 'Alpa' },
  });

  assert.equal(alerts.length, 1);
  assert.equal(alerts[0].id, '1');
});

test('SP1 AI prompt builder & normalizer filter active non-SP1 members and handle edge cases', () => {
  const candidates = [
    { id: 'u1', name: 'Budi Santoso', nim: '101', division: 'Sosial', status: 'Aktif', warning_level: 'none' },
    { id: 'u2', name: 'Siti Aminah', nim: '102', division: 'Pendidikan', status: 'Pengurus Aktif', warning_level: 'sp1' },
    { id: 'u3', name: 'Rina', nim: '103', division: 'Sosial', status: 'Diberhentikan', warning_level: 'sp2' },
  ];

  const { userMessage } = buildSp1AiPrompts('Budi (alpa 4x)', candidates);
  assert.ok(userMessage.includes('u1'));
  assert.equal(userMessage.includes('u2'), false);
  assert.equal(userMessage.includes('u3'), false);

  const parsed = normalizeAiSp1Response(
    '```json\n{"matched":[{"member_id":"u1","note":"Alpa 4 kali","matched_from":"Budi"},{"member_id":"u2","note":"SP1"},{"member_id":"u3","note":""},{"member_id":"fake","note":""}],"unmatched":[{"raw_name":"Anonim","note":"Tidak ditemukan"}]}\n```',
    candidates
  );

  assert.deepEqual(parsed.matched, [
    { member_id: 'u1', note: 'Alpa 4 kali', matched_from: 'Budi' },
  ]);
  assert.equal(parsed.unmatched.length, 4);

  const deduped = normalizeBulkDisciplineItems([
    { memberId: ' u1 ', note: '  Alpa   4x ', alpaCount: 4 },
    { memberId: 'u1', note: 'ignored', alpaCount: 5 },
    { memberId: '', note: 'empty' },
  ]);
  assert.deepEqual(deduped, [{ memberId: 'u1', note: 'Alpa 4x', alpaCount: 5 }]);

  const fallback = fallbackParseSp1List(
    '1. Budi Santoso - Alpa 4x\n2. Siti Aminah\n3. Nama Tidak Ada',
    candidates
  );
  assert.deepEqual(fallback.matched, [
    { member_id: 'u1', note: 'Alpa 4x', matched_from: 'Budi Santoso - Alpa 4x' },
  ]);
  assert.equal(fallback.unmatched.length, 2);
  assert.match(fallback.unmatched[1].note, /Data tidak ditemukan/i);
});
