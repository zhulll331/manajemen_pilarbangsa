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
  
  const currentYear = new Date().getFullYear();
  const financeTrendMap: Record<number, { month: string; Pemasukan: number; Pengeluaran: number }> = {};
  for (let i = 1; i <= 12; i++) {
    financeTrendMap[i] = { month: new Date(currentYear, i - 1, 1).toLocaleString('id-ID', { month: 'short' }), Pemasukan: 0, Pengeluaran: 0 };
  }

  if (transactions) {
    transactions.forEach((t: any) => {
      saldoKas += t.type === "Pemasukan" ? t.amount : -t.amount;
      if (t.transaction_date && t.transaction_date.startsWith(currentYear.toString())) {
        const m = parseInt(t.transaction_date.split('-')[1], 10);
        if (financeTrendMap[m]) {
          if (t.type === "Pemasukan") financeTrendMap[m].Pemasukan += t.amount;
          else financeTrendMap[m].Pengeluaran += t.amount;
        }
      }
    });
  }
  const financeTrend = Object.values(financeTrendMap);

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

  // Surat counts
  const { count: suratMasuk } = await supabase.from("letters").select("*", { count: "exact", head: true }).eq("letter_type", "Masuk");
  const { count: suratKeluar } = await supabase.from("letters").select("*", { count: "exact", head: true }).eq("letter_type", "Keluar");

  // Evaluations
  const { data: evaluations } = await supabase.from("evaluations").select("title, strengths, recommendations").order("created_at", { ascending: false }).limit(3);

  // Attendance Trend (Top 5 Recent Agendas)
  const { data: recentAgendasForChart } = await supabase.from("agendas").select("id, title, date").order("date", { ascending: false }).limit(5);
  const attendanceTrend: any[] = [];
  if (recentAgendasForChart) {
    // Reverse to show chronological
    const agendasReversed = [...recentAgendasForChart].reverse();
    for (const agenda of agendasReversed) {
      const { count: hadirCount } = await supabase.from("attendance").select("*", { count: "exact", head: true }).eq("agenda_id", agenda.id).eq("status", "Hadir");
      attendanceTrend.push({
        title: agenda.title.length > 15 ? agenda.title.substring(0, 15) + '...' : agenda.title,
        Hadir: hadirCount || 0
      });
    }
  }

  return (
    <DashboardKetuaClient
      totalAnggota={totalAnggota || 0}
      programBerjalan={programBerjalan || 0}
      agendaBulanIni={agendaBulanIni || 0}
      saldoKas={saldoKas}
      programData={programData}
      activities={activities.slice(0, 5)}
      suratMasuk={suratMasuk || 0}
      suratKeluar={suratKeluar || 0}
      evaluations={evaluations || []}
      financeTrend={financeTrend}
      attendanceTrend={attendanceTrend}
    />
  );
}
