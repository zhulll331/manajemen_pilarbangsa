import { createClient } from "@/utils/supabase/server";
import DashboardKetuaClient from "./DashboardKetuaClient";

export default async function DashboardKetua() {
  const supabase = await createClient();

  // Fetch counts
  const { count: totalAnggota } = await supabase.from("members").select("*", { count: "exact", head: true }).eq("status", "Aktif");
  const { count: programBerjalan } = await supabase.from("programs").select("*", { count: "exact", head: true }).eq("status", "Berjalan");

  // Agenda bulan ini
  const now = new Date();
  const startOfMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;
  const endOfMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-31`;
  const { count: agendaBulanIni } = await supabase
    .from("agendas")
    .select("*", { count: "exact", head: true })
    .gte("date", startOfMonth)
    .lte("date", endOfMonth);

  // Saldo Kas & Finance Trend
  const { data: transactions } = await supabase.from("finance_transactions").select("type, amount, transaction_date");
  let saldoKas = 0;
  
  if (transactions) {
    transactions.forEach((t: any) => {
      saldoKas += t.type === "Pemasukan" ? t.amount : -t.amount;
    });
  }

  // Program per divisi (for chart)
  const { data: programs } = await supabase.from("programs").select("division, status");
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

  // Recent activities (agendas + letters combined, sorted by date desc)
  const { data: recentAgendas } = await supabase.from("agendas").select("title, date, category").order("date", { ascending: false }).limit(3);
  const { data: recentLetters } = await supabase.from("letters").select("subject, date, letter_type").order("date", { ascending: false }).limit(3);

  const activities: { title: string; date: string; type: string }[] = [];
  if (recentAgendas) recentAgendas.forEach((a) => activities.push({ title: a.title, date: a.date, type: a.category || "Agenda" }));
  if (recentLetters) recentLetters.forEach((l) => activities.push({ title: l.subject, date: l.date, type: `Surat ${l.letter_type}` }));
  activities.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  // Evaluations
  const { data: evaluations } = await supabase.from("evaluations").select("title, strengths, recommendations").order("created_at", { ascending: false }).limit(3);

  return (
    <DashboardKetuaClient
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
