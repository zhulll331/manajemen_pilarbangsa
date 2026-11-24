import { createClient } from "@/utils/supabase/server";
import DashboardKetuaClient from "./DashboardKetuaClient";
import { aggregateFinancialData } from "@/utils/finance";
import { Suspense } from "react";
import { AttendanceOverview } from "@/components/AttendanceOverview";
import { AttendanceCardsSkeleton } from "@/components/AttendanceCards";
import { DisciplineAlertBanner } from "@/components/DisciplineAlertBanner";
import { getSelectedPeriodForDashboard } from "@/lib/periods/server";

export const dynamic = "force-dynamic";

export default async function DashboardKetua() {
  const supabase = await createClient();
  const { selectedPeriod, schemaReady } = await getSelectedPeriodForDashboard();
  const pid = schemaReady ? selectedPeriod.id : null;

  const todayWib = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Jakarta",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
  const [wibYearStr, wibMonthStr] = todayWib.split("-");
  const lastDayOfMonth = new Date(
    Date.UTC(Number(wibYearStr), Number(wibMonthStr), 0)
  ).getUTCDate();
  const startOfMonth = `${wibYearStr}-${wibMonthStr}-01`;
  const endOfMonth = `${wibYearStr}-${wibMonthStr}-${String(lastDayOfMonth).padStart(2, "0")}`;

  let qAnggota = supabase
    .from("members")
    .select("*", { count: "exact", head: true })
    .or("status.is.null,status.neq.Diberhentikan");
  let qAgendaBulan = supabase.from("agendas").select("*", { count: "exact", head: true }).gte("date", startOfMonth).lte("date", endOfMonth);
  let qTx = supabase.from("finance_transactions").select("type, amount, transaction_date");
  let qDues = supabase.from("dues").select("amount, status, payment_date").eq("status", "Lunas");
  let qPrograms = supabase.from("programs").select("division, status");
  let qRecentAgendas = supabase.from("agendas").select("title, date, category").order("date", { ascending: false }).limit(3);
  let qRecentLetters = supabase.from("letters").select("subject, date, letter_type").order("date", { ascending: false }).limit(3);
  let qEvaluations = supabase.from("evaluations").select("title, strengths, recommendations").order("created_at", { ascending: false }).limit(3);

  if (pid) {
    qAnggota = qAnggota.eq("period_id", pid);
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
    { count: agendaBulanIni },
    { data: transactions },
    { data: dues },
    { data: programs },
    { data: recentAgendas },
    { data: recentLetters },
    { data: evaluations },
  ] = await Promise.all([
    qAnggota,
    qAgendaBulan,
    qTx,
    qDues,
    qPrograms,
    qRecentAgendas,
    qRecentLetters,
    qEvaluations,
  ]);

  const { saldoKas } = aggregateFinancialData(transactions || [], dues || []);

  let programBerjalan = 0;
  const divisionMap: Record<string, number> = {};
  if (programs) {
    programs.forEach((p) => {
      const divName = (p.division || "").trim() || "Umum";
      const statusLower = (p.status || "").toLowerCase();
      if (!divisionMap[divName]) divisionMap[divName] = 0;
      if (statusLower.includes("selesai")) {
        divisionMap[divName] += 100;
      } else if (statusLower.includes("jalan")) {
        programBerjalan += 1;
        divisionMap[divName] += 50;
      } else {
        divisionMap[divName] += 10;
      }
    });
  }
  const programData = Object.entries(divisionMap).map(([name, progress]) => ({ name, progress }));

  const activities: { title: string; date: string; type: string }[] = [];
  if (recentAgendas) recentAgendas.forEach((a) => activities.push({ title: a.title, date: a.date, type: a.category || "Agenda" }));
  if (recentLetters) recentLetters.forEach((l) => activities.push({ title: l.subject, date: l.date, type: `Surat ${l.letter_type}` }));
  activities.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <DashboardKetuaClient
      disciplineAlert={
        <Suspense fallback={null}>
          <DisciplineAlertBanner period={selectedPeriod} schemaReady={schemaReady} />
        </Suspense>
      }
      attendanceOverview={<Suspense fallback={<AttendanceCardsSkeleton />}><AttendanceOverview periodId={pid} /></Suspense>}
      totalAnggota={totalAnggota || 0}
      programBerjalan={programBerjalan}
      agendaBulanIni={agendaBulanIni || 0}
      saldoKas={saldoKas}
      programData={programData}
      activities={activities.slice(0, 5)}
      evaluations={evaluations || []}
    />
  );
}
