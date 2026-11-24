'use client';

import { useState } from 'react';
import Image from 'next/image';
import {
  ArrowDown,
  ArrowUp,
  Camera,
  CheckCircle2,
  Eye,
  EyeOff,
  Info,
  Lock,
  Pencil,
  Plus,
  Trash2,
  Upload,
  X,
} from 'lucide-react';
import { DataModal } from '@/components/DataModal';
import { DeleteConfirm } from '@/components/DeleteConfirm';
import type { MomentPhotoItem } from '@/lib/momentPhotos';
import { compressImageIfNeeded } from '@/utils/compressImage';
import { createClient } from '@/utils/supabase/client';
import {
  createMomentPhotoAction,
  deleteMomentPhotoAction,
  swapMomentPhotoOrderAction,
  toggleMomentPhotoActiveAction,
  updateMomentPhotoAction,
} from './actions';

const POSITION_PRESETS = [
  { label: 'Fokus Wajah / Atas (center 25%)', value: 'center 25%' },
  { label: 'Seimbang (center 35%)', value: 'center 35%' },
  { label: 'Tengah Penuh (center center)', value: 'center center' },
  { label: 'Bawah (center 70%)', value: 'center 70%' },
];

interface MomenClientProps {
  initialPhotos: MomentPhotoItem[];
  isLocked: boolean;
  periodId: string;
  periodCode: string;
  tableReady: boolean;
}

function getPreviewUrl(src: MomentPhotoItem['src']): string {
  return typeof src === 'string' ? src : src.src;
}

export default function MomenClient({
  initialPhotos,
  isLocked,
  periodId,
  periodCode,
  tableReady,
}: MomenClientProps) {
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<MomentPhotoItem | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<MomentPhotoItem | null>(null);

  const [imageUrl, setImageUrl] = useState('');
  const [storagePath, setStoragePath] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewObjectUrl, setPreviewObjectUrl] = useState<string | null>(null);
  const [altText, setAltText] = useState('');
  const [rotationDeg, setRotationDeg] = useState(0);
  const [objectPosition, setObjectPosition] = useState('center 35%');
  const [isActive, setIsActive] = useState(true);

  const [submitting, setSubmitting] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [bannerMsg, setBannerMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(
    null
  );

  const activeCount = initialPhotos.filter((p) => p.isActive).length;

  const resetForm = () => {
    if (previewObjectUrl) {
      URL.revokeObjectURL(previewObjectUrl);
    }
    setSelectedFile(null);
    setPreviewObjectUrl(null);
    setEditingItem(null);
    setImageUrl('');
    setStoragePath(null);
    setAltText('');
    setRotationDeg(0);
    setObjectPosition('center 35%');
    setIsActive(true);
  };

  const openAddModal = () => {
    resetForm();
    const defaultRotations = [-2.5, 1.8, -1.5, 2.5, -2.0, 1.5, -1.0, 2.2];
    setRotationDeg(defaultRotations[initialPhotos.length % defaultRotations.length]);
    setShowModal(true);
  };

  const openEditModal = (photo: MomentPhotoItem) => {
    if (previewObjectUrl) {
      URL.revokeObjectURL(previewObjectUrl);
    }
    setSelectedFile(null);
    setPreviewObjectUrl(null);
    setEditingItem(photo);
    setImageUrl(getPreviewUrl(photo.src));
    setStoragePath(photo.storagePath || null);
    setAltText(photo.alt);
    setRotationDeg(photo.rotation);
    setObjectPosition(photo.objectPosition || 'center 35%');
    setIsActive(photo.isActive);
    setShowModal(true);
  };

  const handleFilePick = (file: File | null) => {
    if (previewObjectUrl) {
      URL.revokeObjectURL(previewObjectUrl);
    }
    setSelectedFile(file);
    if (file) {
      setPreviewObjectUrl(URL.createObjectURL(file));
    } else {
      setPreviewObjectUrl(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setBannerMsg(null);

    try {
      let finalUrl = imageUrl.trim();
      let finalStoragePath = storagePath;
      const oldStoragePath = editingItem?.storagePath || null;

      if (selectedFile) {
        const compressed = await compressImageIfNeeded(selectedFile, 1.2, 1600);
        const ext =
          compressed.type === 'image/png'
            ? 'png'
            : compressed.type === 'image/webp'
            ? 'webp'
            : 'jpg';
        const safePeriod = periodId.replace(/[^a-zA-Z0-9_-]/g, '');
        const filePath = `momen/${safePeriod}/${Date.now()}-${Math.random()
          .toString(36)
          .slice(2, 8)}.${ext}`;

        const supabase = createClient();
        const { error: uploadError } = await supabase.storage
          .from('dokumen')
          .upload(filePath, compressed, {
            upsert: true,
            contentType: compressed.type || 'image/jpeg',
          });

        if (uploadError) {
          throw new Error(`Gagal mengunggah foto ke penyimpanan: ${uploadError.message}`);
        }

        const { data: urlData } = supabase.storage.from('dokumen').getPublicUrl(filePath);
        finalUrl = urlData.publicUrl;
        finalStoragePath = filePath;
      }

      const payload = {
        imageUrl: finalUrl,
        storagePath: finalStoragePath,
        oldStoragePath,
        altText: altText.trim() || 'Momen Kegiatan UKM Pilar Bangsa',
        rotationDeg,
        objectPosition,
        isActive,
      };

      const res = editingItem
        ? await updateMomentPhotoAction(editingItem.id, payload)
        : await createMomentPhotoAction(payload);

      if (!res.success) {
        throw new Error(res.error || 'Gagal menyimpan perubahan foto.');
      }

      setShowModal(false);
      resetForm();
      setBannerMsg({
        type: 'success',
        text: editingItem
          ? 'Foto Momen Pilar Bangsa berhasil diperbarui dan disinkronkan ke beranda.'
          : 'Foto Momen baru berhasil ditambahkan ke galeri beranda.',
      });
    } catch (err) {
      setBannerMsg({
        type: 'error',
        text: err instanceof Error ? err.message : 'Terjadi kesalahan saat menyimpan foto.',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleActive = async (photo: MomentPhotoItem) => {
    setBusyId(photo.id);
    setBannerMsg(null);
    const res = await toggleMomentPhotoActiveAction(photo.id, !photo.isActive);
    setBusyId(null);
    if (!res.success) {
      setBannerMsg({ type: 'error', text: res.error || 'Gagal mengubah status.' });
    }
  };

  const handleMove = async (index: number, direction: -1 | 1) => {
    const targetIdx = index + direction;
    if (targetIdx < 0 || targetIdx >= initialPhotos.length) return;
    const current = initialPhotos[index];
    const target = initialPhotos[targetIdx];

    setBusyId(current.id);
    setBannerMsg(null);
    const res = await swapMomentPhotoOrderAction(
      current.id,
      current.sortOrder,
      target.id,
      target.sortOrder
    );
    setBusyId(null);
    if (!res.success) {
      setBannerMsg({ type: 'error', text: res.error || 'Gagal mengurutkan foto.' });
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setBusyId(deleteTarget.id);
    setBannerMsg(null);
    const res = await deleteMomentPhotoAction(deleteTarget.id, deleteTarget.storagePath);
    setBusyId(null);
    setDeleteTarget(null);
    if (!res.success) {
      setBannerMsg({ type: 'error', text: res.error || 'Gagal menghapus foto.' });
    } else {
      setBannerMsg({ type: 'success', text: 'Foto momen berhasil dihapus dari galeri.' });
    }
  };

  const liveModalPreview = previewObjectUrl || imageUrl.trim();

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start sm:items-center gap-3">
          <div className="p-2.5 rounded-xl bg-red-50 text-[#E31837] shrink-0">
            <Camera size={24} />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl sm:text-2xl font-bold text-gray-800">
                Momen Pilar Bangsa
              </h1>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                {isLocked && <Lock size={12} />}
                Periode {periodCode}
              </span>
            </div>
            <p className="text-sm text-gray-500">
              Kelola foto dokumentasi berjalan pada seksi Momen Pilar Bangsa di halaman beranda publik.
            </p>
          </div>
        </div>

        {!isLocked && tableReady && (
          <button
            type="button"
            onClick={openAddModal}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-[var(--color-primary)] text-white rounded-xl text-sm font-medium hover:bg-[var(--color-secondary)] transition-colors shadow-xs"
          >
            <Plus size={18} />
            Tambah Foto Momen
          </button>
        )}
      </div>

      {!tableReady && (
        <div
          role="alert"
          className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-sm text-amber-800 flex items-start gap-3"
        >
          <Info size={18} className="shrink-0 mt-0.5 text-amber-600" />
          <div>
            <p className="font-semibold">Tabel galeri momen belum diinisialisasi</p>
            <p className="text-xs mt-1">
              Jalankan file migrasi SQL <code>supabase_tahap20_multi_period.sql</code> di Supabase
              SQL Editor agar Humas dapat mengunggah dan mengganti foto Momen Pilar Bangsa.
            </p>
          </div>
        </div>
      )}

      {bannerMsg && (
        <div
          role={bannerMsg.type === 'error' ? 'alert' : 'status'}
          className={`flex items-center justify-between gap-3 px-4 py-3 rounded-xl border text-sm ${
            bannerMsg.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-red-50 border-red-200 text-red-700'
          }`}
        >
          <span className="inline-flex items-center gap-2">
            {bannerMsg.type === 'success' && <CheckCircle2 size={17} className="shrink-0" />}
            {bannerMsg.text}
          </span>
          <button
            type="button"
            onClick={() => setBannerMsg(null)}
            aria-label="Tutup pemberitahuan"
            className="p-1 rounded hover:bg-black/5"
          >
            <X size={15} />
          </button>
        </div>
      )}

      {tableReady && initialPhotos.length === 0 && (
        <div className="p-5 rounded-2xl bg-blue-50/70 border border-blue-200 text-sm text-blue-900 flex items-start gap-3">
          <Info size={18} className="shrink-0 mt-0.5 text-blue-600" />
          <div>
            <p className="font-semibold">Beranda sedang menampilkan 8 foto bawaan</p>
            <p className="text-xs text-blue-800 mt-1">
              Galeri periode {periodCode} masih kosong. Segera tambahkan minimal 1 foto baru
              (unggah dari perangkat atau tautan gambar) untuk menggantikan foto bawaan di halaman
              utama.
            </p>
          </div>
        </div>
      )}

      {initialPhotos.length > 0 && (
        <div className="flex items-center justify-between text-xs text-gray-500 px-1">
          <span>
            Total {initialPhotos.length} foto tersimpan ·{' '}
            <strong className="text-emerald-700">{activeCount} aktif</strong> tampil di beranda
          </span>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
        {initialPhotos.map((photo, index) => {
          const previewSrc = getPreviewUrl(photo.src);
          const isBusy = busyId === photo.id;
          return (
            <div
              key={photo.id}
              className={`bg-white rounded-2xl border overflow-hidden shadow-xs flex flex-col transition-opacity ${
                photo.isActive ? 'border-gray-200' : 'border-gray-200 opacity-70'
              }`}
            >
              <div className="relative aspect-[4/3] bg-gray-100 overflow-hidden">
                <Image
                  src={previewSrc}
                  alt={photo.alt}
                  fill
                  unoptimized
                  sizes="(max-width: 640px) 100vw, 320px"
                  style={{ objectFit: 'cover', objectPosition: photo.objectPosition }}
                />
                <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5">
                  <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-black/70 text-white">
                    #{index + 1}
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                      photo.isActive
                        ? 'bg-emerald-600 text-white'
                        : 'bg-gray-700 text-gray-100'
                    }`}
                  >
                    {photo.isActive ? 'Aktif' : 'Disembunyikan'}
                  </span>
                </div>
                <span className="absolute bottom-2 right-2 px-2 py-0.5 rounded bg-black/60 text-[11px] text-white">
                  Rotasi {photo.rotation > 0 ? `+${photo.rotation}` : photo.rotation}°
                </span>
              </div>

              <div className="p-4 flex-1 flex flex-col justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-gray-900 line-clamp-2">{photo.alt}</p>
                  <p className="text-xs text-gray-500 mt-1">Fokus: {photo.objectPosition}</p>
                </div>

                {!isLocked && (
                  <div className="flex items-center justify-between gap-1.5 pt-2 border-t border-gray-100">
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        disabled={isBusy || index === 0}
                        onClick={() => handleMove(index, -1)}
                        title="Geser lebih awal"
                        aria-label="Geser ke kiri / atas"
                        className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 disabled:opacity-30"
                      >
                        <ArrowUp size={15} />
                      </button>
                      <button
                        type="button"
                        disabled={isBusy || index === initialPhotos.length - 1}
                        onClick={() => handleMove(index, 1)}
                        title="Geser lebih akhir"
                        aria-label="Geser ke kanan / bawah"
                        className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 disabled:opacity-30"
                      >
                        <ArrowDown size={15} />
                      </button>
                      <button
                        type="button"
                        disabled={isBusy}
                        onClick={() => handleToggleActive(photo)}
                        title={photo.isActive ? 'Sembunyikan' : 'Tampilkan di beranda'}
                        aria-label={photo.isActive ? 'Sembunyikan foto' : 'Aktifkan foto'}
                        className="p-1.5 rounded-lg text-gray-600 hover:bg-gray-100 disabled:opacity-30"
                      >
                        {photo.isActive ? <Eye size={15} /> : <EyeOff size={15} />}
                      </button>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        disabled={isBusy}
                        onClick={() => openEditModal(photo)}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-blue-600 hover:bg-blue-50 transition-colors"
                      >
                        <Pencil size={13} />
                        Ganti / Edit
                      </button>
                      <button
                        type="button"
                        disabled={isBusy}
                        onClick={() => setDeleteTarget(photo)}
                        aria-label={`Hapus ${photo.alt}`}
                        className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 transition-colors"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Add / Edit Photo Modal */}
      <DataModal
        isOpen={showModal}
        onClose={() => {
          if (!submitting) {
            setShowModal(false);
            resetForm();
          }
        }}
        title={editingItem ? 'Ganti / Edit Foto Momen' : 'Tambah Foto Momen Baru'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {liveModalPreview && (
            <div className="relative aspect-[4/3] w-full rounded-xl overflow-hidden bg-gray-100 border border-gray-200">
              <Image
                src={liveModalPreview}
                alt={altText || 'Pratinjau foto momen'}
                fill
                unoptimized
                sizes="480px"
                style={{ objectFit: 'cover', objectPosition }}
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Unggah Gambar (PNG / JPG / WebP)
            </label>
            <label className="flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-gray-200 rounded-xl bg-gray-50 hover:bg-gray-100 text-sm text-gray-600 cursor-pointer transition-colors">
              <Upload size={17} />
              <span>{selectedFile ? selectedFile.name : 'Pilih foto dari perangkat...'}</span>
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp"
                className="hidden"
                onChange={(e) => handleFilePick(e.target.files?.[0] || null)}
              />
            </label>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Atau Tempel URL Gambar
            </label>
            <input
              type="text"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="https://... (otomatis terisi bila unggah file)"
              required={!selectedFile}
              className="w-full px-3.5 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Keterangan Foto (Alt Text)
            </label>
            <input
              type="text"
              maxLength={220}
              required
              value={altText}
              onChange={(e) => setAltText(e.target.value)}
              placeholder="Contoh: Kegiatan Pengabdian Masyarakat UKM Pilar Bangsa"
              className="w-full px-3.5 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent outline-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Fokus Crop Foto
              </label>
              <select
                value={objectPosition}
                onChange={(e) => setObjectPosition(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm bg-white outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
              >
                {POSITION_PRESETS.map((preset) => (
                  <option key={preset.value} value={preset.value}>
                    {preset.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Kemiringan Kartu ({rotationDeg}°)
              </label>
              <input
                type="range"
                min={-6}
                max={6}
                step={0.5}
                value={rotationDeg}
                onChange={(e) => setRotationDeg(Number(e.target.value))}
                className="w-full mt-2 accent-[#E31837]"
              />
            </div>
          </div>

          <label className="inline-flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
            <input
              type="checkbox"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              className="rounded border-gray-300 text-[var(--color-primary)] focus:ring-[var(--color-primary)]"
            />
            Tampilkan foto ini pada carousel beranda
          </label>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              disabled={submitting}
              onClick={() => {
                setShowModal(false);
                resetForm();
              }}
              className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-gray-700 text-sm font-medium hover:bg-gray-50 transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={submitting || (!selectedFile && !imageUrl.trim())}
              className="flex-1 px-4 py-2.5 rounded-xl bg-[var(--color-primary)] text-white text-sm font-medium hover:bg-[var(--color-secondary)] transition-colors disabled:opacity-50"
            >
              {submitting ? 'Menyimpan...' : editingItem ? 'Simpan Perubahan' : 'Tambahkan Foto'}
            </button>
          </div>
        </form>
      </DataModal>

      <DeleteConfirm
        isOpen={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        loading={busyId === deleteTarget?.id}
        message={`Apakah Anda yakin ingin menghapus foto "${deleteTarget?.alt}" dari galeri Momen Pilar Bangsa?`}
      />
    </div>
  );
}
