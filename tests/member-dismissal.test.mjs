import test from 'node:test';
import assert from 'node:assert/strict';

import {
  buildDismissalAiPrompts,
  extractJsonObjectFromAiText,
  fallbackParseMemberStatusList,
  normalizeAiDismissalResponse,
  normalizeBulkDismissItems,
  validateDismissalInputText,
} from '../src/lib/members/dismissal.ts';

const SAMPLE_CANDIDATES = [
  { id: 'uuid-1', name: 'Budi Santoso', nim: '2024001', division: 'Pendidikan', status: 'Aktif' },
  { id: 'uuid-2', name: 'Siti Aisyah', nim: '2024002', division: 'Sosial', status: 'Pengurus Aktif' },
  { id: 'uuid-3', name: 'Rina Wijaya', nim: '2024003', division: 'Kewirausahaan', status: 'Diberhentikan' },
];

test('validateDismissalInputText rejects empty or overly long text', () => {
  assert.match(validateDismissalInputText(' ') || '', /minimal/);
  assert.match(validateDismissalInputText('a'.repeat(8001)) || '', /maksimal/);
  assert.equal(validateDismissalInputText('Budi - tidak aktif 3 bulan'), null);
});

test('buildDismissalAiPrompts includes active and dismissed candidates for multi-status routing', () => {
  const { userMessage } = buildDismissalAiPrompts('Budi - alumni', SAMPLE_CANDIDATES);
  assert.ok(userMessage.includes('uuid-1'));
  assert.ok(userMessage.includes('uuid-2'));
  assert.ok(userMessage.includes('uuid-3'));
});

test('extractJsonObjectFromAiText strips think blocks, code fences and parses outermost JSON', () => {
  const raw =
    '<think>Sedang menganalisis 3 nama...</think>\n```json\n{"matched":[{"member_id":"uuid-1","target_status":"Diberhentikan","reason":"Alpa 4x"}],"unmatched":[]}\n```';
  const extracted = extractJsonObjectFromAiText(raw);
  const parsed = JSON.parse(extracted);
  assert.equal(parsed.matched.length, 1);
});

test('normalizeAiDismissalResponse preserves target_status, reasons, deduplicates IDs, and flags already-same-status or missing IDs', () => {
  const rawResponse = JSON.stringify({
    matched: [
      { member_id: 'uuid-1', target_status: 'Diberhentikan', reason: '  Tidak aktif 3x rapat   berturut-turut ', matched_from: 'Budi' },
      { member_id: 'uuid-1', target_status: 'Diberhentikan', reason: 'Duplikat', matched_from: 'Budi S.' },
      { member_id: 'uuid-2', target_status: 'Alumni', reason: '', matched_from: 'Siti - alumni' },
      { member_id: 'uuid-3', target_status: 'Diberhentikan', reason: 'Sudah berhenti', matched_from: 'Rina' },
      { member_id: 'uuid-fake', target_status: 'Alumni', reason: '', matched_from: 'Anonim' },
    ],
    unmatched: [
      { raw_name: 'Doni Pratama', target_status: 'Diberhentikan', reason: 'Pelanggaran etik', note: 'Data tidak ditemukan pada daftar anggota periode ini.' },
    ],
  });

  const result = normalizeAiDismissalResponse(rawResponse, SAMPLE_CANDIDATES);
  assert.deepEqual(result.matched, [
    {
      member_id: 'uuid-1',
      target_status: 'Diberhentikan',
      reason: 'Tidak aktif 3x rapat berturut-turut',
      matched_from: 'Budi',
    },
    {
      member_id: 'uuid-2',
      target_status: 'Alumni',
      reason: '',
      matched_from: 'Siti - alumni',
    },
  ]);

  assert.equal(result.unmatched.length, 3);
  assert.equal(result.unmatched[0].raw_name, 'Rina Wijaya');
  assert.equal(result.unmatched[1].raw_name, 'Anonim');
  assert.equal(result.unmatched[2].raw_name, 'Doni Pratama');
});

test('fallbackParseMemberStatusList handles both inline and grouped Diberhentikan/Alumni lists, parenthetical hints, apostrophes, and unregistered names', () => {
  const candidates = [
    { id: 'c1', name: 'Intan Nur Aini', nim: '1', division: 'Pendidikan', study_program: 'Pendidikan Sejarah', status: 'Aktif' },
    { id: 'c2', name: 'Intan Nur Aini', nim: '2', division: 'Sosial', study_program: 'Ilmu Hukum', status: 'Aktif' },
    { id: 'c3', name: 'Eka Tya Sri Rahayu', nim: '3', division: 'Pendidikan', status: 'Aktif' },
    { id: 'c4', name: "Al Ma'arif", nim: '4', division: 'Sosial', status: 'Aktif' },
    { id: 'c5', name: 'Ahmad Ali Munazat', nim: '5', division: 'Pendidikan', status: 'Aktif' },
    { id: 'c6', name: 'Muhammad Azzam', nim: '6', division: 'Kewirausahaan', status: 'Aktif' },
  ];

  // Format 1: Inline
  const inlineInput = [
    '1. Intan Nur Aini (Sejarah) - diberhentikan',
    '2. EKA TYA SRI RAHAYU - diberhentikan',
    '3. Al Maarif - diberhentikan',
    '13. Ahmad Ali Munazat - alumni',
    '19. Azzam - alumni',
    '20. Nama Tidak Terdaftar - diberhentikan',
  ].join('\n');

  const inlineParsed = fallbackParseMemberStatusList(inlineInput, candidates);
  assert.equal(inlineParsed.matched.length, 5);
  assert.deepEqual(
    inlineParsed.matched.map((m) => [m.member_id, m.target_status]),
    [
      ['c1', 'Diberhentikan'],
      ['c3', 'Diberhentikan'],
      ['c4', 'Diberhentikan'],
      ['c5', 'Alumni'],
      ['c6', 'Alumni'],
    ]
  );
  assert.equal(inlineParsed.unmatched.length, 1);
  assert.match(inlineParsed.unmatched[0].note, /Data tidak ditemukan/i);

  // Format 2: Grouped sections
  const groupedInput = [
    'Diberhentikan:',
    '1. Intan Nur Aini (Sejarah)',
    '3. EKA TYA SRI RAHAYU',
    "4. Al Ma'arif",
    '',
    'Alumni:',
    '1. Ahmad Ali Munazat',
    '2. Azzam',
    '3. Orang Asing',
  ].join('\n');

  const groupedParsed = fallbackParseMemberStatusList(groupedInput, candidates);
  assert.equal(groupedParsed.matched.length, 5);
  assert.deepEqual(
    groupedParsed.matched.map((m) => [m.member_id, m.target_status]),
    [
      ['c1', 'Diberhentikan'],
      ['c3', 'Diberhentikan'],
      ['c4', 'Diberhentikan'],
      ['c5', 'Alumni'],
      ['c6', 'Alumni'],
    ]
  );
  assert.equal(groupedParsed.unmatched.length, 1);
  assert.equal(groupedParsed.unmatched[0].raw_name, 'Orang Asing');
  assert.equal(groupedParsed.unmatched[0].target_status, 'Alumni');
});

test('normalizeBulkDismissItems deduplicates, preserves targetStatus and sanitizes whitespace', () => {
  const normalized = normalizeBulkDismissItems([
    { memberId: ' uuid-1 ', reason: '   Alpa   terus ', targetStatus: 'Diberhentikan' },
    { memberId: 'uuid-1', reason: 'ignored duplicate', targetStatus: 'Alumni' },
    { memberId: '', reason: 'empty id' },
    { memberId: 'uuid-2', reason: '', targetStatus: 'Alumni' },
  ]);

  assert.deepEqual(normalized, [
    { memberId: 'uuid-1', reason: 'Alpa terus', targetStatus: 'Diberhentikan' },
    { memberId: 'uuid-2', reason: '', targetStatus: 'Alumni' },
  ]);
});
