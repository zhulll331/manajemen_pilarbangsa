"use client";

import { useState, useRef, useEffect } from "react";
import { Plus, Target, TrendingUp, TrendingDown, Lightbulb, Sparkles, Mic, Square } from "lucide-react";
import { DataModal } from "@/components/DataModal";
import { DeleteConfirm } from "@/components/DeleteConfirm";
import { DataTable } from "@/components/DataTable";
import { tambahEvaluasi, editEvaluasi, hapusEvaluasi, isGeminiConfigured, parseNotulenEvaluasi } from "./actions";

export default function EvaluasiClient({ evaluations, programs }: { evaluations: any[], programs: any[] }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedData, setSelectedData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // AI & Form State
  const [hasGeminiKey, setHasGeminiKey] = useState(false);
  const [showAIPanel, setShowAIPanel] = useState(false);
  const [notulenText, setNotulenText] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const recognitionRef = useRef<any>(null);

  const [formDataState, setFormDataState] = useState({
    program_id: "",
    title: "",
    strengths: "",
    weaknesses: "",
    recommendations: ""
  });

  useEffect(() => {
    isGeminiConfigured().then(setHasGeminiKey);
  }, []);

  const openAdd = () => {
    setSelectedData(null);
    setFormDataState({ program_id: "", title: "", strengths: "", weaknesses: "", recommendations: "" });
    setNotulenText("");
    setShowAIPanel(false);
    setErrorMsg("");
    setIsModalOpen(true);
  };

  const openEdit = (data: any) => {
    setSelectedData(data);
    setFormDataState({
      program_id: data.program_id || "",
      title: data.title || "",
      strengths: data.strengths || "",
      weaknesses: data.weaknesses || "",
      recommendations: data.recommendations || ""
    });
    setNotulenText("");
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
        setNotulenText((prev) => prev + (prev.length > 0 && !prev.endsWith(' ') ? ' ' : '') + finalTranscript);
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
    if (!notulenText.trim()) return;
    setIsAnalyzing(true);
    setErrorMsg("");
    try {
      const parsed = await parseNotulenEvaluasi(notulenText);
      setFormDataState(prev => ({
        ...prev,
        title: parsed.title || prev.title,
        strengths: parsed.strengths || prev.strengths,
        weaknesses: parsed.weaknesses || prev.weaknesses,
        recommendations: parsed.recommendations || prev.recommendations
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
    formData.append("program_id", formDataState.program_id);
    formData.append("title", formDataState.title);
    formData.append("strengths", formDataState.strengths);
    formData.append("weaknesses", formDataState.weaknesses);
    formData.append("recommendations", formDataState.recommendations);

    try {
      if (selectedData) {
        await editEvaluasi(selectedData.id, formData);
      } else {
        await tambahEvaluasi(formData);
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
      await hapusEvaluasi(selectedData.id);
      setIsDeleteOpen(false);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const columns = [
    { 
      key: "program", 
      label: "Program Kerja",
      render: (row: any) => (
        <div className="flex items-center gap-2">
          <Target size={16} className="text-[var(--color-primary)]" />
          <span className="font-semibold">{row.programs?.title || "Program Dihapus"}</span>
        </div>
      )
    },
    { key: "title", label: "Judul Evaluasi" },
    { 
      key: "strengths", 
      label: "Kekuatan",
      render: (row: any) => (
        <div className="flex gap-2">
          <TrendingUp size={16} className="text-green-500 shrink-0 mt-0.5" />
          <p className="line-clamp-2 text-sm">{row.strengths || "-"}</p>
        </div>
      )
    },
    { 
      key: "weaknesses", 
      label: "Kelemahan",
      render: (row: any) => (
        <div className="flex gap-2">
          <TrendingDown size={16} className="text-red-500 shrink-0 mt-0.5" />
          <p className="line-clamp-2 text-sm">{row.weaknesses || "-"}</p>
        </div>
      )
    },
    { 
      key: "recommendations", 
      label: "Rekomendasi",
      render: (row: any) => (
        <div className="flex gap-2">
          <Lightbulb size={16} className="text-yellow-500 shrink-0 mt-0.5" />
          <p className="line-clamp-2 text-sm">{row.recommendations || "-"}</p>
        </div>
      )
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <button
          onClick={openAdd}
          className="bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors w-full sm:w-auto justify-center shadow-md shadow-blue-200"
        >
          <Plus size={20} />
          Buat Evaluasi
        </button>
      </div>

      <DataTable pagination pageSize={10} 
        data={evaluations}
        columns={columns}
        onEdit={openEdit}
        onDelete={openDelete}
        emptyMessage="Belum ada data evaluasi kegiatan."
      />

      <DataModal
        isOpen={isModalOpen}
        onClose={() => {
          if (isRecording && recognitionRef.current) recognitionRef.current.stop();
          setIsModalOpen(false);
        }}
        title={selectedData ? "Edit Evaluasi" : "Buat Evaluasi Baru"}
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
                  ✨ Rekam / Tempel Notulensi (AI)
                </div>
                <span className="text-xs font-medium px-2 py-1 bg-blue-100 text-blue-600 rounded-full">
                  Opsional
                </span>
              </button>

              {showAIPanel && (
                <div className="p-4 pt-0 border-t border-blue-100">
                  {!hasGeminiKey ? (
                    <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg mt-2">
                      <h4 className="font-bold text-yellow-800 mb-1">Kunci API Gemini Belum Dikonfigurasi</h4>
                      <p className="text-sm text-yellow-700 mb-3">
                        Untuk menggunakan fitur AI gratis ini, Anda harus mendaftarkan kunci API di Google AI Studio.
                      </p>
                      <ol className="text-sm text-yellow-800 list-decimal ml-4 space-y-1">
                        <li>Kunjungi <a href="https://aistudio.google.com/" target="_blank" className="text-blue-600 hover:underline font-medium">Google AI Studio</a>.</li>
                        <li>Masuk dengan akun Google & buat <strong>API Key</strong> baru.</li>
                        <li>Buka file <code>.env.local</code> di folder proyek ini.</li>
                        <li>Tambahkan: <code>GEMINI_API_KEY=kunci_rahasia_anda</code></li>
                        <li>Restart server (<code>npm run dev</code>).</li>
                      </ol>
                    </div>
                  ) : (
                    <div className="space-y-3 mt-2">
                      <p className="text-xs text-gray-500">
                        Anda bisa mengetik, *copy-paste*, atau mendiktekan notulensi rapat di sini. AI akan merangkumnya ke dalam tabel secara otomatis.
                      </p>
                      <div className="relative">
                        <textarea
                          value={notulenText}
                          onChange={(e) => setNotulenText(e.target.value)}
                          placeholder="Mulai mendikte dengan suara, atau tempelkan teks notulensi di sini..."
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
                            disabled={!notulenText.trim() || isAnalyzing || isRecording}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-full text-xs font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <Sparkles size={14} />
                            {isAnalyzing ? "Menganalisis..." : "Proses AI"}
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
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
              <label className="text-sm font-medium text-gray-700">Program Kerja yang Dievaluasi</label>
              <select 
                value={formDataState.program_id}
                onChange={(e) => setFormDataState({...formDataState, program_id: e.target.value})}
                required
                className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-[var(--color-primary)] outline-none"
              >
                <option value="" disabled>Pilih Program Kerja</option>
                {programs.map(p => (
                  <option key={p.id} value={p.id}>{p.title}</option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Judul Evaluasi</label>
              <input 
                value={formDataState.title}
                onChange={(e) => setFormDataState({...formDataState, title: e.target.value})}
                required
                placeholder="Contoh: Evaluasi Tengah Tahun Raker"
                className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-[var(--color-primary)] outline-none"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Kekuatan (Strengths)</label>
              <textarea 
                value={formDataState.strengths}
                onChange={(e) => setFormDataState({...formDataState, strengths: e.target.value})}
                rows={3}
                placeholder="Hal-hal positif yang berhasil dicapai..."
                className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-[var(--color-primary)] outline-none resize-none"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Kelemahan (Weaknesses)</label>
              <textarea 
                value={formDataState.weaknesses}
                onChange={(e) => setFormDataState({...formDataState, weaknesses: e.target.value})}
                rows={3}
                placeholder="Kendala atau kekurangan selama pelaksanaan..."
                className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-[var(--color-primary)] outline-none resize-none"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Rekomendasi / Tindak Lanjut</label>
              <textarea 
                value={formDataState.recommendations}
                onChange={(e) => setFormDataState({...formDataState, recommendations: e.target.value})}
                rows={3}
                placeholder="Saran untuk perbaikan di masa mendatang..."
                className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-[var(--color-primary)] outline-none resize-none"
              />
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
        title="Hapus Evaluasi"
        message="Apakah Anda yakin ingin menghapus data evaluasi ini?"
        loading={isLoading}
      />
    </div>
  );
}
