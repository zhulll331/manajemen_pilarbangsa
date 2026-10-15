"use client";

import React, { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import { PublicEvent, PublishStatus, RegistrationStatus } from '@/types/events';
import { 
  Plus, 
  Search, 
  Filter, 
  Calendar, 
  Star, 
  ExternalLink, 
  Edit3, 
  Trash2, 
  AlertCircle, 
  CheckCircle2, 
  RefreshCw, 
  Clock, 
  MapPin, 
  Archive, 
  Check, 
  Eye
} from 'lucide-react';

interface Props {
  initialEvents: PublicEvent[];
}

export default function KelolaKegiatanClient({ initialEvents }: Props) {
  const router = useRouter();
  const supabase = createClient();

  const [events, setEvents] = useState<PublicEvent[]>(initialEvents);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterPublishStatus, setFilterPublishStatus] = useState<string>('all');
  const [filterRegStatus, setFilterRegStatus] = useState<string>('all');
  const [loadingActionId, setLoadingActionId] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Modal konfirmasi hapus draft
  const [eventToDelete, setEventToDelete] = useState<PublicEvent | null>(null);

  const fetchEvents = async () => {
    setIsRefreshing(true);
    setErrorMessage(null);
    try {
      const { data, error } = await supabase
        .from('public_events')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setEvents((data as PublicEvent[]) || []);
    } catch (err: any) {
      setErrorMessage(err.message || 'Gagal memuat ulang data kegiatan.');
    } finally {
      setIsRefreshing(false);
    }
  };

  // Jalankan pemeriksaan auto-purge H+14 saat membuka halaman
  useEffect(() => {
    const runAutoPurgeCheck = async () => {
      try {
        const { data: purgedCount } = await supabase.rpc('fn_purge_expired_archived_events');
        if (typeof purgedCount === 'number' && purgedCount > 0) {
          fetchEvents();
        }
      } catch {
        // Abaikan jika RPC belum dibuat atau tidak ada izin
      }
    };
    runAutoPurgeCheck();
  }, []);

  const filteredEvents = useMemo(() => {
    return events.filter((ev) => {
      const matchSearch =
        ev.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ev.slug.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (ev.location && ev.location.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchPublish =
        filterPublishStatus === 'all' || ev.publish_status === filterPublishStatus;

      const matchReg =
        filterRegStatus === 'all' || ev.registration_status === filterRegStatus;

      return matchSearch && matchPublish && matchReg;
    });
  }, [events, searchQuery, filterPublishStatus, filterRegStatus]);

  // Handle Toggle Sorotan Beranda
  const handleToggleFeatured = async (event: PublicEvent) => {
    if (event.publish_status !== 'published') {
      setErrorMessage('Hanya kegiatan yang sudah berstatus Terbit yang dapat dijadikan sorotan beranda.');
      return;
    }

    setLoadingActionId(event.id);
    setErrorMessage(null);
    setSuccessMessage(null);

    const nextFeatured = !event.is_featured;

    try {
      const { error } = await supabase
        .from('public_events')
        .update({ is_featured: nextFeatured })
        .eq('id', event.id);

      if (error) throw error;

      // Update state: jika diset true, semua event lain is_featured = false
      setEvents((prev) =>
        prev.map((e) => {
          if (e.id === event.id) {
            return { ...e, is_featured: nextFeatured };
          }
          if (nextFeatured) {
            return { ...e, is_featured: false };
          }
          return e;
        })
      );

      setSuccessMessage(
        nextFeatured
          ? `Kegiatan "${event.title}" berhasil dijadikan sorotan utama beranda.`
          : `Sorotan beranda untuk "${event.title}" dinonaktifkan.`
      );
    } catch (err: any) {
      setErrorMessage(err.message || 'Gagal mengubah status sorotan.');
    } finally {
      setLoadingActionId(null);
    }
  };

  // Handle Konfirmasi Hapus Draft
  const handleDeleteDraft = async () => {
    if (!eventToDelete) return;

    if (eventToDelete.publish_status !== 'draft') {
      setErrorMessage('Kegiatan yang sudah diterbitkan atau diarsipkan tidak boleh dihapus demi arsip.');
      setEventToDelete(null);
      return;
    }

    setLoadingActionId(eventToDelete.id);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const { error } = await supabase
        .from('public_events')
        .delete()
        .eq('id', eventToDelete.id);

      if (error) throw error;

      setEvents((prev) => prev.filter((e) => e.id !== eventToDelete.id));
      setSuccessMessage(`Draft kegiatan "${eventToDelete.title}" berhasil dihapus.`);
      setEventToDelete(null);
    } catch (err: any) {
      setErrorMessage(err.message || 'Gagal menghapus draft kegiatan.');
    } finally {
      setLoadingActionId(null);
    }
  };

  const getPublishBadge = (status: PublishStatus) => {
    switch (status) {
      case 'published':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-green-50 text-[#008000] border border-green-200">
            <span className="w-1.5 h-1.5 rounded-full bg-[#008000]"></span>
            Terbit
          </span>
        );
      case 'archived':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-gray-100 text-gray-700 border border-gray-200">
            <Archive size={12} />
            Arsip
          </span>
        );
      case 'draft':
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200">
            <Clock size={12} />
            Draft
          </span>
        );
    }
  };

  const getArchiveCountdown = (ev: PublicEvent) => {
    if (ev.publish_status !== 'archived') return null;
    const baseDateStr = ev.ends_at || ev.updated_at;
    const baseDate = new Date(baseDateStr).getTime();
    const expiryDate = baseDate + 14 * 24 * 60 * 60 * 1000;
    const now = Date.now();
    const diffDays = Math.ceil((expiryDate - now) / (24 * 60 * 60 * 1000));
    
    if (diffDays <= 0) {
      return 'Hapus: Hari ini';
    }
    return `H+14 (${diffDays} hari lagi)`;
  };

  const getRegistrationBadge = (status: RegistrationStatus) => {
    switch (status) {
      case 'open':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            Buka
          </span>
        );
      case 'soon':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
            Segera
          </span>
        );
      case 'closed':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-xs font-semibold bg-red-50 text-red-700 border border-red-200">
            Ditutup
          </span>
        );
      case 'na':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-xs font-medium text-gray-400">
            -
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
        <div>
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-red-50 text-[#E31837] text-xs font-bold uppercase tracking-wider mb-2">
            <Calendar size={14} />
            <span>Pusat Kegiatan Publik</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
            Kelola Halaman Kegiatan
          </h1>
          <p className="text-gray-500 text-sm mt-1 max-w-2xl">
            Satu pusat untuk mengelola tautan, twibbon, caption media sosial, formulir pendaftaran, dan sorotan kegiatan resmi UKM Pilar Bangsa.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchEvents}
            disabled={isRefreshing}
            className="p-3 bg-gray-50 hover:bg-gray-100 text-gray-600 rounded-2xl border border-gray-200 transition-colors disabled:opacity-50"
            title="Muat Ulang"
          >
            <RefreshCw size={18} className={isRefreshing ? 'animate-spin' : ''} />
          </button>

          <Link
            href="/dashboard/humas/kegiatan/baru"
            className="inline-flex items-center gap-2 bg-[#E31837] hover:bg-red-700 text-white font-bold px-5 py-3 rounded-2xl shadow-md hover:shadow-lg transition-all"
          >
            <Plus size={18} />
            <span>Buat Kegiatan</span>
          </Link>
        </div>
      </div>

      {/* Notifications */}
      {errorMessage && (
        <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-800 flex items-start gap-3">
          <AlertCircle size={20} className="shrink-0 text-red-600 mt-0.5" />
          <div className="flex-1 text-sm font-medium">{errorMessage}</div>
          <button onClick={() => setErrorMessage(null)} className="text-red-500 hover:text-red-700">✕</button>
        </div>
      )}

      {successMessage && (
        <div className="p-4 rounded-2xl bg-green-50 border border-green-200 text-[#008000] flex items-start gap-3">
          <CheckCircle2 size={20} className="shrink-0 text-[#008000] mt-0.5" />
          <div className="flex-1 text-sm font-medium">{successMessage}</div>
          <button onClick={() => setSuccessMessage(null)} className="text-green-600 hover:text-green-800">✕</button>
        </div>
      )}

      {/* Filter & Search Bar */}
      <div className="bg-white p-4 rounded-3xl border border-gray-100 shadow-sm flex flex-col md:flex-row items-stretch md:items-center gap-4">
        <div className="relative flex-1">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Cari berdasarkan judul kegiatan, slug, atau lokasi..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-11 pr-4 py-2.5 rounded-2xl border border-gray-200 focus:border-[#E31837] focus:ring-2 focus:ring-red-100 outline-none text-sm"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-gray-500">Status:</span>
            <select
              value={filterPublishStatus}
              onChange={(e) => setFilterPublishStatus(e.target.value)}
              className="px-3 py-2 rounded-xl border border-gray-200 text-xs font-medium bg-white focus:outline-none focus:border-[#E31837]"
            >
              <option value="all">Semua Status</option>
              <option value="published">Terbit</option>
              <option value="draft">Draft</option>
              <option value="archived">Arsip</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-gray-500">Pendaftaran:</span>
            <select
              value={filterRegStatus}
              onChange={(e) => setFilterRegStatus(e.target.value)}
              className="px-3 py-2 rounded-xl border border-gray-200 text-xs font-medium bg-white focus:outline-none focus:border-[#E31837]"
            >
              <option value="all">Semua Pendaftaran</option>
              <option value="open">Buka</option>
              <option value="soon">Segera</option>
              <option value="closed">Ditutup</option>
              <option value="na">Tidak Berlaku</option>
            </select>
          </div>
        </div>
      </div>

      {/* Events Table / Cards */}
      {filteredEvents.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-3xl border border-gray-100 shadow-sm p-8 space-y-4">
          <div className="w-16 h-16 bg-red-50 text-[#E31837] rounded-3xl flex items-center justify-center mx-auto">
            <Calendar size={32} />
          </div>
          <h3 className="text-lg font-bold text-gray-900">
            {searchQuery || filterPublishStatus !== 'all' || filterRegStatus !== 'all'
              ? 'Tidak ada kegiatan yang sesuai filter'
              : 'Belum Ada Kegiatan'}
          </h3>
          <p className="text-gray-500 text-sm max-w-md mx-auto">
            {searchQuery || filterPublishStatus !== 'all' || filterRegStatus !== 'all'
              ? 'Coba atur ulang kata kunci pencarian atau opsi filter Anda.'
              : 'Mulai buat halaman kegiatan baru untuk membagikan informasi, formulir pendaftaran, twibbon, dan materi kepada peserta.'}
          </p>
          <div className="pt-2">
            <Link
              href="/dashboard/humas/kegiatan/baru"
              className="inline-flex items-center gap-2 bg-[#E31837] hover:bg-red-700 text-white font-bold px-6 py-2.5 rounded-2xl shadow-sm text-sm"
            >
              <Plus size={16} />
              <span>Buat Kegiatan Pertama</span>
            </Link>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/70 text-gray-500 text-xs uppercase font-bold tracking-wider">
                  <th className="py-4 px-6">Kegiatan</th>
                  <th className="py-4 px-4">Status Publikasi</th>
                  <th className="py-4 px-4">Pendaftaran</th>
                  <th className="py-4 px-4">Jadwal & Lokasi</th>
                  <th className="py-4 px-4 text-center">Sorotan Beranda</th>
                  <th className="py-4 px-6 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-sm">
                {filteredEvents.map((ev) => (
                  <tr key={ev.id} className="hover:bg-gray-50/80 transition-colors">
                    {/* Kegiatan */}
                    <td className="py-4 px-6">
                      <div className="flex items-start gap-3">
                        {ev.banner_url ? (
                          <img
                            src={ev.banner_url}
                            alt=""
                            className="w-12 h-12 rounded-xl object-cover shrink-0 border border-gray-100 bg-gray-100"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-xl bg-gray-100 border border-gray-200 flex items-center justify-center shrink-0 text-gray-400">
                            <Calendar size={20} />
                          </div>
                        )}
                        <div>
                          <div className="font-bold text-gray-900 hover:text-[#E31837] transition-colors line-clamp-1">
                            <Link href={`/dashboard/humas/kegiatan/${ev.id}`}>
                              {ev.title}
                            </Link>
                          </div>
                          <div className="text-xs text-gray-500 font-mono mt-0.5">
                            /kegiatan/{ev.slug}
                          </div>
                          {ev.summary && (
                            <p className="text-xs text-gray-500 line-clamp-1 mt-1 max-w-sm">
                              {ev.summary}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Status Publikasi */}
                    <td className="py-4 px-4 whitespace-nowrap">
                      <div className="flex flex-col gap-1 items-start">
                        {getPublishBadge(ev.publish_status)}
                        {ev.publish_status === 'archived' && (
                          <span className="text-[10px] text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200/60 font-medium">
                            {getArchiveCountdown(ev)}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Pendaftaran */}
                    <td className="py-4 px-4 whitespace-nowrap">
                      {getRegistrationBadge(ev.registration_status)}
                    </td>

                    {/* Jadwal & Lokasi */}
                    <td className="py-4 px-4 whitespace-nowrap text-xs text-gray-600 space-y-1">
                      {ev.starts_at ? (
                        <div className="flex items-center gap-1.5 font-medium text-gray-700">
                          <Calendar size={13} className="text-gray-400" />
                          <span>
                            {new Date(ev.starts_at).toLocaleDateString('id-ID', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric'
                            })}
                          </span>
                        </div>
                      ) : (
                        <span className="text-gray-400">Tanggal belum diatur</span>
                      )}
                      {ev.location && (
                        <div className="flex items-center gap-1.5 text-gray-500">
                          <MapPin size={13} className="text-gray-400" />
                          <span className="truncate max-w-[150px]">{ev.location}</span>
                        </div>
                      )}
                    </td>

                    {/* Sorotan Beranda */}
                    <td className="py-4 px-4 text-center whitespace-nowrap">
                      <button
                        onClick={() => handleToggleFeatured(ev)}
                        disabled={ev.publish_status !== 'published' || loadingActionId === ev.id}
                        title={
                          ev.publish_status !== 'published'
                            ? 'Harus berstatus Terbit untuk jadi sorotan'
                            : ev.is_featured
                            ? 'Klik untuk copot sorotan'
                            : 'Klik untuk jadikan sorotan beranda'
                        }
                        className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold transition-all ${
                          ev.is_featured
                            ? 'bg-amber-100 text-amber-800 border border-amber-300 shadow-sm'
                            : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
                        } ${
                          ev.publish_status !== 'published' ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'
                        }`}
                      >
                        <Star size={13} className={ev.is_featured ? 'fill-amber-500 text-amber-500' : ''} />
                        <span>{ev.is_featured ? 'Sorotan Aktif' : 'Jadikan Sorotan'}</span>
                      </button>
                    </td>

                    {/* Aksi */}
                    <td className="py-4 px-6 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-2">
                        {/* Pratinjau Publik */}
                        {ev.publish_status !== 'draft' ? (
                          <Link
                            href={`/kegiatan/${ev.slug}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-colors"
                            title="Buka Halaman Publik"
                          >
                            <ExternalLink size={16} />
                          </Link>
                        ) : (
                          <span
                            className="p-2 text-gray-300 cursor-not-allowed"
                            title="Draft belum dapat dibuka publik"
                          >
                            <Eye size={16} />
                          </span>
                        )}

                        {/* Edit */}
                        <Link
                          href={`/dashboard/humas/kegiatan/${ev.id}`}
                          className="p-2 text-gray-600 hover:text-[#E31837] hover:bg-red-50 rounded-xl transition-colors"
                          title="Edit Kegiatan"
                        >
                          <Edit3 size={16} />
                        </Link>

                        {/* Hapus (Hanya draft) */}
                        {ev.publish_status === 'draft' ? (
                          <button
                            onClick={() => setEventToDelete(ev)}
                            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                            title="Hapus Draft"
                          >
                            <Trash2 size={16} />
                          </button>
                        ) : (
                          <span
                            className="p-2 text-gray-300 cursor-not-allowed"
                            title="Kegiatan terbit/arsip dilindungi demi riwayat"
                          >
                            <Trash2 size={16} />
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal Konfirmasi Hapus Draft */}
      {eventToDelete && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-gray-100 space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="w-12 h-12 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center mx-auto">
              <Trash2 size={24} />
            </div>
            <div className="text-center space-y-2">
              <h3 className="text-xl font-bold text-gray-900">Hapus Draft Kegiatan?</h3>
              <p className="text-sm text-gray-500">
                Apakah Anda yakin ingin menghapus draft kegiatan{' '}
                <strong className="text-gray-900">"{eventToDelete.title}"</strong>? Seluruh item di dalamnya juga akan terhapus. Tindakan ini tidak dapat dibatalkan.
              </p>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setEventToDelete(null)}
                className="flex-1 py-3 px-4 rounded-xl border border-gray-200 text-gray-700 font-semibold hover:bg-gray-50 transition-colors text-sm"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleDeleteDraft}
                disabled={loadingActionId === eventToDelete.id}
                className="flex-1 py-3 px-4 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold transition-colors text-sm disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loadingActionId === eventToDelete.id ? (
                  <RefreshCw size={16} className="animate-spin" />
                ) : (
                  'Ya, Hapus Draft'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
