"use client";

import { useState, useRef, useEffect } from "react";
import { Plus, CheckCircle, Clock, AlertCircle, Sparkles, Mic, Square } from "lucide-react";
import { DataModal } from "@/components/DataModal";
import { DeleteConfirm } from "@/components/DeleteConfirm";
import { DataTable } from "@/components/DataTable";
import { ImportCSVModal } from "@/components/ImportCSVModal";
import { tambahProgram, editProgram, hapusProgram, importProgramBatch, parseProgramKerja } from "./actions";

export default function ProgramClient({ programs }: { programs: any[] }) {
  const [filter, setFilter] = useState("Semua");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedData, setSelectedData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // AI & Voice State
  const [showAIPanel, setShowAIPanel] = useState(false);
  const [ideText, setIdeText] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const recognitionRef = useRef<any>(null);

  const [formDataState, setFormDataState] = useState({
    title: "",
    description: "",
    division: "",
    status: "Belum Dimulai",
    person_in_charge: "",
    start_date: "",
    end_date: ""
  });

  const filteredData = filter === "Semua" 
    ? programs 
    : programs.filter((p) => p.status === filter);

  const openAdd = () => {
    setSelectedData(null);
    setFormDataState({
      title: "",
      description: "",
      division: "",
      status: "Belum Dimulai",
      person_in_charge: "",
      start_date: "",
      end_date: ""
    });
    setIdeText("");
    setShowAIPanel(false);
    setErrorMsg("");
    setIsModalOpen(true);
  };

  const openEdit = (data: any) => {
    setSelectedData(data);
    setFormDataState({
      title: data.title || "",
      description: data.description || "",
      division: data.division || "",
      status: data.status || "Belum Dimulai",
      person_in_charge: data.person_in_charge || "",
      start_date: data.start_date || "",
      end_date: data.end_date || ""
    });
    setIdeText("");
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
        setIdeText((prev) => prev + (prev.length > 0 && !prev.endsWith(' ') ? ' ' : '') + finalTranscript);
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
    if (!ideText.trim()) return;
    setIsAnalyzing(true);
    setErrorMsg("");
    try {
      const parsed = await parseProgramKerja(ideText);
      setFormDataState(prev => ({
        ...prev,
        title: parsed.title || prev.title,
        description: parsed.description || prev.description,
        division: parsed.division || prev.division,
        person_in_charge: parsed.person_in_charge || prev.person_in_charge,
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
    formData.append("title", formDataState.title);
    formData.append("description", formDataState.description);
    formData.append("division", formDataState.division);
    formData.append("status", formDataState.status);
    formData.append("person_in_charge", formDataState.person_in_charge);
    formData.append("start_date", formDataState.start_date);
    formData.append("end_date", formDataState.end_date);

    try {
      if (selectedData) {
        await editProgram(selectedData.id, formData);
      } else {
        await tambahProgram(formData);
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
      await hapusProgram(selectedData.id);
      setIsDeleteOpen(false);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const columns = [
    { key: "title", label: "Program Kerja" },
    { key: "division", label: "Divisi" },
    { key: "person_in_charge", label: "Penanggung Jawab" },
    { 
      key: "status", 
      label: "Status", 
      render: (row: any) => (
        <span className={`px-2 py-1 text-xs rounded-full flex items-center gap-1 w-max ${
          row.status === 'Selesai' ? 'bg-green-100 text-green-700' : 
          row.status === 'Berjalan' ? 'bg-blue-100 text-blue-700' : 
          row.status === 'Belum Dimulai' ? 'bg-gray-100 text-gray-700' :
          'bg-orange-100 text-orange-700'
        }`}>
          {row.status === 'Selesai' && <CheckCircle size={12}/>}
          {row.status === 'Berjalan' && <Clock size={12}/>}
          {row.status === 'Belum Dimulai' && <Clock size={12}/>}
          {row.status === 'Tertunda' && <AlertCircle size={12}/>}
          {row.status}
        </span>
      ) 
    },
    { 
      key: "start_date", 
      label: "Mulai",
      render: (row: any) => row.start_date || "-"
    },
    { 
      key: "end_date", 
      label: "Selesai",
      render: (row: any) => row.end_date || "-"
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex gap-2 flex-wrap">
          {["Semua", "Belum Dimulai", "Berjalan", "Tertunda", "Selesai"].map((f) => (
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
        
        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
          <button
            onClick={() => setIsImportOpen(true)}
            className="bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 px-4 py-2 rounded-lg flex items-center justify-center gap-2 transition-colors w-full sm:w-auto font-medium"
          >
            Import CSV
          </button>
          <button
            onClick={openAdd}
            className="bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-white px-4 py-2 rounded-lg flex items-center justify-center gap-2 transition-colors w-full sm:w-auto font-medium shadow-md shadow-indigo-200"
          >
            <Plus size={20} />
            Tambah Program
          </button>
        </div>
      </div>

      <DataTable 
        data={filteredData}
        columns={columns}
        onEdit={openEdit}
        onDelete={openDelete}
        emptyMessage={`Belum ada data program kerja ${filter === 'Semua' ? '' : filter.toLowerCase()}.`}
      />

      <DataModal
        isOpen={isModalOpen}
        onClose={() => {
          if (isRecording && recognitionRef.current) recognitionRef.current.stop();
          setIsModalOpen(false);
        }}
        title={selectedData ? "Edit Program Kerja" : "Tambah Program Kerja"}
      >
        <div className="space-y-4">
          {!selectedData && (
            <div className="border border-indigo-100 bg-indigo-50/50 rounded-xl overflow-hidden transition-all">
              <button 
                onClick={() => setShowAIPanel(!showAIPanel)}
                className="w-full flex items-center justify-between p-4 hover:bg-indigo-50 transition-colors"
              >
                <div className="flex items-center gap-2 text-indigo-700 font-semibold">
                  <Sparkles size={18} className="text-indigo-500" />
                  ✨ Brainstorming Ide (AI)
                </div>
                <span className="text-xs font-medium px-2 py-1 bg-indigo-100 text-indigo-600 rounded-full">
                  Opsional
                </span>
              </button>

              {showAIPanel && (
                <div className="p-4 pt-0 border-t border-indigo-100">
                  <div className="space-y-3 mt-2">
                    <p className="text-xs text-gray-500">
                      Cukup ucapkan ide Anda, contoh: <strong>"Bulan depan kita adakan turnamen esport untuk anak muda desa, tolong divisi humas yang urus, targetnya 100 orang"</strong>. AI akan menerjemahkannya menjadi draf formal!
                    </p>
                    <div className="relative">
                      <textarea
                        value={ideText}
                        onChange={(e) => setIdeText(e.target.value)}
                        placeholder="Mulai utarakan ide brilian Anda..."
                        className="w-full h-32 p-3 pb-12 text-sm border border-indigo-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none resize-none bg-white"
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
                          disabled={!ideText.trim() || isAnalyzing || isRecording}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white rounded-full text-xs font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
            
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Nama Program Kerja</label>
              <input 
                value={formDataState.title}
                onChange={(e) => setFormDataState({...formDataState, title: e.target.value})}
                required
                placeholder="Contoh: Rapat Kerja Tahunan"
                className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-[var(--color-primary)] outline-none"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Deskripsi Singkat</label>
              <textarea 
                value={formDataState.description}
                onChange={(e) => setFormDataState({...formDataState, description: e.target.value})}
                rows={3}
                placeholder="Jelaskan secara singkat mengenai program ini..."
                className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-[var(--color-primary)] outline-none resize-none"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Divisi</label>
                <input 
                  value={formDataState.division}
                  onChange={(e) => setFormDataState({...formDataState, division: e.target.value})}
                  required
                  placeholder="Misal: PSDM"
                  className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-[var(--color-primary)] outline-none"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Status</label>
                <select 
                  value={formDataState.status}
                  onChange={(e) => setFormDataState({...formDataState, status: e.target.value})}
                  required
                  className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-[var(--color-primary)] outline-none"
                >
                  <option value="Belum Dimulai">Belum Dimulai</option>
                  <option value="Berjalan">Berjalan</option>
                  <option value="Tertunda">Tertunda</option>
                  <option value="Selesai">Selesai</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Penanggung Jawab (PIC)</label>
                <input 
                  value={formDataState.person_in_charge}
                  onChange={(e) => setFormDataState({...formDataState, person_in_charge: e.target.value})}
                  required
                  placeholder="Nama PIC"
                  className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-[var(--color-primary)] outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Tanggal Mulai</label>
                <input 
                  type="date"
                  value={formDataState.start_date}
                  onChange={(e) => setFormDataState({...formDataState, start_date: e.target.value})}
                  className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-[var(--color-primary)] outline-none"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Tanggal Selesai</label>
                <input 
                  type="date"
                  value={formDataState.end_date}
                  onChange={(e) => setFormDataState({...formDataState, end_date: e.target.value})}
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
        title="Hapus Program Kerja"
        message="Apakah Anda yakin ingin menghapus data program kerja ini?"
        loading={isLoading}
      />

      {/* Import CSV Modal */}
      <ImportCSVModal
        isOpen={isImportOpen}
        onClose={() => setIsImportOpen(false)}
        onImport={async (data) => {
          await importProgramBatch(data);
        }}
        templateHeaders={["Judul", "Deskripsi", "Divisi", "PenanggungJawab", "Status", "TanggalMulai", "TanggalSelesai"]}
        title="Import Data Program Kerja"
      />
    </div>
  );
}
