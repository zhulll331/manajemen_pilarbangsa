"use client";

import { useState, useEffect, useRef } from "react";
import {
  Brain,
  FileText,
  UploadCloud,
  Trash2,
  Edit3,
  Download,
  CheckCircle2,
  AlertCircle,
  FileCode,
  Sparkles,
  RefreshCw,
  X,
  Save,
  BookOpen,
  Info,
} from "lucide-react";

interface KnowledgeDoc {
  slug: string;
  title: string;
  original_filename: string;
  file_type: string;
  file_size: number;
  created_at: string;
  updated_at: string;
  exists_on_disk: boolean;
}

export default function KnowledgeClient() {
  const [docs, setDocs] = useState<KnowledgeDoc[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Upload Form State
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [customTitle, setCustomTitle] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStep, setUploadStep] = useState<string>("");
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Editor Modal State
  const [editingDoc, setEditingDoc] = useState<KnowledgeDoc | null>(null);
  const [editorContent, setEditorContent] = useState<string>("");
  const [isFetchingContent, setIsFetchingContent] = useState(false);
  const [isSavingContent, setIsSavingContent] = useState(false);
  const [isEditorOpen, setIsEditorOpen] = useState(false);

  // Delete Confirmation State
  const [docToDelete, setDocToDelete] = useState<KnowledgeDoc | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // 1. Fetch Docs on Load
  const fetchDocs = async () => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const res = await fetch("/api/knowledge", { cache: "no-store" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal memuat dokumen");
      setDocs(data.docs || []);
    } catch (err: any) {
      setErrorMsg(err.message || "Terjadi kesalahan saat memuat data");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDocs();
  }, []);

  // 2. Handle File Selection
  const handleFileChange = (file: File) => {
    const ext = file.name.split(".").pop()?.toLowerCase();
    const validExts = ["pdf", "docx", "txt", "md"];
    if (!ext || !validExts.includes(ext)) {
      setErrorMsg("Format file tidak didukung! Gunakan PDF, DOCX, TXT, atau Markdown (.md).");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setErrorMsg("Ukuran file melebihi batas 10 MB.");
      return;
    }

    setErrorMsg(null);
    setSelectedFile(file);
    if (!customTitle) {
      // Auto-generate title from filename
      const baseName = file.name.replace(/\.[^/.]+$/, "");
      setCustomTitle(
        baseName
          .replace(/[_-]+/g, " ")
          .replace(/\b\w/g, (c) => c.toUpperCase())
      );
    }
  };

  // 3. Handle Upload & Async Conversion
  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) return;

    setIsUploading(true);
    setErrorMsg(null);
    setSuccessMsg(null);
    setUploadStep("1/4: Membaca berkas dokumen...");

    try {
      const formData = new FormData();
      formData.append("file", selectedFile);
      if (customTitle.trim()) {
        formData.append("title", customTitle.trim());
      }

      setTimeout(() => setUploadStep("2/4: Mengekstrak teks & struktur dokumen..."), 400);
      setTimeout(() => setUploadStep("3/4: Mengonversi ke Markdown bersih..."), 900);
      setTimeout(() => setUploadStep("4/4: Menyimpan & menyinkronkan ke otak AI..."), 1400);

      const res = await fetch("/api/knowledge", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal mengunggah dokumen");

      setSuccessMsg(data.message || "Dokumen berhasil diproses!");
      setSelectedFile(null);
      setCustomTitle("");
      if (fileInputRef.current) fileInputRef.current.value = "";

      // Refresh data
      await fetchDocs();
    } catch (err: any) {
      setErrorMsg(err.message || "Terjadi kesalahan saat memproses file");
    } finally {
      setIsUploading(false);
      setUploadStep("");
    }
  };

  // 4. Open Document Editor Modal
  const handleOpenEditor = async (doc: KnowledgeDoc) => {
    setEditingDoc(doc);
    setIsEditorOpen(true);
    setIsFetchingContent(true);
    setErrorMsg(null);
    try {
      const res = await fetch(`/api/knowledge/${doc.slug}`, { cache: "no-store" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal mengambil isi naskah");
      setEditorContent(data.content || "");
    } catch (err: any) {
      setErrorMsg(err.message || "Gagal membuka isi dokumen");
      setIsEditorOpen(false);
    } finally {
      setIsFetchingContent(false);
    }
  };

  // 5. Save Edited Content
  const handleSaveEditorContent = async () => {
    if (!editingDoc) return;
    setIsSavingContent(true);
    setErrorMsg(null);

    try {
      const res = await fetch(`/api/knowledge/${editingDoc.slug}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: editorContent, title: editingDoc.title }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal menyimpan perubahan");

      setSuccessMsg("Naskah berhasil diperbarui! Otak AI langsung menggunakan versi terbaru.");
      setIsEditorOpen(false);
      await fetchDocs();
    } catch (err: any) {
      setErrorMsg(err.message || "Gagal menyimpan editan");
    } finally {
      setIsSavingContent(false);
    }
  };

  // 6. Delete Document
  const handleConfirmDelete = async () => {
    if (!docToDelete) return;
    setIsDeleting(true);
    setErrorMsg(null);

    try {
      const res = await fetch(`/api/knowledge/${docToDelete.slug}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal menghapus dokumen");

      setSuccessMsg(`Dokumen "${docToDelete.title}" berhasil dihapus dari otak AI!`);
      setDocToDelete(null);
      await fetchDocs();
    } catch (err: any) {
      setErrorMsg(err.message || "Gagal menghapus dokumen");
    } finally {
      setIsDeleting(false);
    }
  };

  // 7. Download Markdown File
  const handleDownloadMd = (doc: KnowledgeDoc) => {
    window.open(`/api/knowledge/${doc.slug}`, "_blank");
  };

  const formatBytes = (bytes: number) => {
    if (!bytes || bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
  };

  const getBadgeColor = (type: string) => {
    switch (type.toLowerCase()) {
      case "pdf":
        return "bg-rose-100 text-rose-700 border-rose-200";
      case "docx":
        return "bg-blue-100 text-blue-700 border-blue-200";
      case "md":
        return "bg-purple-100 text-purple-700 border-purple-200";
      default:
        return "bg-emerald-100 text-emerald-700 border-emerald-200";
    }
  };

  return (
    <div className="space-y-6">
      {/* Alert Notifications */}
      {errorMsg && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-3 text-rose-800 text-sm">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-rose-600" />
          <div className="flex-1">{errorMsg}</div>
          <button
            onClick={() => setErrorMsg(null)}
            className="text-rose-500 hover:text-rose-700"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {successMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-start gap-3 text-emerald-800 text-sm">
          <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5 text-emerald-600" />
          <div className="flex-1">{successMsg}</div>
          <button
            onClick={() => setSuccessMsg(null)}
            className="text-emerald-500 hover:text-emerald-700"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Top Status Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-purple-50 flex items-center justify-center text-purple-600">
            <Brain className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-bold text-gray-900">{docs.length}</div>
            <div className="text-xs text-gray-500">Dokumen Otak AI Aktif</div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
            <FileCode className="w-6 h-6" />
          </div>
          <div>
            <div className="text-sm font-semibold text-gray-900">PDF, DOCX, TXT, MD</div>
            <div className="text-xs text-gray-500">Format yang Didukung</div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
            <Sparkles className="w-6 h-6" />
          </div>
          <div>
            <div className="text-sm font-semibold text-emerald-600 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              Sinkron Instan
            </div>
            <div className="text-xs text-gray-500">Tanpa Perlu Restart Server</div>
          </div>
        </div>
      </div>

      {/* Upload Dropzone Section */}
      <div className="bg-white rounded-2xl border border-gray-200/80 shadow-sm p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
              <UploadCloud className="w-5 h-5 text-blue-600" />
              Unggah Dokumen Resmi Baru
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">
              Unggah file PDF atau Word (DOCX) naskah AD/ART, Buku Panduan, atau SOP. Sistem akan mengonversinya menjadi Markdown secara otomatis.
            </p>
          </div>
        </div>

        <form onSubmit={handleUploadSubmit} className="space-y-4">
          {/* Dropzone Area */}
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragOver(true);
            }}
            onDragLeave={() => setIsDragOver(false)}
            onDrop={(e) => {
              e.preventDefault();
              setIsDragOver(false);
              if (e.dataTransfer.files?.[0]) {
                handleFileChange(e.dataTransfer.files[0]);
              }
            }}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${
              isDragOver
                ? "border-blue-500 bg-blue-50/50"
                : selectedFile
                ? "border-emerald-400 bg-emerald-50/30"
                : "border-gray-300 hover:border-blue-400 bg-gray-50/50 hover:bg-gray-50"
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.docx,.txt,.md"
              onChange={(e) => {
                if (e.target.files?.[0]) handleFileChange(e.target.files[0]);
              }}
              className="hidden"
            />

            {selectedFile ? (
              <div className="flex flex-col items-center justify-center gap-2">
                <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <div className="font-semibold text-gray-900 text-sm">
                  {selectedFile.name}
                </div>
                <div className="text-xs text-gray-500">
                  {formatBytes(selectedFile.size)} • Siap dikonversi ke basis pengetahuan
                </div>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedFile(null);
                    setCustomTitle("");
                    if (fileInputRef.current) fileInputRef.current.value = "";
                  }}
                  className="mt-1 text-xs text-rose-600 hover:underline font-medium"
                >
                  Ganti File
                </button>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center gap-2">
                <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center">
                  <UploadCloud className="w-6 h-6" />
                </div>
                <div className="text-sm font-semibold text-gray-800">
                  Tarik & lepas file dokumen ke sini, atau{" "}
                  <span className="text-blue-600 underline font-medium">pilih berkas</span>
                </div>
                <div className="text-xs text-gray-400">
                  Mendukung PDF, DOCX, TXT, dan MD (Maksimal 10 MB)
                </div>
              </div>
            )}
          </div>

          {/* Form Fields & Submit Button */}
          {selectedFile && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end pt-2">
              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Judul Dokumen di Basis Pengetahuan:
                </label>
                <input
                  type="text"
                  value={customTitle}
                  onChange={(e) => setCustomTitle(e.target.value)}
                  placeholder="Contoh: AD/ART UKM Pilar Bangsa 2025"
                  className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                  required
                />
              </div>

              <div>
                <button
                  type="submit"
                  disabled={isUploading}
                  className="w-full py-2.5 px-4 bg-[#1D4ED8] hover:bg-[#1E40AF] active:bg-blue-800 disabled:bg-blue-300 text-white font-semibold text-sm rounded-lg shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
                  style={{ backgroundColor: "#1D4ED8", color: "#FFFFFF" }}
                >
                  {isUploading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin text-white" />
                      <span className="text-white font-semibold">Memproses...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 text-white" />
                      <span className="text-white font-semibold">Konversi & Simpan ke AI</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Uploading Status Indicator */}
          {isUploading && (
            <div className="p-3 bg-blue-50 border border-blue-100 rounded-lg flex items-center gap-3 text-xs text-blue-800 animate-pulse">
              <RefreshCw className="w-4 h-4 animate-spin text-blue-600 shrink-0" />
              <span>{uploadStep || "Sedang memproses dokumen..."}</span>
            </div>
          )}
        </form>
      </div>

      {/* Document List Section */}
      <div className="bg-white rounded-2xl border border-gray-200/80 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-purple-600" />
              Daftar Dokumen Basis Pengetahuan
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">
              Semua dokumen berikut dibaca langsung oleh Pilar Asisten untuk menjawab pertanyaan pengunjung dan anggota.
            </p>
          </div>

          <button
            onClick={fetchDocs}
            disabled={isLoading}
            title="Segarkan daftar"
            className="p-2 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
          </button>
        </div>

        {isLoading ? (
          <div className="p-12 text-center text-gray-500 text-sm space-y-3">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto text-blue-600" />
            <div>Memuat daftar dokumen basis pengetahuan...</div>
          </div>
        ) : docs.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-gray-100 text-gray-400 flex items-center justify-center mx-auto">
              <FileText className="w-6 h-6" />
            </div>
            <div className="font-semibold text-gray-800 text-sm">
              Belum ada dokumen yang diunggah
            </div>
            <p className="text-xs text-gray-500 max-w-md mx-auto">
              Silakan unggah naskah AD/ART, Buku Pedoman, atau Peraturan Organisasi UKM Pilar Bangsa menggunakan form di atas agar AI dapat menjawab pertanyaan dengan akurat.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50/75 border-b border-gray-200/80 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                  <th className="px-5 py-3">Nama Dokumen</th>
                  <th className="px-4 py-3">Format</th>
                  <th className="px-4 py-3">Ukuran File</th>
                  <th className="px-4 py-3">Terakhir Diperbarui</th>
                  <th className="px-5 py-3 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-sm">
                {docs.map((doc) => (
                  <tr
                    key={doc.slug}
                    className="hover:bg-gray-50/60 transition-colors group"
                  >
                    <td className="px-5 py-3.5">
                      <div className="font-semibold text-gray-900">{doc.title}</div>
                      <div className="text-xs text-gray-400 font-mono flex items-center gap-1.5 mt-0.5">
                        <span>{doc.slug}.md</span>
                        {doc.original_filename && doc.original_filename !== `${doc.slug}.md` && (
                          <span className="text-gray-400">({doc.original_filename})</span>
                        )}
                      </div>
                    </td>

                    <td className="px-4 py-3.5">
                      <div className="flex flex-col items-start gap-0.5">
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold uppercase tracking-wide border bg-purple-100 text-purple-700 border-purple-200">
                          MD (.md)
                        </span>
                        {doc.file_type && doc.file_type.toLowerCase() !== "md" && (
                          <span className="text-[10px] text-gray-400 font-medium">
                            dari {doc.file_type.toUpperCase()}
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="px-4 py-3.5 text-xs text-gray-600 font-medium">
                      {formatBytes(doc.file_size)}
                    </td>

                    <td className="px-4 py-3.5 text-xs text-gray-500">
                      {new Date(doc.updated_at).toLocaleDateString("id-ID", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </td>

                    <td className="px-5 py-3.5 text-right space-x-1">
                      {/* Lihat / Edit Naskah */}
                      <button
                        onClick={() => handleOpenEditor(doc)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-medium transition"
                        title="Lihat & Edit Isi Teks"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span>Lihat / Edit</span>
                      </button>

                      {/* Hapus Dokumen */}
                      <button
                        onClick={() => setDocToDelete(doc)}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-rose-600 hover:bg-rose-50 text-xs font-medium transition"
                        title="Hapus Dokumen dari Otak AI"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Hapus</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Guidelines Box: Anti-Hallucination Advice */}
      <div className="p-5 bg-gradient-to-r from-amber-50 to-orange-50 rounded-2xl border border-amber-200/80 text-amber-900 space-y-2">
        <div className="flex items-center gap-2 font-bold text-sm text-amber-800">
          <Info className="w-4 h-4 text-amber-600" />
          Panduan Humas: Cara Menulis Dokumen Agar AI Tidak Halusinasi
        </div>
        <ul className="text-xs text-amber-900/90 space-y-1.5 list-disc list-inside">
          <li>
            <strong>Gunakan Penomoran Bab & Pasal yang Rapi:</strong> Tuliskan dengan format standar seperti <code>## BAB I: NAMA DAN ASAS</code> dan <code>### Pasal 1</code> agar AI dapat mengutip ayat secara tepat.
          </li>
          <li>
            <strong>Dokumen Hasil Scan Foto (PDF Gambar):</strong> Pastikan file PDF memiliki teks yang bisa diseleksi (bukan sekadar hasil foto dokumen yang buram) agar ekstraksi teks berhasil sempurna.
          </li>
          <li>
            <strong>Update Instan Otomatis:</strong> Dokumen yang Anda unggah, edit, atau hapus di sini akan langsung sinkron dengan Pilar Asisten saat itu juga tanpa perlu restart server.
          </li>
        </ul>
      </div>

      {/* MODAL 1: Markdown Text Editor */}
      {isEditorOpen && editingDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden border border-gray-200">
            {/* Modal Header */}
            <div className="p-4 border-b border-gray-200 flex items-center justify-between bg-gray-50">
              <div>
                <h3 className="font-bold text-gray-900 text-base flex items-center gap-2">
                  <FileText className="w-4 h-4 text-blue-600" />
                  Editor Naskah: {editingDoc.title}
                </h3>
                <p className="text-xs text-gray-500 font-mono mt-0.5">
                  src/data/knowledge_base/{editingDoc.slug}.md
                </p>
              </div>

              <button
                onClick={() => setIsEditorOpen(false)}
                className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-200/60"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-4 flex-1 overflow-y-auto">
              {isFetchingContent ? (
                <div className="py-20 text-center text-gray-500 text-sm space-y-2">
                  <RefreshCw className="w-6 h-6 animate-spin mx-auto text-blue-600" />
                  <div>Mengambil naskah dokumen...</div>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-xs text-gray-400">
                    <span>Format Markdown (Gunakan # untuk Bab, ## untuk Pasal)</span>
                    <span>{editorContent.length.toLocaleString()} Karakter</span>
                  </div>
                  <textarea
                    value={editorContent}
                    onChange={(e) => setEditorContent(e.target.value)}
                    rows={18}
                    className="w-full font-mono text-xs p-3.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-gray-50/50 leading-relaxed"
                    placeholder="Tuliskan isi dokumen di sini..."
                  />
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-gray-200 bg-gray-50 flex items-center justify-between">
              <button
                type="button"
                onClick={() => handleDownloadMd(editingDoc)}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium text-gray-600 hover:bg-gray-200/60 transition"
              >
                <Download className="w-3.5 h-3.5" />
                Unduh Teks (.md)
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsEditorOpen(false)}
                  className="px-4 py-2 rounded-lg text-xs font-medium text-gray-700 hover:bg-gray-200 transition"
                >
                  Tutup
                </button>
                <button
                  type="button"
                  onClick={handleSaveEditorContent}
                  disabled={isSavingContent || isFetchingContent}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#1D4ED8] hover:bg-[#1E40AF] disabled:bg-blue-300 text-white rounded-lg text-xs font-semibold shadow-sm transition cursor-pointer"
                  style={{ backgroundColor: "#1D4ED8", color: "#FFFFFF" }}
                >
                  {isSavingContent ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin text-white" />
                      <span className="text-white">Menyimpan...</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-3.5 h-3.5 text-white" />
                      <span className="text-white">Simpan Perubahan</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: Delete Confirmation Dialog */}
      {docToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 space-y-4 border border-gray-200">
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1">
              <h3 className="font-bold text-gray-900 text-base">
                Hapus Dokumen dari Otak AI?
              </h3>
              <p className="text-xs text-gray-500">
                Anda akan menghapus dokumen <strong>"{docToDelete.title}"</strong> (
                <code>{docToDelete.slug}.md</code>). File ini akan dihapus permanen dari server dan AI tidak akan lagi menggunakan aturan di dalamnya.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDocToDelete(null)}
                disabled={isDeleting}
                className="w-full py-2.5 px-4 border border-gray-300 rounded-xl text-xs font-semibold text-gray-700 hover:bg-gray-50 transition"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={isDeleting}
                className="w-full py-2.5 px-4 bg-rose-600 hover:bg-rose-700 disabled:bg-rose-400 text-white rounded-xl text-xs font-semibold shadow-sm transition flex items-center justify-center gap-1.5"
              >
                {isDeleting ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    Menghapus...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    Ya, Hapus Dokumen
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
