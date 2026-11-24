"use client";

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { PublicEvent } from '@/types/events';
import { normalizeEventTimestamps, formatEventDateWib } from '@/utils/eventDate';
import { GsapCardGroup } from '@/components/motion/GsapCardGroup';
import { 
  Calendar, 
  MapPin, 
  ArrowRight, 
  Search, 
  Archive, 
  Sparkles, 
  Clock, 
  CheckCircle2 
} from 'lucide-react';

interface Props {
  initialEvents: PublicEvent[];
  initialTab?: string;
}

export default function DaftarKegiatanClient({ initialEvents, initialTab = 'aktif' }: Props) {
  const [activeTab, setActiveTab] = useState<'aktif' | 'arsip'>(
    initialTab === 'arsip' ? 'arsip' : 'aktif'
  );
  const [searchQuery, setSearchQuery] = useState('');

  // Pisahkan aktif dan arsip
  const { activeList, archiveList } = useMemo(() => {
    const aktif: PublicEvent[] = [];
    const arsip: PublicEvent[] = [];

    const now = new Date().getTime();

    initialEvents.forEach((rawEv) => {
      const ev = normalizeEventTimestamps(rawEv);
      if (ev.publish_status === 'archived') {
        arsip.push(ev);
      } else if (ev.publish_status === 'published') {
        aktif.push(ev);
      }
    });

    // Urutkan kegiatan aktif:
    // 1. Yang bertanggal mendatang (ASC)
    // 2. Yang tanpa tanggal
    // 3. Yang sudah lewat (DESC)
    aktif.sort((a, b) => {
      const timeA = a.starts_at ? new Date(a.starts_at).getTime() : null;
      const timeB = b.starts_at ? new Date(b.starts_at).getTime() : null;

      if (timeA && timeB) {
        const isUpcomingA = timeA >= now;
        const isUpcomingB = timeB >= now;

        if (isUpcomingA && isUpcomingB) return timeA - timeB; // Terdekat dulu
        if (isUpcomingA && !isUpcomingB) return -1;
        if (!isUpcomingA && isUpcomingB) return 1;
        return timeB - timeA; // Lewat, terbaru dulu
      }

      if (timeA && !timeB) return -1;
      if (!timeA && timeB) return 1;
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });

    // Urutkan arsip: terbaru dulu (DESC)
    arsip.sort((a, b) => {
      const timeA = a.starts_at ? new Date(a.starts_at).getTime() : new Date(a.created_at).getTime();
      const timeB = b.starts_at ? new Date(b.starts_at).getTime() : new Date(b.created_at).getTime();
      return timeB - timeA;
    });

    return { activeList: aktif, archiveList: arsip };
  }, [initialEvents]);

  const currentList = activeTab === 'aktif' ? activeList : archiveList;

  const filteredEvents = useMemo(() => {
    if (!searchQuery.trim()) return currentList;
    const query = searchQuery.toLowerCase().trim();
    return currentList.filter(
      (ev) =>
        ev.title.toLowerCase().includes(query) ||
        (ev.summary && ev.summary.toLowerCase().includes(query)) ||
        (ev.location && ev.location.toLowerCase().includes(query))
    );
  }, [currentList, searchQuery]);

  return (
    <div className="space-y-8">
      {/* Bar Tab Bergaris Bawah + Pencarian Datar */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-gray-200">
        <div className="flex items-center gap-6 flex-wrap" role="tablist" aria-label="Filter status kegiatan">
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'aktif'}
            onClick={() => setActiveTab('aktif')}
            className={`inline-flex items-center gap-2 py-3 border-b-2 text-sm font-bold whitespace-nowrap transition-colors cursor-pointer ${
              activeTab === 'aktif'
                ? 'border-[#E31837] text-[#E31837]'
                : 'border-transparent text-gray-500 hover:text-gray-900'
            }`}
          >
            <Sparkles size={16} aria-hidden="true" />
            <span>Kegiatan Aktif ({activeList.length})</span>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'arsip'}
            onClick={() => setActiveTab('arsip')}
            className={`inline-flex items-center gap-2 py-3 border-b-2 text-sm font-bold whitespace-nowrap transition-colors cursor-pointer ${
              activeTab === 'arsip'
                ? 'border-gray-900 text-gray-900'
                : 'border-transparent text-gray-500 hover:text-gray-900'
            }`}
          >
            <Archive size={16} aria-hidden="true" />
            <span>Arsip Kegiatan ({archiveList.length})</span>
          </button>
        </div>

        <div className="w-full md:w-80 pb-3">
          <div className="relative">
            <Search
              size={17}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
              aria-hidden="true"
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari kegiatan atau lokasi..."
              aria-label="Cari kegiatan atau lokasi"
              className="w-full min-h-[42px] pl-10 pr-9 py-2 rounded-lg border border-gray-300 focus:border-[#E31837] text-sm outline-none bg-white transition-colors"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                aria-label="Hapus pencarian"
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-gray-500 hover:text-gray-800 bg-gray-100 rounded-full w-6 h-6 flex items-center justify-center"
              >
                ✕
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Daftar Kegiatan */}
      {filteredEvents.length === 0 ? (
        <div className="py-16 border-b border-gray-200 text-center space-y-3">
          <div className="w-12 h-12 bg-gray-100 text-gray-500 rounded-lg flex items-center justify-center mx-auto">
            <Calendar size={24} aria-hidden="true" />
          </div>
          <h3 className="text-lg font-bold text-gray-900">
            {searchQuery
              ? 'Tidak ada kegiatan yang cocok'
              : activeTab === 'aktif'
                ? 'Belum Ada Kegiatan Aktif Saat Ini'
                : 'Belum Ada Arsip Kegiatan'}
          </h3>
          <p className="text-gray-600 text-sm max-w-md mx-auto">
            {searchQuery
              ? `Tidak ditemukan kegiatan dengan kata kunci "${searchQuery}". Coba gunakan kata kunci lain.`
              : activeTab === 'aktif'
                ? 'Pantau terus halaman ini atau media sosial UKM Pilar Bangsa untuk pengumuman kegiatan dan pendaftaran selanjutnya.'
                : 'Kegiatan yang telah selesai akan diarsipkan di halaman ini.'}
          </p>
        </div>
      ) : (
        <GsapCardGroup
          triggerKey={`${activeTab}-${searchQuery}-${filteredEvents.length}`}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
        >
          {filteredEvents.map((ev) => {
            const hasBanner = Boolean(ev.banner_url);
            const isRegOpen = ev.registration_status === 'open';
            const isRegSoon = ev.registration_status === 'soon';
            const isRegClosed = ev.registration_status === 'closed';

            return (
              <Link
                key={ev.id}
                href={`/kegiatan/${ev.slug}`}
                className="group pb-card-hover flex flex-col border-b border-gray-200 pb-6 md:border-b-0 md:pb-0 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#E31837] rounded-lg"
              >
                {/* Cover Image */}
                <div className="relative aspect-[16/10] w-full overflow-hidden rounded-lg bg-gray-100">
                  {hasBanner ? (
                    <img
                      src={ev.banner_url!}
                      alt={ev.title}
                      width={640}
                      height={400}
                      loading="lazy"
                      decoding="async"
                      className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-300"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center bg-gray-900 text-white/40">
                      <Calendar size={40} aria-hidden="true" />
                    </div>
                  )}

                  <div className="absolute top-3 left-3">
                    {activeTab === 'arsip' ? (
                      <span className="inline-flex items-center gap-1 bg-gray-900/90 text-white text-[11px] font-bold px-2.5 py-1 rounded uppercase tracking-wider">
                        <Archive size={11} aria-hidden="true" /> Arsip
                      </span>
                    ) : isRegOpen ? (
                      <span className="inline-flex items-center gap-1 bg-emerald-600 text-white text-[11px] font-bold px-2.5 py-1 rounded uppercase tracking-wider">
                        <CheckCircle2 size={11} aria-hidden="true" /> Pendaftaran Buka
                      </span>
                    ) : isRegSoon ? (
                      <span className="inline-flex items-center gap-1 bg-blue-600 text-white text-[11px] font-bold px-2.5 py-1 rounded uppercase tracking-wider">
                        <Clock size={11} aria-hidden="true" /> Segera Dibuka
                      </span>
                    ) : isRegClosed ? (
                      <span className="inline-flex items-center bg-[#E31837] text-white text-[11px] font-bold px-2.5 py-1 rounded uppercase tracking-wider">
                        Pendaftaran Ditutup
                      </span>
                    ) : null}
                  </div>
                </div>

                {/* Metadata & Teks Langsung Tanpa Kotak */}
                <div className="pt-4 flex flex-col flex-1 space-y-2">
                  {ev.starts_at && (
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-500">
                      <Calendar size={13} className="text-[#E31837]" aria-hidden="true" />
                      <span>
                        {formatEventDateWib(ev.starts_at, {
                          weekday: 'long',
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric',
                        })}
                      </span>
                    </div>
                  )}

                  <h3 className="font-extrabold text-gray-900 text-lg leading-snug group-hover:text-[#E31837] transition-colors line-clamp-2">
                    {ev.title}
                  </h3>

                  {ev.location && (
                    <div className="flex items-center gap-1.5 text-xs text-gray-500 font-medium">
                      <MapPin size={13} className="text-gray-400 shrink-0" aria-hidden="true" />
                      <span className="truncate">{ev.location}</span>
                    </div>
                  )}

                  {ev.summary && (
                    <p className="text-gray-600 text-sm line-clamp-2 leading-relaxed">
                      {ev.summary}
                    </p>
                  )}

                  <div className="pt-2 mt-auto inline-flex items-center gap-1.5 text-sm font-bold text-[#E31837] group-hover:underline">
                    <span>Lihat Info &amp; Materi</span>
                    <ArrowRight size={14} aria-hidden="true" />
                  </div>
                </div>
              </Link>
            );
          })}
        </GsapCardGroup>
      )}
    </div>
  );
}
