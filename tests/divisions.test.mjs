import test from 'node:test';
import assert from 'node:assert/strict';

import {
  MEMBER_DIVISION_FILTERS,
  matchesDivisionFilter,
} from '../src/lib/members/divisions.ts';

test('MEMBER_DIVISION_FILTERS lists Pengurus Inti and the 4 official divisions in order', () => {
  assert.deepEqual([...MEMBER_DIVISION_FILTERS], [
    'Pengurus Inti',
    'Divisi Humas',
    'Divisi Advokasi',
    'Divisi PKM',
    'Divisi Riset',
  ]);
});

test('Pengurus Inti filter matches Ketua Umum, Sekretaris 1/2, Bendahara 1/2, and BPH without matching division officers', () => {
  for (const role of [
    'Pengurus Inti',
    'BPH',
    'Ketua Umum',
    'Wakil Ketua',
    'Sekretaris 1',
    'Sekretaris 2',
    'Sekretaris I',
    'Sekretaris II',
    'Bendahara 1',
    'Bendahara 2',
    'Bendahara Umum',
  ]) {
    assert.equal(matchesDivisionFilter(role, 'Pengurus Inti'), true, `expected ${role} to match Pengurus Inti`);
  }

  assert.equal(matchesDivisionFilter('Ketua Divisi Humas', 'Pengurus Inti'), false);
  assert.equal(matchesDivisionFilter('Sekretaris Divisi PKM', 'Pengurus Inti'), false);
  assert.equal(matchesDivisionFilter('Penalaran & PKM', 'Pengurus Inti'), false);
  assert.equal(matchesDivisionFilter(null, 'Pengurus Inti'), false);
});

test('Division filters match real database labels including Penalaran & PKM and Riset & Penelitian', () => {
  assert.equal(matchesDivisionFilter('Divisi Humas', 'Divisi Humas'), true);
  assert.equal(matchesDivisionFilter('Humas & Media', 'Divisi Humas'), true);
  assert.equal(matchesDivisionFilter('Ketua Divisi Humas', 'Divisi Humas'), true);

  assert.equal(matchesDivisionFilter('Divisi Advokasi', 'Divisi Advokasi'), true);
  assert.equal(matchesDivisionFilter('Advokasi & Pengabdian', 'Divisi Advokasi'), true);

  assert.equal(matchesDivisionFilter('Divisi PKM', 'Divisi PKM'), true);
  assert.equal(matchesDivisionFilter('Penalaran & PKM', 'Divisi PKM'), true);

  assert.equal(matchesDivisionFilter('Divisi Riset', 'Divisi Riset'), true);
  assert.equal(matchesDivisionFilter('Riset & Penelitian', 'Divisi Riset'), true);

  assert.equal(matchesDivisionFilter('Penalaran & PKM', 'Divisi Riset'), false);
  assert.equal(matchesDivisionFilter('Riset & Penelitian', 'Semua'), true);
});
