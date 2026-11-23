'use client';

import React, { useState, useEffect } from 'react';
import { Calendar, CalendarPlus, AlertCircle } from 'lucide-react';
import { createClient } from '@/utils/supabase/client';
import { PilarLoader } from '@/components/PilarLoader';

const PERIOD_START_MONTH: number = 7; // 7 = Juli

interface RoadmapEventItem {
  id: string;
  title: string;
  date: string;
  time: string;
  division: string;
  description: string;
  status: string;
}

interface RawProgramRow {
  id: string;
  title?: string | null;
  description?: string | null;
  start_date?: string | null;
  division?: string | null;
  division_name?: string | null;
  status?: string | null;
}

function getActivePeriod(): { startYear: number; endYear: number; label: string } {
  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();
  const startYear = currentMonth >= PERIOD_START_MONTH ? currentYear : currentYear - 1;
  return {
    startYear,
    endYear: startYear + 1,
    label: `${startYear}-${startYear + 1}`,
  };
}

const divisionsList = [
  'Semua',
  'Humas & Kerjasama',
  'Penalaran & Program Kompetisi',
  'Riset & Penelitian',
  'Pengabdian & Advokasi',
];

const monthsList = [
  'Satu Periode Penuh',
  'Juli',
  'Agustus',
  'September',
  'Oktober',
  'November',
  'Desember',
  'Januari',
  'Februari',
  'Maret',
  'April',
  'Mei',
  'Juni',
];

const monthMap: Record<string, string> = {
  Juli: '07',
  Agustus: '08',
  September: '09',
  Oktober: '10',
  November: '11',
  Desember: '12',
  Januari: '01',
  Februari: '02',
  Maret: '03',
  April: '04',
  Mei: '05',
  Juni: '06',
};

function generateGoogleCalendarUrl(event: {
  title: string;
  date: string;
  time: string;
  description: string;
  division: string;
}) {
  const cleanDate = event.date.replace(/-/g, '');
  const cleanTime = event.time.replace(/:/g, '') + '00';
  const startDateTime = `${cleanDate}T${cleanTime}`;

  const [hour, min] = event.time.split(':').map(Number);
  const endHour = String((hour + 2) % 24).padStart(2, '0');
  const endDateTime = `${cleanDate}T${endHour}${min}00`;

  const details = `${event.description}\n\nDivisi Pelaksana: ${event.division}\n\nDipublikasikan secara resmi oleh UKM Pilar Bangsa`;

  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: event.title,
    dates: `${startDateTime}/${endDateTime}`,
    details,
    location: 'Sekretariat UKM Pilar Bangsa & Lokasi Kegiatan',
  });

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

function formatDateIndo(dateStr: string) {
  if (!dateStr || !dateStr.includes('-')) return dateStr;
  const parts = dateStr.split('-');
  const year = parts[0];
  const monthNum = parts[1];
  const day = parts[2];
  const monthsIndo = [
    'Januari',
    'Februari',
    'Maret',
    'April',
    'Mei',
    'Juni',
    'Juli',
    'Agustus',
    'September',
    'Oktober',
    'November',
    'Desember',
  ];
  const monthName = monthsIndo[parseInt(monthNum, 10) - 1] || 'Bulan';
  return `${day} ${monthName} ${year}`;
}

function getStatusMeta(status: string): {
  dotClass: string;
  badgeClass: string;
  label: string;
} {
  const s = (status || '').toLowerCase();
  if (s.includes('selesai')) {
    return {
      dotClass: 'bg-[#E31837]',
      badgeClass: 'bg-red-50 text-[#E31837] border-red-200',
      label: status,
    };
  }
  if (s.includes('jalan')) {
    return {
      dotClass: 'bg-[#008000]',
      badgeClass: 'bg-green-50 text-[#008000] border-green-200',
      label: status,
    };
  }
  return {
    dotClass: 'bg-gray-400',
    badgeClass: 'bg-gray-100 text-gray-700 border-gray-200',
    label: status || 'Belum Dimulai',
  };
}

export function TimelineRoadmap() {
  const [divisionFilter, setDivisionFilter] = useState('Semua');
  const [monthFilter, setMonthFilter] = useState('Satu Periode Penuh');
  const [events, setEvents] = useState<RoadmapEventItem[]>([]);
  const [loading, setLoading] = useState(true);

  const { startYear, endYear, label: periodLabel } = getActivePeriod();

  useEffect(() => {
    let cancelled = false;
    async function fetchLivePrograms() {
      setLoading(true);
      const supabase = createClient();
      const periodStart = `${startYear}-${String(PERIOD_START_MONTH).padStart(2, '0')}-01`;
      const endMonth = PERIOD_START_MONTH === 1 ? 12 : PERIOD_START_MONTH - 1;
      const periodEnd = `${endYear}-${String(endMonth).padStart(2, '0')}-${new Date(
        endYear,
        endMonth,
        0
      ).getDate()}`;

      const { data, error } = await supabase
        .from('programs')
        .select('*')
        .gte('start_date', periodStart)
        .lte('start_date', periodEnd)
        .order('start_date', { ascending: true });

      if (cancelled) return;

      if (!error && Array.isArray(data) && data.length > 0) {
        const liveEvents: RoadmapEventItem[] = (data as RawProgramRow[]).map((p) => {
          const desc = p.description || '';
          const cleanDesc = desc.split('---')[0].replace(/\[COVER_URL\]:[\s\S]*/, '').trim();
          const dateStr = p.start_date || '2026-07-15';

          return {
            id: p.id,
            title: p.title || 'Program Kerja Organisasi',
            date: dateStr,
            time: '09:00',
            division: p.division || p.division_name || 'Humas & Kerjasama',
            description:
              cleanDesc ||
              'Pelaksanaan program kerja unggulan divisi dalam rangka meningkatkan kapasitas kelembagaan UKM Pilar Bangsa.',
            status: p.status || 'Belum Dimulai',
          };
        });
        setEvents(liveEvents);
      } else {
        setEvents([]);
      }
      setLoading(false);
    }

    fetchLivePrograms();
    return () => {
      cancelled = true;
    };
  }, [startYear, endYear]);

  const filteredEvents = events.filter((event) => {
    if (divisionFilter !== 'Semua' && event.division !== divisionFilter) {
      return false;
    }
    if (monthFilter !== 'Satu Periode Penuh') {
      const parts = (event.date || '').split('-');
      const monthNumber = parts[1];
      if (monthNumber !== monthMap[monthFilter]) {
        return false;
      }
    }
    return true;
  });

  return (
    <div className="space-y-8">
      {/* Header Rata Kiri */}
      <div className="max-w-2xl space-y-3">
        <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#E31837]">
          Timeline Kegiatan Organisasi
        </p>
        <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-gray-900 tracking-tight leading-tight">
          Perjalanan Kami: Periode {periodLabel}
        </h2>
        <p className="text-base text-gray-600 leading-relaxed">
          Peta jalan pelaksanaan seluruh program kerja unggulan UKM Pilar Bangsa selama satu periode kepengurusan penuh secara real-time.
        </p>
      </div>

      {/* Filter Bar Sederhana */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-6 border-b border-gray-200">
        <div className="flex flex-wrap items-center gap-2">
          {divisionsList.map((div) => {
            const isSelected = divisionFilter === div;
            return (
              <button
                key={div}
                type="button"
                onClick={() => setDivisionFilter(div)}
                className={`min-h-[38px] px-3.5 py-1.5 rounded-lg text-xs sm:text-sm font-semibold transition-colors cursor-pointer ${isSelected
                    ? 'bg-gray-900 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
              >
                {div}
              </button>
            );
          })}
        </div>

        <div className="w-full lg:w-64 shrink-0">
          <label htmlFor="roadmap-month-filter" className="sr-only">
            Filter berdasarkan bulan
          </label>
          <select
            id="roadmap-month-filter"
            value={monthFilter}
            onChange={(e) => setMonthFilter(e.target.value)}
            className="w-full min-h-[44px] px-3.5 py-2 bg-white border border-gray-300 rounded-lg text-sm font-semibold text-gray-900 focus:border-gray-900 focus:outline-none"
          >
            {monthsList.map((m) => (
              <option key={m} value={m}>
                {m === 'Satu Periode Penuh' ? 'Bulan: Satu Periode Penuh' : `Bulan: ${m}`}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Isi Timeline Vertikal */}
      {loading ? (
        <div className="py-12 flex flex-col items-center justify-center gap-3 text-gray-500">
          <PilarLoader size="sm" label="Memuat roadmap program kerja" />
          <span className="text-sm font-medium">Memuat data roadmap program kerja...</span>
        </div>
      ) : filteredEvents.length === 0 ? (
        <div className="py-10 border-b border-gray-200 flex items-start gap-3 text-gray-600">
          <AlertCircle className="w-5 h-5 text-gray-400 shrink-0 mt-0.5" aria-hidden="true" />
          <div>
            <p className="font-bold text-gray-900">Tidak ada kegiatan pada filter ini</p>
            <p className="text-sm mt-1">
              Tidak ada program kerja untuk kombinasi Divisi ({divisionFilter}) dan Bulan ({monthFilter}).
            </p>
          </div>
        </div>
      ) : (
        <ol className="relative border-l-2 border-gray-200 ml-2.5 space-y-8 pt-1">
          {filteredEvents.map((event) => {
            const calUrl = generateGoogleCalendarUrl(event);
            const meta = getStatusMeta(event.status);

            return (
              <li key={event.id} className="pl-6 sm:pl-8 relative">
                <span
                  aria-hidden="true"
                  className={`absolute -left-[7px] top-1.5 w-3 h-3 rounded-full ring-4 ring-white ${meta.dotClass}`}
                />

                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-8 border-b border-gray-100">
                  <div className="space-y-2 max-w-2xl">
                    <div className="flex flex-wrap items-center gap-2 text-xs font-semibold">
                      <span className="inline-flex items-center gap-1.5 text-gray-700">
                        <Calendar className="w-3.5 h-3.5 text-gray-400" aria-hidden="true" />
                        <span>{formatDateIndo(event.date)}</span>
                      </span>
                      <span className="text-gray-300" aria-hidden="true">
                        •
                      </span>
                      <span className="text-gray-600">{event.division}</span>
                      <span
                        className={`px-2 py-0.5 rounded text-[11px] font-bold border ${meta.badgeClass}`}
                      >
                        {meta.label}
                      </span>
                    </div>

                    <h3 className="text-lg sm:text-xl font-bold text-gray-900 leading-snug">
                      {event.title}
                    </h3>

                    <p className="text-sm sm:text-base text-gray-600 leading-relaxed line-clamp-2">
                      {event.description}
                    </p>
                  </div>

                  <div className="shrink-0 sm:pt-1">
                    <a
                      href={calUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center gap-2 w-full sm:w-auto min-h-[40px] px-4 py-2 rounded-lg border border-gray-300 bg-white hover:bg-gray-50 text-gray-800 text-xs sm:text-sm font-semibold transition-colors"
                    >
                      <CalendarPlus className="w-4 h-4 text-gray-500" aria-hidden="true" />
                      <span>Simpan ke Kalender</span>
                    </a>
                  </div>
                </div>
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}
