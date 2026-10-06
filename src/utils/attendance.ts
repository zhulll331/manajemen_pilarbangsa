export const ATTENDANCE_STATUSES = ["Hadir", "Izin", "Sakit", "Alpa"] as const;

export interface AttendanceMetric {
  present: number;
  recorded: number;
  percentage: number | null;
  state: "ready" | "empty" | "unavailable";
}

// A missing count is an unavailable result, not zero attendance.
export function attendanceMetric(present: number | null, recorded: number | null): AttendanceMetric {
  if (present === null || recorded === null || !Number.isFinite(present) || !Number.isFinite(recorded)
    || present < 0 || recorded < 0 || present > recorded) {
    return { present: 0, recorded: 0, percentage: null, state: "unavailable" };
  }
  if (recorded === 0) return { present: 0, recorded: 0, percentage: null, state: "empty" };
  return { present, recorded, percentage: Math.round(present / recorded * 1000) / 10, state: "ready" };
}

export function summarizeAttendanceSelection(memberIds: string[], statuses: Record<string, string>) {
  const values = memberIds.map(id => statuses[id]).filter(status => (ATTENDANCE_STATUSES as readonly string[]).includes(status));
  return { ...attendanceMetric(values.filter(status => status === "Hadir").length, values.length), unrecorded: memberIds.length - values.length };
}
