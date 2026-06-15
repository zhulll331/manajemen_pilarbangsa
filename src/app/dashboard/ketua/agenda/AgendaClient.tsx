"use client";

import { useState } from "react";
import { Plus, Calendar, Clock, MapPin } from "lucide-react";
import { DataModal } from "@/components/DataModal";
import { DeleteConfirm } from "@/components/DeleteConfirm";
import { DataTable } from "@/components/DataTable";
import { tambahAgenda, editAgenda, hapusAgenda } from "./actions";

export default function AgendaClient({ agendas }: { agendas: any[] }) {
  const [filter, setFilter] = useState("Semua");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedData, setSelectedData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const filteredData = filter === "Semua" 
    ? agendas 
    : agendas.filter((a) => a.category === filter);

  const openAdd = () => {
    setSelectedData(null);
    setErrorMsg("");
    setIsModalOpen(true);
  };

  const openEdit = (data: any) => {
    setSelectedData(data);
    setErrorMsg("");
    setIsModalOpen(true);
  };

  const openDelete = (data: any) => {
    setSelectedData(data);
    setIsDeleteOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg("");

    const formData = new FormData(e.currentTarget);
    try {
      if (selectedData) {
        await editAgenda(selectedData.id, formData);
      } else {
        await tambahAgenda(formData);
      }
      setIsModalOpen(false);
    } catch (error: any) {
      setErrorMsg(error.message || "Terjadi kesalahan");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedData) return;
    setIsLoading(true);
    try {
      await hapusAgenda(selectedData.id);
      setIsDeleteOpen(false);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const columns = [
    { key: "title", label: "Agenda" },
    { key: "category", label: "Kategori" },
    { 
      key: "date", 
      label: "Waktu",
      render: (row: any) => (
        <div className="flex flex-col gap-1 text-sm">
          <div className="flex items-center gap-1"><Calendar size={14} className="text-gray-400"/> {row.date || "-"}</div>
          <div className="flex items-center gap-1"><Clock size={14} className="text-gray-400"/> {row.time || "-"}</div>
        </div>
      )
    },
    { 
      key: "location", 
      label: "Lokasi",
      render: (row: any) => (
        <div className="flex items-center gap-1">
          <MapPin size={14} className="text-red-400"/>
          <span>{row.location || "-"}</span>
        </div>
      )
    },
    { key: "description", label: "Deskripsi" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex flex-wrap gap-2">
          {["Semua", "Rapat", "Acara", "Pelatihan"].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === f
                  ? "bg-[var(--color-primary)] text-white"
                  : "bg-white text-gray-600 hover:bg-gray-100 border"
              }`}
            >
              {f}
            </button>
          ))}
        </div>
        
        <button
          onClick={openAdd}
          className="bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors w-full sm:w-auto justify-center"
        >
          <Plus size={20} />
          Jadwalkan Agenda
        </button>
      </div>

      <DataTable 
        data={filteredData}
        columns={columns}
        onEdit={openEdit}
        onDelete={openDelete}
        emptyMessage={`Belum ada data agenda ${filter === 'Semua' ? '' : filter.toLowerCase()}.`}
      />

      <DataModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={selectedData ? "Edit Agenda" : "Jadwalkan Agenda"}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {errorMsg && (
            <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg">
              {errorMsg}
            </div>
          )}
          
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Judul Agenda</label>
            <input 
              name="title" 
              required
              defaultValue={selectedData?.title || ""} 
              placeholder="Contoh: Rapat Pleno 1"
              className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-[var(--color-primary)] outline-none"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Deskripsi Singkat</label>
            <textarea 
              name="description" 
              rows={3}
              defaultValue={selectedData?.description || ""} 
              placeholder="Catatan tambahan agenda..."
              className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-[var(--color-primary)] outline-none resize-none"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Tanggal</label>
              <input 
                name="date" 
                type="date"
                required
                defaultValue={selectedData?.date || ""} 
                className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-[var(--color-primary)] outline-none"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Waktu</label>
              <input 
                name="time" 
                type="time"
                required
                defaultValue={selectedData?.time || ""} 
                className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-[var(--color-primary)] outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Lokasi</label>
              <input 
                name="location" 
                required
                defaultValue={selectedData?.location || ""} 
                placeholder="Misal: Ruang Sidang 1 / Link Zoom"
                className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-[var(--color-primary)] outline-none"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Kategori</label>
              <select 
                name="category" 
                required
                defaultValue={selectedData?.category || "Rapat"}
                className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-[var(--color-primary)] outline-none"
              >
                <option value="Rapat">Rapat</option>
                <option value="Acara">Acara</option>
                <option value="Pelatihan">Pelatihan</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-3 mt-6">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-4 py-2 bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-white rounded-lg transition-colors disabled:opacity-50"
            >
              {isLoading ? "Menyimpan..." : "Simpan"}
            </button>
          </div>
        </form>
      </DataModal>

      <DeleteConfirm
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={handleDelete}
        title="Hapus Agenda"
        message="Apakah Anda yakin ingin menghapus data agenda ini?"
        loading={isLoading}
      />
    </div>
  );
}
