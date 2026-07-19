"use client";

import { useState } from "react";
import { Download, TrendingUp, TrendingDown, Users, Wallet, Eye, EyeOff, FileSpreadsheet } from "lucide-react";
import { SummaryCard } from "@/components/SummaryCard";
import * as XLSX from "xlsx";

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

  // Group pengeluaran by proker for the selected year
  const prokerExpenses: Record<string, number> = {};
  let outOfProkerExpense = 0;

  if (transactions) {
    transactions.forEach((t: any) => {
      if (t.type === "Pengeluaran") {
        const date = new Date(t.transaction_date);
        if (date.getFullYear() === filterYear) {
          if (t.programs?.title) {
            const title = t.programs.title;
            prokerExpenses[title] = (prokerExpenses[title] || 0) + t.amount;
          } else {
            outOfProkerExpense += t.amount;
          }
        }
      }
    });
  }

  const prokerList = Object.keys(prokerExpenses).sort();

  const printReport = () => {
    window.print();
  };

  const handleExportExcelProker = () => {
    const workbook = XLSX.utils.book_new();
    
    if (transactions) {
      const yearTransactions = transactions.filter((t: any) => new Date(t.transaction_date).getFullYear() === filterYear);
      
      const prokers: string[] = Array.from(new Set(yearTransactions.map((t: any) => String(t.programs?.title || "Internal (Non-Proker)"))));
      
      prokers.forEach((proker: string) => {
        const prokerData = yearTransactions.filter((t: any) => (t.programs?.title || "Internal (Non-Proker)") === proker);
        
        const exportData = prokerData.map((d: any, index: number) => ({
          "No": index + 1,
          "Tanggal": d.transaction_date,
          "Tipe": d.type,
          "Kategori": d.category,
          "Keterangan": d.description || "-",
          "Nominal": d.amount,
          "Penanggung Jawab": d.responsible_person,
          "Link Bukti": d.proof_url || "-"
        }));

        const worksheet = XLSX.utils.json_to_sheet(exportData);
        
        const wscols = [
          {wch: 5}, {wch: 15}, {wch: 15}, {wch: 25}, {wch: 35}, {wch: 15}, {wch: 25}, {wch: 40}
        ];
        worksheet['!cols'] = wscols;

        // Nama sheet Excel dibatasi max 31 karakter dan tidak boleh ada karakter khusus tertentu
        let sheetName = proker.substring(0, 31).replace(/[\\/*?:\[\]]/g, '');
        XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
      });
      
      XLSX.writeFile(workbook, `Laporan_Proker_${filterYear}.xlsx`);
    }
  };

  const [saldoVisible, setSaldoVisible] = useState(false);

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
        <div className="flex gap-2 w-full sm:w-auto">
          <button
            onClick={handleExportExcelProker}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors w-full sm:w-auto justify-center"
          >
            <FileSpreadsheet size={20} />
            Ekspor LPJ Proker
          </button>
          <button
            onClick={printReport}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors w-full sm:w-auto justify-center"
          >
            <Download size={20} />
            Cetak
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <SummaryCard 
          title={`Pemasukan (${filterYear})`}
          value={saldoVisible ? `Rp ${yearTotalPemasukan.toLocaleString('id-ID')}` : "Rp ••••••••"}
          icon={<TrendingUp size={24} className="text-green-600" />}
        />
        <SummaryCard 
          title={`Pengeluaran (${filterYear})`}
          value={saldoVisible ? `Rp ${yearTotalPengeluaran.toLocaleString('id-ID')}` : "Rp ••••••••"}
          icon={<TrendingDown size={24} className="text-red-600" />}
        />
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 relative">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-50 rounded-xl text-[var(--color-primary)]"><Wallet size={24} /></div>
              <p className="text-sm font-medium text-gray-500">Saldo Kas Saat Ini</p>
            </div>
            <button
              onClick={() => setSaldoVisible(!saldoVisible)}
              className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors print:hidden"
              title={saldoVisible ? "Sembunyikan" : "Tampilkan"}
            >
              {saldoVisible ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
          <p className="text-2xl font-bold text-gray-800 tracking-tight transition-all duration-300">
            {saldoVisible ? `Rp ${saldoKas.toLocaleString('id-ID')}` : "Rp ••••••••"}
          </p>
        </div>
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
      <div className="bg-white border rounded-xl overflow-hidden shadow-sm mt-6">
        <div className="p-4 border-b bg-gray-50">
          <h3 className="font-semibold text-gray-800">Rincian Pengeluaran per Program Kerja - Tahun {filterYear}</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b bg-gray-50/50">
                <th className="p-4 font-medium text-gray-600">Program Kerja</th>
                <th className="p-4 font-medium text-gray-600 text-right">Total Pengeluaran</th>
              </tr>
            </thead>
            <tbody>
              {prokerList.map((title) => (
                <tr key={title} className="border-b hover:bg-gray-50/50 transition-colors">
                  <td className="p-4 font-medium text-gray-800">{title}</td>
                  <td className="p-4 text-red-600 font-medium text-right">Rp {prokerExpenses[title].toLocaleString('id-ID')}</td>
                </tr>
              ))}
              <tr className="border-b hover:bg-gray-50/50 transition-colors bg-gray-50/30">
                <td className="p-4 font-medium text-gray-600 italic">Kebutuhan Internal (Diluar Proker)</td>
                <td className="p-4 text-red-600 font-medium text-right">Rp {outOfProkerExpense.toLocaleString('id-ID')}</td>
              </tr>
            </tbody>
            <tfoot className="bg-gray-50">
              <tr>
                <td className="p-4 font-bold text-gray-800">Total Pengeluaran</td>
                <td className="p-4 font-bold text-red-600 text-right">Rp {yearTotalPengeluaran.toLocaleString('id-ID')}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
}
