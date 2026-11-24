import { createClient } from "@/utils/supabase/server";
import DashboardBendaharaClient from "./DashboardBendaharaClient";
import { aggregateFinancialData, calculateUnpaidMembersCount } from "@/utils/finance";
import { getSelectedPeriodForDashboard } from "@/lib/periods/server";

export const dynamic = "force-dynamic";

export default async function DashboardBendahara() {
  const supabase = await createClient();
  const { selectedPeriod, schemaReady } = await getSelectedPeriodForDashboard();
  const pid = schemaReady ? selectedPeriod.id : null;

  let qTx = supabase
    .from("finance_transactions")
    .select("*")
    .order("transaction_date", { ascending: false });
  let qDues = supabase
    .from("dues")
    .select("id, member_id, month, year, amount, status, payment_date");
  let qMembers = supabase
    .from("members")
    .select("id, name, status");

  if (pid) {
    qTx = qTx.eq("period_id", pid);
    qDues = qDues.eq("period_id", pid);
    qMembers = qMembers.eq("period_id", pid);
  }

  const [{ data: transactions }, { data: dues }, { data: members }] = await Promise.all([
    qTx,
    qDues,
    qMembers,
  ]);

  const paidDues = (dues || []).filter((d) => d.status === "Lunas");

  const { totalPemasukan, totalPengeluaran, saldoKas, monthlyData } = aggregateFinancialData(
    transactions || [],
    paidDues
  );

  // Iuran belum lunas (anggota aktif yang memiliki tunggakan pada periode dipilih)
  const iuranBelumLunas = calculateUnpaidMembersCount(
    members || [],
    dues || [],
    selectedPeriod.start_year
  );

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
