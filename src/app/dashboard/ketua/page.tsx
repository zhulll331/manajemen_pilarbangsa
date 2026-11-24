import { createClient } from "@/utils/supabase/server";
import DashboardKetuaClient from "./DashboardKetuaClient";
import { aggregateFinancialData } from "@/utils/finance";
import { Suspense } from "react";
import { AttendanceOverview } from "@/components/AttendanceOverview";
import { AttendanceCardsSkeleton } from "@/components/AttendanceCards";
import { getSelectedPeriodForDashboard } from "@/lib/periods/server";

export default async function DashboardKetua() {
  const supabase = await createClient();
  const { selectedPeriod, schemaReady } = await getSelectedPeriodForDashboard();
  const pid = schemaReady ? selectedPeriod.id : null;

  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const startDate = new Date(year, month, 1);
  const endDate = new Date(year, month + 1, 0);
  const startOfMonth = `${startDate.getFullYear()}-${String(startDate.getMonth() + 1).padStart(2, "0")}-01`;
  const endOfMonth = `${endDate.getFullYear()}-${String(endDate.getMonth() + 1).padStart(2, "0")}-${String(endDate.getDate()).padStart(2, "0")}`;

  let qAnggota = supabase.from("members").select("*", { count: "exact", head: true }).eq("status", "Aktif");
  let qProgramBerjalan = supabase.from("programs").select("*", { count: "exact", head: true }).eq("status", "Berjalan");
  let qAgendaBulan = supabase.from("agendas").select("*", { count: "exact", head: true }).gte("date", startOfMonth).lte("date", endOfMonth);
  let qTx = supabase.from("finance_transactions").select("type, amount, transaction_date");
  let qDues = supabase.from("dues").select("amount, status, payment_date").eq("status", "Lunas");
  let qPrograms = supabase.from("programs").select("division, status");
  let qRecentAgendas = supabase.from("agendas").select("title, date, category").order("date", { ascending: false }).limit(3);
  let qRecentLetters = supabase.from("letters").select("subject, date, letter_type").order("date", { ascending: false }).limit(3);
  let qEvaluations = supabase.from("evaluations").select("title, strengths, recommendations").order("created_at", { ascending: false }).limit(3);

  if (pid) {
    qAnggota = qAnggota.eq("period_id", pid);
    qProgramBerjalan = qProgramBerjalan.eq("period_id", pid);
    qAgendaBulan = qAgendaBulan.eq("period_id", pid);
    qTx = qTx.eq("period_id", pid);
    qDues = qDues.eq("period_id", pid);
    qPrograms = qPrograms.eq("period_id", pid);
    qRecentAgendas = qRecentAgendas.eq("period_id", pid);
    qRecentLetters = qRecentLetters.eq("period_id", pid);
    qEvaluations = qEvaluations.eq("period_id", pid);
  }

  const [
    { count: totalAnggota },
    { count: programBerjalan },
    { count: agendaBulanIni },
    { data: transactions },
    { data: dues },
    { data: programs },
    { data: recentAgendas },
    { data: recentLetters },
    { data: evaluations },
  ] = await Promise.all([
    qAnggota,
    qProgramBerjalan,
    qAgendaBulan,
    qTx,
    qDues,
    qPrograms,
    qRecentAgendas,
    qRecentLetters,
    qEvaluations,
  ]);

  const { saldoKas } = aggregateFinancialData(transactions || [], dues || []);

  const divisionMap: Record<string, number> = {};
  if (programs) {
    programs.forEach((p) => {
      if (!divisionMap[p.division]) divisionMap[p.division] = 0;
      if (p.status === "Selesai") divisionMap[p.division] += 100;
      else if (p.status === "Berjalan") divisionMap[p.division] += 50;
      else divisionMap[p.division] += 10;
    });
  }
  const programData = Object.entries(divisionMap).map(([name, progress]) => ({ name, progress }));

  const activities: { title: string; date: string; type: string }[] = [];
  if (recentAgendas) recentAgendas.forEach((a) => activities.push({ title: a.title, date: a.date, type: a.category || "Agenda" }));
  if (recentLetters) recentLetters.forEach((l) => activities.push({ title: l.subject, date: l.date, type: `Surat ${l.letter_type}` }));
  activities.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <DashboardKetuaClient
      attendanceOverview={<Suspense fallback={<AttendanceCardsSkeleton />}><AttendanceOverview periodId={pid} /></Suspense>}
      totalAnggota={totalAnggota || 0}
      programBerjalan={programBerjalan || 0}
      agendaBulanIni={agendaBulanIni || 0}
      saldoKas={saldoKas}
      programData={programData}
      activities={activities.slice(0, 5)}
      evaluations={evaluations || []}
    />
  );
}
