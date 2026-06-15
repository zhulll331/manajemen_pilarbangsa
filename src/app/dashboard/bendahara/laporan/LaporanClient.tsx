"use client";

import { useState } from "react";
import { Download, TrendingUp, TrendingDown, Users, Wallet } from "lucide-react";
import { SummaryCard } from "@/components/SummaryCard";

const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];

export default function LaporanClient({ 
  transactions, 
  dues, 
  totalPemasukan, 
  totalPengeluaran, 
  saldoKas,
  monthlyData
}: any) {
  const [filterYear, setFilterYear] = useState<number>(new Date().getFullYear());

  // Laporan is mostly read-only overview
  const yearMonthlyData = monthlyData.filter((d: any) => d.year === filterYear);
  const yearTotalPemasukan = yearMonthlyData.reduce((sum: number, d: any) => sum + d.pemasukan, 0);
  const yearTotalPengeluaran = yearMonthlyData.reduce((sum: number, d: any) => sum + d.pengeluaran, 0);

  const printReport = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 print:hidden">
        <select 
          value={filterYear}
          onChange={(e) => setFilterYear(Number(e.target.value))}
          className="p-2 border rounded-lg outline-none bg-white w-full sm:w-auto"
        >
          {[new Date().getFullYear() - 1, new Date().getFullYear(), new Date().getFullYear() + 1].map(y => (
            <option key={y} value={y}>Tahun {y}</option>
          ))}
        </select>
        <button
          onClick={printReport}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors w-full sm:w-auto justify-center"
        >
          <Download size={20} />
          Cetak Laporan
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <SummaryCard 
          title={`Pemasukan (${filterYear})`}
          value={`Rp ${yearTotalPemasukan.toLocaleString('id-ID')}`}
          icon={<TrendingUp size={24} className="text-green-600" />}
        />
        <SummaryCard 
          title={`Pengeluaran (${filterYear})`}
          value={`Rp ${yearTotalPengeluaran.toLocaleString('id-ID')}`}
          icon={<TrendingDown size={24} className="text-red-600" />}
        />
        <SummaryCard 
          title="Saldo Kas Saat Ini"
          value={`Rp ${saldoKas.toLocaleString('id-ID')}`}
          icon={<Wallet size={24} className="text-[var(--color-primary)]" />}
        />
      </div>

      <div className="bg-white border rounded-xl overflow-hidden shadow-sm">
        <div className="p-4 border-b bg-gray-50">
          <h3 className="font-semibold text-gray-800">Rekapitulasi Bulanan - Tahun {filterYear}</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b bg-gray-50/50">
                <th className="p-4 font-medium text-gray-600">Bulan</th>
                <th className="p-4 font-medium text-gray-600">Pemasukan</th>
                <th className="p-4 font-medium text-gray-600">Pengeluaran</th>
                <th className="p-4 font-medium text-gray-600">Surplus / Defisit</th>
              </tr>
            </thead>
            <tbody>
              {MONTH_NAMES.map((month, index) => {
                const data = yearMonthlyData.find((d: any) => d.month === month) || { pemasukan: 0, pengeluaran: 0 };
                const surplus = data.pemasukan - data.pengeluaran;
                
                return (
                  <tr key={month} className="border-b hover:bg-gray-50/50 transition-colors">
                    <td className="p-4 font-medium text-gray-800">{month}</td>
                    <td className="p-4 text-green-600 font-medium">Rp {data.pemasukan.toLocaleString('id-ID')}</td>
                    <td className="p-4 text-red-600 font-medium">Rp {data.pengeluaran.toLocaleString('id-ID')}</td>
                    <td className={`p-4 font-bold ${surplus >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {surplus >= 0 ? '+' : ''}Rp {surplus.toLocaleString('id-ID')}
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot className="bg-gray-50">
              <tr>
                <td className="p-4 font-bold text-gray-800">Total</td>
                <td className="p-4 font-bold text-green-600">Rp {yearTotalPemasukan.toLocaleString('id-ID')}</td>
                <td className="p-4 font-bold text-red-600">Rp {yearTotalPengeluaran.toLocaleString('id-ID')}</td>
                <td className={`p-4 font-bold ${(yearTotalPemasukan - yearTotalPengeluaran) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  Rp {(yearTotalPemasukan - yearTotalPengeluaran).toLocaleString('id-ID')}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
}
