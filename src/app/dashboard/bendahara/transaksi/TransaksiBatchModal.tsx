"use client";

import { useState, useRef } from "react";
import { Plus, Trash2, Save, X, Sparkles, Mic, Square, Wallet } from "lucide-react";
import { useUploadQueue } from "@/context/UploadQueueContext";
import { tambahTransaksiMassal, parseBatchTransaksiNemotron } from "./actions";

interface TransaksiBatchModalProps {
  isOpen: boolean;
  onClose: () => void;
  programs: any[];
  onSuccess: () => void;
  currentSaldo?: number;
}

export function TransaksiBatchModal({ isOpen, onClose, programs, onSuccess, currentSaldo = 0 }: TransaksiBatchModalProps) {
  const { enqueueUpload } = useUploadQueue();
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [programId, setProgramId] = useState("");
  const [transactionDate, setTransactionDate] = useState(new Date().toISOString().split('T')[0]);

  // AI & Voice State
  const [showAIPanel, setShowAIPanel] = useState(false);
  const [transaksiText, setTransaksiText] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const recognitionRef = useRef<any>(null);

  const emptyRow = {
    type: "Pengeluaran",
    category: "",
    amount: "",
    description: "",
    responsible_person: "",
    proof_url: "",
  };

  const [rows, setRows] = useState<any[]>([{ ...emptyRow }]);
  const [rowFiles, setRowFiles] = useState<Record<number, File[]>>({});

  if (!isOpen) return null;

  const handleAddRow = () => {
    setRows([...rows, { ...emptyRow }]);
  };

  const handleRemoveRow = (index: number) => {
    if (rows.length <= 1) return;
    const newRows = [...rows];
    newRows.splice(index, 1);
    setRows(newRows);
    
    const newFiles = { ...rowFiles };
    delete newFiles[index];
    // shift index keys for files
    const shiftedFiles: Record<number, File[]> = {};
    Object.keys(newFiles).forEach(key => {
      const k = parseInt(key);
      if (k > index) {
        shiftedFiles[k - 1] = newFiles[k];
      } else if (k < index) {
        shiftedFiles[k] = newFiles[k];
      }
    });
    setRowFiles(shiftedFiles);
  };

  const updateRow = (index: number, field: string, value: string) => {
    const newRows = [...rows];
    newRows[index][field] = value;
    setRows(newRows);
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
      const parsedArray = await parseBatchTransaksiNemotron(transaksiText);
      const newRows = parsedArray.map((item: any) => ({
        type: item.type === "Pemasukan" || item.type === "Pengeluaran" ? item.type : "Pengeluaran",
        category: item.category || "",
        amount: item.amount ? item.amount.toString() : "",
        description: item.description || "",
        responsible_person: item.responsible_person || "",
        proof_url: ""
      }));
      setRows(newRows);
      setRowFiles({});
      setShowAIPanel(false);
    } catch (err: any) {
      setErrorMsg(err.message || "Gagal memproses dengan AI Nemotron");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rows.length === 0) return;
    setIsLoading(true);
    setErrorMsg("");

    try {
      const finalData = rows.map((row) => ({
        transaction_date: transactionDate,
        type: row.type,
        category: row.category,
        amount: row.amount,
        description: row.description,
        responsible_person: row.responsible_person,
        proof_url: row.proof_url || "",
        folder_id: null,
        program_id: programId || null,
      }));

      const res = await tambahTransaksiMassal(finalData);
      const insertedRows = res?.data || [];

      // Simpan salinan file dan data baris sebelum modal di-reset
      const savedRowFiles = { ...rowFiles };
      const savedRows = [...rows];

      // Tutup modal langsung seketika (< 1 detik)!
      setRows([{ ...emptyRow }]);
      setRowFiles({});
      setProgramId("");
      onSuccess();
      onClose();

      // Enqueue upload latar belakang untuk baris yang memiliki file bukti
      for (let i = 0; i < savedRows.length; i++) {
        const recordId = insertedRows[i]?.id;
        const files = savedRowFiles[i] || [];
        if (recordId && files.length > 0) {
          const rowDesc = savedRows[i].description || savedRows[i].category || "Transaksi Proker";
          for (const file of files) {
            enqueueUpload({
              file,
              title: `Bukti: ${rowDesc}`,
              recordId,
              tableName: "finance_transactions",
              fieldName: "proof_url",
              append: true,
              folderName: "Bukti Kas Batch",
              parentFolderName: "Bendahara",
            });
          }
        }
      }
    } catch (error: any) {
      setErrorMsg(error.message || "Terjadi kesalahan saat menyimpan data massal.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-6xl max-h-[90vh] flex flex-col overflow-hidden">
        <div className="flex justify-between items-center p-6 border-b">
          <div>
            <h2 className="text-xl font-bold text-gray-800">Tambah Transaksi Massal (Proker)</h2>
            <p className="text-sm text-gray-500 mt-1">Input banyak baris transaksi sekaligus untuk satu Program Kerja.</p>
          </div>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 bg-gray-50/50">
          {/* Info Saldo Kas Saat Ini & Simulasi */}
          <div className="mb-6 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 p-4 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-blue-100 text-blue-700 rounded-lg">
                <Wallet size={20} />
              </div>
              <div>
                <p className="text-xs text-blue-600 font-medium">Saldo Kas Sebelum Input Ini</p>
                <p className="text-base font-bold text-blue-950">
                  Rp {currentSaldo.toLocaleString('id-ID')}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4 text-xs">
              <div>
                <p className="text-gray-500 font-medium">Total Dampak Transaksi</p>
                {(() => {
                  const diff = rows.reduce((acc, r) => {
                    const amt = Number(r.amount || 0);
                    return r.type === "Pemasukan" ? acc + amt : acc - amt;
                  }, 0);
                  return (
                    <p className={`font-bold text-sm ${diff >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {diff >= 0 ? '+' : '-'} Rp {Math.abs(diff).toLocaleString('id-ID')}
                    </p>
                  );
                })()}
              </div>
              <div className="border-l pl-4">
                <p className="text-gray-500 font-medium">Estimasi Saldo Baru</p>
                {(() => {
                  const diff = rows.reduce((acc, r) => {
                    const amt = Number(r.amount || 0);
                    return r.type === "Pemasukan" ? acc + amt : acc - amt;
                  }, 0);
                  const newSaldo = currentSaldo + diff;
                  return (
                    <p className={`font-bold text-sm ${newSaldo >= 0 ? 'text-blue-950' : 'text-red-600'}`}>
                      Rp {newSaldo.toLocaleString('id-ID')}
                    </p>
                  );
                })()}
              </div>
            </div>
          </div>

          <div className="mb-6 flex justify-end">
            <button
              type="button"
              onClick={() => setShowAIPanel(!showAIPanel)}
              className="flex items-center gap-2 text-sm text-purple-600 font-medium hover:bg-purple-50 px-3 py-1.5 rounded-full transition-colors border border-purple-200 bg-white"
            >
              <Sparkles size={16} />
              Dikte Kilat via Suara / Teks (AI Nemotron)
            </button>
          </div>

          {showAIPanel && (
            <div className="mb-6 bg-gradient-to-br from-purple-50 to-white p-5 rounded-xl border border-purple-100 shadow-sm">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-semibold text-purple-900 flex items-center gap-2">
                    <Sparkles size={18} className="text-purple-600" />
                    Asisten AI Nemotron
                  </h3>
                  <p className="text-xs text-purple-700/80 mt-1">
                    Ucapkan atau tempel daftar transaksi RAB Anda. AI akan mengisikan baris secara otomatis! (Contoh: "Beli konsumsi 50rb, honor pemateri 100rb...")
                  </p>
                </div>
                <button
                  type="button"
                  onClick={toggleRecording}
                  className={`p-3 rounded-full transition-all duration-300 shadow-sm flex items-center justify-center ${
                    isRecording 
                      ? 'bg-red-500 hover:bg-red-600 text-white animate-pulse shadow-red-200' 
                      : 'bg-white hover:bg-gray-50 text-gray-600 border border-gray-200'
                  }`}
                  title={isRecording ? "Hentikan Rekaman" : "Mulai Merekam Suara"}
                >
                  {isRecording ? <Square size={20} className="fill-current" /> : <Mic size={20} />}
                </button>
              </div>
              
              <div className="relative">
                <textarea
                  value={transaksiText}
                  onChange={(e) => setTransaksiText(e.target.value)}
                  placeholder="Tempel RAB disini, atau klik tombol mic untuk mendikte..."
                  className="w-full p-4 pr-12 border border-purple-200 rounded-xl outline-none focus:ring-2 focus:ring-purple-300 resize-none min-h-[100px] text-sm text-gray-700 bg-white shadow-inner"
                />
              </div>

              <div className="mt-4 flex justify-end">
                <button
                  type="button"
                  onClick={handleAIProcess}
                  disabled={isAnalyzing || !transaksiText.trim()}
                  className="bg-purple-600 hover:bg-purple-700 text-white px-5 py-2.5 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 flex items-center gap-2 shadow-sm"
                >
                  {isAnalyzing ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Menganalisis...
                    </>
                  ) : (
                    <>Isi Baris Otomatis</>
                  )}
                </button>
              </div>
            </div>
          )}

          {errorMsg && (
            <div className="p-3 mb-4 bg-red-50 text-red-600 text-sm rounded-xl font-medium">
              {errorMsg}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8 bg-white p-5 rounded-xl border shadow-sm">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Tanggal Transaksi (Semua Baris)</label>
              <input 
                type="date" 
                value={transactionDate}
                onChange={(e) => setTransactionDate(e.target.value)}
                required
                className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-[var(--color-primary)] outline-none"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Program Kerja (Berlaku untuk Semua)</label>
              <select 
                value={programId}
                onChange={(e) => setProgramId(e.target.value)}
                className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-[var(--color-primary)] outline-none bg-white"
              >
                <option value="">Bukan Proker / Kebutuhan Internal</option>
                {programs.map((p) => (
                  <option key={p.id} value={p.id}>{p.title}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-4">
            {rows.map((row, index) => (
              <div key={index} className="bg-white p-5 rounded-xl border shadow-sm relative group">
                <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button type="button" onClick={() => handleRemoveRow(index)} className="p-1.5 bg-red-50 text-red-600 rounded hover:bg-red-100 transition-colors" title="Hapus Baris">
                    <Trash2 size={16} />
                  </button>
                </div>
                
                <h4 className="font-semibold text-gray-700 mb-4 border-b pb-2">Baris #{index + 1}</h4>
                
                <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                  <div className="md:col-span-2 space-y-1">
                    <label className="text-xs font-medium text-gray-500">Tipe</label>
                    <select 
                      value={row.type}
                      onChange={(e) => updateRow(index, 'type', e.target.value)}
                      className="w-full p-2 text-sm border rounded-lg focus:ring-1 focus:ring-[var(--color-primary)] outline-none"
                    >
                      <option value="Pengeluaran">Pengeluaran</option>
                      <option value="Pemasukan">Pemasukan</option>
                    </select>
                  </div>
                  
                  <div className="md:col-span-3 space-y-1">
                    <label className="text-xs font-medium text-gray-500">Kategori</label>
                    <input 
                      value={row.category}
                      onChange={(e) => updateRow(index, 'category', e.target.value)}
                      required
                      placeholder="Konsumsi, ATK..."
                      className="w-full p-2 text-sm border rounded-lg focus:ring-1 focus:ring-[var(--color-primary)] outline-none"
                    />
                  </div>
                  
                  <div className="md:col-span-2 space-y-1">
                    <label className="text-xs font-medium text-gray-500">Nominal (Rp)</label>
                    <input 
                      type="number"
                      value={row.amount}
                      onChange={(e) => updateRow(index, 'amount', e.target.value)}
                      required
                      min="0"
                      placeholder="50000"
                      className="w-full p-2 text-sm border rounded-lg focus:ring-1 focus:ring-[var(--color-primary)] outline-none"
                    />
                  </div>
                  
                  <div className="md:col-span-3 space-y-1">
                    <label className="text-xs font-medium text-gray-500">Keterangan Singkat</label>
                    <input 
                      value={row.description}
                      onChange={(e) => updateRow(index, 'description', e.target.value)}
                      placeholder="Beli snack rapat"
                      className="w-full p-2 text-sm border rounded-lg focus:ring-1 focus:ring-[var(--color-primary)] outline-none"
                    />
                  </div>

                  <div className="md:col-span-2 space-y-1">
                    <label className="text-xs font-medium text-gray-500">Penanggung Jawab</label>
                    <input 
                      value={row.responsible_person}
                      onChange={(e) => updateRow(index, 'responsible_person', e.target.value)}
                      required
                      placeholder="Nama"
                      className="w-full p-2 text-sm border rounded-lg focus:ring-1 focus:ring-[var(--color-primary)] outline-none"
                    />
                  </div>

                  <div className="md:col-span-6 space-y-1">
                    <label className="text-xs font-medium text-gray-500">Link Bukti Tambahan (Opsional)</label>
                    <input 
                      type="url"
                      value={row.proof_url}
                      onChange={(e) => updateRow(index, 'proof_url', e.target.value)}
                      placeholder="https://..."
                      className="w-full p-2 text-sm border rounded-lg focus:ring-1 focus:ring-[var(--color-primary)] outline-none"
                    />
                  </div>

                  <div className="md:col-span-6 space-y-1">
                    <label className="text-xs font-medium text-gray-500">Upload Bukti Fisik</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="file"
                        multiple
                        accept="image/*,.pdf"
                        onChange={(e) => {
                          const files = Array.from(e.target.files || []);
                          setRowFiles({ ...rowFiles, [index]: files });
                        }}
                        className="w-full text-xs text-gray-500 file:mr-2 file:py-1 file:px-3 file:rounded file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer"
                      />
                      {rowFiles[index]?.length > 0 && (
                        <span className="text-xs font-bold text-green-600 whitespace-nowrap">{rowFiles[index].length} file</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 flex justify-center">
            <button
              type="button"
              onClick={handleAddRow}
              className="px-6 py-2.5 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-lg font-medium transition-colors flex items-center gap-2"
            >
              <Plus size={18} /> Tambah Baris Transaksi
            </button>
          </div>
        </form>

        <div className="p-6 border-t bg-white flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 text-gray-600 hover:bg-gray-100 rounded-lg font-medium transition-colors"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isLoading || rows.length === 0}
            className="px-5 py-2.5 bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-white rounded-lg font-medium flex items-center gap-2 transition-colors disabled:opacity-50"
          >
            {isLoading ? "Menyimpan & Upload..." : <><Save size={18} /> Simpan Semua Baris</>}
          </button>
        </div>
      </div>
    </div>
  );
}
