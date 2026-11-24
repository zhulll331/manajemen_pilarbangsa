import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import {
  getAuthenticatedDashboardContext,
  getSelectedPeriodForDashboard,
} from "@/lib/periods/server";
import {
  canManagePeriodsRole,
  getDefaultDashboardPath,
  isSchemaMissingError,
} from "@/lib/periods/utils";
import type {
  DisciplineAgendaInput,
  DisciplineAttendanceInput,
  DisciplineMemberInput,
} from "@/lib/members/discipline";
import KedisiplinanClient, {
  type DisciplinaryLogRecord,
} from "./KedisiplinanClient";

export const dynamic = "force-dynamic";

export default async function KedisiplinanPage() {
  const { role } = await getAuthenticatedDashboardContext();
  if (!canManagePeriodsRole(role)) {
    redirect(getDefaultDashboardPath(role));
  }

  const supabase = await createClient();
  const { selectedPeriod, isLocked, schemaReady } =
    await getSelectedPeriodForDashboard();

  let qMembers = supabase
    .from("members")
    .select("*")
    .order("name", { ascending: true });
  let qAgendas = supabase
    .from("agendas")
    .select("id, title, date")
    .order("date", { ascending: false });
  let qAttendance = supabase
    .from("attendance")
    .select("agenda_id, member_id, status");
  let qLogs = supabase
    .from("member_disciplinary_logs")
    .select(
      "id, member_id, action, quarter_label, alpa_count, effective_date, source, note, actor_name, actor_role, created_at"
    )
    .order("created_at", { ascending: false })
    .limit(200);

  if (schemaReady) {
    qMembers = qMembers.eq("period_id", selectedPeriod.id);
    qAgendas = qAgendas.eq("period_id", selectedPeriod.id);
    qAttendance = qAttendance.eq("period_id", selectedPeriod.id);
    qLogs = qLogs.eq("period_id", selectedPeriod.id);
  }

  const [membersRes, agendasRes, attendanceRes, logsRes, schemaProbeRes] =
    await Promise.all([
      qMembers,
      qAgendas,
      qAttendance,
      qLogs,
      supabase.from("members").select("warning_level").limit(1),
    ]);

  const disciplineSchemaReady =
    !isSchemaMissingError(logsRes.error) &&
    !isSchemaMissingError(schemaProbeRes.error);

  const aiConfigured = Boolean(
    process.env.GEMINI_API_KEY ||
      process.env.GROQ_API_KEY ||
      process.env.OPENROUTER_API_KEY
  );

  return (
    <KedisiplinanClient
      period={selectedPeriod}
      isLocked={isLocked}
      disciplineSchemaReady={disciplineSchemaReady}
      aiConfigured={aiConfigured}
      members={(membersRes.data || []) as DisciplineMemberInput[]}
      agendas={(agendasRes.data || []) as DisciplineAgendaInput[]}
      attendance={(attendanceRes.data || []) as DisciplineAttendanceInput[]}
      logs={
        logsRes.error
          ? []
          : ((logsRes.data || []) as DisciplinaryLogRecord[])
      }
    />
  );
}
