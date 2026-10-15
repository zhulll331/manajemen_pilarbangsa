"use client";

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { PublicEvent } from '@/types/events';
import { 
  Calendar, 
  MapPin, 
  ArrowRight, 
  Search, 
  Archive, 
  Sparkles, 
  Clock, 
  CheckCircle2, 
  AlertCircle 
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

    initialEvents.forEach((ev) => {
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
      {/* Controls Bar: Tabs & Search */}
      <div className="bg-white p-4 sm:p-5 rounded-3xl border border-gray-100 shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        {/* Tabs Switcher */}
        <div className="flex items-center gap-1.5 p-1 bg-gray-100/80 rounded-2xl shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('aktif')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all ${
              activeTab === 'aktif'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            <Sparkles size={16} className={activeTab === 'aktif' ? 'text-[#E31837]' : ''} />
            <span>Kegiatan Aktif ({activeList.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('arsip')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all ${
              activeTab === 'arsip'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            <Archive size={16} className={activeTab === 'arsip' ? 'text-gray-700' : ''} />
            <span>Arsip Kegiatan ({archiveList.length})</span>
          </button>
        </div>

        {/* Live Search Input */}
        <div className="relative flex-1 max-w-md">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari kegiatan atau lokasi..."
            className="w-full pl-11 pr-4 py-2.5 rounded-2xl border border-gray-200 focus:border-[#E31837] focus:ring-2 focus:ring-red-100 text-sm outline-none bg-gray-50/50 focus:bg-white transition-colors"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs text-gray-400 hover:text-gray-600 bg-gray-200 rounded-full w-5 h-5 flex items-center justify-center"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Events Grid */}
      {filteredEvents.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-3xl border border-gray-100 shadow-sm p-8 space-y-4">
          <div className="w-16 h-16 bg-gray-50 text-gray-400 rounded-3xl flex items-center justify-center mx-auto">
            <Calendar size={32} />
          </div>
          <h3 className="text-lg font-bold text-gray-900">
            {searchQuery
              ? 'Tidak ada kegiatan yang cocok'
              : activeTab === 'aktif'
              ? 'Belum Ada Kegiatan Aktif Saat Ini'
              : 'Belum Ada Arsip Kegiatan'}
          </h3>
          <p className="text-gray-500 text-sm max-w-md mx-auto">
            {searchQuery
              ? `Tidak ditemukan kegiatan dengan kata kunci "${searchQuery}". Coba gunakan kata kunci lain.`
              : activeTab === 'aktif'
              ? 'Pantau terus halaman ini atau media sosial UKM Pilar Bangsa untuk pengumuman kegiatan dan pendaftaran selanjutnya.'
              : 'Kegiatan yang telah selesai akan diarsipkan di halaman ini.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {filteredEvents.map((ev) => {
            const hasBanner = Boolean(ev.banner_url);
            const isRegOpen = ev.registration_status === 'open';
            const isRegSoon = ev.registration_status === 'soon';
            const isRegClosed = ev.registration_status === 'closed';

            return (
              <Link
                key={ev.id}
                href={`/kegiatan/${ev.slug}`}
                className="group bg-white rounded-3xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col hover:-translate-y-1"
              >
                {/* Banner / Cover Header */}
                <div className="relative h-48 sm:h-52 w-full overflow-hidden bg-gradient-to-br from-gray-900 via-gray-800 to-red-950">
                  {hasBanner ? (
                    <img
                      src={ev.banner_url!}
                      alt={ev.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center p-6 text-center text-white/40">
                      <Calendar size={48} className="opacity-40" />
                    </div>
                  )}

                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

                  {/* Status Badges Overlay */}
                  <div className="absolute top-3 left-3 flex flex-wrap items-center gap-1.5">
                    {activeTab === 'arsip' ? (
                      <span className="bg-gray-800/90 backdrop-blur-md text-white text-[11px] font-bold px-3 py-1 rounded-full uppercase tracking-wider shadow-sm flex items-center gap-1">
                        <Archive size={11} /> Arsip
                      </span>
                    ) : isRegOpen ? (
                      <span className="bg-emerald-600/95 backdrop-blur-md text-white text-[11px] font-bold px-3 py-1 rounded-full uppercase tracking-wider shadow-sm flex items-center gap-1">
                        <CheckCircle2 size={11} /> Pendaftaran Buka
                      </span>
                    ) : isRegSoon ? (
                      <span className="bg-blue-600/95 backdrop-blur-md text-white text-[11px] font-bold px-3 py-1 rounded-full uppercase tracking-wider shadow-sm flex items-center gap-1">
                        <Clock size={11} /> Segera Dibuka
                      </span>
                    ) : isRegClosed ? (
                      <span className="bg-red-600/95 backdrop-blur-md text-white text-[11px] font-bold px-3 py-1 rounded-full uppercase tracking-wider shadow-sm">
                        Pendaftaran Ditutup
                      </span>
                    ) : null}
                  </div>

                  {/* Jadwal Pelaksanaan Pill di Banner */}
                  {ev.starts_at && (
                    <div className="absolute bottom-3 left-3 right-3 text-white text-xs font-semibold flex items-center gap-1.5 drop-shadow-md">
                      <Calendar size={13} className="text-[#FFD700]" />
                      <span>
                        {new Date(ev.starts_at).toLocaleDateString('id-ID', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric',
                        })}
                      </span>
                    </div>
                  )}
                </div>

                {/* Card Content */}
                <div className="p-6 flex flex-col flex-1 space-y-3">
                  {ev.location && (
                    <div className="flex items-center gap-1.5 text-xs text-gray-500 font-medium">
                      <MapPin size={13} className="text-[#E31837] shrink-0" />
                      <span className="truncate">{ev.location}</span>
                    </div>
                  )}

                  <h3 className="font-extrabold text-gray-900 text-lg leading-snug group-hover:text-[#E31837] transition-colors line-clamp-2">
                    {ev.title}
                  </h3>

                  {ev.summary && (
                    <p className="text-gray-600 text-sm line-clamp-3 leading-relaxed">
                      {ev.summary}
                    </p>
                  )}

                  {/* Footer Link */}
                  <div className="mt-auto pt-4 flex items-center justify-between border-t border-gray-50">
                    <span className="text-xs font-bold text-[#E31837] group-hover:underline">
                      Lihat Info & Materi
                    </span>
                    <div className="w-8 h-8 rounded-full bg-red-50 text-[#E31837] flex items-center justify-center group-hover:bg-[#E31837] group-hover:text-white transition-colors">
                      <ArrowRight size={14} />
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
