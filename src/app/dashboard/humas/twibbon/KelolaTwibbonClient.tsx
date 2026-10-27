"use client";

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import type { TwibbonCampaignRow, TwibbonCampaignState } from '@/types/twibbon';
import type { PublicEvent } from '@/types/events';
import {
  DEFAULT_DIKLAT_2026_CAMPAIGN,
  DIKLAT_2026_CAMPAIGN_SLUG,
} from '@/lib/twibbon/caption';
import {
  Plus,
  Search,
  Image as ImageIcon,
  ExternalLink,
  Edit3,
  Trash2,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
  Clock,
  Archive,
  Eye,
  Sparkles,
  Calendar,
  Database,
} from 'lucide-react';

interface Props {
  initialCampaigns: TwibbonCampaignRow[];
  events: PublicEvent[];
  dbSchemaMissing?: boolean;
}

export default function KelolaTwibbonClient({
  initialCampaigns,
  events,
  dbSchemaMissing = false,
}: Props) {
  const router = useRouter();
  const supabase = createClient();

  const [campaigns, setCampaigns] = useState<TwibbonCampaignRow[]>(initialCampaigns);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterState, setFilterState] = useState<string>('all');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isCreatingDiklat, setIsCreatingDiklat] = useState(false);
  const [loadingActionId, setLoadingActionId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [campaignToDelete, setCampaignToDelete] = useState<TwibbonCampaignRow | null>(null);

  const eventMap = useMemo(() => {
    const map = new Map<string, PublicEvent>();
    for (const ev of events) {
      map.set(ev.id, ev);
    }
    return map;
  }, [events]);

  const hasDiklatCampaign = useMemo(() => {
    return campaigns.some((c) => c.slug === DIKLAT_2026_CAMPAIGN_SLUG);
  }, [campaigns]);

  const fetchCampaigns = async () => {
    setIsRefreshing(true);
    setErrorMessage(null);
    try {
      const { data, error } = await supabase
        .from('twibbon_campaigns')
        .select('*')
        .order('updated_at', { ascending: false });

      if (error) throw error;
      setCampaigns((data as TwibbonCampaignRow[]) || []);
    } catch (err: any) {
      setErrorMessage(err.message || 'Gagal memuat ulang data kampanye twibbon.');
    } finally {
      setIsRefreshing(false);
    }
  };

  // Helper 1-klik untuk menyiapkan Draft Diklat Kepemimpinan 2026
  const handleInitDiklatCampaign = async () => {
    setIsCreatingDiklat(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const diklatEvent = events.find(
        (e) =>
          e.slug === 'pendaftaran-diklat-kepemimpinan-periode-20262027' ||
          e.title.toLowerCase().includes('diklat kepemimpinan')
      );

      const response = await fetch('/api/admin/twibbon', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: DEFAULT_DIKLAT_2026_CAMPAIGN.title,
          slug: DEFAULT_DIKLAT_2026_CAMPAIGN.slug,
          description: DEFAULT_DIKLAT_2026_CAMPAIGN.description,
          event_id: diklatEvent?.id || null,
          caption_default: DEFAULT_DIKLAT_2026_CAMPAIGN.caption_default,
          caption_template: DEFAULT_DIKLAT_2026_CAMPAIGN.caption_template,
        }),
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result?.error?.message || 'Gagal menyiapkan draft Diklat Kepemimpinan 2026.');
      }

      const created: TwibbonCampaignRow = result.campaign || result.data;
      setCampaigns((prev) => [created, ...prev]);
      setSuccessMessage(
        'Draft kampanye "Twibbon Diklat Kepemimpinan UKM Pilar Bangsa 2026" berhasil dibuat! Mengarahkan ke editor...'
      );
      router.push(`/dashboard/humas/twibbon/${created.id}`);
    } catch (err: any) {
      setErrorMessage(err.message || 'Gagal membuat draft Diklat.');
    } finally {
      setIsCreatingDiklat(false);
    }
  };

  const handleDeleteDraft = async () => {
    if (!campaignToDelete) return;

    setLoadingActionId(campaignToDelete.id);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const response = await fetch(`/api/admin/twibbon/${campaignToDelete.id}`, {
        method: 'DELETE',
      });
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result?.error?.message || 'Gagal menghapus draft kampanye.');
      }

      setCampaigns((prev) => prev.filter((c) => c.id !== campaignToDelete.id));
      setSuccessMessage(
        `Draft kampanye "${campaignToDelete.draft_payload?.title || campaignToDelete.slug}" berhasil dihapus.`
      );
      setCampaignToDelete(null);
    } catch (err: any) {
      setErrorMessage(err.message || 'Gagal menghapus draft kampanye.');
    } finally {
      setLoadingActionId(null);
    }
  };

  const filteredCampaigns = useMemo(() => {
    return campaigns.filter((c) => {
      const title = c.draft_payload?.title || '';
      const matchSearch =
        title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.slug.toLowerCase().includes(searchQuery.toLowerCase());
      const matchState = filterState === 'all' || c.state === filterState;
      return matchSearch && matchState;
    });
  }, [campaigns, searchQuery, filterState]);

  const getStateBadge = (state: TwibbonCampaignState, hasUnpublished: boolean) => {
    switch (state) {
      case 'published':
        return (
          <div className="flex flex-col items-start gap-1">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-green-50 text-[#008000] border border-green-200">
              <span className="w-1.5 h-1.5 rounded-full bg-[#008000]" />
              Terbit (Published)
            </span>
            {hasUnpublished && (
              <span className="text-[10px] font-bold text-amber-800 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-md">
                Ada Perubahan Draft Belum Terbit
              </span>
            )}
          </div>
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
            Draft Privat
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
            <ImageIcon size={14} />
            <span>Modul Twibbon Pilar Bangsa</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
            Kelola Kampanye Twibbon
          </h1>
          <p className="text-gray-500 text-sm mt-1 max-w-2xl">
            Kelola bingkai PNG transparan 1080×1080, template caption resmi (umum & personal), pratinjau privat, dan publikasi atomik untuk kegiatan UKM Pilar Bangsa.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={fetchCampaigns}
            disabled={isRefreshing}
            className="p-3 bg-gray-50 hover:bg-gray-100 text-gray-600 rounded-2xl border border-gray-200 transition-colors disabled:opacity-50"
            title="Muat Ulang"
          >
            <RefreshCw size={18} className={isRefreshing ? 'animate-spin' : ''} />
          </button>

          <Link
            href="/twibbon"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-3 rounded-2xl border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 text-xs sm:text-sm font-bold transition-colors"
          >
            <ExternalLink size={16} />
            <span>Katalog Publik</span>
          </Link>

          <Link
            href="/dashboard/humas/twibbon/baru"
            className="inline-flex items-center gap-2 bg-[#E31837] hover:bg-red-700 text-white font-bold px-5 py-3 rounded-2xl shadow-md hover:shadow-lg transition-all text-xs sm:text-sm"
          >
            <Plus size={18} />
            <span>Buat Kampanye Twibbon</span>
          </Link>
        </div>
      </div>

      {/* Peringatan jika SQL Migration belum dijalankan */}
      {dbSchemaMissing && (
        <div className="p-5 rounded-3xl bg-amber-50 border border-amber-200 text-amber-950 space-y-2">
          <div className="flex items-center gap-2.5 font-extrabold text-sm text-amber-900">
            <Database className="w-5 h-5 text-amber-700 shrink-0" />
            <span>Tabel Database Twibbon Belum Diinisialisasi di Supabase</span>
          </div>
          <p className="text-xs sm:text-sm text-amber-800 leading-relaxed">
            Jalankan file migrasi <code className="font-mono bg-amber-100 px-1.5 py-0.5 rounded">supabase_tahap17_twibbon.sql</code> di{' '}
            <strong>Supabase SQL Editor</strong> agar fitur penyimpanan draft, revisi immutable, bucket privat/publik, dan audit log aktif sepenuhnya. Saat ini halaman publik <code className="font-mono bg-amber-100 px-1.5 py-0.5 rounded">/twibbon/diklat-kepemimpinan-2026</code> tetap berjalan normal menggunakan bingkai contoh bawaan.
          </p>
        </div>
      )}

      {/* Quick Setup Banner untuk Diklat Kepemimpinan 2026 */}
      {!dbSchemaMissing && !hasDiklatCampaign && (
        <div className="p-6 rounded-3xl bg-gradient-to-r from-gray-900 via-gray-900 to-red-950 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5 max-w-2xl">
            <div className="inline-flex items-center gap-1.5 text-xs font-bold text-[#FFD700] uppercase tracking-wider">
              <Sparkles size={14} />
              <span>Siap Pakai untuk 1 November 2026</span>
            </div>
            <h2 className="text-lg sm:text-xl font-extrabold">
              Siapkan Kampanye Twibbon Diklat Kepemimpinan 2026
            </h2>
            <p className="text-xs sm:text-sm text-gray-300 leading-relaxed">
              Buat draft kampanye resmi <code className="text-amber-300">/twibbon/diklat-kepemimpinan-2026</code> lengkap dengan template caption umum & personal sesuai PRD dan terhubung otomatis ke kegiatan Pendaftaran Diklat Kepemimpinan Periode 2026/2027.
            </p>
          </div>

          <button
            type="button"
            onClick={handleInitDiklatCampaign}
            disabled={isCreatingDiklat}
            className="inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-2xl bg-[#E31837] hover:bg-red-700 text-white text-xs sm:text-sm font-extrabold shadow-lg transition-all shrink-0 disabled:opacity-50"
          >
            {isCreatingDiklat ? (
              <RefreshCw size={16} className="animate-spin" />
            ) : (
              <Sparkles size={16} />
            )}
            <span>Siapkan Draft Diklat 2026</span>
          </button>
        </div>
      )}

      {/* Notifications */}
      {errorMessage && (
        <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-800 flex items-start gap-3">
          <AlertCircle size={20} className="shrink-0 text-red-600 mt-0.5" />
          <div className="flex-1 text-sm font-medium">{errorMessage}</div>
          <button onClick={() => setErrorMessage(null)} className="text-red-500 hover:text-red-700">
            ✕
          </button>
        </div>
      )}

      {successMessage && (
        <div className="p-4 rounded-2xl bg-green-50 border border-green-200 text-[#008000] flex items-start gap-3">
          <CheckCircle2 size={20} className="shrink-0 text-[#008000] mt-0.5" />
          <div className="flex-1 text-sm font-medium">{successMessage}</div>
          <button
            onClick={() => setSuccessMessage(null)}
            className="text-green-600 hover:text-green-800"
          >
            ✕
          </button>
        </div>
      )}

      {/* Search & Filter */}
      <div className="bg-white p-4 rounded-3xl border border-gray-100 shadow-sm flex flex-col md:flex-row items-stretch md:items-center gap-4">
        <div className="relative flex-1">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Cari kampanye berdasarkan judul atau slug..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-11 pr-4 py-2.5 rounded-2xl border border-gray-200 focus:border-[#E31837] focus:ring-2 focus:ring-red-100 outline-none text-sm"
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-gray-500">Status:</span>
          <select
            value={filterState}
            onChange={(e) => setFilterState(e.target.value)}
            className="px-3 py-2 rounded-xl border border-gray-200 text-xs font-medium bg-white focus:outline-none focus:border-[#E31837]"
          >
            <option value="all">Semua Status</option>
            <option value="published">Terbit (Published)</option>
            <option value="draft">Draft Privat</option>
            <option value="archived">Arsip (Archived)</option>
          </select>
        </div>
      </div>

      {/* Table / Empty State */}
      {filteredCampaigns.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-3xl border border-gray-100 shadow-sm p-8 space-y-4">
          <div className="w-16 h-16 bg-red-50 text-[#E31837] rounded-3xl flex items-center justify-center mx-auto">
            <ImageIcon size={32} />
          </div>
          <h3 className="text-lg font-bold text-gray-900">
            {searchQuery || filterState !== 'all'
              ? 'Tidak ada kampanye yang sesuai filter'
              : 'Belum Ada Kampanye Twibbon di Database'}
          </h3>
          <p className="text-gray-500 text-sm max-w-md mx-auto">
            {searchQuery || filterState !== 'all'
              ? 'Coba ubah kata kunci pencarian atau filter status.'
              : 'Mulai dengan menyiapkan draft Twibbon Diklat Kepemimpinan 2026 atau buat kampanye twibbon baru.'}
          </p>
          <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
            {!hasDiklatCampaign && !dbSchemaMissing && (
              <button
                type="button"
                onClick={handleInitDiklatCampaign}
                disabled={isCreatingDiklat}
                className="inline-flex items-center gap-2 bg-gray-900 hover:bg-black text-white font-bold px-5 py-2.5 rounded-2xl shadow-sm text-xs sm:text-sm"
              >
                <Sparkles size={16} />
                <span>Siapkan Draft Diklat 2026</span>
              </button>
            )}
            <Link
              href="/dashboard/humas/twibbon/baru"
              className="inline-flex items-center gap-2 bg-[#E31837] hover:bg-red-700 text-white font-bold px-6 py-2.5 rounded-2xl shadow-sm text-xs sm:text-sm"
            >
              <Plus size={16} />
              <span>Buat Kampanye Baru</span>
            </Link>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/70 text-gray-500 text-xs uppercase font-bold tracking-wider">
                  <th className="py-4 px-6">Kampanye Twibbon</th>
                  <th className="py-4 px-4">Status & Versi</th>
                  <th className="py-4 px-4">Kegiatan Terkait</th>
                  <th className="py-4 px-4">Diperbarui</th>
                  <th className="py-4 px-6 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-sm">
                {filteredCampaigns.map((c) => {
                  const title = c.draft_payload?.title || c.slug;
                  const relatedEventId = c.event_id || c.draft_payload?.related_event_id;
                  const relatedEvent = relatedEventId ? eventMap.get(relatedEventId) : null;
                  const canDelete = c.state === 'draft' && !c.published_revision_id;

                  return (
                    <tr key={c.id} className="hover:bg-gray-50/80 transition-colors">
                      <td className="py-4 px-6">
                        <div className="flex items-start gap-3">
                          <div className="w-11 h-11 rounded-2xl bg-red-50 text-[#E31837] flex items-center justify-center shrink-0 border border-red-100">
                            <ImageIcon size={20} />
                          </div>
                          <div>
                            <div className="font-bold text-gray-900 hover:text-[#E31837] transition-colors line-clamp-1">
                              <Link href={`/dashboard/humas/twibbon/${c.id}`}>{title}</Link>
                            </div>
                            <div className="text-xs text-gray-500 font-mono mt-0.5 flex items-center gap-1.5">
                              <span>/twibbon/{c.slug}</span>
                              {c.slug_locked && (
                                <span className="text-[10px] bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded font-sans font-semibold">
                                  Slug Terkunci
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="py-4 px-4 whitespace-nowrap">
                        <div className="space-y-1">
                          {getStateBadge(c.state, Boolean(c.has_unpublished_changes))}
                          <div className="text-[11px] text-gray-400 font-mono">
                            edit_version: v{c.edit_version}
                          </div>
                        </div>
                      </td>

                      <td className="py-4 px-4 text-xs text-gray-600">
                        {relatedEvent ? (
                          <div className="space-y-0.5 max-w-xs">
                            <div className="font-bold text-gray-800 line-clamp-1">
                              {relatedEvent.title}
                            </div>
                            {relatedEvent.starts_at && (
                              <div className="flex items-center gap-1 text-gray-500">
                                <Calendar size={12} />
                                <span>
                                  {new Date(relatedEvent.starts_at).toLocaleDateString('id-ID', {
                                    day: 'numeric',
                                    month: 'short',
                                    year: 'numeric',
                                  })}
                                </span>
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-gray-400">Tidak terhubung</span>
                        )}
                      </td>

                      <td className="py-4 px-4 whitespace-nowrap text-xs text-gray-500">
                        {new Date(c.updated_at).toLocaleString('id-ID', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>

                      <td className="py-4 px-6 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-2">
                          {/* Pratinjau Privat Draft */}
                          <Link
                            href={`/dashboard/humas/twibbon/${c.id}/preview`}
                            className="p-2 text-gray-600 hover:text-amber-700 hover:bg-amber-50 rounded-xl transition-colors"
                            title="Pratinjau Privat Draft"
                          >
                            <Eye size={16} />
                          </Link>

                          {/* Halaman Publik (jika sudah terbit/arsip) */}
                          {c.state !== 'draft' && (
                            <Link
                              href={`/twibbon/${c.slug}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-colors"
                              title="Buka Halaman Publik"
                            >
                              <ExternalLink size={16} />
                            </Link>
                          )}

                          {/* Edit */}
                          <Link
                            href={`/dashboard/humas/twibbon/${c.id}`}
                            className="p-2 text-gray-600 hover:text-[#E31837] hover:bg-red-50 rounded-xl transition-colors"
                            title="Edit Kampanye Twibbon"
                          >
                            <Edit3 size={16} />
                          </Link>

                          {/* Hapus Draft */}
                          {canDelete ? (
                            <button
                              type="button"
                              onClick={() => setCampaignToDelete(c)}
                              className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                              title="Hapus Draft"
                            >
                              <Trash2 size={16} />
                            </button>
                          ) : (
                            <span
                              className="p-2 text-gray-300 cursor-not-allowed"
                              title="Kampanye yang pernah dipublikasikan dilindungi (gunakan fitur Arsip)"
                            >
                              <Trash2 size={16} />
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal Konfirmasi Hapus Draft */}
      {campaignToDelete && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-gray-100 space-y-5">
            <div className="w-12 h-12 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center mx-auto">
              <Trash2 size={24} />
            </div>
            <div className="text-center space-y-2">
              <h3 className="text-xl font-bold text-gray-900">Hapus Draft Twibbon?</h3>
              <p className="text-sm text-gray-500">
                Apakah Anda yakin ingin menghapus draft kampanye{' '}
                <strong className="text-gray-900">
                  &ldquo;{campaignToDelete.draft_payload?.title || campaignToDelete.slug}&rdquo;
                </strong>
                ? Tindakan ini tidak dapat dibatalkan.
              </p>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setCampaignToDelete(null)}
                className="flex-1 py-3 px-4 rounded-xl border border-gray-200 text-gray-700 font-semibold hover:bg-gray-50 transition-colors text-sm"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleDeleteDraft}
                disabled={loadingActionId === campaignToDelete.id}
                className="flex-1 py-3 px-4 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold transition-colors text-sm disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loadingActionId === campaignToDelete.id ? (
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
