"use client";

import { useState, useMemo, useRef } from "react";
import { uploadFileToDrive } from "@/utils/driveClientUpload";
import { Plus, FileText, Mail, MailOpen, Loader2, Sparkles, ArrowUpDown } from "lucide-react";
import { DataModal } from "@/components/DataModal";
import { DeleteConfirm } from "@/components/DeleteConfirm";
import { DataTable, type Column } from "@/components/DataTable";
import { getViewerUrl } from "@/utils/driveClientUpload";
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

const letterStatuses = ["Diterima", "Diproses", "Terkirim", "Selesai", "Diarsipkan"];
const documentTypes = ["Surat Masuk", "Surat Keluar", "Proposal", "LPJ", "SK", "Dokumentasi", "Lainnya"];

export default function SuratClient({ letters }: { letters: Letter[] }) {
  const [showModal, setShowModal] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [editData, setEditData] = useState<Letter | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Letter | null>(null);
  const [loading, setLoading] = useState(false);
  const [extracting, setExtracting] = useState(false);
  const [filter, setFilter] = useState<string>("Semua");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  // Range Number States
  const [isRangeMode, setIsRangeMode] = useState(false);
  const [letterNumberInput, setLetterNumberInput] = useState("");
  const [rangeStart, setRangeStart] = useState("");
  const [rangeEnd, setRangeEnd] = useState("");
  const [rangeSuffix, setRangeSuffix] = useState("");

  const generatedRangeNumber = useMemo(() => {
    if (!rangeStart && !rangeEnd) return "";
    const startFormatted = rangeStart ? rangeStart.padStart(3, "0") : "";
    const endFormatted = rangeEnd ? rangeEnd.padStart(3, "0") : "";
    let suffix = rangeSuffix.trim();
    if (suffix && !suffix.startsWith("/")) {
      suffix = "/" + suffix;
    }
    if (startFormatted && endFormatted) {
      return `${startFormatted} - ${endFormatted}${suffix}`;
    }
    return `${startFormatted || endFormatted}${suffix}`;
  }, [rangeStart, rangeEnd, rangeSuffix]);

  const openAdd = () => {
    setEditData(null);
    setSelectedFile(null);
    setLetterNumberInput("");
    setRangeStart("");
    setRangeEnd("");
    setRangeSuffix("");
    setIsRangeMode(false);
    setShowModal(true);
  };

  const openEdit = (l: Letter) => {
    setEditData(l);
    setSelectedFile(null);
    const num = l.letter_number || "";
    setLetterNumberInput(num);
    const match = num.match(/(\d+)\s*-\s*(\d+)(.*)/);
    if (match) {
      setRangeStart(match[1]);
      setRangeEnd(match[2]);
      setRangeSuffix(match[3] || "");
      setIsRangeMode(true);
    } else {
      setRangeStart("");
      setRangeEnd("");
      setRangeSuffix("");
      setIsRangeMode(false);
    }
    setShowModal(true);
  };

  const handleExtract = async () => {
    if (!selectedFile) {
      alert("Pilih file terlebih dahulu sebelum melakukan ekstraksi otomatis!");
      return;
    }

    setExtracting(true);
    try {
      const formData = new FormData();
      formData.append("file", selectedFile);

      const res = await fetch("/api/gemini/extract-surat", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal mengekstrak dokumen");

      if (formRef.current) {
        const elements = formRef.current.elements as any;
        if (data.letter_type && elements.letter_type) elements.letter_type.value = data.letter_type;
        if (data.letter_number && elements.letter_number) {
          elements.letter_number.value = data.letter_number;
          setLetterNumberInput(data.letter_number);
          setIsRangeMode(false);
        }
        if (data.date && elements.date) elements.date.value = data.date;
        if (data.sender && elements.sender) elements.sender.value = data.sender;
        if (data.recipient && elements.recipient) elements.recipient.value = data.recipient;
        if (data.subject && elements.subject) elements.subject.value = data.subject;
      }
      
      // Optional: beri tahu user berhasil
      alert("✨ Ekstraksi berhasil! Kolom formulir telah diisi otomatis.");
    } catch (e: any) {
      alert("Gagal ekstraksi otomatis: " + e.message);
    } finally {
      setExtracting(false);
    }
  };

  const [sortBy, setSortBy] = useState<"smart" | "nomor_desc" | "nomor_asc" | "date_desc" | "date_asc">("smart");

  const getInitialNumber = (letterNum?: string | null): number | null => {
    if (!letterNum) return null;
    const match = letterNum.trim().match(/(?:^|No\.?\s*)(\d+)/i);
    return match ? parseInt(match[1], 10) : null;
  };

  const isUkmLetter = (str?: string | null) => {
    return str ? /UKM14/i.test(str) : false;
  };

  const filteredLetters = useMemo(() => {
    return filter === "Semua"
      ? letters
      : letters.filter(l => l.letter_type === filter);
  }, [letters, filter]);

  const sortedLetters = useMemo(() => {
    const list = [...filteredLetters];

    if (sortBy === "smart") {
      // Urutan cerdas: Surat berkodekan UKM14 (contoh: 012/UKM14/...) diurutkan sesuai nomor awalnya
      const ukmDates = list
        .filter(l => isUkmLetter(l.letter_number) && l.date)
        .map(l => new Date(l.date).getTime());
      const maxUkmDate = ukmDates.length > 0 ? Math.max(...ukmDates) : Date.now();

      return list.sort((a, b) => {
        const isUkmA = isUkmLetter(a.letter_number);
        const isUkmB = isUkmLetter(b.letter_number);
        const numA = getInitialNumber(a.letter_number);
        const numB = getInitialNumber(b.letter_number);

        let timeA = a.date ? new Date(a.date).getTime() : 0;
        let timeB = b.date ? new Date(b.date).getTime() : 0;

        if (isUkmA && numA !== null) {
          timeA = maxUkmDate + (numA * 60 * 1000);
        }
        if (isUkmB && numB !== null) {
          timeB = maxUkmDate + (numB * 60 * 1000);
        }

        if (timeA !== timeB) return timeB - timeA;
        return (b.id || "").localeCompare(a.id || "");
      });
    }

    if (sortBy === "nomor_desc") {
      return list.sort((a, b) => {
        const numA = getInitialNumber(a.letter_number);
        const numB = getInitialNumber(b.letter_number);
        if (numA !== null && numB !== null) {
          if (numA !== numB) return numB - numA;
        } else if (numA !== null) return -1;
        else if (numB !== null) return 1;

        const dateA = a.date ? new Date(a.date).getTime() : 0;
        const dateB = b.date ? new Date(b.date).getTime() : 0;
        if (dateA !== dateB) return dateB - dateA;
        return (b.id || "").localeCompare(a.id || "");
      });
    }

    if (sortBy === "nomor_asc") {
      return list.sort((a, b) => {
        const numA = getInitialNumber(a.letter_number);
        const numB = getInitialNumber(b.letter_number);
        if (numA !== null && numB !== null) {
          if (numA !== numB) return numA - numB;
        } else if (numA !== null) return -1;
        else if (numB !== null) return 1;

        const dateA = a.date ? new Date(a.date).getTime() : 0;
        const dateB = b.date ? new Date(b.date).getTime() : 0;
        if (dateA !== dateB) return dateA - dateB;
        return (b.id || "").localeCompare(a.id || "");
      });
    }

    if (sortBy === "date_desc") {
      return list.sort((a, b) => {
        const dateA = a.date ? new Date(a.date).getTime() : 0;
        const dateB = b.date ? new Date(b.date).getTime() : 0;
        if (dateA !== dateB) return dateB - dateA;
        return (b.id || "").localeCompare(a.id || "");
      });
    }

    if (sortBy === "date_asc") {
      return list.sort((a, b) => {
        const dateA = a.date ? new Date(a.date).getTime() : 0;
        const dateB = b.date ? new Date(b.date).getTime() : 0;
        if (dateA !== dateB) return dateA - dateB;
        return (b.id || "").localeCompare(a.id || "");
      });
    }

    return list;
  }, [filteredLetters, sortBy]);

  const columns: Column<Letter>[] = [
    { 
      key: "letter_number", 
      label: "No. Surat / Dokumen", 
      render: (l) => (
        <div className="flex flex-col">
          <span className="font-medium text-gray-900 text-xs">{l.letter_number || "-"}</span>
          {l.letter_number && l.letter_number.includes(" - ") && (
            <span className="text-[10px] text-blue-600 font-semibold flex items-center gap-0.5">
              📜 Rentang Dokumen
            </span>
          )}
        </div>
      ) 
    },
    {
      key: "letter_type",
      label: "Kategori",
      render: (l) => (
        <span className={`inline-flex items-center gap-1 text-xs font-semibold px-3 py-1 rounded-full w-fit ${
          l.letter_type === "Surat Masuk" ? "bg-blue-100 text-blue-700" :
          l.letter_type === "Surat Keluar" ? "bg-indigo-100 text-indigo-700" :
          "bg-gray-100 text-gray-700"
        }`}>
          {l.letter_type === "Surat Masuk" ? <Mail size={12} /> : 
           l.letter_type === "Surat Keluar" ? <MailOpen size={12} /> : 
           <FileText size={12} />}
          {l.letter_type}
        </span>
      ),
    },
    { key: "date", label: "Tanggal" },
    { key: "subject", label: "Perihal / Judul", render: (l) => <span className="line-clamp-1 max-w-[200px]">{l.subject}</span> },
    { key: "sender", label: "Pengirim / Pembuat", render: (l) => l.sender || "-" },
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
      key: "file_url",
      label: "File Surat",
      render: (l) => l.file_url ? (
        <a href={getViewerUrl(l.file_url)} target="_blank" rel="noreferrer" className="text-[var(--color-primary)] hover:underline text-xs flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
          <FileText size={14} /> Buka
        </a>
      ) : <span className="text-gray-400 text-xs">-</span>
    },
  ];

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (loading) return; // Prevent double submit
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    try {
      const letterType = formData.get("letter_type") as string || "Masuk";
      const folderName = `Surat ${letterType}`;
      
      let folderId = "";
      if (selectedFile) {
        // Buat atau dapatkan folder di Google Drive dalam folder Sekretaris
        const res = await fetch('/api/drive/create-folder', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ folderName, parentFolderName: 'Sekretaris' })
        });
        const data = await res.json();
        if (data.error) throw new Error(data.error);
        if (data.folderId) folderId = data.folderId;

        // Upload langsung dari browser ke Google Drive (melewati Vercel)
        const { url: fileUrl } = await uploadFileToDrive(selectedFile, folderId || undefined);
        if (fileUrl) {
          formData.set('file_url', fileUrl);
        }
      }

      if (editData) {
        formData.append("id", editData.id);
        await editSurat(formData);
      } else {
        await tambahSurat(formData);
      }
      setShowModal(false);
      setEditData(null);
      setSelectedFile(null);
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
      if (deleteTarget.file_url && deleteTarget.file_url.includes('drive.google.com')) {
        await fetch('/api/drive/delete', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ fileUrl: deleteTarget.file_url })
        }).catch(err => console.error('Gagal hapus file drive:', err));
      }

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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start sm:items-center gap-3">
          <div className="p-2.5 rounded-xl bg-blue-100 text-[var(--color-primary)] shrink-0 mt-1 sm:mt-0">
            <FileText size={24} />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-800">Arsip & Persuratan</h1>
            <p className="text-sm text-gray-500 line-clamp-2 sm:line-clamp-none">Kelola surat masuk, surat keluar, proposal, LPJ, dan arsip dokumen lainnya</p>
          </div>
        </div>
        <button
          onClick={openAdd}
          className="flex items-center justify-center gap-2 px-5 py-2.5 bg-[var(--color-primary)] text-white rounded-xl font-medium hover:bg-[var(--color-secondary)] transition-colors shadow-sm w-full sm:w-auto"
        >
          <Plus size={18} />
          Tambah Data
        </button>
      </div>

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div className="flex overflow-x-auto pb-2 -mx-4 px-4 sm:mx-0 sm:px-0 hide-scrollbar gap-2 w-full sm:w-auto">
          <button
            onClick={() => setFilter("Semua")}
            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
              filter === "Semua" ? "bg-[var(--color-primary)] text-white shadow-sm" : "bg-white text-gray-600 hover:bg-gray-50 border border-gray-200"
            }`}
          >
            Semua Data
          </button>
          {documentTypes.map(type => (
            <button
              key={type}
              onClick={() => setFilter(type)}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                filter === type ? "bg-[var(--color-primary)] text-white shadow-sm" : "bg-white text-gray-600 hover:bg-gray-50 border border-gray-200"
              }`}
            >
              {type}
            </button>
          ))}
        </div>

        {/* Pengaturan Urutan */}
        <div className="flex items-center gap-2 self-end sm:self-auto bg-white px-3 py-2 rounded-xl border border-gray-200 shadow-2xs">
          <ArrowUpDown size={14} className="text-gray-400 shrink-0" />
          <span className="text-xs text-gray-500 font-medium whitespace-nowrap">Urutkan:</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="text-xs font-semibold text-gray-700 bg-transparent outline-none cursor-pointer"
          >
            <option value="smart">Nomor Surat UKM (Sesuai Urutan)</option>
            <option value="nomor_desc">Nomor Terbesar ke Terkecil (015 → 001)</option>
            <option value="nomor_asc">Nomor Terkecil ke Terbesar (001 → 015)</option>
            <option value="date_desc">Tanggal (Terbaru)</option>
            <option value="date_asc">Tanggal (Terlama)</option>
          </select>
        </div>
      </div>

      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <DataTable pagination pageSize={10}
          columns={columns}
          data={sortedLetters}
          onEdit={openEdit}
          onDelete={(l) => { setDeleteTarget(l); setShowDelete(true); }}
          emptyMessage="Belum ada data."
        />
      </div>

      <DataModal
        isOpen={showModal}
        onClose={() => { if (!loading && !extracting) { setShowModal(false); setEditData(null); } }}
        title={editData ? "Edit Data" : "Tambah Data"}
      >
        <form ref={formRef} onSubmit={handleSubmit} className="space-y-4 relative">
          {(loading || extracting) && (
            <div className="absolute inset-0 bg-white/50 z-10 flex items-center justify-center backdrop-blur-[1px] rounded-xl">
              <div className="flex flex-col items-center text-blue-600 gap-2">
                <Loader2 size={32} className="animate-spin" />
                <span className="text-sm font-semibold">
                  {extracting ? "✨ AI sedang membaca dokumen..." : "Memproses Dokumen..."}
                </span>
              </div>
            </div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Kategori / Tipe Dokumen</label>
              <select name="letter_type" defaultValue={editData?.letter_type || documentTypes[0]}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent outline-none transition bg-white">
                {documentTypes.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select name="status" defaultValue={editData?.status || "Diterima"}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent outline-none transition bg-white">
                {letterStatuses.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="block text-sm font-medium text-gray-700">No. Surat / Dokumen (Opsional)</label>
                <button
                  type="button"
                  onClick={() => {
                    if (!isRangeMode && !rangeSuffix) {
                      setRangeSuffix("/UKM14/SRT/VIII/2026");
                    }
                    setIsRangeMode(!isRangeMode);
                  }}
                  className="text-xs text-[var(--color-primary)] font-semibold hover:underline flex items-center gap-1"
                >
                  {isRangeMode ? "Mode Manual" : "⚡ Mode Rentang Nomor"}
                </button>
              </div>

              {!isRangeMode ? (
                <input
                  name="letter_number"
                  value={letterNumberInput}
                  onChange={(e) => setLetterNumberInput(e.target.value)}
                  placeholder="Misal: 012/UKM14/AM/VIII/2026 atau 001 - 020"
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent outline-none transition"
                />
              ) : (
                <div className="p-3.5 bg-blue-50/60 border border-blue-200/80 rounded-xl space-y-2.5">
                  <div className="flex items-center justify-between text-xs text-blue-800 font-semibold">
                    <span>Rentang Nomor (Banyak Sertifikat/Surat)</span>
                    <span className="text-[10px] font-medium text-blue-600 bg-blue-100/70 px-2 py-0.5 rounded-full">
                      1 Arsip Mewakili Banyak Nomor
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <span className="text-[11px] text-gray-600 font-medium">Nomor Awal:</span>
                      <input
                        type="number"
                        min="1"
                        placeholder="Contoh: 1"
                        value={rangeStart}
                        onChange={(e) => setRangeStart(e.target.value)}
                        className="w-full px-3 py-1.5 bg-white border border-blue-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <span className="text-[11px] text-gray-600 font-medium">Nomor Akhir:</span>
                      <input
                        type="number"
                        min="1"
                        placeholder="Contoh: 20"
                        value={rangeEnd}
                        onChange={(e) => setRangeEnd(e.target.value)}
                        className="w-full px-3 py-1.5 bg-white border border-blue-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                  <div>
                    <span className="text-[11px] text-gray-600 font-medium">Format / Kode Surat (Opsional):</span>
                    <input
                      placeholder="Contoh: /UKM14/SRT/VIII/2026 (atau kosongkan)"
                      value={rangeSuffix}
                      onChange={(e) => setRangeSuffix(e.target.value)}
                      className="w-full px-3 py-1.5 bg-white border border-blue-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <div className="flex flex-wrap gap-1.5 mt-1.5">
                      <button
                        type="button"
                        onClick={() => setRangeSuffix("/UKM14/SRT/VIII/2026")}
                        className="text-[10px] bg-blue-100 hover:bg-blue-200 text-blue-700 px-2 py-0.5 rounded font-medium transition-colors"
                      >
                        + /UKM14/SRT/VIII/2026
                      </button>
                      <button
                        type="button"
                        onClick={() => setRangeSuffix("/UKM14/AM/VIII/2026")}
                        className="text-[10px] bg-blue-100 hover:bg-blue-200 text-blue-700 px-2 py-0.5 rounded font-medium transition-colors"
                      >
                        + /UKM14/AM/VIII/2026
                      </button>
                      <button
                        type="button"
                        onClick={() => setRangeSuffix("")}
                        className="text-[10px] bg-gray-100 hover:bg-gray-200 text-gray-600 px-2 py-0.5 rounded font-medium transition-colors"
                      >
                        Hanya Angka
                      </button>
                    </div>
                  </div>
                  <div className="bg-white p-2.5 rounded-lg border border-blue-100 text-xs">
                    <span className="text-gray-500">Hasil: </span>
                    <strong className="text-blue-900 font-mono">
                      {generatedRangeNumber || "Ketik nomor awal & akhir..."}
                    </strong>
                  </div>
                  <input type="hidden" name="letter_number" value={generatedRangeNumber} />
                </div>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tanggal</label>
              <input type="date" name="date" defaultValue={editData?.date} required
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent outline-none transition" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Pengirim / Pembuat (Opsional)</label>
              <input name="sender" defaultValue={editData?.sender || ""}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent outline-none transition mb-2" />
              <div className="flex gap-2">
                <button type="button" onClick={() => { if(formRef.current) (formRef.current.elements as any).sender.value = 'Sekretaris 1'; }} className="text-[10px] font-semibold bg-gray-100 hover:bg-gray-200 text-gray-700 px-2 py-1 rounded-md transition-colors">
                  Sekretaris 1
                </button>
                <button type="button" onClick={() => { if(formRef.current) (formRef.current.elements as any).sender.value = 'Sekretaris 2'; }} className="text-[10px] font-semibold bg-gray-100 hover:bg-gray-200 text-gray-700 px-2 py-1 rounded-md transition-colors">
                  Sekretaris 2
                </button>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Penerima / Tujuan (Opsional)</label>
              <input name="recipient" defaultValue={editData?.recipient || ""}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent outline-none transition" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Perihal / Judul Dokumen</label>
            <input name="subject" defaultValue={editData?.subject} required
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent outline-none transition" />
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-end mb-1">
              <label className="block text-sm font-medium text-gray-700">Upload File (Google Drive)</label>
              {selectedFile && (
                <button 
                  type="button" 
                  onClick={handleExtract}
                  disabled={extracting || loading}
                  className="flex items-center gap-1.5 text-xs font-semibold bg-indigo-50 text-indigo-600 px-3 py-1.5 rounded-lg hover:bg-indigo-100 transition-colors border border-indigo-200"
                >
                  <Sparkles size={14} />
                  Ekstrak Otomatis 🪄
                </button>
              )}
            </div>
            <div className="border-2 border-dashed border-gray-300 rounded-xl p-4 text-center hover:border-blue-500 transition-colors bg-blue-50/20">
              <input type="file" accept=".pdf,.doc,.docx,.png,.jpg,.jpeg"
                onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                className="w-full text-xs text-gray-500 file:mr-4 file:py-1.5 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-700 file:transition-colors cursor-pointer" />
              {selectedFile && (
                <p className="mt-2 text-xs font-bold text-green-600">File terpilih: {selectedFile.name}</p>
              )}
              <p className="mt-1 text-[11px] text-gray-400">Berkas akan masuk ke Google Drive Sekretaris.</p>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Atau Link Eksternal</label>
            <input name="file_url" defaultValue={editData?.file_url || ""} placeholder="https://drive.google.com/..."
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent outline-none transition" />
          </div>

          {editData?.file_url && (
            <div className="text-sm text-gray-500">
              File saat ini: <a href={getViewerUrl(editData.file_url)} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline">Lihat Berkas</a>
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
            <button type="button" onClick={() => { setShowModal(false); setEditData(null); setSelectedFile(null); }} disabled={loading}
              className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-gray-700 font-medium hover:bg-gray-50 transition-colors disabled:opacity-50">
              Batal
            </button>
            <button type="submit" disabled={loading}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[var(--color-primary)] text-white font-medium hover:bg-[var(--color-secondary)] transition-colors disabled:opacity-70 disabled:cursor-not-allowed">
              {loading ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  <span>Menyimpan & Upload...</span>
                </>
              ) : editData ? "Simpan Perubahan" : "Tambah Dokumen"}
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
