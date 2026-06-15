import { createClient } from "@/utils/supabase/server";
import DashboardBendaharaClient from "./DashboardBendaharaClient";

const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];

export default async function DashboardBendahara() {
  const supabase = await createClient();

  // Fetch all transactions
  const { data: transactions } = await supabase
    .from("finance_transactions")
    .select("*")
    .order("transaction_date", { ascending: false });

  let totalPemasukan = 0;
  let totalPengeluaran = 0;

  // Monthly aggregation
  const monthlyMap: Record<string, { pemasukan: number; pengeluaran: number }> = {};

  if (transactions) {
    transactions.forEach((t) => {
      if (t.type === "Pemasukan") totalPemasukan += t.amount;
      else totalPengeluaran += t.amount;

      const date = new Date(t.transaction_date);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
      if (!monthlyMap[monthKey]) monthlyMap[monthKey] = { pemasukan: 0, pengeluaran: 0 };
      if (t.type === "Pemasukan") monthlyMap[monthKey].pemasukan += t.amount;
      else monthlyMap[monthKey].pengeluaran += t.amount;
    });
  }

  const saldoKas = totalPemasukan - totalPengeluaran;

  // Sort monthly data chronologically
  const monthlyData = Object.entries(monthlyMap)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, val]) => {
      const monthIdx = parseInt(key.split("-")[1], 10) - 1;
      return {
        month: MONTH_NAMES[monthIdx],
        pemasukan: val.pemasukan,
        pengeluaran: val.pengeluaran,
      };
    });

  // Iuran belum lunas (distinct member count)
  const { data: unpaidDues } = await supabase
    .from("dues")
    .select("member_id")
    .eq("status", "Belum Lunas");
  const uniqueUnpaid = new Set(unpaidDues?.map((d) => d.member_id));
  const iuranBelumLunas = uniqueUnpaid.size;

  // Recent transactions (top 5)
  const recentTransactions = (transactions || []).slice(0, 5).map((t) => ({
    id: t.id,
    description: t.description || "-",
    type: t.type,
    amount: t.amount,
    transaction_date: t.transaction_date,
  }));

  return (
    <DashboardBendaharaClient
      saldoKas={saldoKas}
      totalPemasukan={totalPemasukan}
      totalPengeluaran={totalPengeluaran}
      iuranBelumLunas={iuranBelumLunas}
      monthlyData={monthlyData}
      recentTransactions={recentTransactions}
    />
  );
}
