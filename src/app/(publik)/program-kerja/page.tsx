'use client';

import React, { useState, useEffect } from 'react';
import { Search, Filter, RefreshCw } from 'lucide-react';
import { ProgramCard, ProgramWork } from '@/components/ProgramCard';
import { createClient } from '@/utils/supabase/client';
import { PilarLoader } from '@/components/PilarLoader';
import { PageHeader, Section } from '@/components/ui/PublicPrimitives';
import { SplitWordsHeading } from '@/components/motion/SplitWordsHeading';
import { GsapCardGroup } from '@/components/motion/GsapCardGroup';

interface RawProgramRow {
  id: string;
  period_id?: string | null;
  title?: string | null;
  description?: string | null;
  division?: string | null;
  division_name?: string | null;
  status?: string | null;
  start_date?: string | null;
  end_date?: string | null;
  cover_image_url?: string | null;
  link_foto_utama?: string | null;
  gallery_drive_url?: string | null;
  link_folder_drive?: string | null;
}

interface PublicPeriodOption {
  id: string;
  code: string;
  name: string;
  status: string;
}

type ProgramWorkWithPeriod = ProgramWork & { periodId?: string | null };

const divisions = [
  'Semua Divisi',
  'Humas & Kerjasama',
  'Penalaran & Program Kompetisi',
  'Riset & Penelitian',
  'Pengabdian & Advokasi',
];

const statuses = ['Semua Status', 'Belum Mulai', 'Sedang Berjalan', 'Selesai'];

export default function ProgramKerjaPage() {
  const [selectedDivision, setSelectedDivision] = useState('Semua Divisi');
  const [selectedStatus, setSelectedStatus] = useState('Semua Status');
  const [selectedPeriodId, setSelectedPeriodId] = useState<string>('ALL');
  const [periodOptions, setPeriodOptions] = useState<PublicPeriodOption[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [programs, setPrograms] = useState<ProgramWorkWithPeriod[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function fetchDatabasePrograms() {
      setLoading(true);
      const supabase = createClient();
      const [programsRes, periodsRes] = await Promise.all([
        supabase
          .from('programs')
          .select('*')
          .order('created_at', { ascending: false }),
        supabase
          .from('periods')
          .select('id, code, name, status, start_year')
          .order('start_year', { ascending: false }),
      ]);

      if (cancelled) return;

      if (!periodsRes.error && Array.isArray(periodsRes.data) && periodsRes.data.length > 0) {
        const opts = (periodsRes.data as Array<PublicPeriodOption>).map((p) => ({
          id: p.id,
          code: p.code,
          name: p.name,
          status: p.status,
        }));
        setPeriodOptions(opts);
        const active = opts.find((p) => p.status === 'active');
        if (active) {
          setSelectedPeriodId(active.id);
        }
      }

      const { data, error } = programsRes;
      if (!error && Array.isArray(data) && data.length > 0) {
        const livePrograms: ProgramWorkWithPeriod[] = (data as RawProgramRow[]).map((p) => {
          const desc = p.description || '';
          let cover = p.cover_image_url || p.link_foto_utama || '';
          let gallery = p.gallery_drive_url || p.link_folder_drive || '';

          const coverMatch = desc.match(/\[COVER_URL\]:\s*([^\n\r]+)/);
          if (coverMatch && coverMatch[1]) cover = coverMatch[1].trim();

          const galleryMatch = desc.match(/\[GALLERY_URL\]:\s*([^\n\r]+)/);
          if (galleryMatch && galleryMatch[1]) gallery = galleryMatch[1].trim();

          return {
            id: p.id,
            periodId: p.period_id ?? null,
            title: p.title || 'Program Kerja',
            division: p.division || p.division_name || 'Humas & Kerjasama',
            status: p.status || 'Belum Mulai',
            startDate: p.start_date || '',
            endDate: p.end_date || '',
            coverImageUrl: cover,
            driveFolderUrl: gallery,
          };
        });
        setPrograms(livePrograms);
      } else {
        setPrograms([]);
      }
      setLoading(false);
    }

    fetchDatabasePrograms();
    return () => {
      cancelled = true;
    };
  }, []);

  const filteredPrograms = programs.filter((program) => {
    const matchPeriod =
      selectedPeriodId === 'ALL' ||
      !program.periodId ||
      program.periodId === selectedPeriodId;

    const matchDivision =
      selectedDivision === 'Semua Divisi' ||
      (program.division && program.division.toLowerCase().includes(selectedDivision.toLowerCase()));

    let matchStatus = true;
    if (selectedStatus !== 'Semua Status') {
      const pStat = (program.status || '').toLowerCase();
      const sStat = selectedStatus.toLowerCase();
      if (sStat === 'belum mulai') {
        matchStatus = pStat.includes('belum');
      } else if (sStat === 'sedang berjalan') {
        matchStatus = pStat.includes('jalan');
      } else if (sStat === 'selesai') {
        matchStatus = pStat.includes('selesai');
      }
    }

    const matchSearch =
      (program.title || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (program.division || '').toLowerCase().includes(searchQuery.toLowerCase());
    return matchPeriod && matchDivision && matchStatus && matchSearch;
  });

  return (
    <div className="w-full">
      <PageHeader
        breadcrumbs={[
          { label: 'Beranda', href: '/' },
          { label: 'Program Kerja' },
        ]}
        eyebrow="Portal Transparansi Organisasi"
        title="Katalog Lengkap Program Kerja"
        description="Pantau perkembangan aktivitas, jadwal pelaksanaan, serta bukti dokumentasi dari seluruh bidang dan divisi UKM Pilar Bangsa."
      />

      <Section tone="white" ariaLabel="Filter dan daftar program kerja">
        <div className="space-y-8">
          {/* Baris Filter Sederhana (Tanpa Kotak Tebal) */}
          <div className="space-y-4">
            <div className="flex flex-col md:flex-row gap-3 md:items-center justify-between">
              <div className="relative w-full md:w-96">
                <Search
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
                  aria-hidden="true"
                />
                <input
                  type="text"
                  placeholder="Cari nama proker atau divisi..."
                  aria-label="Cari nama program kerja atau divisi"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full min-h-[44px] pl-10 pr-4 py-2 bg-white border border-gray-300 rounded-lg text-sm text-gray-900 font-medium focus:outline-none focus:border-gray-900"
                />
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {periodOptions.length > 0 && (
                  <select
                    value={selectedPeriodId}
                    onChange={(e) => setSelectedPeriodId(e.target.value)}
                    aria-label="Filter periode kepengurusan"
                    className="min-h-[38px] px-3 py-1.5 rounded-lg border border-gray-300 bg-white text-xs sm:text-sm font-semibold text-gray-800 outline-none focus:border-gray-900"
                  >
                    <option value="ALL">Semua Periode</option>
                    {periodOptions.map((p) => (
                      <option key={p.id} value={p.id}>
                        Periode {p.code} {p.status === 'active' ? '(Aktif)' : '(Arsip)'}
                      </option>
                    ))}
                  </select>
                )}
                {statuses.map((status) => (
                  <button
                    key={status}
                    type="button"
                    onClick={() => setSelectedStatus(status)}
                    className={`min-h-[38px] px-3.5 py-1.5 rounded-lg text-xs sm:text-sm font-semibold transition-colors whitespace-nowrap cursor-pointer ${
                      selectedStatus === status
                        ? 'bg-gray-900 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {status}
                  </button>
                ))}
              </div>
            </div>

            {/* Tab Divisi Bergaris Bawah */}
            <div className="flex items-center gap-5 overflow-x-auto border-b border-gray-200">
              {divisions.map((division) => (
                <button
                  key={division}
                  type="button"
                  onClick={() => setSelectedDivision(division)}
                  className={`pb-3 text-xs sm:text-sm font-bold whitespace-nowrap border-b-2 transition-colors cursor-pointer ${
                    selectedDivision === division
                      ? 'border-[#E31837] text-[#E31837]'
                      : 'border-transparent text-gray-500 hover:text-gray-900'
                  }`}
                >
                  {division}
                </button>
              ))}
            </div>
          </div>

          {/* Katalog Program */}
          {loading ? (
            <div className="py-16 text-center text-gray-500 flex flex-col items-center justify-center gap-3">
              <PilarLoader size="md" label="Memuat daftar program kerja" />
              <span className="text-sm font-medium">
                Memuat katalog program kerja &amp; karya tulis...
              </span>
            </div>
          ) : filteredPrograms.length === 0 ? (
            <div className="py-16 border-y border-gray-200 text-center space-y-4">
              <Filter className="w-10 h-10 text-gray-300 mx-auto" aria-hidden="true" />
              <h3 className="text-xl font-bold text-gray-900">
                Tidak Ada Program Kerja Ditemukan
              </h3>
              <p className="text-gray-600 text-sm sm:text-base max-w-md mx-auto">
                Tidak ada program kerja yang cocok dengan filter atau kata kunci pencarian Anda.
              </p>
              <button
                type="button"
                onClick={() => {
                  setSelectedDivision('Semua Divisi');
                  setSelectedStatus('Semua Status');
                  setSearchQuery('');
                }}
                className="inline-flex items-center justify-center gap-2 min-h-[44px] px-5 py-2.5 bg-gray-900 hover:bg-black text-white font-semibold text-sm rounded-lg transition-colors"
              >
                <RefreshCw className="w-4 h-4" aria-hidden="true" />
                <span>Atur Ulang Filter</span>
              </button>
            </div>
          ) : (
            <GsapCardGroup
              triggerKey={`${selectedDivision}-${selectedStatus}-${searchQuery}-${filteredPrograms.length}`}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
            >
              {filteredPrograms.map((program) => (
                <ProgramCard key={program.id} program={program} />
              ))}
            </GsapCardGroup>
          )}
        </div>
      </Section>

      {/* Pita Transparansi Penuh Lebar */}
      <Section tone="dark" ariaLabel="Transparansi informasi publik">
        <div className="max-w-3xl space-y-3">
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#FFD700]">
            Keterbukaan Publik
          </p>
          <SplitWordsHeading
            as="h2"
            text="Transparansi Informasi Publik"
            className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white"
          />
          <p className="text-gray-300 text-base leading-relaxed">
            Sesuai dengan pedoman keterbukaan informasi, Biro Humas &amp; Kerjasama secara rutin memperbarui status pelaksanaan program kerja dari seluruh divisi dan mengunggah dokumentasi pelaksanaannya ke portal ini.
          </p>
        </div>
      </Section>
    </div>
  );
}
