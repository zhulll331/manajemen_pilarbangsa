"use client";

import { useState, useRef, useEffect } from "react";
import { Plus, ClipboardList, Calendar, Users, MessageSquare, CheckCircle, ArrowRight, Link as LinkIcon, Sparkles, Mic, Square } from "lucide-react";
import { DataModal } from "@/components/DataModal";
import { DeleteConfirm } from "@/components/DeleteConfirm";
import { tambahNotulensi, editNotulensi, hapusNotulensi, parseNotulensiRapat, isGeminiConfigured } from "./actions";

interface Minute {
  id: string;
  title: string;
  meeting_date: string;
  participants: string;
  discussion: string;
  decisions: string;
  follow_up: string;
  file_url: string | null;
}

export default function NotulensiClient({ minutes }: { minutes: Minute[] }) {
  const [showModal, setShowModal] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [showDetail, setShowDetail] = useState<Minute | null>(null);
  const [editData, setEditData] = useState<Minute | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Minute | null>(null);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // AI & Form State
  const [hasGeminiKey, setHasGeminiKey] = useState(false);
  const [showAIPanel, setShowAIPanel] = useState(false);
  const [notulenText, setNotulenText] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const recognitionRef = useRef<any>(null);

  const [formDataState, setFormDataState] = useState({
    title: "",
    meeting_date: "",
    participants: "",
    discussion: "",
    decisions: "",
    follow_up: "",
    file_url: ""
  });

  useEffect(() => {
    // Check if AI API is available
    if (typeof isGeminiConfigured === 'function') {
      isGeminiConfigured().then(setHasGeminiKey).catch(() => setHasGeminiKey(false));
    } else {
      // Fallback if not exported correctly initially
      setHasGeminiKey(true);
    }
  }, []);

  const openAdd = () => {
    setEditData(null);
    setFormDataState({ title: "", meeting_date: "", participants: "", discussion: "", decisions: "", follow_up: "", file_url: "" });
    setNotulenText("");
    setShowAIPanel(false);
    setErrorMsg("");
    setShowModal(true);
  };

  const openEdit = (data: Minute) => {
    setEditData(data);
    setFormDataState({
      title: data.title || "",
      meeting_date: data.meeting_date || "",
      participants: data.participants || "",
      discussion: data.discussion || "",
      decisions: data.decisions || "",
      follow_up: data.follow_up || "",
      file_url: data.file_url || ""
    });
    setNotulenText("");
    setShowAIPanel(false);
    setErrorMsg("");
    setShowModal(true);
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
      const parsed = await parseNotulensiRapat(notulenText);
      setFormDataState(prev => ({
        ...prev,
        title: parsed.title || prev.title,
        meeting_date: parsed.meeting_date || prev.meeting_date,
        participants: parsed.participants || prev.participants,
        discussion: parsed.discussion || prev.discussion,
        decisions: parsed.decisions || prev.decisions,
        follow_up: parsed.follow_up || prev.follow_up
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
    setLoading(true);
    setErrorMsg("");

    const formData = new FormData();
    if (editData) formData.append("id", editData.id);
    formData.append("title", formDataState.title);
    formData.append("meeting_date", formDataState.meeting_date);
    formData.append("participants", formDataState.participants);
    formData.append("discussion", formDataState.discussion);
    formData.append("decisions", formDataState.decisions);
    formData.append("follow_up", formDataState.follow_up);
    formData.append("file_url", formDataState.file_url);

    try {
      if (editData) {
        await editNotulensi(formData);
      } else {
        await tambahNotulensi(formData);
      }
      setShowModal(false);
      setEditData(null);
    } catch (err: any) {
      setErrorMsg(err.message || "Terjadi kesalahan");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setLoading(true);
    try {
      await hapusNotulensi(deleteTarget.id);
      setShowDelete(false);
      setDeleteTarget(null);
    } catch (err: any) {
      alert("Gagal menghapus: " + err.message);
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
            <ClipboardList size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Notulensi Rapat</h1>
            <p className="text-sm text-gray-500">Kelola catatan hasil rapat organisasi</p>
          </div>
        </div>
        <button
          onClick={openAdd}
          className="flex items-center gap-2 px-5 py-2.5 bg-[var(--color-primary)] text-white rounded-xl font-medium hover:bg-[var(--color-secondary)] transition-colors shadow-sm"
        >
          <Plus size={18} />
          Tambah Notulensi
        </button>
      </div>

      {/* Card Grid */}
      {minutes.length === 0 ? (
        <div className="bg-white rounded-2xl p-16 shadow-sm border border-gray-100 text-center">
          <ClipboardList size={48} className="mx-auto text-gray-300 mb-4" />
          <p className="text-gray-400 text-sm">Belum ada notulensi.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {minutes.map((m) => (
            <div
              key={m.id}
              className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:border-[var(--color-secondary)] hover:shadow-md transition-all cursor-pointer group"
              onClick={() => setShowDetail(m)}
            >
              <div className="flex items-start justify-between mb-3">
                <h3 className="text-base font-bold text-gray-800 group-hover:text-[var(--color-primary)] transition-colors line-clamp-2">
                  {m.title}
                </h3>
                <div className="flex gap-1 shrink-0 ml-2">
                  <button
                    onClick={(e) => { e.stopPropagation(); openEdit(m); }}
                    className="p-1.5 rounded-lg text-blue-500 hover:bg-blue-50 transition-colors"
                    title="Edit"
                  >
                    <ClipboardList size={14} />
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); setDeleteTarget(m); setShowDelete(true); }}
                    className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 transition-colors"
                    title="Hapus"
                  >
                    ✕
                  </button>
                </div>
              </div>

              <div className="space-y-2 text-xs text-gray-500">
                <div className="flex items-center gap-2">
                  <Calendar size={14} className="text-gray-400" />
                  <span>{m.meeting_date || "Tanggal belum diisi"}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Users size={14} className="text-gray-400" />
                  <span className="line-clamp-1">{m.participants || "-"}</span>
                </div>
              </div>

              {m.discussion && (
                <p className="text-xs text-gray-400 mt-3 line-clamp-2">{m.discussion}</p>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Detail Modal */}
      <DataModal
        isOpen={!!showDetail}
        onClose={() => setShowDetail(null)}
        title={showDetail?.title || ""}
      >
        {showDetail && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Calendar size={16} />
              <span>{showDetail.meeting_date || "-"}</span>
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1 flex items-center gap-1"><Users size={14} /> Peserta</p>
              <p className="text-sm text-gray-700">{showDetail.participants || "-"}</p>
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1 flex items-center gap-1"><MessageSquare size={14} /> Pembahasan</p>
              <p className="text-sm text-gray-700 whitespace-pre-line">{showDetail.discussion || "-"}</p>
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1 flex items-center gap-1"><CheckCircle size={14} /> Keputusan</p>
              <p className="text-sm text-gray-700 whitespace-pre-line">{showDetail.decisions || "-"}</p>
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1 flex items-center gap-1"><ArrowRight size={14} /> Tindak Lanjut</p>
              <p className="text-sm text-gray-700 whitespace-pre-line">{showDetail.follow_up || "-"}</p>
            </div>
            {showDetail.file_url && (
              <a href={showDetail.file_url} target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-sm text-[var(--color-primary)] hover:underline">
                <LinkIcon size={14} /> Lihat Dokumen
              </a>
            )}
          </div>
        )}
      </DataModal>

      {/* Form Modal */}
      <DataModal
        isOpen={showModal}
        onClose={() => {
          if (isRecording && recognitionRef.current) recognitionRef.current.stop();
          setShowModal(false);
        }}
        title={editData ? "Edit Notulensi" : "Tambah Notulensi Baru"}
      >
        <div className="space-y-4">
          {!editData && (
            <div className="border border-indigo-100 bg-indigo-50/50 rounded-xl overflow-hidden transition-all">
              <button 
                onClick={() => setShowAIPanel(!showAIPanel)}
                className="w-full flex items-center justify-between p-4 hover:bg-indigo-50 transition-colors"
              >
                <div className="flex items-center gap-2 text-indigo-700 font-semibold">
                  <Sparkles size={18} className="text-indigo-500" />
                  ✨ Rekam / Tempel Dikte Rapat (AI)
                </div>
                <span className="text-xs font-medium px-2 py-1 bg-indigo-100 text-indigo-600 rounded-full">
                  Opsional
                </span>
              </button>

              {showAIPanel && (
                <div className="p-4 pt-0 border-t border-indigo-100">
                  {!hasGeminiKey ? (
                    <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg mt-2">
                      <h4 className="font-bold text-yellow-800 mb-1">Kunci API Gemini Belum Dikonfigurasi</h4>
                      <p className="text-sm text-yellow-700 mb-3">
                        Untuk menggunakan fitur AI gratis ini, Anda harus mendaftarkan kunci API di file .env.local.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3 mt-2">
                      <p className="text-xs text-gray-500">
                        Anda bisa mendiktekan jalannya rapat di sini. AI akan merangkumnya ke dalam form otomatis.
                      </p>
                      <div className="relative">
                        <textarea
                          value={notulenText}
                          onChange={(e) => setNotulenText(e.target.value)}
                          placeholder="Mulai mendikte dengan suara, atau tempelkan draf rapat di sini..."
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
                            disabled={!notulenText.trim() || isAnalyzing || isRecording}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white rounded-full text-xs font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Judul Rapat</label>
              <input 
                value={formDataState.title}
                onChange={(e) => setFormDataState({...formDataState, title: e.target.value})}
                required
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent outline-none transition" 
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tanggal Rapat</label>
              <input 
                type="date" 
                value={formDataState.meeting_date}
                onChange={(e) => setFormDataState({...formDataState, meeting_date: e.target.value})}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent outline-none transition" 
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Peserta</label>
              <input 
                value={formDataState.participants}
                onChange={(e) => setFormDataState({...formDataState, participants: e.target.value})}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent outline-none transition"
                placeholder="Ketua, Sekretaris, Bendahara, ..." 
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Pembahasan</label>
              <textarea 
                value={formDataState.discussion}
                onChange={(e) => setFormDataState({...formDataState, discussion: e.target.value})}
                rows={3}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent outline-none transition resize-none" 
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Keputusan</label>
              <textarea 
                value={formDataState.decisions}
                onChange={(e) => setFormDataState({...formDataState, decisions: e.target.value})}
                rows={2}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent outline-none transition resize-none" 
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tindak Lanjut</label>
              <textarea 
                value={formDataState.follow_up}
                onChange={(e) => setFormDataState({...formDataState, follow_up: e.target.value})}
                rows={2}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent outline-none transition resize-none" 
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Link File (opsional)</label>
              <input 
                value={formDataState.file_url}
                onChange={(e) => setFormDataState({...formDataState, file_url: e.target.value})}
                placeholder="https://drive.google.com/..."
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent outline-none transition" 
              />
            </div>
            <div className="flex gap-3 pt-2">
              <button type="button" onClick={() => { setShowModal(false); setEditData(null); }}
                className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-gray-700 font-medium hover:bg-gray-50 transition-colors">
                Batal
              </button>
              <button type="submit" disabled={loading}
                className="flex-1 px-4 py-2.5 rounded-xl bg-[var(--color-primary)] text-white font-medium hover:bg-[var(--color-secondary)] transition-colors disabled:opacity-50">
                {loading ? "Menyimpan..." : editData ? "Simpan Perubahan" : "Tambah Notulensi"}
              </button>
            </div>
          </form>
        </div>
      </DataModal>

      <DeleteConfirm
        isOpen={showDelete}
        onClose={() => { setShowDelete(false); setDeleteTarget(null); }}
        onConfirm={handleDelete}
        loading={loading}
        message={`Hapus notulensi "${deleteTarget?.title}"?`}
      />
    </div>
  );
}
