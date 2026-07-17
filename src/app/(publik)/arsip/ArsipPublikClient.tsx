"use client";

import { useState, useMemo } from "react";
import { ExternalLink, FolderOpen, Calendar, Archive as ArchiveIcon, Search } from "lucide-react";
import { ScrollReveal } from "@/components/ScrollReveal";

type Archive = {
  id: string;
  title: string;
  period: string;
  category: string;
  drive_url: string;
  programs?: { title: string } | null;
};

const PERIODS = ["Semua", "2022/2023", "2023/2024", "2024/2025", "2025/2026", "2026/2027"];
const CATEGORIES = ["Semua", "Humas & Kerjasama", "Penalaran & Program Kompetisi", "Riset & Penelitian", "Pengabdian & Advokasi"];

export function ArsipPublikClient({ archives }: { archives: Archive[] }) {
  const [selectedPeriod, setSelectedPeriod] = useState("Semua");
  const [selectedCategory, setSelectedCategory] = useState("Semua");

  const filtered = useMemo(() => {
    return archives.filter((a) => {
      const matchPeriod = selectedPeriod === "Semua" || a.period === selectedPeriod;
      const matchCategory = selectedCategory === "Semua" || a.category === selectedCategory;
      return matchPeriod && matchCategory;
    });
  }, [archives, selectedPeriod, selectedCategory]);

  return (
    <div className="py-12 md:py-16">
      <ScrollReveal>
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center justify-center p-3 bg-red-50 text-red-600 rounded-full mb-4">
            <ArchiveIcon size={24} />
          </div>
          <h1 className="text-3xl md:text-5xl font-extrabold text-gray-900 mb-6 tracking-tight">
            Arsip & <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-600 to-red-400">Dokumen UKM</span>
          </h1>
          <p className="text-lg text-gray-600 leading-relaxed">
            Kumpulan arsip kegiatan, laporan, dan dokumen Unit Kegiatan Mahasiswa Pilar Bangsa dari berbagai periode kepengurusan.
          </p>
        </div>
      </ScrollReveal>

      {/* Filter Section — instant, no reload */}
      <ScrollReveal delay={0.1}>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 mb-10 max-w-4xl mx-auto">
          <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
            <Search className="w-5 h-5 text-gray-400" /> Filter Arsip
          </h2>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="w-full md:w-1/2">
              <label className="block text-sm font-medium text-gray-700 mb-2">Periode Kepengurusan</label>
              <select
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(e.target.value)}
                className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 outline-none transition-all"
              >
                {PERIODS.map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <div className="w-full md:w-1/2">
              <label className="block text-sm font-medium text-gray-700 mb-2">Kategori Divisi</label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 outline-none transition-all"
              >
                {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>
          {(selectedPeriod !== "Semua" || selectedCategory !== "Semua") && (
            <p className="text-sm text-gray-500 mt-3">
              Menampilkan <span className="font-bold text-gray-700">{filtered.length}</span> arsip ditemukan.
            </p>
          )}
        </div>
      </ScrollReveal>

      {/* Archives Grid */}
      <ScrollReveal delay={0.2}>
        <div className="max-w-6xl mx-auto">
          {filtered.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filtered.map((archive) => (
                <div key={archive.id} className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow group flex flex-col h-full">
                  <div className="flex items-start justify-between mb-4">
                    <div className="p-3 bg-blue-50 text-blue-600 rounded-xl group-hover:scale-110 transition-transform">
                      <FolderOpen size={24} />
                    </div>
                    <span className="bg-gray-100 text-gray-600 text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1.5">
                      <Calendar size={12} /> {archive.period}
                    </span>
                  </div>

                  <h3 className="text-xl font-bold text-gray-800 mb-2 line-clamp-2">{archive.title}</h3>
                  <div className="text-sm font-medium text-red-600 mb-4">{archive.category}</div>

                  {archive.programs?.title && (
                    <div className="text-xs text-gray-500 mb-6 bg-gray-50 p-2 rounded-lg border border-gray-100 line-clamp-1">
                      Terkait: {archive.programs.title}
                    </div>
                  )}

                  <div className="mt-auto pt-4 border-t border-gray-100">
                    <a
                      href={archive.drive_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-2 w-full py-2.5 bg-gray-50 hover:bg-red-50 text-gray-700 hover:text-red-600 rounded-xl font-semibold transition-colors text-sm"
                    >
                      Buka Dokumen <ExternalLink size={16} />
                    </a>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-20 bg-gray-50 rounded-3xl border border-dashed border-gray-200">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-white rounded-full shadow-sm mb-4">
                <FolderOpen className="text-gray-400" size={32} />
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">Belum Ada Arsip</h3>
              <p className="text-gray-500 max-w-md mx-auto">
                Belum ada arsip yang dipublikasikan untuk filter yang Anda pilih saat ini.
              </p>
            </div>
          )}
        </div>
      </ScrollReveal>
    </div>
  );
}
