"use client";

import Link from "next/link";
import { Users, ClipboardList, Calendar, Wallet, TrendingUp, FileText, Star } from "lucide-react";
import { SummaryCard } from "@/components/SummaryCard";
import { ChartCard } from "@/components/ChartCard";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Legend } from "recharts";

interface DashboardKetuaClientProps {
  totalAnggota: number;
  programBerjalan: number;
  agendaBulanIni: number;
  saldoKas: number;
  programData: { name: string; progress: number }[];
  activities: { title: string; date: string; type: string }[];
  suratMasuk: number;
  suratKeluar: number;
  evaluations: { title: string; strengths: string; recommendations: string }[];
  financeTrend: { month: string; Pemasukan: number; Pengeluaran: number }[];
  attendanceTrend: { title: string; Hadir: number }[];
}

const COLORS = ["#5B4B9A", "#6C63B7", "#38C172", "#FFC107", "#F87171"];

export default function DashboardKetuaClient({
  totalAnggota,
  programBerjalan,
  agendaBulanIni,
  saldoKas,
  programData,
  activities,
  suratMasuk,
  suratKeluar,
  evaluations,
  financeTrend,
  attendanceTrend,
}: DashboardKetuaClientProps) {
  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(value);

  const suratPieData = [
    { name: "Masuk", value: suratMasuk },
    { name: "Keluar", value: suratKeluar },
  ];

  return (
    <div className="space-y-8">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Link href="/dashboard/sekretaris/anggota" className="block hover:scale-[1.02] transition-transform">
          <SummaryCard title="Total Anggota" value={totalAnggota.toString()} icon={<Users size={24} />} color="primary" />
        </Link>
        <Link href="/dashboard/ketua/program" className="block hover:scale-[1.02] transition-transform">
          <SummaryCard title="Program Berjalan" value={programBerjalan.toString()} icon={<ClipboardList size={24} />} color="green" />
        </Link>
        <Link href="/dashboard/ketua/agenda" className="block hover:scale-[1.02] transition-transform">
          <SummaryCard title="Agenda Bulan Ini" value={agendaBulanIni.toString()} icon={<Calendar size={24} />} color="yellow" />
        </Link>
        <Link href="/dashboard/bendahara/laporan" className="block hover:scale-[1.02] transition-transform">
          <SummaryCard title="Saldo Kas" value={formatCurrency(saldoKas)} icon={<Wallet size={24} />} color="green" />
        </Link>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <ChartCard title="Progress Program Kerja per Divisi">
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={programData} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: "#6B7280" }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: "#6B7280" }} dx={-10} />
                <Tooltip cursor={{ fill: "transparent" }} contentStyle={{ borderRadius: "12px", border: "none", boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)" }} />
                <Bar dataKey="progress" fill="var(--color-primary)" radius={[6, 6, 0, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>

        {/* Surat Overview Pie */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex flex-col">
          <h3 className="text-lg font-bold text-gray-800 mb-4">Ringkasan Surat</h3>
          <div className="flex-1 flex items-center justify-center">
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={suratPieData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={5} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                  {suratPieData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-center gap-6 mt-2 text-sm">
            <span className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-[var(--color-primary)]"></span>Masuk ({suratMasuk})</span>
            <span className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-[var(--color-secondary)]"></span>Keluar ({suratKeluar})</span>
          </div>
          <Link 
            href="/dashboard/sekretaris/surat"
            className="w-full mt-4 py-2 text-sm font-medium text-[var(--color-primary)] hover:bg-purple-50 rounded-xl transition-colors border border-purple-100 text-center block"
          >
            Lihat Semua Surat
          </Link>
        </div>
      </div>

      {/* New Charts Row for Finance and Attendance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCard title="Tren Kas Organisasi (Tahun Ini)">
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={financeTrend} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
              <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: "#6B7280" }} dy={10} />
              <YAxis axisLine={false} tickLine={false} tick={{ fill: "#6B7280" }} dx={-10} tickFormatter={(val) => `Rp${val/1000}k`} />
              <Tooltip cursor={{ fill: "transparent" }} contentStyle={{ borderRadius: "12px", border: "none", boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)" }} formatter={(value: any) => formatCurrency(Number(value))} />
              <Legend wrapperStyle={{ paddingTop: "20px" }} />
              <Line type="monotone" dataKey="Pemasukan" stroke="#38C172" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
              <Line type="monotone" dataKey="Pengeluaran" stroke="#F87171" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Tren Kehadiran (5 Agenda Terakhir)">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={attendanceTrend} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
              <XAxis dataKey="title" axisLine={false} tickLine={false} tick={{ fill: "#6B7280", fontSize: 11 }} dy={10} interval={0} />
              <YAxis axisLine={false} tickLine={false} tick={{ fill: "#6B7280" }} dx={-10} allowDecimals={false} />
              <Tooltip cursor={{ fill: "transparent" }} contentStyle={{ borderRadius: "12px", border: "none", boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)" }} />
              <Bar dataKey="Hadir" fill="#3B82F6" radius={[6, 6, 0, 0]} barSize={40} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Activity + Evaluasi */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Activity List */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h3 className="text-lg font-bold text-gray-800 mb-6">Aktivitas Terbaru</h3>
          <div className="space-y-5">
            {activities.length === 0 && <p className="text-sm text-gray-400">Belum ada aktivitas.</p>}
            {activities.map((item, i) => (
              <div key={i} className="flex gap-4">
                <div className="w-2 h-2 mt-2 rounded-full bg-[var(--color-primary)] shrink-0" />
                <div>
                  <p className="font-semibold text-sm text-gray-800">{item.title}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs font-medium text-[var(--color-primary)] bg-purple-50 px-2 py-0.5 rounded-md">{item.type}</span>
                    <span className="text-xs text-gray-500">{item.date}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Evaluasi */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex flex-col">
          <div className="flex-1">
            <h3 className="text-lg font-bold text-gray-800 mb-6">Evaluasi Kegiatan Terbaru</h3>
            <div className="space-y-5">
              {evaluations.length === 0 && <p className="text-sm text-gray-400">Belum ada evaluasi.</p>}
              {evaluations.map((ev, i) => (
                <div key={i} className="p-4 border border-gray-100 rounded-xl hover:bg-gray-50 transition-colors">
                  <div className="flex items-center gap-2 mb-2">
                    <Star size={16} className="text-[var(--color-accent-yellow)]" />
                    <p className="font-semibold text-sm text-gray-800">{ev.title}</p>
                  </div>
                  <p className="text-xs text-green-600 mb-1"><span className="font-medium">Kelebihan:</span> {ev.strengths}</p>
                  <p className="text-xs text-blue-600"><span className="font-medium">Rekomendasi:</span> {ev.recommendations}</p>
                </div>
              ))}
            </div>
          </div>
          <Link 
            href="/dashboard/ketua/evaluasi"
            className="w-full mt-4 py-2 text-sm font-medium text-[var(--color-primary)] hover:bg-purple-50 rounded-xl transition-colors border border-purple-100 text-center block"
          >
            Lihat Semua Evaluasi
          </Link>
        </div>
      </div>
    </div>
  );
}
