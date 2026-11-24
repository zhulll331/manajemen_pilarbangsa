import test from 'node:test';
import assert from 'node:assert/strict';

import {
  buildVirtualFallbackPeriod,
  canAccessDashboardPath,
  canManagePeriodsRole,
  formatPeriodErrorMessage,
  generateMonthsForPeriod,
  getDefaultDashboardPath,
  inferDefaultPeriodInfo,
  isPeriodLockedError,
  isSchemaMissingError,
  resolveEffectiveRole,
  suggestNextPeriod,
  validateNewPeriodInput,
} from '../src/lib/periods/utils.ts';

test('suggestNextPeriod increments active period cleanly', () => {
  const next = suggestNextPeriod({
    start_year: 2026,
    end_year: 2027,
    code: '2026/2027',
  });

  assert.equal(next.code, '2027/2028');
  assert.equal(next.name, 'Periode 2027/2028');
  assert.equal(next.startYear, 2027);
  assert.equal(next.endYear, 2028);
  assert.equal(next.startDate, '2027-07-01');
  assert.equal(next.endDate, '2028-06-30');
});

test('inferDefaultPeriodInfo uses July-to-June academic period boundary', () => {
  const june = inferDefaultPeriodInfo(new Date('2026-06-15T00:00:00Z'));
  assert.equal(june.code, '2025/2026');

  const july = inferDefaultPeriodInfo(new Date('2026-07-01T00:00:00Z'));
  assert.equal(july.code, '2026/2027');
});

test('validateNewPeriodInput validates format, chronology, and uniqueness', () => {
  const existing = [{ code: '2026/2027' }];

  assert.match(
    validateNewPeriodInput(
      {
        newCode: '2027-2028',
        newName: 'Periode 2027/2028',
        startYear: 2027,
        endYear: 2028,
        startDate: '2027-07-01',
        endDate: '2028-06-30',
      },
      existing
    ) || '',
    /YYYY\/YYYY/
  );

  assert.match(
    validateNewPeriodInput(
      {
        newCode: '2026/2027',
        newName: 'Periode 2026/2027',
        startYear: 2026,
        endYear: 2027,
        startDate: '2026-07-01',
        endDate: '2027-06-30',
      },
      existing
    ) || '',
    /sudah ada/
  );

  assert.equal(
    validateNewPeriodInput(
      {
        newCode: '2027/2028',
        newName: 'Periode 2027/2028',
        startYear: 2027,
        endYear: 2028,
        startDate: '2027-07-01',
        endDate: '2028-06-30',
      },
      existing
    ),
    null
  );
});

test('generateMonthsForPeriod produces 12 months Jul to Jun', () => {
  const months = generateMonthsForPeriod(2026, 2027);
  assert.equal(months.length, 12);
  assert.deepEqual(months[0], { month: 7, year: 2026, label: 'Jul 26' });
  assert.deepEqual(months[5], { month: 12, year: 2026, label: 'Des 26' });
  assert.deepEqual(months[6], { month: 1, year: 2027, label: 'Jan 27' });
  assert.deepEqual(months[11], { month: 6, year: 2027, label: 'Jun 27' });
});

test('role authority permits both ketua and sekretaris only', () => {
  assert.equal(canManagePeriodsRole(resolveEffectiveRole('ketua', 'ketua@ukm.id')), true);
  assert.equal(canManagePeriodsRole(resolveEffectiveRole('sekretaris', 'sekretaris@ukm.id')), true);
  assert.equal(canManagePeriodsRole(resolveEffectiveRole('ketua', 'humas@ukm.id')), false);
  assert.equal(canManagePeriodsRole(resolveEffectiveRole('bendahara', 'bendahara@ukm.id')), false);
  assert.equal(canManagePeriodsRole(resolveEffectiveRole('ketua', 'divisi.sosial@ukm.id')), false);
});

test('resolveEffectiveRole handles divisi, wakilketua, riset, and default fallback', () => {
  assert.equal(resolveEffectiveRole('ketua', 'riset@ukm.id'), 'divisi');
  assert.equal(resolveEffectiveRole('ketua', 'wakilketua@ukm.id'), 'divisi');
  assert.equal(resolveEffectiveRole('penalaran', 'user@ukm.id'), 'divisi');
  assert.equal(resolveEffectiveRole('pengabdian', 'user@ukm.id'), 'divisi');
  assert.equal(resolveEffectiveRole(null, 'unknown@ukm.id'), 'ketua');
  assert.equal(resolveEffectiveRole('sekretaris', 'sekretaris@ukm.id'), 'sekretaris');
  assert.equal(resolveEffectiveRole('bendahara', 'bendahara@ukm.id'), 'bendahara');
  assert.equal(resolveEffectiveRole('ketua', 'humas@ukm.id'), 'humas');
});

test('canAccessDashboardPath and getDefaultDashboardPath enforce role routes properly', () => {
  assert.equal(getDefaultDashboardPath('ketua'), '/dashboard/ketua');
  assert.equal(getDefaultDashboardPath('sekretaris'), '/dashboard/sekretaris');
  assert.equal(getDefaultDashboardPath('bendahara'), '/dashboard/bendahara');
  assert.equal(getDefaultDashboardPath('humas'), '/dashboard/humas/berita');

  // Period & Discipline management allowed only for ketua & sekretaris
  assert.equal(canAccessDashboardPath('ketua', '/dashboard/periode'), true);
  assert.equal(canAccessDashboardPath('sekretaris', '/dashboard/periode'), true);
  assert.equal(canAccessDashboardPath('bendahara', '/dashboard/periode'), false);
  assert.equal(canAccessDashboardPath('humas', '/dashboard/periode'), false);
  assert.equal(canAccessDashboardPath('ketua', '/dashboard/periode-foo'), false);

  assert.equal(canAccessDashboardPath('ketua', '/dashboard/kedisiplinan'), true);
  assert.equal(canAccessDashboardPath('sekretaris', '/dashboard/kedisiplinan'), true);
  assert.equal(canAccessDashboardPath('bendahara', '/dashboard/kedisiplinan'), false);
  assert.equal(canAccessDashboardPath('humas', '/dashboard/kedisiplinan'), false);
  assert.equal(canAccessDashboardPath('ketua', '/dashboard/kedisiplinan-x'), false);

  // Ketua synchronized cross-role read/review paths vs restricted paths
  assert.equal(canAccessDashboardPath('ketua', '/dashboard/sekretaris/anggota'), true);
  assert.equal(canAccessDashboardPath('ketua', '/dashboard/sekretaris/agenda'), true);
  assert.equal(canAccessDashboardPath('ketua', '/dashboard/bendahara/laporan'), true);
  assert.equal(canAccessDashboardPath('ketua', '/dashboard/humas/twibbon'), true);
  assert.equal(canAccessDashboardPath('ketua', '/dashboard/humas/momen'), true);
  assert.equal(canAccessDashboardPath('ketua', '/dashboard/profil'), true);
  assert.equal(canAccessDashboardPath('ketua', '/dashboard/bendahara/transaksi'), false);
  assert.equal(canAccessDashboardPath('ketua', '/dashboard/humas/banner'), false);

  // Sekretaris restrictions
  assert.equal(canAccessDashboardPath('sekretaris', '/dashboard/sekretaris/anggota'), true);
  assert.equal(canAccessDashboardPath('sekretaris', '/dashboard/ketua'), false);
  assert.equal(canAccessDashboardPath('sekretaris', '/dashboard/bendahara'), false);
});

test('error detectors classify schema missing and locked period errors accurately', () => {
  assert.equal(isSchemaMissingError({ code: '42P01', message: 'relation "periods" does not exist' }), true);
  assert.equal(isSchemaMissingError({ code: 'PGRST205', message: 'Could not find the table' }), true);
  assert.equal(isSchemaMissingError({ code: '23505', message: 'duplicate key' }), false);

  assert.equal(isPeriodLockedError(new Error('PERIOD_LOCKED: Periode dikunci')), true);
  assert.equal(isPeriodLockedError({ code: '42501', message: 'Periode sudah dikunci' }), true);
  assert.equal(
    formatPeriodErrorMessage(new Error('PERIOD_LOCKED: Locked'), 'Fallback'),
    'Periode ini sudah dikunci permanen dan tidak dapat diubah lagi.'
  );

  const fallback = buildVirtualFallbackPeriod(new Date('2026-08-01T00:00:00Z'));
  assert.equal(fallback.code, '2026/2027');
  assert.equal(fallback.status, 'active');
});
