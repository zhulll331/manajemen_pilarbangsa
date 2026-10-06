import test from 'node:test';
import assert from 'node:assert/strict';
import { attendanceMetric, summarizeAttendanceSelection } from '../src/utils/attendance.ts';

test('attendance includes recorded absences in the denominator', () => {
  assert.equal(attendanceMetric(3, 4).percentage, 75);
  assert.equal(attendanceMetric(1, 3).percentage, 33.3);
});
test('no records is distinct from a recorded zero-percent attendance', () => {
  assert.equal(attendanceMetric(0, 0).state, 'empty');
  assert.equal(attendanceMetric(0, 0).percentage, null);
  assert.equal(attendanceMetric(0, 4).state, 'ready');
  assert.equal(attendanceMetric(0, 4).percentage, 0);
});
test('failed or inconsistent counts never display a fabricated percentage', () => {
  for (const counts of [[null, 10], [1, null], [5, 4], [-1, 3], [NaN, 5], [1, Infinity]]) {
    assert.equal(attendanceMetric(...counts).state, 'unavailable');
    assert.equal(attendanceMetric(...counts).percentage, null);
  }
});
test('selection uses only filtered members and explicitly recorded statuses', () => {
  const result = summarizeAttendanceSelection(['a', 'b', 'c', 'd', 'e', 'f'], {
    a: 'Hadir', b: 'Izin', c: 'Sakit', d: 'Alpa', e: '', f: 'Unknown', outsideFilter: 'Hadir',
  });
  assert.equal(result.percentage, 25);
  assert.equal(result.recorded, 4);
  assert.equal(result.unrecorded, 2);
});
test('empty member filters have no percentage and do not produce NaN', () => {
  assert.deepEqual(summarizeAttendanceSelection([], { a: 'Hadir' }), {
    present: 0, recorded: 0, percentage: null, state: 'empty', unrecorded: 0,
  });
});
