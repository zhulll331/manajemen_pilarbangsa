import { summarizeAttendanceSelection } from "@/utils/attendance";

export function AttendanceSelectionSummary({ memberIds, statuses }: { memberIds: string[]; statuses: Record<string, string> }) {
  const summary = summarizeAttendanceSelection(memberIds, statuses);
  return <section className="attendance-selection" aria-label="Kehadiran pada pilihan saat ini">
    <strong>{summary.percentage === null ? "—" : `${summary.percentage.toLocaleString("id-ID")}%`}</strong>
    <div><p>Kehadiran pada agenda terpilih</p><small>{summary.present} hadir · {summary.recorded} terisi · {summary.unrecorded} belum diisi</small></div>
    <div><small>Mengikuti filter dan pilihan status saat ini. Simpan perubahan untuk memperbarui ringkasan dashboard. Status kosong tidak dihitung.</small></div>
  </section>;
}
