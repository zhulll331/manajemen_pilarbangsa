"use client";

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import { 
  PublicEvent, 
  PublicEventResource, 
  PublishStatus, 
  RegistrationStatus, 
  ResourceItemType, 
  ResourceLinkRole 
} from '@/types/events';
import { 
  ArrowLeft, 
  Save, 
  Send, 
  Eye, 
  AlertCircle, 
  CheckCircle2, 
  Plus, 
  Trash2, 
  ArrowUp, 
  ArrowDown, 
  Link as LinkIcon, 
  FileText, 
  Heading, 
  Lock, 
  Star, 
  Calendar, 
  MapPin, 
  Globe, 
  Copy, 
  RefreshCw, 
  Info,
  Check,
  Sparkles,
  Upload,
  Image as ImageIcon,
  Loader2,
  X
} from 'lucide-react';
import { convertAndCompressToWebP } from '@/utils/compressImage';
import {
  normalizeEventTimestamps,
  toWibDateTimeLocalInput,
  fromWibDateTimeLocalInput,
} from '@/utils/eventDate';

interface Props {
  initialEvent: PublicEvent | null;
  initialResources: PublicEventResource[];
  isNew: boolean;
}

export default function EditorKegiatanClient({ initialEvent, initialResources, isNew }: Props) {
  const router = useRouter();
  const supabase = createClient();

  const normalizedInitial = useMemo(
    () => (initialEvent ? normalizeEventTimestamps(initialEvent) : null),
    [initialEvent]
  );

  // Form State Event
  const [title, setTitle] = useState(normalizedInitial?.title || '');
  const [slug, setSlug] = useState(normalizedInitial?.slug || '');
  const [isSlugAuto, setIsSlugAuto] = useState(isNew);
  const [summary, setSummary] = useState(normalizedInitial?.summary || '');
  const [description, setDescription] = useState(normalizedInitial?.description || '');
  const [bannerUrl, setBannerUrl] = useState(normalizedInitial?.banner_url || '');
  const [startsAt, setStartsAt] = useState(
    toWibDateTimeLocalInput(normalizedInitial?.starts_at)
  );
  const [endsAt, setEndsAt] = useState(
    toWibDateTimeLocalInput(normalizedInitial?.ends_at)
  );
  const [location, setLocation] = useState(initialEvent?.location || '');
  const [publishStatus, setPublishStatus] = useState<PublishStatus>(
    initialEvent?.publish_status || 'draft'
  );
  const [registrationStatus, setRegistrationStatus] = useState<RegistrationStatus>(
    initialEvent?.registration_status || 'na'
  );
  const [isFeatured, setIsFeatured] = useState<boolean>(initialEvent?.is_featured || false);
  const [slugLocked] = useState<boolean>(initialEvent?.slug_locked || false);
  const [version, setVersion] = useState<number>(initialEvent?.version || 1);

  // Resources State
  const [resources, setResources] = useState<PublicEventResource[]>(
    initialResources.map((res, idx) => ({ ...res, sort_order: idx + 1 }))
  );

  // UI & Loading State
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isDirty, setIsDirty] = useState(false);

  // Banner Upload State
  const [isUploadingBanner, setIsUploadingBanner] = useState(false);
  const [bannerUploadStatus, setBannerUploadStatus] = useState<string | null>(null);
  const [showManualUrlInput, setShowManualUrlInput] = useState(false);

  // Track changes for beforeunload
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isDirty]);

  // Sinkronisasi otomatis ke database apabila mendeteksi timestamp lama yang bergeser akibat bug UTC
  useEffect(() => {
    if (
      !isNew &&
      initialEvent &&
      normalizedInitial &&
      (initialEvent.starts_at !== normalizedInitial.starts_at ||
        initialEvent.ends_at !== normalizedInitial.ends_at)
    ) {
      supabase
        .from('public_events')
        .update({
          starts_at: normalizedInitial.starts_at,
          ends_at: normalizedInitial.ends_at,
        })
        .eq('id', initialEvent.id)
        .select('version')
        .single()
        .then(({ data }) => {
          if (data?.version) {
            setVersion(data.version);
          }
          fetch('/api/admin/kegiatan/revalidate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ slug: initialEvent.slug }),
          }).catch(() => {});
        });
    }
  }, [isNew, initialEvent, normalizedInitial, supabase]);

  const markDirty = () => {
    if (!isDirty) setIsDirty(true);
  };

  // Handler Upload Foto Banner ke Supabase Storage (Auto-WebP)
  const handleBannerUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Reset input value agar user bisa memilih kembali berkas yang sama jika diperlukan
    e.target.value = '';

    if (!file.type.startsWith('image/')) {
      setErrorMessage('Berkas yang dipilih harus berupa format gambar (PNG, JPG, JPEG, WEBP, dll).');
      return;
    }

    setIsUploadingBanner(true);
    setBannerUploadStatus('Mengompresi & mengonversi gambar ke WebP...');
    setErrorMessage(null);

    try {
      // 1. Konversi ke WebP dan kompres efisien di client side
      const webpFile = await convertAndCompressToWebP(file, 1920, 0.82, 450 * 1024);
      
      const originalSizeKB = Math.round(file.size / 1024);
      const webpSizeKB = Math.round(webpFile.size / 1024);
      
      setBannerUploadStatus(`Menyimpan ke Supabase Storage (${webpSizeKB} KB)...`);

      // 2. Buat nama berkas unik
      const eventSlugPrefix = slug ? slug.substring(0, 30) : 'kegiatan';
      const cleanPrefix = eventSlugPrefix.replace(/[^a-zA-Z0-9_-]/g, '').toLowerCase() || 'banner';
      const fileName = `banner-${cleanPrefix}-${Date.now()}.webp`;

      // 3. Upload ke bucket 'event-banners'
      const { error: uploadError } = await supabase.storage
        .from('event-banners')
        .upload(fileName, webpFile, {
          cacheControl: '3600',
          upsert: true,
          contentType: 'image/webp',
        });

      if (uploadError) {
        throw new Error('Gagal mengunggah banner ke Supabase Storage: ' + uploadError.message);
      }

      // 4. Dapatkan public URL
      const { data: publicUrlData } = supabase.storage
        .from('event-banners')
        .getPublicUrl(fileName);

      if (!publicUrlData?.publicUrl) {
        throw new Error('Gagal mendapatkan tautan publik untuk banner yang diunggah.');
      }

      setBannerUrl(publicUrlData.publicUrl);
      markDirty();
      setSuccessMessage(
        `Banner berhasil diunggah! Berkas dioptimasi dari ${originalSizeKB} KB menjadi ${webpSizeKB} KB (.WebP).`
      );
    } catch (err: any) {
      setErrorMessage(err.message || 'Terjadi kesalahan saat memproses gambar banner.');
    } finally {
      setIsUploadingBanner(false);
      setBannerUploadStatus(null);
    }
  };

  const handleRemoveBanner = () => {
    setBannerUrl('');
    markDirty();
  };

  // Helper Auto Generate Slug
  const generateSlug = (text: string) => {
    return text
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 100);
  };

  const handleTitleChange = (val: string) => {
    setTitle(val);
    markDirty();
    if (isSlugAuto && !slugLocked) {
      setSlug(generateSlug(val));
    }
  };

  const handleSlugChange = (val: string) => {
    if (slugLocked) return;
    setIsSlugAuto(false);
    setSlug(generateSlug(val));
    markDirty();
  };

  // Resources helpers
  const handleAddResource = (type: ResourceItemType) => {
    markDirty();
    const newRes: PublicEventResource = {
      id: `temp-${Date.now()}-${Math.random()}`,
      event_id: initialEvent?.id || '',
      item_type: type,
      title: type === 'section_header' ? 'Judul Bagian Baru' : '',
      description: '',
      url: type === 'link' ? 'https://' : null,
      link_role: 'general',
      content: type === 'text' ? '' : null,
      copyable: false,
      is_required: false,
      is_visible: true,
      sort_order: resources.length + 1,
    };
    setResources((prev) => [...prev, newRes]);
  };

  const handleUpdateResource = (index: number, updates: Partial<PublicEventResource>) => {
    markDirty();
    setResources((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], ...updates };
      return copy;
    });
  };

  const handleMoveResource = (index: number, direction: 'up' | 'down') => {
    markDirty();
    setResources((prev) => {
      const copy = [...prev];
      const targetIndex = direction === 'up' ? index - 1 : index + 1;
      if (targetIndex < 0 || targetIndex >= copy.length) return prev;
      const temp = copy[index];
      copy[index] = copy[targetIndex];
      copy[targetIndex] = temp;
      return copy.map((item, idx) => ({ ...item, sort_order: idx + 1 }));
    });
  };

  const handleDeleteResource = (index: number) => {
    markDirty();
    setResources((prev) => {
      const copy = prev.filter((_, idx) => idx !== index);
      return copy.map((item, idx) => ({ ...item, sort_order: idx + 1 }));
    });
  };

  // Validasi sebelum simpan
  const validate = (targetPublishStatus: PublishStatus) => {
    if (!title.trim()) {
      return 'Judul kegiatan wajib diisi.';
    }
    if (title.length > 120) {
      return 'Judul kegiatan maksimal 120 karakter.';
    }
    if (!slug.trim()) {
      return 'Slug URL kegiatan wajib diisi.';
    }
    const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
    if (!slugRegex.test(slug)) {
      return 'Slug hanya boleh berisi huruf kecil, angka, dan tanda hubung (-). Contoh: diklat-pb-2026';
    }
    if (summary && summary.length > 300) {
      return 'Ringkasan kegiatan maksimal 300 karakter.';
    }
    if (bannerUrl && !bannerUrl.startsWith('https://')) {
      return 'URL Banner harus menggunakan protokol aman HTTPS (https://...).';
    }
    const startIso = fromWibDateTimeLocalInput(startsAt);
    const endIso = fromWibDateTimeLocalInput(endsAt);
    if (startIso && endIso && new Date(endIso) < new Date(startIso)) {
      return 'Waktu selesai tidak boleh lebih awal dari waktu mulai.';
    }

    // Validasi Resources
    for (let i = 0; i < resources.length; i++) {
      const res = resources[i];
      if (!res.title.trim()) {
        return `Item #${i + 1}: Judul item wajib diisi.`;
      }
      if (res.item_type === 'link') {
        if (!res.url || !res.url.startsWith('https://')) {
          return `Item #${i + 1} (${res.title}): Tautan URL harus diawali dengan https://`;
        }
        if (/^(javascript|data|vbscript):/i.test(res.url)) {
          return `Item #${i + 1}: Format URL tidak aman.`;
        }
      }
      if (res.item_type === 'text') {
        if (!res.content || !res.content.trim()) {
          return `Item #${i + 1} (${res.title}): Isi teks tidak boleh kosong.`;
        }
        if (res.content.length > 10000) {
          return `Item #${i + 1}: Isi teks melebihi batas 10.000 karakter.`;
        }
      }
    }

    // Validasi syarat publikasi
    if (targetPublishStatus === 'published') {
      const visibleContentItems = resources.filter(
        (r) => r.is_visible && (r.item_type === 'link' || r.item_type === 'text')
      );
      if (visibleContentItems.length === 0) {
        return 'Syarat publikasi: Minimal harus ada 1 item berjenis Tautan atau Teks yang berstatus aktif/tampil.';
      }
    }

    return null;
  };

  // Simpan data
  const handleSave = async (targetPublishStatus: PublishStatus) => {
    setErrorMessage(null);
    setSuccessMessage(null);

    const validationError = validate(targetPublishStatus);
    if (validationError) {
      setErrorMessage(validationError);
      return;
    }

    setIsSaving(true);

    try {
      // 1. Optimistic Locking Check jika edit yang sudah ada
      if (!isNew && initialEvent?.id) {
        const { data: currentDbEvent, error: checkErr } = await supabase
          .from('public_events')
          .select('version')
          .eq('id', initialEvent.id)
          .single();

        if (checkErr) throw checkErr;

        if (currentDbEvent && currentDbEvent.version > version) {
          setErrorMessage(
            'Konflik Perubahan: Kegiatan ini telah diperbarui oleh pengguna lain sejak Anda membuka form ini. Harap muat ulang halaman agar perubahan tidak tertimpa.'
          );
          setIsSaving(false);
          return;
        }
      }

      // Ambil user auth saat ini
      const { data: { user } } = await supabase.auth.getUser();

      const eventPayload = {
        title: title.trim(),
        slug: slug.trim(),
        summary: summary.trim() || null,
        description: description.trim() || null,
        banner_url: bannerUrl.trim() || null,
        starts_at: fromWibDateTimeLocalInput(startsAt),
        ends_at: fromWibDateTimeLocalInput(endsAt),
        location: location.trim() || null,
        publish_status: targetPublishStatus,
        registration_status: registrationStatus,
        is_featured: targetPublishStatus === 'published' ? isFeatured : false,
        updated_by: user?.id || null,
      };

      let savedEventId = initialEvent?.id;

      if (isNew) {
        const { data: insertResult, error: insertError } = await supabase
          .from('public_events')
          .insert({
            ...eventPayload,
            created_by: user?.id || null,
          })
          .select('id, version')
          .single();

        if (insertError) {
          if (insertError.code === '23505') {
            throw new Error('Slug URL sudah digunakan oleh kegiatan lain. Harap ubah slug.');
          }
          throw insertError;
        }

        savedEventId = insertResult.id;
        setVersion(insertResult.version);
      } else {
        const { data: updateResult, error: updateError } = await supabase
          .from('public_events')
          .update(eventPayload)
          .eq('id', savedEventId)
          .select('id, version, slug_locked')
          .single();

        if (updateError) {
          if (updateError.code === '23505') {
            throw new Error('Slug URL sudah digunakan oleh kegiatan lain. Harap ubah slug.');
          }
          throw updateError;
        }

        setVersion(updateResult.version);
      }

      // 2. Simpan Resources secara atomik
      // Hapus resource lama untuk event ini
      const { error: deleteResError } = await supabase
        .from('public_event_resources')
        .delete()
        .eq('event_id', savedEventId);

      if (deleteResError) throw deleteResError;

      // Insert resources baru jika ada
      if (resources.length > 0) {
        const resourcesToInsert = resources.map((r, idx) => ({
          event_id: savedEventId,
          item_type: r.item_type,
          title: r.title.trim(),
          description: r.description?.trim() || null,
          url: r.item_type === 'link' ? r.url?.trim() || null : null,
          link_role: r.link_role,
          content: r.item_type === 'text' ? r.content || null : null,
          copyable: r.item_type === 'text' ? !!r.copyable : false,
          is_required: !!r.is_required,
          is_visible: r.is_visible,
          sort_order: idx + 1,
        }));

        const { error: insertResError } = await supabase
          .from('public_event_resources')
          .insert(resourcesToInsert);

        if (insertResError) throw insertResError;
      }

      setIsDirty(false);
      setPublishStatus(targetPublishStatus);
      setSuccessMessage(
        targetPublishStatus === 'published'
          ? 'Kegiatan berhasil dipublikasikan! Halaman publik kini dapat diakses.'
          : 'Perubahan kegiatan berhasil disimpan sebagai draft.'
      );

      // Revalidasi cache halaman publik (/kegiatan/[slug], /kegiatan, /, /twibbon) secara instan
      try {
        await fetch('/api/admin/kegiatan/revalidate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ slug: slug.trim() }),
        });
      } catch {
        // Abaikan jika gagal revalidasi jaringan
      }

      if (isNew) {
        router.replace(`/dashboard/humas/kegiatan/${savedEventId}`);
      } else {
        router.refresh();
      }
    } catch (err: any) {
      console.error('Gagal menyimpan kegiatan:', err);
      setErrorMessage(err.message || 'Terjadi kesalahan saat menyimpan data.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-16">
      {/* Top Bar Navigation & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 sticky top-0 z-30 bg-white/95 backdrop-blur-md py-4 px-6 rounded-3xl border border-gray-100 shadow-sm">
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/humas/kegiatan"
            className="p-2.5 rounded-2xl border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors"
            title="Kembali ke Daftar"
          >
            <ArrowLeft size={18} />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-gray-900 line-clamp-1">
              {isNew ? 'Buat Kegiatan Baru' : `Edit: ${title || 'Tanpa Judul'}`}
            </h1>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-xs text-gray-500 font-mono">
                {slug ? `/kegiatan/${slug}` : 'Slug otomatis'}
              </span>
              {slugLocked && (
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-gray-500 bg-gray-100 px-2 py-0.5 rounded-md">
                  <Lock size={10} /> Terkunci
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          {/* Tombol Pratinjau jika sudah terbit/arsip atau ada slug */}
          {!isNew && slug && (
            <Link
              href={`/kegiatan/${slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-2xl border border-gray-200 text-gray-700 hover:bg-gray-50 text-xs font-bold transition-all"
            >
              <Eye size={15} />
              <span>Lihat Publik</span>
            </Link>
          )}

          {/* Tombol Simpan Draft */}
          <button
            type="button"
            onClick={() => handleSave('draft')}
            disabled={isSaving}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl border border-gray-300 bg-white hover:bg-gray-50 text-gray-800 text-xs sm:text-sm font-bold shadow-sm transition-all disabled:opacity-50"
          >
            {isSaving ? <RefreshCw size={15} className="animate-spin" /> : <Save size={15} />}
            <span>Simpan Draft</span>
          </button>

          {/* Tombol Terbitkan / Simpan Perubahan */}
          <button
            type="button"
            onClick={() => handleSave('published')}
            disabled={isSaving}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-2xl bg-[#E31837] hover:bg-red-700 text-white text-xs sm:text-sm font-bold shadow-md hover:shadow-lg transition-all disabled:opacity-50"
          >
            {isSaving ? <RefreshCw size={15} className="animate-spin" /> : <Send size={15} />}
            <span>{publishStatus === 'published' ? 'Simpan Perubahan' : 'Publikasikan'}</span>
          </button>
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Kolom Kiri & Tengah: Section A & Section C */}
        <div className="lg:col-span-2 space-y-8">
          {/* SECTION A: Informasi Utama Acara */}
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-gray-100 shadow-sm space-y-6">
            <div className="border-b border-gray-100 pb-4">
              <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#E31837]"></span>
                Informasi Utama Kegiatan
              </h2>
              <p className="text-xs text-gray-500 mt-1">
                Data umum acara yang akan ditampilkan di header halaman publik.
              </p>
            </div>

            {/* Judul Kegiatan */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Judul Kegiatan <span className="text-red-500">*</span>
                </label>
                <span className={`text-xs ${title.length > 120 ? 'text-red-600 font-bold' : 'text-gray-400'}`}>
                  {title.length}/120
                </span>
              </div>
              <input
                type="text"
                value={title}
                onChange={(e) => handleTitleChange(e.target.value)}
                maxLength={120}
                placeholder="Contoh: Diklat Manajemen Organisasi 2026"
                className="w-full px-4 py-3 rounded-2xl border border-gray-200 focus:border-[#E31837] focus:ring-2 focus:ring-red-100 outline-none text-sm font-medium"
              />
            </div>

            {/* Slug URL */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Slug Tautan Publik <span className="text-red-500">*</span>
                </label>
                {slugLocked ? (
                  <span className="text-xs text-amber-600 flex items-center gap-1 font-medium">
                    <Lock size={12} /> Terkunci setelah publikasi
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      setIsSlugAuto(true);
                      setSlug(generateSlug(title));
                      markDirty();
                    }}
                    className="text-xs text-blue-600 hover:underline flex items-center gap-1"
                  >
                    <Sparkles size={12} /> Generate dari Judul
                  </button>
                )}
              </div>
              <div className="flex items-center">
                <span className="px-3.5 py-3 bg-gray-50 border border-r-0 border-gray-200 rounded-l-2xl text-xs text-gray-500 font-mono">
                  /kegiatan/
                </span>
                <input
                  type="text"
                  value={slug}
                  disabled={slugLocked}
                  onChange={(e) => handleSlugChange(e.target.value)}
                  placeholder="diklat-manajemen-2026"
                  className="w-full px-4 py-3 rounded-r-2xl border border-gray-200 focus:border-[#E31837] focus:ring-2 focus:ring-red-100 outline-none text-sm font-mono disabled:bg-gray-100 disabled:text-gray-500"
                />
              </div>
              {slugLocked && (
                <p className="text-[11px] text-gray-500">
                  Slug dikunci otomatis untuk mencegah rusaknya tautan yang sudah disebarkan kepada peserta.
                </p>
              )}
            </div>

            {/* Ringkasan */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Ringkasan Singkat (Subtitle)
                </label>
                <span className={`text-xs ${summary.length > 300 ? 'text-red-600 font-bold' : 'text-gray-400'}`}>
                  {summary.length}/300
                </span>
              </div>
              <textarea
                value={summary}
                onChange={(e) => {
                  setSummary(e.target.value);
                  markDirty();
                }}
                maxLength={300}
                rows={2}
                placeholder="Deskripsi 1-2 kalimat untuk preview dan media sosial..."
                className="w-full px-4 py-3 rounded-2xl border border-gray-200 focus:border-[#E31837] focus:ring-2 focus:ring-red-100 outline-none text-sm resize-none"
              />
            </div>

            {/* Deskripsi Lengkap */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                Deskripsi Lengkap Acara
              </label>
              <textarea
                value={description}
                onChange={(e) => {
                  setDescription(e.target.value);
                  markDirty();
                }}
                rows={5}
                placeholder="Penjelasan detail seputar latar belakang acara, ketentuan umum, atau petunjuk bagi peserta..."
                className="w-full px-4 py-3 rounded-2xl border border-gray-200 focus:border-[#E31837] focus:ring-2 focus:ring-red-100 outline-none text-sm"
              />
            </div>

            {/* Banner URL & Upload Preview */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-gray-700 uppercase tracking-wider flex items-center gap-1.5">
                  <ImageIcon size={14} className="text-gray-400" />
                  <span>Gambar Banner Kegiatan</span>
                  <span className="text-[10px] bg-red-100 text-[#E31837] px-2 py-0.5 rounded-full font-bold">
                    Auto-WebP
                  </span>
                </label>
                <button
                  type="button"
                  onClick={() => setShowManualUrlInput(!showManualUrlInput)}
                  className="text-xs text-gray-500 hover:text-[#E31837] transition-colors underline cursor-pointer"
                >
                  {showManualUrlInput ? 'Sembunyikan URL Manual' : 'Input URL Manual (Opsional)'}
                </button>
              </div>

              {/* Upload Dropzone / Action */}
              <div className="grid grid-cols-1 gap-3">
                <label
                  className={`relative flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-2xl cursor-pointer transition-all duration-200 ${
                    isUploadingBanner
                      ? 'bg-gray-50 border-gray-300 pointer-events-none'
                      : 'border-gray-200 hover:border-[#E31837] hover:bg-red-50/20 bg-white'
                  }`}
                >
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleBannerUpload}
                    disabled={isUploadingBanner}
                    className="sr-only"
                  />

                  {isUploadingBanner ? (
                    <div className="flex flex-col items-center gap-2 text-center py-2">
                      <Loader2 size={32} className="animate-spin text-[#E31837]" />
                      <p className="text-sm font-bold text-gray-800">{bannerUploadStatus || 'Memproses berkas...'}</p>
                      <p className="text-xs text-gray-400">Sedang mengompresi ke WebP dan menyimpan ke Supabase Storage</p>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-2 text-center">
                      <div className="w-12 h-12 rounded-2xl bg-red-50 text-[#E31837] flex items-center justify-center shadow-xs">
                        <Upload size={22} />
                      </div>
                      <div>
                        <span className="text-sm font-bold text-gray-800 hover:text-[#E31837] transition-colors">
                          {bannerUrl ? 'Klik untuk mengganti foto banner' : 'Pilih atau Tarik Foto Banner ke Sini'}
                        </span>
                        <p className="text-xs text-gray-500 mt-0.5">
                          Format foto apapun otomatis dikonversi ke <strong className="text-gray-700">WebP</strong> & dikompres seefisien mungkin ke bucket <code className="bg-gray-100 px-1.5 py-0.5 rounded font-mono text-[11px] text-[#E31837]">event-banners</code>
                        </p>
                      </div>
                    </div>
                  )}
                </label>

                {/* Input URL Manual jika dibutuhkan */}
                {showManualUrlInput && (
                  <div className="space-y-1.5 pt-1">
                    <label className="text-[11px] font-semibold text-gray-500">
                      Tautan URL Gambar Banner Langsung (HTTPS):
                    </label>
                    <input
                      type="url"
                      value={bannerUrl}
                      onChange={(e) => {
                        setBannerUrl(e.target.value);
                        markDirty();
                      }}
                      placeholder="https://images.unsplash.com/... atau URL banner resmi"
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-[#E31837] focus:ring-2 focus:ring-red-100 outline-none text-xs font-mono"
                    />
                  </div>
                )}
              </div>

              {/* Preview Banner */}
              {bannerUrl && (
                <div className="mt-2 rounded-2xl overflow-hidden border border-gray-200 bg-gray-900/5 relative group">
                  <div className="aspect-21/9 max-h-64 w-full overflow-hidden bg-gray-100 flex items-center justify-center">
                    <img
                      src={bannerUrl}
                      alt="Preview Banner"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLElement).style.display = 'none';
                      }}
                    />
                  </div>
                  
                  {/* Overlay Controls */}
                  <div className="absolute top-3 left-3 bg-black/60 text-white text-[11px] px-3 py-1.5 rounded-xl backdrop-blur-md flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-green-400"></span>
                    <span>Banner Terpasang (WebP)</span>
                  </div>

                  <div className="absolute top-3 right-3 flex items-center gap-2">
                    <a
                      href={bannerUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 rounded-xl bg-black/60 hover:bg-black/80 text-white text-xs backdrop-blur-md transition-all flex items-center gap-1"
                      title="Buka gambar penuh di tab baru"
                    >
                      <Eye size={14} />
                    </a>
                    <button
                      type="button"
                      onClick={handleRemoveBanner}
                      className="p-2 rounded-xl bg-red-600/80 hover:bg-red-600 text-white text-xs backdrop-blur-md transition-all flex items-center gap-1 cursor-pointer"
                      title="Hapus gambar banner"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>

                  <div className="p-3 bg-white border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
                    <span className="font-mono text-[11px] truncate max-w-md">{bannerUrl}</span>
                    <span className="text-[10px] text-green-700 bg-green-50 font-bold px-2 py-0.5 rounded-full shrink-0">
                      Aktif di Halaman Publik
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Jadwal Pelaksanaan */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-700 uppercase tracking-wider flex items-center gap-1.5">
                  <Calendar size={14} className="text-gray-400" />
                  Waktu Mulai
                </label>
                <input
                  type="datetime-local"
                  value={startsAt}
                  onChange={(e) => {
                    setStartsAt(e.target.value);
                    markDirty();
                  }}
                  className="w-full px-4 py-3 rounded-2xl border border-gray-200 focus:border-[#E31837] focus:ring-2 focus:ring-red-100 outline-none text-sm"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-700 uppercase tracking-wider flex items-center gap-1.5">
                  <Calendar size={14} className="text-gray-400" />
                  Waktu Selesai (Opsional)
                </label>
                <input
                  type="datetime-local"
                  value={endsAt}
                  onChange={(e) => {
                    setEndsAt(e.target.value);
                    markDirty();
                  }}
                  className="w-full px-4 py-3 rounded-2xl border border-gray-200 focus:border-[#E31837] focus:ring-2 focus:ring-red-100 outline-none text-sm"
                />
              </div>
            </div>

            {/* Lokasi */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-700 uppercase tracking-wider flex items-center gap-1.5">
                <MapPin size={14} className="text-gray-400" />
                Lokasi Pelaksanaan
              </label>
              <input
                type="text"
                value={location}
                onChange={(e) => {
                  setLocation(e.target.value);
                  markDirty();
                }}
                placeholder="Contoh: Gedung Aula KH. Ahmad Dahlan / Google Meet"
                className="w-full px-4 py-3 rounded-2xl border border-gray-200 focus:border-[#E31837] focus:ring-2 focus:ring-red-100 outline-none text-sm"
              />
            </div>
          </div>

          {/* SECTION C: Daftar Item & Konten (Tautan, Twibbon, Caption, Form) */}
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-gray-100 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 pb-4">
              <div>
                <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#008000]"></span>
                  Daftar Item & Materi Kegiatan
                </h2>
                <p className="text-xs text-gray-500 mt-1">
                  Atur tautan eksternal, materi teks, twibbon, dan pemisah bagian dengan bebas.
                </p>
              </div>

              {/* Tombol Tambah Item */}
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleAddResource('link')}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-blue-50 text-blue-700 hover:bg-blue-100 text-xs font-bold transition-colors"
                >
                  <Plus size={14} />
                  <span>+ Tautan</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleAddResource('text')}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-50 text-emerald-700 hover:bg-emerald-100 text-xs font-bold transition-colors"
                >
                  <Plus size={14} />
                  <span>+ Teks / Caption</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleAddResource('section_header')}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-gray-100 text-gray-700 hover:bg-gray-200 text-xs font-bold transition-colors"
                >
                  <Plus size={14} />
                  <span>+ Judul Bagian</span>
                </button>
              </div>
            </div>

            {/* List of Resource Items */}
            {resources.length === 0 ? (
              <div className="text-center py-12 bg-gray-50 rounded-2xl border border-dashed border-gray-200 p-6 space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-white shadow-sm border border-gray-100 flex items-center justify-center mx-auto text-gray-400">
                  <Plus size={24} />
                </div>
                <div className="text-sm font-semibold text-gray-700">Belum Ada Item Konten</div>
                <p className="text-xs text-gray-500 max-w-sm mx-auto">
                  Tambahkan tombol pendaftaran, tautan twibbon, caption media sosial, atau berkas panduan menggunakan tombol di atas.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {resources.map((res, index) => (
                  <div
                    key={res.id}
                    className={`p-5 rounded-2xl border transition-all ${
                      res.is_visible
                        ? 'bg-white border-gray-200 shadow-xs'
                        : 'bg-gray-50/70 border-gray-200 opacity-70'
                    }`}
                  >
                    {/* Item Header Controls */}
                    <div className="flex items-center justify-between gap-3 border-b border-gray-100 pb-3 mb-4">
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded-lg bg-gray-100 text-gray-700 text-xs font-bold flex items-center justify-center">
                          {index + 1}
                        </span>

                        {/* Badge Tipe */}
                        {res.item_type === 'link' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
                            <LinkIcon size={12} /> Tautan
                          </span>
                        )}
                        {res.item_type === 'text' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <FileText size={12} /> Teks / Caption
                          </span>
                        )}
                        {res.item_type === 'section_header' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-50 text-purple-700 border border-purple-200">
                            <Heading size={12} /> Judul Bagian
                          </span>
                        )}

                        {!res.is_visible && (
                          <span className="text-[11px] font-semibold text-gray-500 bg-gray-200 px-2 py-0.5 rounded-md">
                            Disembunyikan
                          </span>
                        )}
                      </div>

                      {/* Urutan & Aksi Kontrol */}
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleMoveResource(index, 'up')}
                          disabled={index === 0}
                          className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg disabled:opacity-30"
                          title="Pindah ke atas"
                        >
                          <ArrowUp size={16} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleMoveResource(index, 'down')}
                          disabled={index === resources.length - 1}
                          className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg disabled:opacity-30"
                          title="Pindah ke bawah"
                        >
                          <ArrowDown size={16} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteResource(index)}
                          className="p-1.5 text-red-400 hover:text-red-700 hover:bg-red-50 rounded-lg ml-1"
                          title="Hapus Item"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>

                    {/* Form Fields per Type */}
                    <div className="space-y-4">
                      {/* Judul Item */}
                      <div>
                        <label className="text-xs font-semibold text-gray-600 block mb-1">
                          {res.item_type === 'section_header' ? 'Teks Judul Bagian' : 'Judul / Label Tombol'}
                        </label>
                        <input
                          type="text"
                          value={res.title}
                          onChange={(e) => handleUpdateResource(index, { title: e.target.value })}
                          placeholder={
                            res.item_type === 'link'
                              ? 'Contoh: Formulir Pendaftaran Peserta Diklat'
                              : res.item_type === 'text'
                              ? 'Contoh: Caption Twibbon Instagram'
                              : 'Contoh: Berkas & Twibbon Kegiatan'
                          }
                          className="w-full px-3.5 py-2 rounded-xl border border-gray-200 focus:border-[#E31837] focus:ring-1 focus:ring-red-100 text-sm font-medium"
                        />
                      </div>

                      {/* Deskripsi Tambahan Opsional */}
                      {res.item_type !== 'section_header' && (
                        <div>
                          <label className="text-xs font-semibold text-gray-600 block mb-1">
                            Keterangan Tambahan (Opsional)
                          </label>
                          <input
                            type="text"
                            value={res.description || ''}
                            onChange={(e) => handleUpdateResource(index, { description: e.target.value })}
                            placeholder="Contoh: Wajib diisi sebelum batas akhir 30 Oktober 2026"
                            className="w-full px-3.5 py-2 rounded-xl border border-gray-200 focus:border-[#E31837] text-xs text-gray-600"
                          />
                        </div>
                      )}

                      {/* Field Khusus TAUTAN */}
                      {res.item_type === 'link' && (
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                          <div className="sm:col-span-2 space-y-1">
                            <label className="text-xs font-semibold text-gray-600 block">
                              URL Tautan (HTTPS) <span className="text-red-500">*</span>
                            </label>
                            <input
                              type="url"
                              value={res.url || ''}
                              onChange={(e) => handleUpdateResource(index, { url: e.target.value })}
                              placeholder="https://forms.gle/... atau https://twb.nz/..."
                              className="w-full px-3.5 py-2 rounded-xl border border-gray-200 focus:border-[#E31837] text-xs font-mono"
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="text-xs font-semibold text-gray-600 block">
                              Peran Tautan
                            </label>
                            <select
                              value={res.link_role}
                              onChange={(e) =>
                                handleUpdateResource(index, {
                                  link_role: e.target.value as ResourceLinkRole,
                                })
                              }
                              className="w-full px-3 py-2 rounded-xl border border-gray-200 bg-white text-xs font-medium focus:border-[#E31837]"
                            >
                              <option value="general">Tautan Biasa</option>
                              <option value="registration">Tautan Pendaftaran</option>
                            </select>
                            {res.link_role === 'registration' && (
                              <p className="text-[10px] text-gray-500 mt-1">
                                Akan otomatis dinonaktifkan jika status pendaftaran "Ditutup" atau "Segera".
                              </p>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Field Khusus TEKS / CAPTION */}
                      {res.item_type === 'text' && (
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <label className="text-xs font-semibold text-gray-600">
                              Konten Teks (Mendukung Emoji & Paragraf)
                            </label>
                            <span className="text-[11px] text-gray-400">
                              {(res.content || '').length}/10000
                            </span>
                          </div>
                          <textarea
                            value={res.content || ''}
                            onChange={(e) => handleUpdateResource(index, { content: e.target.value })}
                            rows={4}
                            placeholder="Tuliskan teks caption media sosial atau instruksi..."
                            className="w-full px-3.5 py-2 rounded-xl border border-gray-200 focus:border-[#E31837] text-xs font-mono"
                          />
                        </div>
                      )}

                      {/* Options Checkboxes */}
                      <div className="flex flex-wrap items-center gap-6 pt-2 border-t border-gray-100 text-xs">
                        {/* Toggle Visibilitas */}
                        <label className="flex items-center gap-2 cursor-pointer select-none text-gray-700">
                          <input
                            type="checkbox"
                            checked={res.is_visible}
                            onChange={(e) => handleUpdateResource(index, { is_visible: e.target.checked })}
                            className="rounded text-[#E31837] focus:ring-red-400"
                          />
                          <span>Tampilkan di halaman publik</span>
                        </label>

                        {/* Checkbox Copyable (hanya untuk tipe teks) */}
                        {res.item_type === 'text' && (
                          <label className="flex items-center gap-2 cursor-pointer select-none text-gray-700 font-medium">
                            <input
                              type="checkbox"
                              checked={res.copyable}
                              onChange={(e) => handleUpdateResource(index, { copyable: e.target.checked })}
                              className="rounded text-[#008000] focus:ring-green-400"
                            />
                            <span className="flex items-center gap-1 text-[#008000]">
                              <Copy size={13} />
                              Sediakan tombol "Salin Teks" untuk pengunjung
                            </span>
                          </label>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Kolom Kanan: Section B (Pengaturan Publikasi & Status) */}
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-6 sticky top-28">
            <div className="border-b border-gray-100 pb-3">
              <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#FFD700]"></span>
                Pengaturan Publikasi
              </h2>
            </div>

            {/* Status Publikasi */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-700 uppercase tracking-wider block">
                Status Halaman
              </label>
              <select
                value={publishStatus}
                onChange={(e) => {
                  setPublishStatus(e.target.value as PublishStatus);
                  markDirty();
                }}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm font-semibold focus:border-[#E31837] focus:outline-none"
              >
                <option value="draft">Draft (Hanya terlihat di panel admin)</option>
                <option value="published">Terbit (Dapat diakses publik)</option>
                <option value="archived">Arsip (Kegiatan telah berlalu)</option>
              </select>
              <p className="text-[11px] text-gray-500">
                {publishStatus === 'draft' && 'Kegiatan tersimpan aman dan tidak bisa dilihat pengunjung.'}
                {publishStatus === 'published' && 'Halaman dapat diakses publik, masuk ke indeks dan sitemap.'}
                {publishStatus === 'archived' && (
                  <span className="block mt-1 p-2 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-[11px] font-medium leading-relaxed">
                    ⚠️ <strong>Kebijakan Penghematan Penyimpanan:</strong> Kegiatan yang diarsipkan akan otomatis terhapus permanen beserta foto bannernya pada H+14 setelah kegiatan selesai (atau H+14 sejak diarsipkan jika waktu selesai kosong).
                  </span>
                )}
              </p>
            </div>

            {/* Status Pendaftaran */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-700 uppercase tracking-wider block">
                Status Pendaftaran Peserta
              </label>
              <select
                value={registrationStatus}
                onChange={(e) => {
                  setRegistrationStatus(e.target.value as RegistrationStatus);
                  markDirty();
                }}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm font-semibold focus:border-[#E31837] focus:outline-none"
              >
                <option value="na">Tidak Berlaku / Tidak Ada</option>
                <option value="soon">Segera Dibuka</option>
                <option value="open">Pendaftaran Dibuka</option>
                <option value="closed">Pendaftaran Ditutup</option>
              </select>
              <p className="text-[11px] text-gray-500">
                Mengatur badge status dan keaktifan tombol formulir pendaftaran.
              </p>
            </div>

            {/* Toggle Sorotan Beranda */}
            <div className="pt-2 border-t border-gray-100 space-y-3">
              <label
                className={`flex items-start gap-3 p-3.5 rounded-2xl border transition-all select-none ${
                  publishStatus !== 'published'
                    ? 'bg-gray-50 border-gray-200 opacity-60 cursor-not-allowed'
                    : isFeatured
                    ? 'bg-amber-50 border-amber-300 text-amber-900 cursor-pointer'
                    : 'bg-white border-gray-200 hover:bg-gray-50 cursor-pointer'
                }`}
              >
                <input
                  type="checkbox"
                  checked={isFeatured}
                  disabled={publishStatus !== 'published'}
                  onChange={(e) => {
                    setIsFeatured(e.target.checked);
                    markDirty();
                  }}
                  className="mt-1 rounded text-amber-600 focus:ring-amber-500"
                />
                <div className="space-y-1">
                  <div className="text-xs font-bold flex items-center gap-1.5">
                    <Star size={14} className={isFeatured ? 'fill-amber-500 text-amber-500' : 'text-gray-400'} />
                    <span>Jadikan Sorotan Utama di Beranda</span>
                  </div>
                  <p className="text-[11px] text-gray-500 leading-snug">
                    Kegiatan ini akan dipasang di card sorotan halaman beranda utama website. Hanya 1 kegiatan yang dapat disorot.
                  </p>
                </div>
              </label>
              {publishStatus !== 'published' && (
                <p className="text-[10px] text-gray-400 italic">
                  * Catatan: Sorotan hanya dapat diaktifkan jika status halaman adalah "Terbit".
                </p>
              )}
            </div>

            {/* Metadata Info */}
            {!isNew && initialEvent && (
              <div className="pt-4 border-t border-gray-100 text-xs text-gray-400 space-y-1">
                <div>Dibuat: {new Date(initialEvent.created_at).toLocaleString('id-ID')}</div>
                <div>Terakhir update: {new Date(initialEvent.updated_at).toLocaleString('id-ID')}</div>
                <div>Versi Dokumen: v{version}</div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
