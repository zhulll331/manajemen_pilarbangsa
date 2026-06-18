"use client";

import { useState } from "react";
import { Plus, Users } from "lucide-react";
import { DataModal } from "@/components/DataModal";
import { DeleteConfirm } from "@/components/DeleteConfirm";
import { DataTable, type Column } from "@/components/DataTable";
import { ImportCSVModal } from "@/components/ImportCSVModal";
import { tambahAnggota, editAnggota, hapusAnggota, importAnggotaBatch } from "./actions";

interface Member {
  id: string;
  name: string;
  nim: string;
  faculty: string;
  study_program: string;
  generation: string;
  phone: string;
  division: string;
  status: string;
}

const divisions = ["Pendidikan", "Sosial", "Kewirausahaan", "Seni Budaya"];
const statuses = ["Aktif", "Cuti", "Alumni"];

export default function AnggotaClient({ members }: { members: Member[] }) {
  const [showModal, setShowModal] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [editData, setEditData] = useState<Member | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Member | null>(null);
  const [loading, setLoading] = useState(false);

  const columns: Column<Member>[] = [
    { key: "name", label: "Nama", render: (m) => <span className="font-medium text-gray-900">{m.name}</span> },
    { key: "nim", label: "NIM" },
    { key: "faculty", label: "Fakultas" },
    { key: "study_program", label: "Prodi" },
    { key: "generation", label: "Angkatan" },
    { key: "division", label: "Divisi" },
    {
      key: "status",
      label: "Status",
      render: (m) => (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
          m.status === "Aktif" ? "bg-green-100 text-green-700" :
          m.status === "Cuti" ? "bg-yellow-100 text-yellow-700" :
          "bg-gray-100 text-gray-600"
        }`}>
          {m.status}
        </span>
      ),
    },
  ];

  const handleSubmit = async (formData: FormData) => {
    setLoading(true);
    try {
      if (editData) {
        formData.append("id", editData.id);
        await editAnggota(editData.id, formData);
      } else {
        await tambahAnggota(formData);
      }
      setShowModal(false);
      setEditData(null);
    } catch (e) {
      alert("Gagal menyimpan data: " + (e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setLoading(true);
    try {
      await hapusAnggota(deleteTarget.id);
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
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-blue-100 text-[var(--color-primary)]">
            <Users size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Data Anggota</h1>
            <p className="text-sm text-gray-500">Kelola data anggota UKM Pilar Bangsa</p>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={() => setShowImport(true)}
            className="flex items-center justify-center gap-2 px-5 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors shadow-sm"
          >
            Import CSV
          </button>
          <button
            onClick={() => { setEditData(null); setShowModal(true); }}
            className="flex items-center justify-center gap-2 px-5 py-2.5 bg-[var(--color-primary)] text-white rounded-xl font-medium hover:bg-[var(--color-secondary)] transition-colors shadow-sm"
          >
            <Plus size={18} />
            Tambah Anggota
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <DataTable pagination pageSize={10}
          columns={columns}
          data={members}
          onEdit={(m) => { setEditData(m); setShowModal(true); }}
          onDelete={(m) => { setDeleteTarget(m); setShowDelete(true); }}
          emptyMessage="Belum ada data anggota."
        />
      </div>

      {/* Modal Form */}
      <DataModal
        isOpen={showModal}
        onClose={() => { setShowModal(false); setEditData(null); }}
        title={editData ? "Edit Anggota" : "Tambah Anggota Baru"}
      >
        <form action={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nama Lengkap</label>
            <input name="name" defaultValue={editData?.name} required
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent outline-none transition" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">NIM</label>
              <input name="nim" defaultValue={editData?.nim}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent outline-none transition" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Angkatan</label>
              <input name="generation" defaultValue={editData?.generation}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent outline-none transition" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Fakultas</label>
              <input name="faculty" defaultValue={editData?.faculty}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent outline-none transition" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Program Studi</label>
              <input name="study_program" defaultValue={editData?.study_program}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent outline-none transition" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">No. Telepon</label>
            <input name="phone" defaultValue={editData?.phone}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent outline-none transition" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Divisi</label>
              <select name="division" defaultValue={editData?.division || ""}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent outline-none transition bg-white">
                <option value="">Pilih Divisi</option>
                {divisions.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select name="status" defaultValue={editData?.status || "Aktif"}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent outline-none transition bg-white">
                {statuses.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => { setShowModal(false); setEditData(null); }}
              className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-gray-700 font-medium hover:bg-gray-50 transition-colors">
              Batal
            </button>
            <button type="submit" disabled={loading}
              className="flex-1 px-4 py-2.5 rounded-xl bg-[var(--color-primary)] text-white font-medium hover:bg-[var(--color-secondary)] transition-colors disabled:opacity-50">
              {loading ? "Menyimpan..." : editData ? "Simpan Perubahan" : "Tambah Anggota"}
            </button>
          </div>
        </form>
      </DataModal>

      {/* Delete Confirm */}
      <DeleteConfirm
        isOpen={showDelete}
        onClose={() => { setShowDelete(false); setDeleteTarget(null); }}
        onConfirm={handleDelete}
        loading={loading}
        message={`Apakah Anda yakin ingin menghapus ${deleteTarget?.name}?`}
      />

      {/* Import CSV Modal */}
      <ImportCSVModal
        isOpen={showImport}
        onClose={() => setShowImport(false)}
        onImport={async (data) => {
          await importAnggotaBatch(data);
        }}
        templateHeaders={["Nama", "NIM", "Fakultas", "Prodi", "Angkatan", "Telepon", "Divisi", "Status"]}
        title="Import Data Anggota"
      />
    </div>
  );
}
