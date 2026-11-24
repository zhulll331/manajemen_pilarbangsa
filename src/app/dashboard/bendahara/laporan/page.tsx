import { getSelectedPeriodForDashboard } from "@/lib/periods/server";
import { createClient } from "@/utils/supabase/server";
import LaporanClient from "./LaporanClient";
import { aggregateFinancialData } from "@/utils/finance";

export default async function LaporanPage() {
  const supabase = await createClient();
  const { selectedPeriod, schemaReady } = await getSelectedPeriodForDashboard();

  let qTx = supabase
    .from("finance_transactions")
    .select("*, programs(title)");
  let qDues = supabase
    .from("dues")
    .select("amount, status, payment_date")
    .eq("status", "Lunas");

  if (schemaReady) {
    qTx = qTx.eq("period_id", selectedPeriod.id);
    qDues = qDues.eq("period_id", selectedPeriod.id);
  }

  const [{ data: transactions }, { data: dues }] = await Promise.all([qTx, qDues]);

  const { totalPemasukan, totalPengeluaran, saldoKas, monthlyData } = aggregateFinancialData(transactions || [], dues || []);

  return (
    <div>
      <div className="mb-6 print:hidden">
        <h1 className="text-2xl font-bold text-gray-800">Laporan Keuangan</h1>
        <p className="text-gray-600 mt-1">
          Ringkasan transaksi dan arus kas organisasi (Periode {selectedPeriod.code}).
        </p>
      </div>

      {/* Print Header only visible on print */}
      <div className="hidden print:block mb-8 text-center border-b pb-4">
        <h1 className="text-2xl font-bold text-gray-800 uppercase">Laporan Keuangan Pilar Bangsa</h1>
        <p className="text-gray-600">Dokumen Rekapitulasi Arus Kas — Periode {selectedPeriod.code}</p>
      </div>

      <LaporanClient 
        transactions={transactions || []}
        dues={dues || []}
        totalPemasukan={totalPemasukan}
        totalPengeluaran={totalPengeluaran}
        saldoKas={saldoKas}
        monthlyData={monthlyData}
      />
    </div>
  );
}
