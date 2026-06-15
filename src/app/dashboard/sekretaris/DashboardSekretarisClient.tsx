"use client";

import Link from "next/link";
import { Users, Mail, MailOpen, ClipboardList, FileText, FolderOpen, CalendarCheck } from "lucide-react";
import { SummaryCard } from "@/components/SummaryCard";

interface Member {
  name: string;
  division: string;
  status: string;
  created_at: string;
}

interface Letter {
  letter_number: string;
  letter_type: string;
  date: string;
  subject: string;
  status: string;
}

interface Minute {
  title: string;
  meeting_date: string;
  participants: string;
}

interface Archive {
  title: string;
  category: string;
  uploaded_by: string;
  created_at: string;
}

interface DashboardSekretarisClientProps {
  totalAnggota: number;
  suratMasuk: number;
  suratKeluar: number;
  totalNotulensi: number;
  recentMembers: Member[];
  recentLetters: Letter[];
  recentMinutes: Minute[];
  recentArchives: Archive[];
}

export default function DashboardSekretarisClient({
  totalAnggota,
  suratMasuk,
  suratKeluar,
  totalNotulensi,
  recentMembers,
  recentLetters,
  recentMinutes,
  recentArchives,
}: DashboardSekretarisClientProps) {
  return (
    <div className="space-y-8">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <SummaryCard title="Total Anggota" value={totalAnggota} icon={<Users size={24} />} color="primary" />
        <SummaryCard title="Surat Masuk" value={suratMasuk} icon={<Mail size={24} />} color="yellow" />
        <SummaryCard title="Surat Keluar" value={suratKeluar} icon={<MailOpen size={24} />} color="green" />
        <SummaryCard title="Notulensi Rapat" value={totalNotulensi} icon={<ClipboardList size={24} />} color="primary" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Tabel Anggota Terbaru */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-bold text-gray-800">Anggota Terbaru</h3>
            <Link href="/dashboard/sekretaris/anggota" className="text-sm text-[var(--color-primary)] hover:underline font-medium">Lihat Semua</Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-600">
              <thead className="bg-gray-50 text-gray-700">
                <tr>
                  <th className="py-3 px-4 rounded-tl-lg rounded-bl-lg font-medium">Nama</th>
                  <th className="py-3 px-4 font-medium">Divisi</th>
                  <th className="py-3 px-4 rounded-tr-lg rounded-br-lg font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {recentMembers.map((member, i) => (
                  <tr key={i} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/50 transition-colors">
                    <td className="py-3 px-4 font-medium text-gray-900">{member.name}</td>
                    <td className="py-3 px-4">{member.division}</td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        member.status === "Aktif" ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"
                      }`}>
                        {member.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Tabel Surat */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-bold text-gray-800">Surat Terbaru</h3>
            <Link href="/dashboard/sekretaris/surat" className="text-sm text-[var(--color-primary)] hover:underline font-medium">Lihat Semua</Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-600">
              <thead className="bg-gray-50 text-gray-700">
                <tr>
                  <th className="py-3 px-4 rounded-tl-lg rounded-bl-lg font-medium">No. Surat</th>
                  <th className="py-3 px-4 font-medium">Perihal</th>
                  <th className="py-3 px-4 font-medium">Tipe</th>
                  <th className="py-3 px-4 rounded-tr-lg rounded-br-lg font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {recentLetters.map((letter, i) => (
                  <tr key={i} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/50 transition-colors">
                    <td className="py-3 px-4 font-medium text-gray-900 text-xs">{letter.letter_number}</td>
                    <td className="py-3 px-4 line-clamp-1">{letter.subject}</td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        letter.letter_type === "Masuk" ? "bg-blue-100 text-blue-700" : "bg-purple-100 text-purple-700"
                      }`}>
                        {letter.letter_type}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-xs">{letter.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Notulensi + Arsip */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Notulensi */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-bold text-gray-800">Notulensi Terbaru</h3>
            <Link href="/dashboard/sekretaris/notulensi" className="text-sm text-[var(--color-primary)] hover:underline font-medium">Lihat Semua</Link>
          </div>
          <div className="space-y-4">
            {recentMinutes.length === 0 && <p className="text-sm text-gray-400">Belum ada notulensi.</p>}
            {recentMinutes.map((m, i) => (
              <div key={i} className="p-4 border border-gray-100 rounded-xl hover:bg-gray-50 transition-colors cursor-pointer">
                <div className="flex items-center gap-2 mb-1">
                  <ClipboardList size={16} className="text-[var(--color-primary)]" />
                  <p className="text-sm font-semibold text-gray-800">{m.title}</p>
                </div>
                <p className="text-xs text-gray-500">{m.meeting_date} • {m.participants}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Arsip */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-bold text-gray-800">Arsip & Dokumen Terakhir</h3>
            <Link href="/dashboard/sekretaris/arsip" className="text-sm text-[var(--color-primary)] hover:underline font-medium">Lihat Semua</Link>
          </div>
          <div className="space-y-4">
            {recentArchives.length === 0 && <p className="text-sm text-gray-400">Belum ada arsip.</p>}
            {recentArchives.map((arc, i) => (
              <div key={i} className="flex items-center p-4 border border-gray-100 rounded-xl hover:border-gray-200 hover:bg-gray-50 transition-colors cursor-pointer">
                <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center text-blue-500 shrink-0">
                  <FolderOpen size={20} />
                </div>
                <div className="ml-4 flex-1">
                  <p className="text-sm font-semibold text-gray-800">{arc.title}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    <span className="bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded text-[10px] font-medium mr-2">{arc.category}</span>
                    oleh {arc.uploaded_by}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
