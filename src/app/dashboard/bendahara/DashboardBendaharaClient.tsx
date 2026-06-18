"use client";

import Link from "next/link";
import { Wallet, TrendingUp, TrendingDown, Users } from "lucide-react";
import { SummaryCard } from "@/components/SummaryCard";
import { ChartCard } from "@/components/ChartCard";
import dynamic from "next/dynamic";

const ResponsiveContainer = dynamic(() => import("recharts").then(mod => mod.ResponsiveContainer), { ssr: false });
const LineChart = dynamic(() => import("recharts").then(mod => mod.LineChart), { ssr: false });
const Line = dynamic(() => import("recharts").then(mod => mod.Line), { ssr: false });
const XAxis = dynamic(() => import("recharts").then(mod => mod.XAxis), { ssr: false });
const YAxis = dynamic(() => import("recharts").then(mod => mod.YAxis), { ssr: false });
const CartesianGrid = dynamic(() => import("recharts").then(mod => mod.CartesianGrid), { ssr: false });
const Tooltip = dynamic(() => import("recharts").then(mod => mod.Tooltip), { ssr: false });
const Legend = dynamic(() => import("recharts").then(mod => mod.Legend), { ssr: false });

interface Transaction {
  id: string;
  description: string;
  type: string;
  amount: number;
  transaction_date: string;
}

interface MonthlyData {
  month: string;
  pemasukan: number;
  pengeluaran: number;
}

interface DashboardBendaharaClientProps {
  saldoKas: number;
  totalPemasukan: number;
  totalPengeluaran: number;
  iuranBelumLunas: number;
  monthlyData: MonthlyData[];
  recentTransactions: Transaction[];
}

export default function DashboardBendaharaClient({
  saldoKas,
  totalPemasukan,
  totalPengeluaran,
  iuranBelumLunas,
  monthlyData,
  recentTransactions,
}: DashboardBendaharaClientProps) {
  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(value);

  return (
    <div className="space-y-8">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Link href="/dashboard/bendahara/laporan" className="block hover:scale-[1.02] transition-transform">
          <SummaryCard title="Saldo Kas" value={formatCurrency(saldoKas)} icon={<Wallet size={24} />} color="primary" />
        </Link>
        <Link href="/dashboard/bendahara/transaksi" className="block hover:scale-[1.02] transition-transform">
          <SummaryCard title="Total Pemasukan" value={formatCurrency(totalPemasukan)} icon={<TrendingUp size={24} />} color="green" />
        </Link>
        <Link href="/dashboard/bendahara/transaksi" className="block hover:scale-[1.02] transition-transform">
          <SummaryCard title="Total Pengeluaran" value={formatCurrency(totalPengeluaran)} icon={<TrendingDown size={24} />} color="red" />
        </Link>
        <Link href="/dashboard/bendahara/iuran" className="block hover:scale-[1.02] transition-transform">
          <SummaryCard title="Iuran Belum Lunas" value={`${iuranBelumLunas} Org`} icon={<Users size={24} />} color="yellow" />
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart */}
        <div className="lg:col-span-2">
          <ChartCard title="Grafik Pemasukan & Pengeluaran Bulanan">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={monthlyData} margin={{ top: 20, right: 30, left: 20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: "#6B7280" }} dy={10} />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "#6B7280" }}
                  dx={-10}
                  tickFormatter={(value) => `${(value / 1000000).toFixed(1)}M`}
                />
                <Tooltip
                  cursor={{ stroke: "#E5E7EB", strokeWidth: 2 }}
                  contentStyle={{ borderRadius: "12px", border: "none", boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)" }}
                  formatter={(value: any) => formatCurrency(Number(value))}
                />
                <Legend iconType="circle" wrapperStyle={{ paddingTop: 20 }} />
                <Line type="monotone" dataKey="pemasukan" name="Pemasukan" stroke="var(--color-accent-green)" strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6 }} />
                <Line type="monotone" dataKey="pengeluaran" name="Pengeluaran" stroke="var(--color-accent-red)" strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>

        {/* Recent Transactions */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex flex-col">
          <h3 className="text-lg font-bold text-gray-800 mb-6">Transaksi Terbaru</h3>
          <div className="space-y-4 flex-1">
            {recentTransactions.length === 0 && <p className="text-sm text-gray-400">Belum ada transaksi.</p>}
            {recentTransactions.map((trx, i) => (
              <div key={i} className="flex justify-between items-center p-3 hover:bg-gray-50 rounded-xl transition-colors">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                    trx.type === "Pemasukan" ? "bg-green-100 text-green-600" : "bg-red-100 text-red-600"
                  }`}>
                    {trx.type === "Pemasukan" ? <TrendingUp size={18} /> : <TrendingDown size={18} />}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-800 line-clamp-1">{trx.description}</p>
                    <p className="text-xs text-gray-500">{trx.transaction_date}</p>
                  </div>
                </div>
                <div className={`font-bold text-sm whitespace-nowrap ${trx.type === "Pemasukan" ? "text-green-600" : "text-red-600"}`}>
                  {trx.type === "Pemasukan" ? "+ " : "- "}{formatCurrency(trx.amount)}
                </div>
              </div>
            ))}
          </div>
          <Link 
            href="/dashboard/bendahara/transaksi"
            className="w-full mt-4 py-2 text-sm font-medium text-[var(--color-primary)] hover:bg-blue-50 rounded-xl transition-colors border border-blue-100 text-center block"
          >
            Lihat Semua Transaksi
          </Link>
        </div>
      </div>
    </div>
  );
}
