'use client';

import React, { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import {
  Image as ImageIcon,
  Save,
  RefreshCw,
  CheckCircle2,
  Upload,
  AlertCircle,
  Trash2,
  Plus,
  Database,
  ArrowRight,
} from 'lucide-react';
import { compressImageIfNeeded } from '@/utils/compressImage';
import { PilarLoader } from '@/components/PilarLoader';
import {
  isTableMissingError,
  normalizeHeroImageUrl,
  splitHeroTitle,
} from '@/lib/heroSlides';

type TableMode = 'hero_slides' | 'banners';

interface AdminBannerSlide {
  id: string;
  image_url: string;
  badge: string;
  title: string;
  subtitle: string;
  description: string;
  accent_color: string;
  cta_primary_label: string;
  cta_primary_href: string;
  cta_secondary_label: string;
  cta_secondary_href: string;
  sort_order: number;
  is_active: boolean;
}

function readStr(val: unknown, fallback = ''): string {
  return typeof val === 'string' ? val : fallback;
}

export default function BannerManagementPage() {
  const [tableMode, setTableMode] = useState<TableMode>('hero_slides');
  const [slides, setSlides] = useState<AdminBannerSlide[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [selectedFiles, setSelectedFiles] = useState<Record<string, File | null>>({});
  const [notification, setNotification] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  const notify = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 4500);
  };

  const triggerHomepageRevalidate = () => {
    fetch('/api/admin/kegiatan/revalidate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: '{}',
    }).catch(() => {
      // Abaikan kegagalan revalidasi latar belakang
    });
  };

  const [periodCtx, setPeriodCtx] = useState<{
    selectedPeriodId: string | null;
    isLocked: boolean;
    schemaReady: boolean;
  }>({ selectedPeriodId: null, isLocked: false, schemaReady: false });

  useEffect(() => {
    let cancelled = false;
    async function loadBanners() {
      const supabase = createClient();
      const ctxRes = await fetch('/api/admin/period-context')
        .then((r) => (r.ok ? r.json() : null))
        .catch(() => null);
      const activeCtx = ctxRes
        ? {
            selectedPeriodId: (ctxRes.selectedPeriodId as string) || null,
            isLocked: Boolean(ctxRes.isLocked),
            schemaReady: Boolean(ctxRes.schemaReady),
          }
        : { selectedPeriodId: null, isLocked: false, schemaReady: false };

      if (!cancelled) {
        setPeriodCtx(activeCtx);
      }

      let heroQuery = supabase
        .from('hero_slides')
        .select(
          'id, image_url, badge, title, description, cta_primary_label, cta_primary_href, cta_secondary_label, cta_secondary_href, sort_order, is_active, created_at'
        )
        .order('sort_order', { ascending: true })
        .order('created_at', { ascending: true });

      if (activeCtx.schemaReady && activeCtx.selectedPeriodId) {
        heroQuery = heroQuery.eq('period_id', activeCtx.selectedPeriodId);
      }

      const { data: heroData, error: heroError } = await heroQuery;

      if (cancelled) return;

      if (!heroError && Array.isArray(heroData)) {
        setTableMode('hero_slides');
        setSlides(
          heroData.map((raw, idx) => {
            const r = raw as Record<string, unknown>;
            return {
              id: String(r.id),
              image_url: readStr(r.image_url),
              badge: readStr(r.badge),
              title: readStr(r.title),
              subtitle: '',
              description: readStr(r.description),
              accent_color: '#E31837',
              cta_primary_label: readStr(r.cta_primary_label, 'Lihat Program Kerja'),
              cta_primary_href: readStr(r.cta_primary_href, '/program-kerja'),
              cta_secondary_label: readStr(r.cta_secondary_label),
              cta_secondary_href: readStr(r.cta_secondary_href),
              sort_order: typeof r.sort_order === 'number' ? r.sort_order : idx + 1,
              is_active: typeof r.is_active === 'boolean' ? r.is_active : true,
            };
          })
        );
        setLoading(false);
        return;
      }

      if (heroError && isTableMissingError(heroError)) {
        const { data: legacyData, error: legacyError } = await supabase
          .from('banners')
          .select('*')
          .order('id', { ascending: true });

        if (cancelled) return;

        setTableMode('banners');
        if (!legacyError && Array.isArray(legacyData)) {
          setSlides(
            legacyData.map((raw, idx) => {
              const r = raw as Record<string, unknown>;
              return {
                id: String(r.id),
                image_url: readStr(r.image_url),
                badge: readStr(r.badge),
                title: readStr(r.title),
                subtitle: readStr(r.subtitle),
                description: readStr(r.description),
                accent_color: readStr(r.accent_color, '#E31837'),
                cta_primary_label: 'Lihat Program Kerja',
                cta_primary_href: '/program-kerja',
                cta_secondary_label: 'Pelajari Lebih Lanjut',
                cta_secondary_href: '/tentang-kami',
                sort_order: idx + 1,
                is_active: true,
              };
            })
          );
        }
        setLoading(false);
        return;
      }

      setLoading(false);
    }

    loadBanners();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleFieldChange = <K extends keyof AdminBannerSlide>(
    id: string,
    field: K,
    value: AdminBannerSlide[K]
  ) => {
    setSlides((prev) =>
      prev.map((slide) => (slide.id === id ? { ...slide, [field]: value } : slide))
    );
  };

  const handleFileChange = (id: string, file: File | null) => {
    setSelectedFiles((prev) => ({ ...prev, [id]: file }));
  };

  const handleSave = async (id: string) => {
    if (periodCtx.isLocked) {
      notify('error', 'Periode ini sudah dikunci permanen dan tidak dapat diubah.');
      return;
    }
    setSavingId(id);
    setNotification(null);
    const currentSlide = slides.find((s) => s.id === id);
    if (!currentSlide) {
      setSavingId(null);
      return;
    }

    try {
      const supabase = createClient();
      let finalImageUrl = currentSlide.image_url;
      const fileToUpload = selectedFiles[id];

      if (fileToUpload) {
        const compressed = await compressImageIfNeeded(fileToUpload, 1, 1920);
        const ext = compressed.type === 'image/png' ? 'png' : 'jpg';
        const fileName = `banner-${currentSlide.id}-${Date.now()}.${ext}`;

        const { error: uploadError } = await supabase.storage
          .from('banner-images')
          .upload(fileName, compressed, { upsert: true, contentType: compressed.type });

        if (uploadError) {
          throw new Error('Gagal mengunggah gambar ke Supabase: ' + uploadError.message);
        }

        const { data: publicUrlData } = supabase.storage
          .from('banner-images')
          .getPublicUrl(fileName);
        finalImageUrl = publicUrlData.publicUrl;
      }

      if (tableMode === 'hero_slides') {
        const { error } = await supabase
          .from('hero_slides')
          .update({
            image_url: finalImageUrl,
            badge: currentSlide.badge,
            title: currentSlide.title,
            description: currentSlide.description,
            cta_primary_label: currentSlide.cta_primary_label || 'Lihat Program Kerja',
            cta_primary_href: currentSlide.cta_primary_href || '/program-kerja',
            cta_secondary_label: currentSlide.cta_secondary_label.trim() || null,
            cta_secondary_href: currentSlide.cta_secondary_href.trim() || null,
            sort_order: Number(currentSlide.sort_order) || 0,
            is_active: currentSlide.is_active,
          })
          .eq('id', currentSlide.id);

        if (error) throw error;
      } else {
        const { error } = await supabase.from('banners').upsert({
          id: Number(currentSlide.id),
          title: currentSlide.title,
          subtitle: currentSlide.subtitle,
          description: currentSlide.description,
          image_url: finalImageUrl,
          badge: currentSlide.badge,
          accent_color: currentSlide.accent_color || '#E31837',
        });

        if (error) throw error;
      }

      setSlides((prev) =>
        prev.map((s) => (s.id === id ? { ...s, image_url: finalImageUrl } : s))
      );
      setSelectedFiles((prev) => ({ ...prev, [id]: null }));
      triggerHomepageRevalidate();
      notify('success', 'Slide hero beranda berhasil diperbarui dan disinkronkan!');
    } catch (error: unknown) {
      const msg =
        error instanceof Error ? error.message : 'Terjadi kesalahan saat menyimpan banner.';
      notify('error', msg);
    } finally {
      setSavingId(null);
    }
  };

  const handleAddBanner = async () => {
    if (periodCtx.isLocked) {
      notify('error', 'Periode ini sudah dikunci permanen dan tidak dapat menambah slide.');
      return;
    }
    try {
      const supabase = createClient();

      if (tableMode === 'hero_slides') {
        const nextOrder =
          slides.length > 0 ? Math.max(...slides.map((s) => s.sort_order)) + 1 : 1;
        const { data, error } = await supabase
          .from('hero_slides')
          .insert([
            {
              image_url:
                'https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=1400&q=80',
              badge: 'Agenda UKM',
              title: 'Judul Slide Baru | UKM Pilar Bangsa',
              description:
                'Deskripsi ringkas yang menjelaskan sorotan atau program unggulan slide ini.',
              cta_primary_label: 'Lihat Program Kerja',
              cta_primary_href: '/program-kerja',
              cta_secondary_label: 'Pelajari Lebih Lanjut',
              cta_secondary_href: '/tentang-kami',
              sort_order: nextOrder,
              is_active: true,
              ...(periodCtx.schemaReady && periodCtx.selectedPeriodId
                ? { period_id: periodCtx.selectedPeriodId }
                : {}),
            },
          ])
          .select();

        if (error) throw error;
        if (data && data.length > 0) {
          const r = data[0] as Record<string, unknown>;
          setSlides((prev) => [
            ...prev,
            {
              id: String(r.id),
              image_url: readStr(r.image_url),
              badge: readStr(r.badge),
              title: readStr(r.title),
              subtitle: '',
              description: readStr(r.description),
              accent_color: '#E31837',
              cta_primary_label: readStr(r.cta_primary_label, 'Lihat Program Kerja'),
              cta_primary_href: readStr(r.cta_primary_href, '/program-kerja'),
              cta_secondary_label: readStr(r.cta_secondary_label),
              cta_secondary_href: readStr(r.cta_secondary_href),
              sort_order: typeof r.sort_order === 'number' ? r.sort_order : nextOrder,
              is_active: typeof r.is_active === 'boolean' ? r.is_active : true,
            },
          ]);
        }
      } else {
        const nextId =
          slides.length > 0 ? Math.max(...slides.map((s) => Number(s.id) || 0)) + 1 : 1;
        const newBanner = {
          id: nextId,
          title: 'Judul Slide Baru | UKM Pilar Bangsa',
          subtitle: 'Wadah Transformasi Mahasiswa',
          description:
            'Deskripsi ringkas yang tampil pada hero banner halaman beranda.',
          image_url:
            'https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=1400&q=80',
          badge: 'Agenda UKM',
          accent_color: '#E31837',
        };
        const { data, error } = await supabase.from('banners').insert([newBanner]).select();
        if (error) throw error;
        if (data && data.length > 0) {
          const r = data[0] as Record<string, unknown>;
          setSlides((prev) => [
            ...prev,
            {
              id: String(r.id),
              image_url: readStr(r.image_url),
              badge: readStr(r.badge),
              title: readStr(r.title),
              subtitle: readStr(r.subtitle),
              description: readStr(r.description),
              accent_color: readStr(r.accent_color, '#E31837'),
              cta_primary_label: 'Lihat Program Kerja',
              cta_primary_href: '/program-kerja',
              cta_secondary_label: 'Pelajari Lebih Lanjut',
              cta_secondary_href: '/tentang-kami',
              sort_order: slides.length + 1,
              is_active: true,
            },
          ]);
        }
      }

      triggerHomepageRevalidate();
      notify('success', 'Slide hero baru berhasil ditambahkan.');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gagal menambahkan banner';
      notify('error', msg);
    }
  };

  const handleDeleteBanner = async (id: string) => {
    if (periodCtx.isLocked) {
      notify('error', 'Periode ini sudah dikunci permanen dan tidak dapat menghapus slide.');
      return;
    }
    if (!confirm('Apakah Anda yakin ingin menghapus slide banner ini?')) return;
    try {
      const supabase = createClient();
      const currentSlide = slides.find((s) => s.id === id);
      if (
        currentSlide?.image_url &&
        currentSlide.image_url.includes('.supabase.co/storage/v1/object/public/banner-images/')
      ) {
        const parts = currentSlide.image_url.split('/');
        const fileName = parts[parts.length - 1];
        if (fileName) {
          await supabase.storage.from('banner-images').remove([fileName]);
        }
      }

      if (tableMode === 'hero_slides') {
        const { error } = await supabase.from('hero_slides').delete().eq('id', id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('banners').delete().eq('id', Number(id));
        if (error) throw error;
      }

      setSlides((prev) => prev.filter((s) => s.id !== id));
      triggerHomepageRevalidate();
      notify('success', 'Slide banner berhasil dihapus.');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gagal menghapus banner';
      notify('error', msg);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center w-full min-h-[calc(100dvh-190px)] gap-3.5 text-center">
        <PilarLoader size="md" label="Memuat data banner" />
        <p className="text-xs font-medium text-[#686e68] tracking-wide">Sabarr yah...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 relative pb-20">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Pengaturan Hero Banner Beranda</h1>
          <p className="text-gray-600 mt-1 text-sm">
            Kelola slide hero banner halaman beranda publik dengan pratinjau langsung tata letak terbaru.
          </p>
          <div className="mt-2 inline-flex items-center gap-2 text-xs font-semibold px-3 py-1 rounded-full bg-gray-100 text-gray-700 border border-gray-200">
            <Database size={13} />
            <span>
              Sumber Data Aktif:{' '}
              {tableMode === 'hero_slides'
                ? 'Tabel hero_slides (Penuh: Urutan, CTA, Status Aktif)'
                : 'Tabel banners (Kompatibel — jalankan supabase_tahap19_hero_slides.sql untuk tombol CTA kustom)'}
            </span>
          </div>
        </div>
        <button
          type="button"
          onClick={handleAddBanner}
          className="inline-flex items-center justify-center gap-2 bg-[#E31837] hover:bg-red-700 text-white px-4 py-2.5 rounded-lg font-semibold text-sm transition-colors shadow-sm shrink-0"
        >
          <Plus size={18} />
          <span>Tambah Slide Banner</span>
        </button>
      </div>

      {notification && (
        <div
          role={notification.type === 'error' ? 'alert' : 'status'}
          className={`fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg flex items-center gap-3 text-white ${
            notification.type === 'success' ? 'bg-green-600' : 'bg-red-600'
          }`}
        >
          {notification.type === 'success' ? (
            <CheckCircle2 size={20} />
          ) : (
            <AlertCircle size={20} />
          )}
          <span className="font-medium text-sm">{notification.message}</span>
        </div>
      )}

      {slides.map((slide, index) => {
        const previewFile = selectedFiles[slide.id];
        const previewImgSrc = previewFile
          ? URL.createObjectURL(previewFile)
          : normalizeHeroImageUrl(slide.image_url);
        const { primaryLine, accentLine } = splitHeroTitle(slide.title || 'Judul Banner');

        return (
          <div
            key={slide.id}
            className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 flex flex-col xl:flex-row gap-8"
          >
            {/* Kolom Kiri: Form Input */}
            <div className="flex-1 space-y-4">
              <div className="flex flex-wrap items-center gap-3 pb-3 border-b border-gray-100">
                <span className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-xs font-bold">
                  Slide #{index + 1}
                </span>

                {tableMode === 'hero_slides' && (
                  <label className="inline-flex items-center gap-2 text-xs font-semibold text-gray-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={slide.is_active}
                      onChange={(e) =>
                        handleFieldChange(slide.id, 'is_active', e.target.checked)
                      }
                      className="w-4 h-4 accent-[#E31837]"
                    />
                    <span>Tampilkan di Beranda (Aktif)</span>
                  </label>
                )}

                <button
                  type="button"
                  onClick={() => handleDeleteBanner(slide.id)}
                  className="text-red-500 hover:bg-red-50 p-2 rounded-lg transition-colors ml-auto"
                  title="Hapus Banner"
                  aria-label={`Hapus slide ${slide.title}`}
                >
                  <Trash2 size={18} />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Judul Utama
                  </label>
                  <input
                    type="text"
                    value={slide.title}
                    onChange={(e) => handleFieldChange(slide.id, 'title', e.target.value)}
                    className="w-full border border-gray-300 p-2.5 rounded-lg text-sm focus:ring-2 focus:ring-red-200 focus:border-[#E31837] outline-none"
                  />
                  <p className="text-[11px] text-gray-500 mt-1">
                    Tips: gunakan tanda <code className="bg-gray-100 px-1 rounded">|</code> untuk memisahkan baris hitam &amp; baris kedua warna merah.
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Teks Badge Kategori
                  </label>
                  <input
                    type="text"
                    value={slide.badge}
                    onChange={(e) => handleFieldChange(slide.id, 'badge', e.target.value)}
                    className="w-full border border-gray-300 p-2.5 rounded-lg text-sm focus:ring-2 focus:ring-red-200 focus:border-[#E31837] outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Deskripsi Singkat Hero
                </label>
                <textarea
                  value={slide.description}
                  onChange={(e) => handleFieldChange(slide.id, 'description', e.target.value)}
                  rows={3}
                  className="w-full border border-gray-300 p-2.5 rounded-lg text-sm focus:ring-2 focus:ring-red-200 focus:border-[#E31837] outline-none resize-none"
                />
              </div>

              {tableMode === 'hero_slides' ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 bg-gray-50 p-3.5 rounded-lg border border-gray-200">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Tombol Utama
                    </label>
                    <input
                      type="text"
                      value={slide.cta_primary_label}
                      onChange={(e) =>
                        handleFieldChange(slide.id, 'cta_primary_label', e.target.value)
                      }
                      className="w-full border border-gray-300 p-2 rounded-lg text-xs bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Link Utama
                    </label>
                    <input
                      type="text"
                      value={slide.cta_primary_href}
                      onChange={(e) =>
                        handleFieldChange(slide.id, 'cta_primary_href', e.target.value)
                      }
                      className="w-full border border-gray-300 p-2 rounded-lg text-xs bg-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Tombol Sekunder
                    </label>
                    <input
                      type="text"
                      value={slide.cta_secondary_label}
                      onChange={(e) =>
                        handleFieldChange(slide.id, 'cta_secondary_label', e.target.value)
                      }
                      placeholder="Opsional"
                      className="w-full border border-gray-300 p-2 rounded-lg text-xs bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Link Sekunder
                    </label>
                    <input
                      type="text"
                      value={slide.cta_secondary_href}
                      onChange={(e) =>
                        handleFieldChange(slide.id, 'cta_secondary_href', e.target.value)
                      }
                      placeholder="/tentang-kami"
                      className="w-full border border-gray-300 p-2 rounded-lg text-xs bg-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Urutan
                    </label>
                    <input
                      type="number"
                      value={slide.sort_order}
                      onChange={(e) =>
                        handleFieldChange(
                          slide.id,
                          'sort_order',
                          parseInt(e.target.value, 10) || 0
                        )
                      }
                      className="w-full border border-gray-300 p-2 rounded-lg text-xs bg-white"
                    />
                  </div>
                </div>
              ) : (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Sub Judul (Fallback jika deskripsi kosong)
                  </label>
                  <input
                    type="text"
                    value={slide.subtitle}
                    onChange={(e) => handleFieldChange(slide.id, 'subtitle', e.target.value)}
                    className="w-full border border-gray-300 p-2.5 rounded-lg text-sm focus:ring-2 focus:ring-red-200 focus:border-[#E31837] outline-none"
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Ganti Foto Latar Kanan (Upload otomatis ke Supabase Storage)
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleFileChange(slide.id, e.target.files?.[0] || null)}
                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-red-50 file:text-[#E31837] hover:file:bg-red-100"
                  />
                  {selectedFiles[slide.id] && (
                    <span className="text-xs font-medium text-blue-700 whitespace-nowrap bg-blue-50 px-2.5 py-1 rounded">
                      Siap diunggah
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-500 mt-1.5">
                  Disarankan rasio landscape (min. 1280×720) dengan subjek orang berada agak ke kanan agar memudar halus dengan teks kiri.
                </p>
              </div>

              <div className="pt-3 border-t border-gray-100 flex justify-end">
                <button
                  type="button"
                  onClick={() => handleSave(slide.id)}
                  disabled={savingId === slide.id}
                  className={`inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg text-white font-semibold text-sm transition-colors ${
                    savingId === slide.id
                      ? 'bg-gray-400 cursor-not-allowed'
                      : selectedFiles[slide.id]
                        ? 'bg-[#E31837] hover:bg-red-700'
                        : 'bg-gray-900 hover:bg-black'
                  }`}
                >
                  {savingId === slide.id ? (
                    <>
                      <RefreshCw className="animate-spin" size={16} />
                      <span>Menyimpan...</span>
                    </>
                  ) : (
                    <>
                      {selectedFiles[slide.id] ? <Upload size={16} /> : <Save size={16} />}
                      <span>Simpan Perubahan</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Kolom Kanan: Pratinjau Desain Hero Baru (Split Terang + Foto Kanan Fade Halus) */}
            <div className="xl:w-[42%] flex flex-col bg-gray-50 rounded-lg border border-gray-200 overflow-hidden shrink-0">
              <div className="px-3.5 py-2.5 bg-gray-100 border-b border-gray-200 flex items-center justify-between">
                <span className="text-[11px] font-bold text-gray-600 uppercase tracking-wider">
                  Pratinjau Hero Beranda Baru
                </span>
                {!slide.is_active && tableMode === 'hero_slides' && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-100 text-amber-800">
                    Nonaktif
                  </span>
                )}
              </div>

              <div className="relative bg-white min-h-[240px] flex overflow-hidden">
                {/* Foto kanan + fade ke kiri */}
                <div className="absolute inset-y-0 right-0 w-[62%]">
                  <img
                    src={previewImgSrc}
                    alt={slide.title}
                    className="w-full h-full object-cover object-[center_22%]"
                  />
                  <div
                    className="absolute inset-0 pointer-events-none"
                    style={{
                      background:
                        'linear-gradient(to right, #ffffff 0%, rgba(255,255,255,0.92) 18%, rgba(255,255,255,0.55) 42%, transparent 72%)',
                    }}
                  />
                </div>

                {/* Teks kiri */}
                <div className="relative z-10 w-[64%] p-5 flex flex-col justify-center space-y-2.5">
                  {slide.badge && (
                    <span className="inline-flex w-fit items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-red-50 text-[#E31837] border border-red-100 text-[10px] font-bold uppercase tracking-wider">
                      {slide.badge}
                    </span>
                  )}

                  <h4 className="font-extrabold text-sm sm:text-base leading-tight text-gray-900">
                    <span className="block">{primaryLine}</span>
                    {accentLine && <span className="block text-[#E31837]">{accentLine}</span>}
                  </h4>

                  <p className="text-[11px] text-gray-600 line-clamp-2 leading-relaxed">
                    {slide.description || slide.subtitle}
                  </p>

                  <div className="flex flex-wrap gap-1.5 pt-1">
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-[#E31837] text-white text-[10px] font-semibold">
                      <span>{slide.cta_primary_label || 'Lihat Program Kerja'}</span>
                      <ArrowRight size={10} />
                    </span>
                    {slide.cta_secondary_label && (
                      <span className="inline-flex items-center px-2.5 py-1 rounded border border-gray-300 bg-white text-gray-800 text-[10px] font-semibold">
                        {slide.cta_secondary_label}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      })}

      {slides.length === 0 && (
        <div className="text-center p-12 bg-white rounded-xl border border-gray-200">
          <ImageIcon className="mx-auto h-12 w-12 text-gray-300 mb-4" />
          <h3 className="text-lg font-medium text-gray-900">Belum ada Banner Hero</h3>
          <p className="mt-1 text-sm text-gray-500">
            Tambahkan slide banner untuk ditampilkan pada hero halaman beranda publik.
          </p>
          <div className="mt-6">
            <button
              type="button"
              onClick={handleAddBanner}
              className="inline-flex items-center gap-2 bg-[#E31837] hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-semibold"
            >
              <Plus size={18} />
              <span>Tambah Slide Perdana</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
