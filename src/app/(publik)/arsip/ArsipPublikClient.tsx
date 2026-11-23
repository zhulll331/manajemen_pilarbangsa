'use client';

import { useState, useMemo } from 'react';
import { ExternalLink, FolderOpen, Calendar } from 'lucide-react';
import { PageHeader, Section } from '@/components/ui/PublicPrimitives';

type Archive = {
  id: string;
  title: string;
  period: string;
  category: string;
  drive_url: string;
  programs?: { title: string } | null;
};

const PERIODS = ['Semua', '2022/2023', '2023/2024', '2024/2025', '2025/2026', '2026/2027'];
const CATEGORIES = [
  'Semua',
  'Humas & Kerjasama',
  'Penalaran & Program Kompetisi',
  'Riset & Penelitian',
  'Pengabdian & Advokasi',
];

export function ArsipPublikClient({ archives }: { archives: Archive[] }) {
  const [selectedPeriod, setSelectedPeriod] = useState('Semua');
  const [selectedCategory, setSelectedCategory] = useState('Semua');

  const filtered = useMemo(() => {
    return archives.filter((a) => {
      const matchPeriod = selectedPeriod === 'Semua' || a.period === selectedPeriod;
      const matchCategory = selectedCategory === 'Semua' || a.category === selectedCategory;
      return matchPeriod && matchCategory;
    });
  }, [archives, selectedPeriod, selectedCategory]);

  return (
    <div className="w-full">
      <PageHeader
        breadcrumbs={[
          { label: 'Beranda', href: '/' },
          { label: 'Arsip UKM' },
        ]}
        eyebrow="Dokumentasi & Laporan"
        title="Arsip & Dokumen UKM"
        description="Kumpulan arsip kegiatan, laporan pertanggungjawaban, dan dokumen resmi Unit Kegiatan Mahasiswa Pilar Bangsa dari berbagai periode kepengurusan."
      />

      <Section tone="white" ariaLabel="Filter dan daftar arsip UKM">
        <div className="space-y-8">
          {/* Bar Filter Datar */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="arsip-period"
                className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-1.5"
              >
                Periode Kepengurusan
              </label>
              <select
                id="arsip-period"
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(e.target.value)}
                className="w-full min-h-[44px] px-3.5 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-900 focus:border-gray-900 outline-none"
              >
                {PERIODS.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="arsip-category"
                className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-1.5"
              >
                Kategori Divisi
              </label>
              <select
                id="arsip-category"
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full min-h-[44px] px-3.5 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-900 focus:border-gray-900 outline-none"
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex items-center justify-between text-xs sm:text-sm text-gray-500">
            <span>
              Menampilkan <strong className="text-gray-900">{filtered.length}</strong> dokumen arsip
            </span>
          </div>

          {/* Daftar Baris Bergaris */}
          {filtered.length > 0 ? (
            <div className="divide-y divide-gray-200 border-y border-gray-200">
              {filtered.map((archive) => (
                <div
                  key={archive.id}
                  className="py-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="space-y-1.5 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 text-xs font-semibold">
                      <span className="text-[#E31837]">{archive.category}</span>
                      <span aria-hidden="true" className="text-gray-300">
                        •
                      </span>
                      <span className="inline-flex items-center gap-1 text-gray-500">
                        <Calendar size={12} aria-hidden="true" />
                        <span>{archive.period}</span>
                      </span>
                    </div>

                    <h2 className="text-lg font-bold text-gray-900 leading-snug">
                      {archive.title}
                    </h2>

                    {archive.programs?.title && (
                      <p className="text-xs sm:text-sm text-gray-500">
                        Program terkait: {archive.programs.title}
                      </p>
                    )}
                  </div>

                  <div className="shrink-0">
                    <a
                      href={archive.drive_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center gap-2 w-full sm:w-auto min-h-[44px] px-4 py-2 bg-white hover:bg-gray-50 text-gray-900 border border-gray-300 rounded-lg font-semibold text-sm transition-colors"
                    >
                      <span>Buka Dokumen</span>
                      <ExternalLink size={15} aria-hidden="true" />
                    </a>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-16 border-y border-gray-200 text-center space-y-3">
              <FolderOpen className="text-gray-300 mx-auto" size={36} aria-hidden="true" />
              <h2 className="text-lg font-bold text-gray-900">Belum Ada Arsip</h2>
              <p className="text-gray-600 text-sm max-w-md mx-auto">
                Belum ada arsip yang dipublikasikan untuk filter periode dan kategori ini.
              </p>
            </div>
          )}
        </div>
      </Section>
    </div>
  );
}
