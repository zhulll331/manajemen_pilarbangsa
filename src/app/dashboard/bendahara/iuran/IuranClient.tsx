"use client";

import { useState } from "react";
import { Plus, CheckCircle, XCircle, ExternalLink, Download, Users } from "lucide-react";
import * as XLSX from "xlsx";
import { DataModal } from "@/components/DataModal";
import { DeleteConfirm } from "@/components/DeleteConfirm";
import { DataTable } from "@/components/DataTable";
import { tambahIuran, editIuran, hapusIuran, tambahIuranMassal } from "./actions";

const MONTHS = [
  { value: 1, label: "Januari" },
  { value: 2, label: "Februari" },
  { value: 3, label: "Maret" },
  { value: 4, label: "April" },
  { value: 5, label: "Mei" },
  { value: 6, label: "Juni" },
  { value: 7, label: "Juli" },
  { value: 8, label: "Agustus" },
  { value: 9, label: "September" },
  { value: 10, label: "Oktober" },
  { value: 11, label: "November" },
  { value: 12, label: "Desember" }
];

const CURRENT_YEAR = new Date().getFullYear();
const YEARS = [CURRENT_YEAR - 1, CURRENT_YEAR, CURRENT_YEAR + 1];

export default function IuranClient({ dues, members }: { dues: any[], members: any[] }) {
  const [filterYear, setFilterYear] = useState<number>(CURRENT_YEAR);
  const [filterMonth, setFilterMonth] = useState<number>(0); // 0 means all

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isMassalModalOpen, setIsMassalModalOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedData, setSelectedData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // Bulk State
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [massalData, setMassalData] = useState({
    month: new Date().getMonth() + 1,
    year: CURRENT_YEAR,
    amount: 10000,
    payment_date: new Date().toISOString().split('T')[0],
    status: "Lunas",
    proof_url: ""
  });

  const filteredData = dues.filter(d => {
    if (d.year !== filterYear) return false;
    if (filterMonth !== 0 && d.month !== filterMonth) return false;
    return true;
  });

  const openAdd = () => {
    setSelectedData(null);
    setErrorMsg("");
    setIsModalOpen(true);
  };

  const openMassal = () => {
    setSelectedMembers([]);
    setMassalData({
      month: new Date().getMonth() + 1,
      year: CURRENT_YEAR,
      amount: 10000,
      payment_date: new Date().toISOString().split('T')[0],
      status: "Lunas",
      proof_url: ""
    });
    setErrorMsg("");
    setIsMassalModalOpen(true);
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
        await editIuran(selectedData.id, formData);
      } else {
        await tambahIuran(formData);
      }
      setIsModalOpen(false);
    } catch (error: any) {
      setErrorMsg(error.message || "Terjadi kesalahan");
    } finally {
      setIsLoading(false);
    }
  };

  const handleMassalSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (selectedMembers.length === 0) {
      setErrorMsg("Pilih minimal satu anggota dari daftar.");
      return;
    }
    setIsLoading(true);
    setErrorMsg("");

    const payload = selectedMembers.map(memberId => ({
      member_id: memberId,
      month: Number(massalData.month),
      year: Number(massalData.year),
      amount: Number(massalData.amount),
      status: massalData.status,
      payment_date: massalData.payment_date || null,
      proof_url: massalData.proof_url || null
    }));

    try {
      await tambahIuranMassal(payload);
      setIsMassalModalOpen(false);
      setSelectedMembers([]);
    } catch (error: any) {
      setErrorMsg(error.message || "Terjadi kesalahan saat simpan massal");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedData) return;
    setIsLoading(true);
    try {
      await hapusIuran(selectedData.id);
      setIsDeleteOpen(false);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleExportExcel = () => {
    const exportData = filteredData.map((d, index) => ({
      "No": index + 1,
      "Nama Anggota": d.members?.name || "Anggota Dihapus",
      "Periode": `${MONTHS.find(m => m.value === d.month)?.label} ${d.year}`,
      "Nominal": d.amount,
      "Status": d.status,
      "Tanggal Bayar": d.payment_date || "-",
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Iuran");
    
    const wscols = [
      {wch: 5}, {wch: 25}, {wch: 20}, {wch: 15}, {wch: 15}, {wch: 15}
    ];
    worksheet['!cols'] = wscols;

    XLSX.writeFile(workbook, `Laporan_Iuran_${filterMonth === 0 ? "Semua_Bulan" : MONTHS.find(m => m.value === filterMonth)?.label}_${filterYear}.xlsx`);
  };

  const columns = [
    { 
      key: "member", 
      label: "Anggota",
      render: (row: any) => row.members?.name || "Anggota Dihapus"
    },
    { 
      key: "period", 
      label: "Periode",
      render: (row: any) => {
        const monthName = MONTHS.find(m => m.value === row.month)?.label;
        return `${monthName} ${row.year}`;
      }
    },
    { 
      key: "amount", 
      label: "Nominal",
      render: (row: any) => (
        <span className="font-medium whitespace-nowrap">
          Rp {row.amount?.toLocaleString('id-ID')}
        </span>
      )
    },
    { 
      key: "status", 
      label: "Status", 
      render: (row: any) => (
        <span className={`px-2 py-1 text-xs rounded-full flex items-center gap-1 w-max ${
          row.status === 'Lunas' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'
        }`}>
          {row.status === 'Lunas' ? <CheckCircle size={12}/> : <XCircle size={12}/>}
          {row.status}
        </span>
      ) 
    },
    { 
      key: "payment_date", 
      label: "Tgl Bayar",
      render: (row: any) => row.payment_date ? row.payment_date : "-"
    },
    { 
      key: "proof_url", 
      label: "Bukti", 
      render: (row: any) => row.proof_url ? (
        <a href={row.proof_url} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline flex items-center gap-1">
          <ExternalLink size={14} /> Lihat
        </a>
      ) : <span className="text-gray-400">-</span>
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <select 
            value={filterYear}
            onChange={(e) => setFilterYear(Number(e.target.value))}
            className="p-2 border rounded-lg outline-none bg-white min-w-[120px]"
          >
            {YEARS.map(y => <option key={y} value={y}>Tahun {y}</option>)}
          </select>
          <select 
            value={filterMonth}
            onChange={(e) => setFilterMonth(Number(e.target.value))}
            className="p-2 border rounded-lg outline-none bg-white min-w-[150px]"
          >
            <option value={0}>Semua Bulan</option>
            {MONTHS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
          </select>
        </div>

        <div className="flex flex-wrap gap-2 w-full sm:w-auto">
          <button
            onClick={handleExportExcel}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors flex-1 sm:flex-none justify-center"
          >
            <Download size={20} />
            Ekspor Excel
          </button>
          <button
            onClick={openAdd}
            className="bg-white border border-[var(--color-primary)] text-[var(--color-primary)] hover:bg-indigo-50 px-4 py-2 rounded-lg flex items-center gap-2 transition-colors flex-1 sm:flex-none justify-center"
          >
            <Plus size={20} />
            Catat 1 per 1
          </button>
          <button
            onClick={openMassal}
            className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors flex-1 sm:flex-none justify-center shadow-md shadow-indigo-200"
          >
            <Users size={20} />
            Catat Massal
          </button>
        </div>
      </div>

      <DataTable 
        data={filteredData}
        columns={columns}
        onEdit={openEdit}
        onDelete={openDelete}
        emptyMessage={`Belum ada data iuran pada periode yang dipilih.`}
      />

      {/* SINGLE ENTRY MODAL */}
      <DataModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={selectedData ? "Edit Iuran" : "Catat Iuran Anggota"}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {errorMsg && (
            <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg">
              {errorMsg}
            </div>
          )}
          
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Anggota</label>
            <select 
              name="member_id" 
              required
              defaultValue={selectedData?.member_id || ""}
              className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-[var(--color-primary)] outline-none bg-white"
            >
              <option value="" disabled>Pilih Anggota</option>
              {members.map(m => (
                <option key={m.id} value={m.id}>{m.name}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Bulan</label>
              <select 
                name="month" 
                required
                defaultValue={selectedData?.month || new Date().getMonth() + 1}
                className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-[var(--color-primary)] outline-none bg-white"
              >
                {MONTHS.map(m => (
                  <option key={m.value} value={m.value}>{m.label}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Tahun</label>
              <input 
                name="year" 
                type="number" 
                required
                defaultValue={selectedData?.year || CURRENT_YEAR} 
                className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-[var(--color-primary)] outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Nominal (Rp)</label>
              <input 
                name="amount" 
                type="number" 
                required
                min="0"
                defaultValue={selectedData?.amount || 10000} 
                className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-[var(--color-primary)] outline-none"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Status</label>
              <select 
                name="status" 
                required
                defaultValue={selectedData?.status || "Lunas"}
                className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-[var(--color-primary)] outline-none bg-white"
              >
                <option value="Lunas">Lunas</option>
                <option value="Belum Lunas">Belum Lunas</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Tanggal Bayar</label>
              <input 
                name="payment_date" 
                type="date" 
                defaultValue={selectedData?.payment_date || ""} 
                className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-[var(--color-primary)] outline-none"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Link Bukti (Opsional)</label>
              <input 
                name="proof_url" 
                type="url"
                defaultValue={selectedData?.proof_url || ""} 
                placeholder="https://..."
                className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-[var(--color-primary)] outline-none"
              />
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

      {/* MASSAL (BULK) ENTRY MODAL */}
      <DataModal
        isOpen={isMassalModalOpen}
        onClose={() => setIsMassalModalOpen(false)}
        title="Catat Iuran Secara Massal"
      >
        <form onSubmit={handleMassalSubmit} className="space-y-4">
          {errorMsg && (
            <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg">
              {errorMsg}
            </div>
          )}

          <div className="bg-indigo-50 border border-indigo-100 p-4 rounded-xl space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-indigo-800 uppercase tracking-wider">Bulan</label>
                <select 
                  value={massalData.month}
                  onChange={(e) => setMassalData({...massalData, month: Number(e.target.value)})}
                  className="w-full p-2 text-sm border-0 rounded-lg focus:ring-2 focus:ring-[var(--color-primary)] outline-none"
                >
                  {MONTHS.map(m => (
                    <option key={m.value} value={m.value}>{m.label}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-indigo-800 uppercase tracking-wider">Tahun</label>
                <input 
                  type="number" 
                  value={massalData.year}
                  onChange={(e) => setMassalData({...massalData, year: Number(e.target.value)})}
                  className="w-full p-2 text-sm border-0 rounded-lg focus:ring-2 focus:ring-[var(--color-primary)] outline-none"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-indigo-800 uppercase tracking-wider">Nominal Pukul Rata</label>
                <input 
                  type="number" 
                  value={massalData.amount}
                  onChange={(e) => setMassalData({...massalData, amount: Number(e.target.value)})}
                  className="w-full p-2 text-sm border-0 rounded-lg focus:ring-2 focus:ring-[var(--color-primary)] outline-none"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-indigo-800 uppercase tracking-wider">Tanggal Bayar</label>
                <input 
                  type="date" 
                  value={massalData.payment_date}
                  onChange={(e) => setMassalData({...massalData, payment_date: e.target.value})}
                  className="w-full p-2 text-sm border-0 rounded-lg focus:ring-2 focus:ring-[var(--color-primary)] outline-none"
                />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-bold text-gray-700">Daftar Anggota yang Telah Membayar</label>
              <button 
                type="button"
                onClick={() => {
                  if (selectedMembers.length === members.length) setSelectedMembers([]);
                  else setSelectedMembers(members.map(m => m.id));
                }}
                className="text-xs text-indigo-600 hover:text-indigo-800 font-medium"
              >
                {selectedMembers.length === members.length ? "Hapus Semua Pilihan" : "Pilih Semua Anggota"}
              </button>
            </div>
            
            <div className="bg-gray-50 border rounded-xl h-64 overflow-y-auto p-2 space-y-1">
              {members.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-4">Tidak ada data anggota.</p>
              ) : (
                members.map((m) => (
                  <label key={m.id} className="flex items-center gap-3 p-2 hover:bg-gray-100 rounded-lg cursor-pointer transition-colors">
                    <input 
                      type="checkbox"
                      checked={selectedMembers.includes(m.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedMembers([...selectedMembers, m.id]);
                        } else {
                          setSelectedMembers(selectedMembers.filter(id => id !== m.id));
                        }
                      }}
                      className="w-4 h-4 text-[var(--color-primary)] rounded border-gray-300 focus:ring-[var(--color-primary)]"
                    />
                    <div className="flex flex-col">
                      <span className="text-sm font-medium text-gray-800">{m.name}</span>
                      <span className="text-xs text-gray-500">{m.position || "Anggota"}</span>
                    </div>
                  </label>
                ))
              )}
            </div>
            <p className="text-xs text-gray-500 text-right">
              Telah dipilih: <span className="font-bold text-indigo-600">{selectedMembers.length}</span> anggota
            </p>
          </div>

          <div className="flex justify-end gap-3 mt-6">
            <button
              type="button"
              onClick={() => setIsMassalModalOpen(false)}
              className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isLoading || selectedMembers.length === 0}
              className="px-4 py-2 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white rounded-lg transition-colors disabled:opacity-50"
            >
              {isLoading ? "Menyimpan..." : "Simpan Data Massal"}
            </button>
          </div>
        </form>
      </DataModal>

      <DeleteConfirm
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={handleDelete}
        title="Hapus Data Iuran"
        message="Apakah Anda yakin ingin menghapus data iuran ini?"
        loading={isLoading}
      />
    </div>
  );
}
