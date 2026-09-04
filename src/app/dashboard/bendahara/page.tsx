import { createClient } from "@/utils/supabase/server";
import DashboardBendaharaClient from "./DashboardBendaharaClient";
import { aggregateFinancialData, calculateUnpaidMembersCount } from "@/utils/finance";

export default async function DashboardBendahara() {
  const supabase = await createClient();

  // Fetch all transactions
  const { data: transactions } = await supabase
    .from("finance_transactions")
    .select("*")
    .order("transaction_date", { ascending: false });

  // Fetch all dues records
  const { data: dues } = await supabase
    .from("dues")
    .select("id, member_id, month, year, amount, status, payment_date");

  // Fetch all members
  const { data: members } = await supabase
    .from("members")
    .select("id, name, status");

  const paidDues = (dues || []).filter((d) => d.status === "Lunas");

  const { totalPemasukan, totalPengeluaran, saldoKas, monthlyData } = aggregateFinancialData(
    transactions || [],
    paidDues
  );

  // Iuran belum lunas (anggota aktif yang memiliki tunggakan pada periode berjalan)
  const iuranBelumLunas = calculateUnpaidMembersCount(members || [], dues || []);

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
