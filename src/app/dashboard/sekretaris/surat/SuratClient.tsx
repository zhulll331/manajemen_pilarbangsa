"use client";

import { useState } from "react";
import { Plus, FileText, Mail, MailOpen } from "lucide-react";
import { DataModal } from "@/components/DataModal";
import { DeleteConfirm } from "@/components/DeleteConfirm";
import { DataTable, type Column } from "@/components/DataTable";
import { tambahSurat, editSurat, hapusSurat } from "./actions";

interface Letter {
  id: string;
  letter_number: string;
  letter_type: string;
  date: string;
  sender: string;
  recipient: string;
  subject: string;
  file_url: string | null;
  status: string;
}

const letterStatuses = ["Diterima", "Diproses", "Terkirim", "Selesai"];

export default function SuratClient({ letters }: { letters: Letter[] }) {
  const [showModal, setShowModal] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [editData, setEditData] = useState<Letter | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Letter | null>(null);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<"Semua" | "Masuk" | "Keluar">("Semua");

  const filteredLetters = filter === "Semua"
    ? letters
    : letters.filter(l => l.letter_type === filter);

  const columns: Column<Letter>[] = [
    { key: "letter_number", label: "No. Surat", render: (l) => <span className="font-medium text-gray-900 text-xs">{l.letter_number}</span> },
    {
      key: "letter_type",
      label: "Tipe",
      render: (l) => (
        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
          l.letter_type === "Masuk" ? "bg-blue-100 text-blue-700" : "bg-purple-100 text-purple-700"
        }`}>
          {l.letter_type === "Masuk" ? <Mail size={12} /> : <MailOpen size={12} />}
          {l.letter_type}
        </span>
      ),
    },
    { key: "date", label: "Tanggal" },
    { key: "subject", label: "Perihal", render: (l) => <span className="line-clamp-1 max-w-[200px]">{l.subject}</span> },
    { key: "sender", label: "Pengirim" },
    {
      key: "status",
      label: "Status",
      render: (l) => (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
          l.status === "Diterima" ? "bg-green-100 text-green-700" :
          l.status === "Terkirim" ? "bg-blue-100 text-blue-700" :
          l.status === "Diproses" ? "bg-yellow-100 text-yellow-700" :
          "bg-gray-100 text-gray-600"
        }`}>
          {l.status}
        </span>
      ),
    },
    {
      key: "file_url" as any,
      label: "Berkas",
      render: (l) => l.file_url ? (
        <a href={l.file_url} target="_blank" rel="noreferrer" className="text-[var(--color-primary)] hover:underline text-xs flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
          <FileText size={14} /> Lihat
        </a>
      ) : <span className="text-gray-400 text-xs">-</span>
    },
  ];

  const handleSubmit = async (formData: FormData) => {
    setLoading(true);
    try {
      if (editData) {
        formData.append("id", editData.id);
        await editSurat(formData);
      } else {
        await tambahSurat(formData);
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
      await hapusSurat(deleteTarget.id);
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
          <div className="p-2.5 rounded-xl bg-purple-100 text-[var(--color-primary)]">
            <FileText size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Persuratan</h1>
            <p className="text-sm text-gray-500">Kelola surat masuk dan surat keluar</p>
          </div>
        </div>
        <button
          onClick={() => { setEditData(null); setShowModal(true); }}
          className="flex items-center gap-2 px-5 py-2.5 bg-[var(--color-primary)] text-white rounded-xl font-medium hover:bg-[var(--color-secondary)] transition-colors shadow-sm"
        >
          <Plus size={18} />
          Tambah Surat
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2">
        {(["Semua", "Masuk", "Keluar"] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setFilter(tab)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
              filter === tab
                ? "bg-[var(--color-primary)] text-white"
                : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"
            }`}
          >
            {tab === "Semua" ? "Semua Surat" : `Surat ${tab}`}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <DataTable
          columns={columns}
          data={filteredLetters}
          onEdit={(l) => { setEditData(l); setShowModal(true); }}
          onDelete={(l) => { setDeleteTarget(l); setShowDelete(true); }}
          emptyMessage="Belum ada data surat."
        />
      </div>

      {/* Modal Form */}
      <DataModal
        isOpen={showModal}
        onClose={() => { setShowModal(false); setEditData(null); }}
        title={editData ? "Edit Surat" : "Tambah Surat Baru"}
      >
        <form action={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">No. Surat</label>
              <input name="letter_number" defaultValue={editData?.letter_number} required
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent outline-none transition" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tipe Surat</label>
              <select name="letter_type" defaultValue={editData?.letter_type || "Masuk"}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent outline-none transition bg-white">
                <option value="Masuk">Surat Masuk</option>
                <option value="Keluar">Surat Keluar</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tanggal</label>
            <input type="date" name="date" defaultValue={editData?.date}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent outline-none transition" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Pengirim</label>
              <input name="sender" defaultValue={editData?.sender}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent outline-none transition" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Penerima</label>
              <input name="recipient" defaultValue={editData?.recipient}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent outline-none transition" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Perihal</label>
            <input name="subject" defaultValue={editData?.subject} required
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent outline-none transition" />
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
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select name="status" defaultValue={editData?.status || "Diterima"}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent outline-none transition bg-white">
              {letterStatuses.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => { setShowModal(false); setEditData(null); }}
              className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-gray-700 font-medium hover:bg-gray-50 transition-colors">
              Batal
            </button>
            <button type="submit" disabled={loading}
              className="flex-1 px-4 py-2.5 rounded-xl bg-[var(--color-primary)] text-white font-medium hover:bg-[var(--color-secondary)] transition-colors disabled:opacity-50">
              {loading ? "Menyimpan..." : editData ? "Simpan Perubahan" : "Tambah Surat"}
            </button>
          </div>
        </form>
      </DataModal>

      <DeleteConfirm
        isOpen={showDelete}
        onClose={() => { setShowDelete(false); setDeleteTarget(null); }}
        onConfirm={handleDelete}
        loading={loading}
        message={`Hapus surat "${deleteTarget?.subject}"?`}
      />
    </div>
  );
}
