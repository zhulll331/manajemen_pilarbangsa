import Link from "next/link";
import { AlertTriangle, ShieldAlert, ArrowRight } from "lucide-react";
import { createClient } from "@/utils/supabase/server";
import type { OrganizationPeriod } from "@/lib/periods/types";
import { isSchemaMissingError } from "@/lib/periods/utils";
import {
  buildPeriodQuarters,
  evaluateAttendanceDiscipline,
  getDefaultQuarterKey,
  type DisciplineAgendaInput,
  type DisciplineAttendanceInput,
  type DisciplineMemberInput,
} from "@/lib/members/discipline";

export async function DisciplineAlertBanner({
  period,
  schemaReady,
}: {
  period: OrganizationPeriod;
  schemaReady: boolean;
}) {
  const supabase = await createClient();

  let qMembers = supabase.from("members").select("*");
  let qAgendas = supabase.from("agendas").select("id, title, date");
  let qAttendance = supabase
    .from("attendance")
    .select("agenda_id, member_id, status");

  if (schemaReady) {
    qMembers = qMembers.eq("period_id", period.id);
    qAgendas = qAgendas.eq("period_id", period.id);
    qAttendance = qAttendance.eq("period_id", period.id);
  }

  const [probeRes, membersRes, agendasRes, attendanceRes] = await Promise.all([
    supabase.from("members").select("warning_level").limit(1),
    qMembers,
    qAgendas,
    qAttendance,
  ]);

  // Tetap aman sebelum SQL Tahap 21 dijalankan di Supabase
  if (isSchemaMissingError(probeRes.error)) {
    return null;
  }

  if (membersRes.error || agendasRes.error || attendanceRes.error) {
    return null;
  }

  const quarters = buildPeriodQuarters(period);
  const currentKey = getDefaultQuarterKey(quarters);
  const currentQuarter =
    quarters.find((q) => q.key === currentKey) || quarters[0];

  const { summary } = evaluateAttendanceDiscipline({
    members: (membersRes.data || []) as DisciplineMemberInput[],
    agendas: (agendasRes.data || []) as DisciplineAgendaInput[],
    attendance: (attendanceRes.data || []) as DisciplineAttendanceInput[],
    rangeStart: currentQuarter.startDate,
    rangeEnd: currentQuarter.endDate,
    includeDismissedSp2: true,
  });

  const hasUrgentSp2 = summary.eligibleSp2 > 0;
  const hasCandidates = summary.eligibleSp1 > 0 || summary.activeSp1 > 0;

  return (
    <div
      className={`rounded-2xl p-4 sm:p-5 border flex flex-col md:flex-row md:items-center justify-between gap-4 ${
        hasUrgentSp2
          ? "bg-red-50 border-red-200"
          : hasCandidates
          ? "bg-amber-50 border-amber-200"
          : "bg-white border-gray-100 shadow-sm"
      }`}
    >
      <div className="flex items-start gap-3">
        <div
          className={`p-2 rounded-xl shrink-0 ${
            hasUrgentSp2
              ? "bg-red-100 text-red-700"
              : hasCandidates
              ? "bg-amber-100 text-amber-700"
              : "bg-blue-50 text-[var(--color-primary)]"
          }`}
        >
          {hasUrgentSp2 ? <AlertTriangle size={20} /> : <ShieldAlert size={20} />}
        </div>
        <div>
          <p className="font-bold text-sm text-gray-900">
            Pemantauan Kedisiplinan Absensi — {currentQuarter.shortLabel}
          </p>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs mt-1 text-gray-700">
            <span>
              <strong className={summary.eligibleSp2 > 0 ? "text-red-700" : ""}>
                {summary.eligibleSp2}
              </strong>{" "}
              Siap SP 2 (Diberhentikan)
            </span>
            <span>
              <strong className={summary.eligibleSp1 > 0 ? "text-amber-800" : ""}>
                {summary.eligibleSp1}
              </strong>{" "}
              Kandidat SP 1 (&gt;3 Alpa)
            </span>
            <span>
              <strong>{summary.activeSp1}</strong> SP 1 Aktif periode{" "}
              {period.code}
            </span>
          </div>
        </div>
      </div>

      <Link
        href="/dashboard/kedisiplinan"
        className={`inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold shrink-0 transition-colors ${
          hasUrgentSp2
            ? "bg-red-600 text-white hover:bg-red-700"
            : hasCandidates
            ? "bg-amber-600 text-white hover:bg-amber-700"
            : "bg-gray-100 text-gray-800 hover:bg-gray-200"
        }`}
      >
        Kelola Rekap &amp; SP
        <ArrowRight size={14} />
      </Link>
    </div>
  );
}
