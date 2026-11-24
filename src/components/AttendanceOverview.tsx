import { createClient } from "@/utils/supabase/server";
import { attendanceMetric, ATTENDANCE_STATUSES } from "@/utils/attendance";
import { isSchemaMissingError } from "@/lib/periods/utils";
import { AttendanceCards } from "./AttendanceCards";

export async function AttendanceOverview({
  canManage = false,
  periodId,
}: {
  canManage?: boolean;
  periodId?: string | null;
}) {
  const supabase = await createClient();
  const today = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Jakarta",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());

  async function getMetric(memberStatus: string) {
    try {
      const buildQuery = (withPeriod: boolean) => {
        let q = supabase
          .from("attendance")
          .select("id, members!inner(status), agendas!inner(date)", {
            count: "exact",
            head: true,
          })
          .eq("members.status", memberStatus)
          .lte("agendas.date", today);

        if (withPeriod && periodId) {
          q = q.eq("period_id", periodId);
        }
        return q;
      };

      const runPair = (withPeriod: boolean) =>
        Promise.all([
          buildQuery(withPeriod).eq("status", "Hadir"),
          buildQuery(withPeriod).in("status", [...ATTENDANCE_STATUSES]),
        ]);

      let [present, recorded] = await runPair(Boolean(periodId));

      if (
        periodId &&
        (isSchemaMissingError(present.error) || isSchemaMissingError(recorded.error))
      ) {
        [present, recorded] = await runPair(false);
      }

      return attendanceMetric(
        present.error ? null : present.count,
        recorded.error ? null : recorded.count
      );
    } catch {
      return attendanceMetric(null, null);
    }
  }

  const [members, officers] = await Promise.all([
    getMetric("Aktif"),
    getMetric("Pengurus Aktif"),
  ]);
  return (
    <AttendanceCards
      members={members}
      officers={officers}
      canManage={canManage}
    />
  );
}
