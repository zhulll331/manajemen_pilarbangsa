import { createClient } from "@/utils/supabase/server";
import LaporanClient from "./LaporanClient";

const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];

export default async function LaporanPage() {
  const supabase = await createClient();

  // Fetch all transactions
  const { data: transactions } = await supabase
    .from("finance_transactions")
    .select("*");

  // Fetch all dues
  const { data: dues } = await supabase
    .from("dues")
    .select("*");

  let totalPemasukan = 0;
  let totalPengeluaran = 0;

  // Monthly aggregation including dues
  const monthlyMap: Record<string, { pemasukan: number; pengeluaran: number; year: number; month: string }> = {};

  if (transactions) {
    transactions.forEach((t) => {
      if (t.type === "Pemasukan") totalPemasukan += t.amount;
      else totalPengeluaran += t.amount;

      const date = new Date(t.transaction_date);
      const year = date.getFullYear();
      const monthIdx = date.getMonth();
      const monthName = MONTH_NAMES[monthIdx];
      const monthKey = `${year}-${String(monthIdx + 1).padStart(2, "0")}`;
      
      if (!monthlyMap[monthKey]) monthlyMap[monthKey] = { pemasukan: 0, pengeluaran: 0, year, month: monthName };
      
      if (t.type === "Pemasukan") monthlyMap[monthKey].pemasukan += t.amount;
      else monthlyMap[monthKey].pengeluaran += t.amount;
    });
  }

  if (dues) {
    // Iuran is considered Pemasukan if paid (Lunas)
    dues.forEach((d) => {
      if (d.status === "Lunas" && d.payment_date) {
        totalPemasukan += d.amount;
        
        const date = new Date(d.payment_date);
        const year = date.getFullYear();
        const monthIdx = date.getMonth();
        const monthName = MONTH_NAMES[monthIdx];
        const monthKey = `${year}-${String(monthIdx + 1).padStart(2, "0")}`;
        
        if (!monthlyMap[monthKey]) monthlyMap[monthKey] = { pemasukan: 0, pengeluaran: 0, year, month: monthName };
        
        monthlyMap[monthKey].pemasukan += d.amount;
      }
    });
  }

  const saldoKas = totalPemasukan - totalPengeluaran;

  const monthlyData = Object.values(monthlyMap);

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
