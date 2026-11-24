import test from 'node:test';
import assert from 'node:assert/strict';

import {
  buildDismissalAiPrompts,
  extractJsonObjectFromAiText,
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

test('buildDismissalAiPrompts omits already dismissed members from active catalog', () => {
  const { userMessage } = buildDismissalAiPrompts('Budi - SP3', SAMPLE_CANDIDATES);
  assert.ok(userMessage.includes('uuid-1'));
  assert.ok(userMessage.includes('uuid-2'));
  assert.equal(userMessage.includes('uuid-3'), false);
});

test('extractJsonObjectFromAiText strips code fences and parses outermost JSON', () => {
  const raw = 'Berikut hasilnya:\n```json\n{"matched":[{"member_id":"uuid-1","reason":"Alpa 4x"}],"unmatched":[]}\n```';
  const extracted = extractJsonObjectFromAiText(raw);
  const parsed = JSON.parse(extracted);
  assert.equal(parsed.matched.length, 1);
});

test('normalizeAiDismissalResponse preserves per-member reasons, deduplicates IDs, and flags already dismissed/hallucinated IDs', () => {
  const rawResponse = JSON.stringify({
    matched: [
      { member_id: 'uuid-1', reason: '  Tidak aktif 3x rapat   berturut-turut ', matched_from: 'Budi' },
      { member_id: 'uuid-1', reason: 'Duplikat', matched_from: 'Budi S.' },
      { member_id: 'uuid-2', reason: 'Mengundurkan diri per surat resmi', matched_from: 'Siti' },
      { member_id: 'uuid-3', reason: 'Sudah berhenti', matched_from: 'Rina' },
      { member_id: 'uuid-fake', reason: 'Test', matched_from: 'Anonim' },
    ],
    unmatched: [
      { raw_name: 'Doni Pratama', reason: 'Pelanggaran etik', note: 'Tidak ditemukan di periode aktif' },
    ],
  });

  const result = normalizeAiDismissalResponse(rawResponse, SAMPLE_CANDIDATES);
  assert.deepEqual(result.matched, [
    {
      member_id: 'uuid-1',
      reason: 'Tidak aktif 3x rapat berturut-turut',
      matched_from: 'Budi',
    },
    {
      member_id: 'uuid-2',
      reason: 'Mengundurkan diri per surat resmi',
      matched_from: 'Siti',
    },
  ]);

  assert.equal(result.unmatched.length, 3);
  assert.equal(result.unmatched[0].raw_name, 'Rina Wijaya');
  assert.equal(result.unmatched[1].raw_name, 'Anonim');
  assert.equal(result.unmatched[2].raw_name, 'Doni Pratama');
});

test('normalizeBulkDismissItems deduplicates and sanitizes whitespace', () => {
  const normalized = normalizeBulkDismissItems([
    { memberId: ' uuid-1 ', reason: '   Alpa   terus ' },
    { memberId: 'uuid-1', reason: 'ignored duplicate' },
    { memberId: '', reason: 'empty id' },
    { memberId: 'uuid-2', reason: 'Pindah domisili' },
  ]);

  assert.deepEqual(normalized, [
    { memberId: 'uuid-1', reason: 'Alpa terus' },
    { memberId: 'uuid-2', reason: 'Pindah domisili' },
  ]);
});
