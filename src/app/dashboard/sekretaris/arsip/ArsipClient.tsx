"use client";

import { useState } from "react";
import { Plus, FolderOpen, ExternalLink } from "lucide-react";
import { DataModal } from "@/components/DataModal";
import { DeleteConfirm } from "@/components/DeleteConfirm";
import { DataTable, type Column } from "@/components/DataTable";
import { tambahArsip, editArsip, hapusArsip } from "./actions";
import { uploadFileToDrive } from "@/utils/driveClientUpload";

interface Archive {
  id: string;
  title: string;
  category: string;
  description: string;
  file_url: string | null;
  uploaded_by: string;
  created_at: string;
  folder_id?: string;
}

const defaultCategories = ["Proposal", "LPJ", "SK", "RAB", "Dokumentasi", "Laporan Kegiatan", "AD-ART", "Pedoman", "Rekap Kehadiran", "Lainnya"];

export default function ArsipClient({ archives }: { archives: Archive[] }) {
  const [showModal, setShowModal] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [editData, setEditData] = useState<Archive | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Archive | null>(null);
  const [loading, setLoading] = useState(false);
  const [filterCategory, setFilterCategory] = useState("Semua");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [customCategory, setCustomCategory] = useState("");

  // Kumpulkan kategori unik dari data arsip yang ada agar kategori baru tersimpan di filter dan pilihan form
  const allCategories = Array.from(new Set([...defaultCategories, ...archives.map(a => a.category)]));

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

  const handleOpenAdd = () => {
    setEditData(null);
    setSelectedFile(null);
    setErrorMsg("");
    setSelectedCategory("");
    setCustomCategory("");
    setShowModal(true);
  };

  const handleOpenEdit = (a: Archive) => {
    setEditData(a);
    setSelectedFile(null);
    setErrorMsg("");
    if (allCategories.includes(a.category)) {
      setSelectedCategory(a.category);
      setCustomCategory("");
    } else {
      setSelectedCategory("Tambah Kategori Lain");
      setCustomCategory(a.category);
    }
    setShowModal(true);
  };

  const handleSubmit = async (formData: FormData) => {
    setLoading(true);
    setErrorMsg("");

    let finalCategory = selectedCategory;
    if (finalCategory === "Tambah Kategori Lain") {
      finalCategory = customCategory.trim() || "Lainnya";
    }
    formData.set("category", finalCategory);

    const folderName = `Arsip - ${finalCategory}`;

    try {
      let folderId = editData?.folder_id || "";
      
      // Mengirimkan parentFolderName: 'Sekretaris' agar bersarang di dalam folder Sekretaris
      const res = await fetch('/api/drive/create-folder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ folderName, parentFolderName: 'Sekretaris' })
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      if (data.folderId) folderId = data.folderId;

      formData.append('folder_id', folderId);

      if (selectedFile) {
        // Upload langsung dari browser ke Google Drive (melewati Vercel)
        // → tidak ada batas ukuran/timeout dari Vercel
        const { url: fileUrl } = await uploadFileToDrive(selectedFile, folderId || undefined);
        if (fileUrl) {
          formData.set('file_url', fileUrl);
        }
      }

      if (editData) {
        formData.append("id", editData.id);
        await editArsip(formData);
      } else {
        await tambahArsip(formData);
      }
      setShowModal(false);
      setEditData(null);
      setSelectedFile(null);
    } catch (e: any) {
      setErrorMsg(e.message || "Terjadi kesalahan saat menyimpan data");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setLoading(true);
    try {
      // Hapus file dari Google Drive jika ada file_url
      if (deleteTarget.file_url && deleteTarget.file_url.includes('drive.google.com')) {
        await fetch('/api/drive/delete', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ fileUrl: deleteTarget.file_url })
        }).catch(err => console.error('Gagal hapus file drive:', err));
      }

      await hapusArsip(deleteTarget.id);
      setShowDelete(false);
      setDeleteTarget(null);
    } catch (e: any) {
      alert("Gagal menghapus: " + e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start sm:items-center gap-3">
          <div className="p-2.5 rounded-xl bg-blue-100 text-blue-600 shrink-0 mt-1 sm:mt-0">
            <FolderOpen size={24} />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-800">Arsip Dokumen</h1>
            <p className="text-sm text-gray-500 line-clamp-2 sm:line-clamp-none">Kelola arsip dan dokumen organisasi</p>
          </div>
        </div>
        <button
          onClick={handleOpenAdd}
          className="flex items-center justify-center gap-2 px-5 py-2.5 bg-[var(--color-primary)] text-white rounded-xl font-medium hover:bg-[var(--color-secondary)] transition-colors shadow-sm w-full sm:w-auto"
        >
          <Plus size={18} />
          Tambah Arsip
        </button>
      </div>

      {/* Category Filter */}
      <div className="flex gap-2 flex-wrap">
        {["Semua", ...allCategories].map(cat => (
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
        <DataTable pagination pageSize={10}
          columns={columns}
          data={filteredArchives}
          onEdit={handleOpenEdit}
          onDelete={(a) => { setDeleteTarget(a); setShowDelete(true); }}
          emptyMessage="Belum ada arsip dokumen."
        />
      </div>

      {/* Modal Form */}
      <DataModal
        isOpen={showModal}
        onClose={() => { setShowModal(false); setEditData(null); setSelectedFile(null); }}
        title={editData ? "Edit Arsip" : "Tambah Arsip Baru"}
      >
        <form action={handleSubmit} className="space-y-4">
          {errorMsg && (
            <div className="p-3 bg-red-50 text-red-600 text-sm rounded-xl font-medium">
              {errorMsg}
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Judul Dokumen</label>
            <input name="title" defaultValue={editData?.title} required
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent outline-none transition" />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Kategori</label>
              <select 
                value={selectedCategory} 
                onChange={(e) => setSelectedCategory(e.target.value)}
                required
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent outline-none transition bg-white"
              >
                <option value="">Pilih Kategori</option>
                {allCategories.map(c => <option key={c} value={c}>{c}</option>)}
                <option value="Tambah Kategori Lain" className="font-bold text-blue-600">+ Tambah Kategori Lain</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Pengunggah</label>
              <input name="uploaded_by" defaultValue={editData?.uploaded_by} required
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent outline-none transition" />
            </div>
          </div>

          {selectedCategory === "Tambah Kategori Lain" && (
            <div className="p-4 bg-blue-50/50 border border-blue-100 rounded-xl space-y-2 animate-fadeIn">
              <label className="block text-sm font-bold text-blue-900">Nama Kategori Baru *</label>
              <input 
                value={customCategory} 
                onChange={(e) => setCustomCategory(e.target.value)}
                placeholder="Misal: Sertifikat, MoU, Surat Tugas..."
                required={selectedCategory === "Tambah Kategori Lain"}
                className="w-full px-4 py-2.5 border border-blue-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition bg-white" 
              />
              <p className="text-[11px] text-blue-600">Sistem akan otomatis membuatkan folder &quot;Arsip - [Nama Kategori Baru]&quot; di dalam folder Sekretaris.</p>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Deskripsi</label>
            <textarea name="description" defaultValue={editData?.description} rows={3}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent outline-none transition resize-none" />
          </div>
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Upload File Arsip (Google Drive)</label>
            <div className="border-2 border-dashed border-gray-300 rounded-xl p-4 text-center hover:border-blue-500 transition-colors bg-blue-50/20">
              <input type="file" accept=".pdf,.doc,.docx,.png,.jpg,.jpeg"
                onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                className="w-full text-xs text-gray-500 file:mr-4 file:py-1.5 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-700 file:transition-colors cursor-pointer" />
              {selectedFile && (
                <p className="mt-2 text-xs font-bold text-green-600">File terpilih: {selectedFile.name}</p>
              )}
              <p className="mt-1 text-[11px] text-gray-400">File akan otomatis masuk ke folder Google Drive &quot;Sekretaris &gt; Arsip - {selectedCategory || 'Kategori'}&quot;.</p>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Atau Link Eksternal</label>
            <input name="file_url" defaultValue={editData?.file_url || ""} placeholder="https://drive.google.com/..."
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent outline-none transition" />
          </div>
          {editData?.file_url && (
            <div className="text-sm text-gray-500">
              File saat ini: <a href={editData.file_url} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline">Lihat Berkas</a>
            </div>
          )}
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => { setShowModal(false); setEditData(null); setSelectedFile(null); }}
              className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-gray-700 font-medium hover:bg-gray-50 transition-colors">
              Batal
            </button>
            <button type="submit" disabled={loading}
              className="flex-1 px-4 py-2.5 rounded-xl bg-[var(--color-primary)] text-white font-medium hover:bg-[var(--color-secondary)] transition-colors disabled:opacity-50">
              {loading ? "Menyimpan & Upload Drive..." : editData ? "Simpan Perubahan" : "Tambah Arsip"}
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
