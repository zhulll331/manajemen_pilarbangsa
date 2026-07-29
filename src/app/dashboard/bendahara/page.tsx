import { createClient } from "@/utils/supabase/server";
import DashboardBendaharaClient from "./DashboardBendaharaClient";
import { aggregateFinancialData } from "@/utils/finance";

export default async function DashboardBendahara() {
  const supabase = await createClient();

  // Fetch all transactions
  const { data: transactions } = await supabase
    .from("finance_transactions")
    .select("*")
    .order("transaction_date", { ascending: false });

  // Fetch dues
  const { data: dues } = await supabase.from("dues").select("amount, status, payment_date").eq("status", "Lunas");

  const { totalPemasukan, totalPengeluaran, saldoKas, monthlyData } = aggregateFinancialData(transactions || [], dues || []);

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
