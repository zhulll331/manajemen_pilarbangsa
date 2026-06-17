"use client";

import { useState } from "react";
import { Plus, FolderOpen, ExternalLink } from "lucide-react";
import { DataModal } from "@/components/DataModal";
import { DeleteConfirm } from "@/components/DeleteConfirm";
import { DataTable, type Column } from "@/components/DataTable";
import { tambahArsip, editArsip, hapusArsip } from "./actions";

interface Archive {
  id: string;
  title: string;
  category: string;
  description: string;
  file_url: string | null;
  uploaded_by: string;
  created_at: string;
}

const categories = ["Proposal", "LPJ", "SK", "RAB", "Dokumentasi", "Laporan Kegiatan", "AD-ART", "Pedoman", "Rekap Kehadiran", "Lainnya"];

export default function ArsipClient({ archives }: { archives: Archive[] }) {
  const [showModal, setShowModal] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [editData, setEditData] = useState<Archive | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Archive | null>(null);
  const [loading, setLoading] = useState(false);
  const [filterCategory, setFilterCategory] = useState("Semua");

  const filteredArchives = filterCategory === "Semua"
    ? archives
    : archives.filter(a => a.category === filterCategory);

  const columns: Column<Archive>[] = [
    {
      key: "title",
      label: "Judul Dokumen",
      render: (a) => (
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center text-blue-500 shrink-0">
            <FolderOpen size={18} />
          </div>
          <span className="font-medium text-gray-900">{a.title}</span>
        </div>
      ),
    },
    {
      key: "category",
      label: "Kategori",
      render: (a) => (
        <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
          {a.category}
        </span>
      ),
    },
    { key: "description", label: "Deskripsi", render: (a) => <span className="line-clamp-1 text-gray-500 text-xs max-w-[200px]">{a.description || "-"}</span> },
    { key: "uploaded_by", label: "Pengunggah" },
    {
      key: "file_url",
      label: "File",
      render: (a) => a.file_url ? (
        <a href={a.file_url} target="_blank" rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-xs text-[var(--color-primary)] hover:underline"
          onClick={(e) => e.stopPropagation()}>
          <ExternalLink size={14} /> Buka
        </a>
      ) : <span className="text-gray-400 text-xs">-</span>,
    },
  ];

  const handleSubmit = async (formData: FormData) => {
    setLoading(true);
    try {
      if (editData) {
        formData.append("id", editData.id);
        await editArsip(formData);
      } else {
        await tambahArsip(formData);
      }
      setShowModal(false);
      setEditData(null);
    } catch (e) {
      alert("Gagal menyimpan: " + (e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setLoading(true);
    try {
      await hapusArsip(deleteTarget.id);
      setShowDelete(false);
      setDeleteTarget(null);
    } catch (e) {
      alert("Gagal menghapus: " + (e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-blue-100 text-blue-600">
            <FolderOpen size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Arsip Dokumen</h1>
            <p className="text-sm text-gray-500">Kelola arsip dan dokumen organisasi</p>
          </div>
        </div>
        <button
          onClick={() => { setEditData(null); setShowModal(true); }}
          className="flex items-center gap-2 px-5 py-2.5 bg-[var(--color-primary)] text-white rounded-xl font-medium hover:bg-[var(--color-secondary)] transition-colors shadow-sm"
        >
          <Plus size={18} />
          Tambah Arsip
        </button>
      </div>

      {/* Category Filter */}
      <div className="flex gap-2 flex-wrap">
        {["Semua", ...categories].map(cat => (
          <button
            key={cat}
            onClick={() => setFilterCategory(cat)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
              filterCategory === cat
                ? "bg-[var(--color-primary)] text-white"
                : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <DataTable
          columns={columns}
          data={filteredArchives}
          onEdit={(a) => { setEditData(a); setShowModal(true); }}
          onDelete={(a) => { setDeleteTarget(a); setShowDelete(true); }}
          emptyMessage="Belum ada arsip dokumen."
        />
      </div>

      {/* Modal Form */}
      <DataModal
        isOpen={showModal}
        onClose={() => { setShowModal(false); setEditData(null); }}
        title={editData ? "Edit Arsip" : "Tambah Arsip Baru"}
      >
        <form action={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Judul Dokumen</label>
            <input name="title" defaultValue={editData?.title} required
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent outline-none transition" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Kategori</label>
              <select name="category" defaultValue={editData?.category || ""}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent outline-none transition bg-white">
                <option value="">Pilih Kategori</option>
                {categories.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Pengunggah</label>
              <input name="uploaded_by" defaultValue={editData?.uploaded_by}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent outline-none transition" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Deskripsi</label>
            <textarea name="description" defaultValue={editData?.description} rows={3}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent outline-none transition resize-none" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Upload File (opsional)</label>
              <input type="file" name="file" accept=".pdf,.doc,.docx,.png,.jpg,.jpeg"
                className="w-full px-4 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent outline-none transition bg-white" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Atau Link Eksternal</label>
              <input name="file_url" defaultValue={editData?.file_url || ""} placeholder="https://drive.google.com/..."
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent outline-none transition" />
            </div>
          </div>
          {editData?.file_url && (
            <div className="text-sm text-gray-500">
              File saat ini: <a href={editData.file_url} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline">Lihat Berkas</a>
            </div>
          )}
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => { setShowModal(false); setEditData(null); }}
              className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-gray-700 font-medium hover:bg-gray-50 transition-colors">
              Batal
            </button>
            <button type="submit" disabled={loading}
              className="flex-1 px-4 py-2.5 rounded-xl bg-[var(--color-primary)] text-white font-medium hover:bg-[var(--color-secondary)] transition-colors disabled:opacity-50">
              {loading ? "Menyimpan..." : editData ? "Simpan Perubahan" : "Tambah Arsip"}
            </button>
          </div>
        </form>
      </DataModal>

      <DeleteConfirm
        isOpen={showDelete}
        onClose={() => { setShowDelete(false); setDeleteTarget(null); }}
        onConfirm={handleDelete}
        loading={loading}
        message={`Hapus arsip "${deleteTarget?.title}"?`}
      />
    </div>
  );
}
