import { createClient } from "@/utils/supabase/server";
import { attendanceMetric, ATTENDANCE_STATUSES } from "@/utils/attendance";
import { AttendanceCards } from "./AttendanceCards";

export async function AttendanceOverview({ canManage = false }: { canManage?: boolean }) {
  const supabase = await createClient();
  const today = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Jakarta", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());

  async function getMetric(memberStatus: string) {
    try {
      // Exact HEAD counts avoid the row limit and do not expose member records to the browser.
      // Reuse the signed-in user's client and existing RLS policies.
      const query = () => supabase.from("attendance")
        .select("id, members!inner(status), agendas!inner(date)", { count: "exact", head: true })
        .eq("members.status", memberStatus).lte("agendas.date", today);
      const [present, recorded] = await Promise.all([
        query().eq("status", "Hadir"),
        query().in("status", [...ATTENDANCE_STATUSES]),
      ]);
      return attendanceMetric(present.error ? null : present.count, recorded.error ? null : recorded.count);
    } catch {
      return attendanceMetric(null, null);
    }
  }
  const [members, officers] = await Promise.all([getMetric("Aktif"), getMetric("Pengurus Aktif")]);
  return <AttendanceCards members={members} officers={officers} canManage={canManage} />;
}
