"use client";

import { useState, useRef, useEffect } from "react";
import { Plus, ArrowDownCircle, ArrowUpCircle, ExternalLink, Download, Sparkles, Mic, Square } from "lucide-react";
import * as XLSX from "xlsx";
import { DataModal } from "@/components/DataModal";
import { DeleteConfirm } from "@/components/DeleteConfirm";
import { DataTable } from "@/components/DataTable";
import { tambahTransaksi, editTransaksi, hapusTransaksi, parseTransaksiHarian } from "./actions";

// Assume we check Gemini config status based on a server action or we just assume it's true since we just added it.
// Wait, we didn't add isGeminiConfigured to Transaksi's actions.ts. We will assume it's configured for simplicity in this component or just let the error throw if not.

export default function TransaksiClient({ transactions }: { transactions: any[] }) {
  const [filter, setFilter] = useState("Semua");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedData, setSelectedData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // AI & Voice State
  const [showAIPanel, setShowAIPanel] = useState(false);
  const [transaksiText, setTransaksiText] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const recognitionRef = useRef<any>(null);

  const [formDataState, setFormDataState] = useState({
    transaction_date: new Date().toISOString().split('T')[0],
    type: "Pengeluaran",
    category: "",
    amount: "",
    description: "",
    responsible_person: "",
    proof_url: ""
  });

  const filteredData = filter === "Semua" 
    ? transactions 
    : transactions.filter((t) => t.type === filter);

  const totalFiltered = filteredData.reduce((sum, t) => sum + Number(t.amount || 0), 0);

  const openAdd = () => {
    setSelectedData(null);
    setFormDataState({
      transaction_date: new Date().toISOString().split('T')[0],
      type: "Pengeluaran",
      category: "",
      amount: "",
      description: "",
      responsible_person: "",
      proof_url: ""
    });
    setTransaksiText("");
    setShowAIPanel(false);
    setErrorMsg("");
    setIsModalOpen(true);
  };

  const openEdit = (data: any) => {
    setSelectedData(data);
    setFormDataState({
      transaction_date: data.transaction_date || "",
      type: data.type || "Pengeluaran",
      category: data.category || "",
      amount: data.amount?.toString() || "",
      description: data.description || "",
      responsible_person: data.responsible_person || "",
      proof_url: data.proof_url || ""
    });
    setTransaksiText("");
    setShowAIPanel(false);
    setErrorMsg("");
    setIsModalOpen(true);
  };

  const openDelete = (data: any) => {
    setSelectedData(data);
    setIsDeleteOpen(true);
  };

  const toggleRecording = () => {
    if (isRecording) {
      if (recognitionRef.current) recognitionRef.current.stop();
      setIsRecording(false);
      return;
    }

    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      alert("Browser Anda tidak mendukung fitur perekaman suara. Silakan gunakan Google Chrome.");
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'id-ID';

    recognition.onresult = (event: any) => {
      let finalTranscript = '';
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript + ' ';
        }
      }
      if (finalTranscript) {
        setTransaksiText((prev) => prev + (prev.length > 0 && !prev.endsWith(' ') ? ' ' : '') + finalTranscript);
      }
    };

    recognition.onerror = (event: any) => {
      console.error("Speech recognition error", event.error);
      setIsRecording(false);
    };

    recognition.onend = () => {
      setIsRecording(false);
    };

    recognition.start();
    recognitionRef.current = recognition;
    setIsRecording(true);
  };

  const handleAIProcess = async () => {
    if (!transaksiText.trim()) return;
    setIsAnalyzing(true);
    setErrorMsg("");
    try {
      const parsed = await parseTransaksiHarian(transaksiText);
      setFormDataState(prev => ({
        ...prev,
        type: parsed.type === "Pemasukan" || parsed.type === "Pengeluaran" ? parsed.type : prev.type,
        category: parsed.category || prev.category,
        amount: parsed.amount ? parsed.amount.toString() : prev.amount,
        description: parsed.description || prev.description,
        responsible_person: parsed.responsible_person || prev.responsible_person,
      }));
      setShowAIPanel(false);
    } catch (err: any) {
      setErrorMsg(err.message || "Gagal memproses dengan AI");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg("");

    const formData = new FormData();
    formData.append("transaction_date", formDataState.transaction_date);
    formData.append("type", formDataState.type);
    formData.append("category", formDataState.category);
    formData.append("amount", formDataState.amount);
    formData.append("description", formDataState.description);
    formData.append("responsible_person", formDataState.responsible_person);
    formData.append("proof_url", formDataState.proof_url);

    try {
      if (selectedData) {
        await editTransaksi(selectedData.id, formData);
      } else {
        await tambahTransaksi(formData);
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
      await hapusTransaksi(selectedData.id);
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
      "Tanggal": d.transaction_date,
      "Tipe": d.type,
      "Kategori": d.category,
      "Keterangan": d.description || "-",
      "Nominal": d.amount,
      "Penanggung Jawab": d.responsible_person
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Transaksi");
    
    const wscols = [
      {wch: 5}, {wch: 15}, {wch: 15}, {wch: 25}, {wch: 35}, {wch: 15}, {wch: 25}
    ];
    worksheet['!cols'] = wscols;

    XLSX.writeFile(workbook, `Laporan_Transaksi_${filter}.xlsx`);
  };

  const columns = [
    { key: "transaction_date", label: "Tanggal" },
    { 
      key: "type", 
      label: "Tipe", 
      render: (row: any) => (
        <span className={`px-2 py-1 text-xs rounded-full flex items-center gap-1 w-max ${
          row.type === 'Pemasukan' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
        }`}>
          {row.type === 'Pemasukan' ? <ArrowDownCircle size={12}/> : <ArrowUpCircle size={12}/>}
          {row.type}
        </span>
      ) 
    },
    { key: "category", label: "Kategori" },
    { key: "description", label: "Keterangan" },
    { 
      key: "amount", 
      label: "Nominal",
      render: (row: any) => (
        <span className="font-medium whitespace-nowrap">
          Rp {row.amount?.toLocaleString('id-ID')}
        </span>
      )
    },
    { key: "responsible_person", label: "Penanggung Jawab" },
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
        <div className="flex gap-2">
          {["Semua", "Pemasukan", "Pengeluaran"].map((f) => (
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
        <div className="flex items-center gap-4 w-full sm:w-auto">
          {filter !== "Semua" && (
            <div className="text-sm px-4 py-2 bg-gray-50 border rounded-lg whitespace-nowrap hidden md:block">
              Total {filter}: <span className="font-bold">Rp {totalFiltered.toLocaleString('id-ID')}</span>
            </div>
          )}
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            <button
              onClick={handleExportExcel}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors w-full sm:w-auto justify-center"
            >
              <Download size={20} />
              Ekspor Excel
            </button>
            <button
              onClick={openAdd}
              className="bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors w-full sm:w-auto justify-center shadow-md shadow-blue-200"
            >
              <Plus size={20} />
              Tambah Data
            </button>
          </div>
        </div>
      </div>

      {filter !== "Semua" && (
        <div className="text-sm px-4 py-3 bg-gray-50 border rounded-lg sm:hidden">
          Total {filter}: <span className="font-bold">Rp {totalFiltered.toLocaleString('id-ID')}</span>
        </div>
      )}

      <DataTable pagination pageSize={10} 
        data={filteredData}
        columns={columns}
        onEdit={openEdit}
        onDelete={openDelete}
        emptyMessage={`Belum ada data ${filter === 'Semua' ? 'transaksi' : filter.toLowerCase()}.`}
      />

      <DataModal
        isOpen={isModalOpen}
        onClose={() => {
          if (isRecording && recognitionRef.current) recognitionRef.current.stop();
          setIsModalOpen(false);
        }}
        title={selectedData ? "Edit Transaksi" : "Tambah Transaksi"}
      >
        <div className="space-y-4">
          {!selectedData && (
            <div className="border border-blue-100 bg-blue-50/50 rounded-xl overflow-hidden transition-all">
              <button 
                onClick={() => setShowAIPanel(!showAIPanel)}
                className="w-full flex items-center justify-between p-4 hover:bg-blue-50 transition-colors"
              >
                <div className="flex items-center gap-2 text-blue-700 font-semibold">
                  <Sparkles size={18} className="text-blue-500" />
                  ✨ Dikte Kilat via Suara (AI)
                </div>
                <span className="text-xs font-medium px-2 py-1 bg-blue-100 text-blue-600 rounded-full">
                  Opsional
                </span>
              </button>

              {showAIPanel && (
                <div className="p-4 pt-0 border-t border-blue-100">
                  <div className="space-y-3 mt-2">
                    <p className="text-xs text-gray-500">
                      Cukup ucapkan: <strong>"Beli konsumsi rapat dan gorengan 50 ribu"</strong>. AI akan otomatis menebak jenis, nominal, dan kategori transaksinya!
                    </p>
                    <div className="relative">
                      <textarea
                        value={transaksiText}
                        onChange={(e) => setTransaksiText(e.target.value)}
                        placeholder="Mulai mendikte dengan suara..."
                        className="w-full h-32 p-3 pb-12 text-sm border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none resize-none bg-white"
                      />
                      <div className="absolute bottom-2 left-2 right-2 flex justify-between items-center">
                        <button
                          type="button"
                          onClick={toggleRecording}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                            isRecording 
                              ? "bg-red-100 text-red-700 hover:bg-red-200 animate-pulse" 
                              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                          }`}
                        >
                          {isRecording ? <Square size={14} className="fill-current" /> : <Mic size={14} />}
                          {isRecording ? "Hentikan Rekaman" : "Dikte Suara"}
                        </button>
                        
                        <button
                          type="button"
                          onClick={handleAIProcess}
                          disabled={!transaksiText.trim() || isAnalyzing || isRecording}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-full text-xs font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <Sparkles size={14} />
                          {isAnalyzing ? "Menganalisis..." : "Proses AI"}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {errorMsg && (
              <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg">
                {errorMsg}
              </div>
            )}
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Tanggal</label>
                <input 
                  type="date" 
                  value={formDataState.transaction_date}
                  onChange={(e) => setFormDataState({...formDataState, transaction_date: e.target.value})}
                  required
                  className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-[var(--color-primary)] outline-none"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Tipe</label>
                <select 
                  value={formDataState.type}
                  onChange={(e) => setFormDataState({...formDataState, type: e.target.value})}
                  required
                  className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-[var(--color-primary)] outline-none"
                >
                  <option value="Pemasukan">Pemasukan</option>
                  <option value="Pengeluaran">Pengeluaran</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Kategori</label>
                <input 
                  value={formDataState.category}
                  onChange={(e) => setFormDataState({...formDataState, category: e.target.value})}
                  required
                  placeholder="Misal: Uang Kas, Pembelian ATK..."
                  className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-[var(--color-primary)] outline-none"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Nominal (Rp)</label>
                <input 
                  type="number" 
                  value={formDataState.amount}
                  onChange={(e) => setFormDataState({...formDataState, amount: e.target.value})}
                  required
                  min="0"
                  placeholder="Misal: 50000"
                  className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-[var(--color-primary)] outline-none"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Keterangan</label>
              <textarea 
                value={formDataState.description}
                onChange={(e) => setFormDataState({...formDataState, description: e.target.value})}
                rows={3}
                placeholder="Deskripsi detail transaksi..."
                className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-[var(--color-primary)] outline-none resize-none"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Penanggung Jawab</label>
                <input 
                  value={formDataState.responsible_person}
                  onChange={(e) => setFormDataState({...formDataState, responsible_person: e.target.value})}
                  required
                  placeholder="Nama penanggung jawab"
                  className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-[var(--color-primary)] outline-none"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Link Bukti (Opsional)</label>
                <input 
                  type="url"
                  value={formDataState.proof_url}
                  onChange={(e) => setFormDataState({...formDataState, proof_url: e.target.value})}
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
        </div>
      </DataModal>

      <DeleteConfirm
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={handleDelete}
        title="Hapus Transaksi"
        message="Apakah Anda yakin ingin menghapus data transaksi ini?"
        loading={isLoading}
      />
    </div>
  );
}
