import { createClient } from "@/utils/supabase/server";
import LaporanClient from "./LaporanClient";
import { aggregateFinancialData } from "@/utils/finance";

export default async function LaporanPage() {
  const supabase = await createClient();

  // Fetch all transactions
  const { data: transactions } = await supabase
    .from("finance_transactions")
    .select("*, programs(title)");

  // Fetch dues
  const { data: dues } = await supabase.from("dues").select("amount, status, payment_date").eq("status", "Lunas");

  const { totalPemasukan, totalPengeluaran, saldoKas, monthlyData } = aggregateFinancialData(transactions || [], dues || []);

  return (
    <div>
      <div className="mb-6 print:hidden">
        <h1 className="text-2xl font-bold text-gray-800">Laporan Keuangan</h1>
        <p className="text-gray-600 mt-1">Ringkasan transaksi dan arus kas organisasi.</p>
      </div>

      {/* Print Header only visible on print */}
      <div className="hidden print:block mb-8 text-center border-b pb-4">
        <h1 className="text-2xl font-bold text-gray-800 uppercase">Laporan Keuangan Pilar Bangsa</h1>
        <p className="text-gray-600">Dokumen Rekapitulasi Arus Kas</p>
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
