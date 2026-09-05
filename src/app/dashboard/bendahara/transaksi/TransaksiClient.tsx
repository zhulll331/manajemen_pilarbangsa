"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Plus, ArrowDownCircle, ArrowUpCircle, ExternalLink, Download, Sparkles, Mic, Square, Layers, Wallet, Eye, UploadCloud } from "lucide-react";
import * as XLSX from "xlsx";
import { useUploadQueue } from "@/context/UploadQueueContext";
import { DataModal } from "@/components/DataModal";
import { DeleteConfirm } from "@/components/DeleteConfirm";
import { DataTable, Column } from "@/components/DataTable";
import { tambahTransaksi, editTransaksi, hapusTransaksi, parseTransaksiHarian } from "./actions";
import { TransaksiBatchModal } from "./TransaksiBatchModal";


export default function TransaksiClient({ transactions, programs = [], totalIuranDiterima = 0, duesTransactions = [] }: { transactions: any[], programs?: any[], totalIuranDiterima?: number, duesTransactions?: any[] }) {
  const router = useRouter();
  const { enqueueUpload, getJobByRecordId } = useUploadQueue();

  const [filter, setFilter] = useState("Semua");
  const [groupProker, setGroupProker] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isBatchModalOpen, setIsBatchModalOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedData, setSelectedData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<any[] | null>(null);
  const [selectedGroupTitle, setSelectedGroupTitle] = useState<string>("");
  const [selectedProofs, setSelectedProofs] = useState<{ title: string; urls: string[] } | null>(null);

  // Refetch server data saat upload background transaksi selesai
  useEffect(() => {
    const handleFinished = (e: any) => {
      if (e.detail?.tableName === "finance_transactions") {
        router.refresh();
      }
    };
    window.addEventListener("upload-queue-finished", handleFinished);
    return () => window.removeEventListener("upload-queue-finished", handleFinished);
  }, [router]);

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
    proof_url: "",
    folder_id: "",
    program_id: ""
  });

  // Gabungkan finance_transactions + dues (sebagai baris virtual) lalu hitung running balance
  const { transactionsWithBalance, currentTotalSaldo } = useMemo(() => {
    // Gabungkan semua baris: transaksi keuangan biasa + iuran (virtual)
    const allRows = [...transactions, ...duesTransactions];

    // ── Sort kunci: transaction_date → created_at → id ──────────────────────
    // Dipakai BALIK SEMPURNA untuk ASC (kalkulasi) dan DESC (tampilan)
    // sehingga running_balance setiap baris selalu cocok posisi tampilannya.
    const sortKey = (a: any, b: any, dir: 1 | -1) => {
      const dateA = new Date(a.transaction_date).getTime();
      const dateB = new Date(b.transaction_date).getTime();
      if (dateA !== dateB) return dir * (dateA - dateB);
      const createdA = new Date(a.created_at || 0).getTime();
      const createdB = new Date(b.created_at || 0).getTime();
      if (createdA !== createdB) return dir * (createdA - createdB);
      // Tiebreaker: id — pastikan unik & deterministik
      return dir * (a.id || "").localeCompare(b.id || "");
    };

    // Urutkan ASC (terlama → terbaru) untuk menghitung running balance
    const sortedChronological = [...allRows].sort((a, b) => sortKey(a, b, 1));

    // Hitung running balance mulai dari 0
    let runningBalance = 0;
    const balanceById = new Map<string, number>();
    sortedChronological.forEach((t) => {
      const amt = Number(t.amount || 0);
      if (t.type === "Pemasukan") runningBalance += amt;
      else runningBalance -= amt;
      balanceById.set(t.id, runningBalance);
    });

    // Urutkan DESC (terbaru → terlama) untuk tampilan — KEBALIKAN sempurna dari ASC
    const withBalanceAll = allRows.map((t) => ({
      ...t,
      running_balance: balanceById.get(t.id) ?? 0,
    })).sort((a, b) => sortKey(a, b, -1)); // dir=-1 = DESC

    return {
      transactionsWithBalance: withBalanceAll,
      currentTotalSaldo: runningBalance,
    };
  }, [transactions, duesTransactions]);



  const filteredData = useMemo(() => {
    return filter === "Semua" 
      ? transactionsWithBalance 
      : transactionsWithBalance.filter((t) => t.type === filter);
  }, [filter, transactionsWithBalance]);

  const totalFiltered = useMemo(() => {
    return filteredData.reduce((sum, t) => sum + Number(t.amount || 0), 0);
  }, [filteredData]);

  // Grouping proker opsional — rapi tanpa membuat baris melar
  const tableData = useMemo(() => {
    if (!groupProker) return filteredData;

    const grouped = new Map<string, any>();
    const regularRows: any[] = [];

    filteredData.forEach((t) => {
      // Kelompokkan jika transaksi terhubung ke proker tertentu
      if (t.program_id && t.programs?.title) {
        const key = `${t.program_id}-${t.type}`;
        if (!grouped.has(key)) {
          grouped.set(key, {
            id: `grouped-${key}`,
            transaction_date: t.transaction_date,
            type: t.type,
            category: t.category || "Proker",
            programs: t.programs,
            program_id: t.program_id,
            amount: 0,
            running_balance: t.running_balance,
            description: `Total ${t.type} Proker: ${t.programs.title}`,
            responsible_person: t.responsible_person || "Tim Proker",
            proof_url: "",
            _originalRows: [],
            _isGroupedProker: true,
          });
        }
        const g = grouped.get(key)!;
        g.amount += Number(t.amount || 0);
        g._originalRows.push(t);

        // Ambil tanggal & saldo dari baris transaksi terbaru di dalam kelompok
        if (new Date(t.transaction_date).getTime() >= new Date(g.transaction_date).getTime()) {
          g.transaction_date = t.transaction_date;
          g.running_balance = t.running_balance;
          if (t.responsible_person) g.responsible_person = t.responsible_person;
        }

        // Kumpulkan semua link bukti unik tanpa duplikat
        if (t.proof_url) {
          const existing = g.proof_url ? g.proof_url.split(',') : [];
          const news = t.proof_url.split(',').filter(Boolean);
          g.proof_url = Array.from(new Set([...existing, ...news])).join(',');
        }
      } else {
        regularRows.push(t);
      }
    });

    const all = [...regularRows, ...Array.from(grouped.values())];

    return all.sort((a, b) => {
      const dateA = new Date(a.transaction_date).getTime();
      const dateB = new Date(b.transaction_date).getTime();
      if (dateA !== dateB) return dateB - dateA;
      return (b.id || "").localeCompare(a.id || "");
    });
  }, [filteredData, groupProker]);

  const openAdd = () => {
    setSelectedData(null);
    setFormDataState({
      transaction_date: new Date().toISOString().split('T')[0],
      type: "Pengeluaran",
      category: "",
      amount: "",
      description: "",
      responsible_person: "",
      proof_url: "",
      folder_id: "",
      program_id: ""
    });
    setSelectedFiles([]);
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
      proof_url: data.proof_url || "",
      folder_id: data.folder_id || "",
      program_id: data.program_id || ""
    });
    setSelectedFiles([]);
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

    const folderName = `Bukti Kas ${formDataState.type}`;
    let folderId = formDataState.folder_id || "";

    try {
      const formData = new FormData();
      formData.append("transaction_date", formDataState.transaction_date);
      formData.append("type", formDataState.type);
      formData.append("category", formDataState.category);
      formData.append("amount", formDataState.amount);
      formData.append("description", formDataState.description);
      formData.append("responsible_person", formDataState.responsible_person);
      formData.append("proof_url", formDataState.proof_url || "");
      formData.append("folder_id", folderId);
      formData.append("program_id", formDataState.program_id);

      let targetRecordId = selectedData?.id;

      if (selectedData) {
        await editTransaksi(selectedData.id, formData);
      } else {
        const res = await tambahTransaksi(formData);
        targetRecordId = res?.id;
      }

      const filesToUpload = [...selectedFiles];
      const currentDesc = formDataState.description || formDataState.category || "Transaksi";
      const currentType = formDataState.type;

      // Tutup modal langsung seketika (< 1 detik)!
      setIsModalOpen(false);
      setSelectedFiles([]);

      // Jika ada file bukti yang dipilih, jalankan upload di latar belakang
      if (filesToUpload.length > 0 && targetRecordId) {
        for (const file of filesToUpload) {
          enqueueUpload({
            file,
            title: `Bukti: ${currentDesc}`,
            recordId: targetRecordId,
            tableName: "finance_transactions",
            fieldName: "proof_url",
            append: true,
            folderName: `Bukti Kas ${currentType}`,
            parentFolderName: "Bendahara",
            folderId: folderId || undefined,
          });
        }
      }
    } catch (error: any) {
      setErrorMsg(error.message || "Terjadi kesalahan saat menyimpan data");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedData) return;
    setIsLoading(true);
    try {
      // Hapus file bukti dari Google Drive jika ada proof_url
      if (selectedData.proof_url) {
        const urls = selectedData.proof_url.split(',').filter(Boolean);
        for (const url of urls) {
          if (url.includes('drive.google.com')) {
            await fetch('/api/drive/delete', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ fileUrl: url })
            }).catch(err => console.error('Gagal hapus file drive:', err));
          }
        }
      }

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
      "Program Kerja": d.programs?.title || "-",
      "Keterangan": d.description || "-",
      "Nominal (Rp)": d.amount,
      "Saldo (Rp)": d.running_balance,
      "Penanggung Jawab": d.responsible_person,
      "Link Bukti": d.proof_url || "-"
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Transaksi");
    
    const wscols = [
      {wch: 5}, {wch: 15}, {wch: 15}, {wch: 25}, {wch: 35}, {wch: 15}, {wch: 18}, {wch: 25}, {wch: 40}
    ];
    worksheet['!cols'] = wscols;

    XLSX.writeFile(workbook, `Laporan_Transaksi_${filter}.xlsx`);
  };

  const columns: Column<any>[] = [
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
    { 
      key: "category", 
      label: "Kategori",
      render: (row: any) => (
        <div className="flex flex-col gap-0.5">
          <span className="font-medium text-gray-900">{row.category}</span>
          {row.programs?.title && (
            <span className="text-[11px] bg-blue-50 text-blue-700 font-semibold px-2 py-0.5 rounded-md w-max border border-blue-100 flex items-center gap-1">
              <span>🎯</span> {row.programs.title}
            </span>
          )}
        </div>
      )
    },
    { 
      key: "description", 
      label: "Keterangan",
      render: (row: any) => {
        if (row._isGroupedProker) {
          return (
            <div className="flex flex-col">
              <span className="font-semibold text-gray-800">
                Total {row.type} Proker: {row.programs?.title}
              </span>
              <span className="text-xs text-purple-600 font-medium">
                Dirangkum dari {row._originalRows.length} transaksi
              </span>
            </div>
          );
        }
        return <span className="text-gray-700">{row.description || "-"}</span>;
      }
    },
    { 
      key: "amount", 
      label: "Nominal",
      align: "right",
      render: (row: any) => (
        <span className={`font-semibold whitespace-nowrap ${
          row.type === 'Pemasukan' ? 'text-green-600' : 'text-red-600'
        }`}>
          {row.type === 'Pemasukan' ? '+' : '-'} Rp {Number(row.amount || 0).toLocaleString('id-ID')}
        </span>
      )
    },
    { 
      key: "running_balance", 
      label: "Saldo",
      align: "right",
      render: (row: any) => (
        <span className={`font-bold whitespace-nowrap px-2.5 py-1 rounded-lg text-xs inline-block ${
          Number(row.running_balance || 0) >= 0 
            ? 'bg-blue-50 text-blue-900 border border-blue-100' 
            : 'bg-red-50 text-red-700 border border-red-100'
        }`}>
          Rp {Number(row.running_balance || 0).toLocaleString('id-ID')}
        </span>
      )
    },
    { key: "responsible_person", label: "Penanggung Jawab" },
    { 
      key: "proof_url", 
      label: "Bukti", 
      render: (row: any) => {
        const job = getJobByRecordId(row.id, "proof_url");
        if (job && (job.status === "pending" || job.status === "uploading")) {
          return (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200 animate-pulse whitespace-nowrap shadow-2xs">
              <UploadCloud size={12} className="animate-bounce" />
              <span>{job.progress > 0 ? `${job.progress}%` : "Mengunggah..."}</span>
            </span>
          );
        }

        let urls = row.proof_url ? row.proof_url.split(',').filter(Boolean) : [];
        if (job && job.resultUrl && !urls.includes(job.resultUrl)) {
          urls = [...urls, job.resultUrl];
        }

        if (urls.length === 0) return <span className="text-gray-400 text-xs">-</span>;
        
        if (urls.length === 1) {
          return (
            <a 
              href={urls[0]} 
              target="_blank" 
              rel="noreferrer" 
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200/60 transition-colors whitespace-nowrap shadow-2xs"
            >
              <ExternalLink size={12} />
              Bukti File
            </a>
          );
        }

        return (
          <button
            type="button"
            onClick={() => setSelectedProofs({ 
              title: row.programs?.title 
                ? `Proker: ${row.programs.title}` 
                : (row.description || row.category || "Transaksi"), 
              urls 
            })}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200 transition-colors shadow-2xs whitespace-nowrap group"
          >
            <ExternalLink size={12} className="text-indigo-500 group-hover:scale-110 transition-transform" />
            <span>{urls.length} Bukti</span>
            <span className="text-[10px] bg-indigo-200/70 text-indigo-900 px-1.5 py-0.5 rounded-full font-bold">
              Lihat
            </span>
          </button>
        );
      }
    },
    {
      key: "actions",
      label: "Aksi",
      align: "center",
      render: (row: any) => {
        if (row._isDues) {
          return (
            <span className="text-xs px-2 py-1 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200 font-medium whitespace-nowrap">
              📋 Iuran
            </span>
          );
        }
        if (row._isGroupedProker) {
          return (
            <div className="flex justify-center">
              <button 
                onClick={() => {
                  setSelectedGroup(row._originalRows);
                  setSelectedGroupTitle(row.programs?.title || "Program Kerja");
                }} 
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-200 transition-all shadow-2xs whitespace-nowrap hover:shadow-xs"
              >
                <Eye size={13} className="text-purple-600" />
                <span>Lihat Rincian</span>
                <span className="bg-purple-200/80 text-purple-900 px-1.5 py-0.2 rounded-full text-[10px] font-bold">
                  {row._originalRows.length}
                </span>
              </button>
            </div>
          );
        }
        return (
          <div className="flex items-center justify-center gap-2">
            <button onClick={() => openEdit(row)} className="text-blue-600 hover:bg-blue-50 p-1.5 rounded text-xs font-medium transition-colors">Edit</button>
            <button onClick={() => openDelete(row)} className="text-red-600 hover:bg-red-50 p-1.5 rounded text-xs font-medium transition-colors">Hapus</button>
          </div>
        );
      }
    }

  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex gap-1 bg-gray-100/80 p-1 rounded-xl ring-1 ring-gray-200/50">
            {["Semua", "Pemasukan", "Pengeluaran"].map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  filter === f
                    ? "bg-white text-[var(--color-primary)] shadow-sm ring-1 ring-gray-200/50"
                    : "text-gray-500 hover:text-gray-800 hover:bg-gray-200/50"
                }`}
              >
                {f}
              </button>
            ))}
          </div>

          {/* Toggle Mode: Ringkas Proker vs Rinci Semua */}
          <div className="flex items-center bg-gray-100/80 p-1 rounded-xl ring-1 ring-gray-200/50">
            <button
              type="button"
              onClick={() => setGroupProker(true)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                groupProker 
                  ? "bg-white text-purple-700 shadow-sm ring-1 ring-gray-200/50" 
                  : "text-gray-500 hover:text-gray-800 hover:bg-gray-200/50"
              }`}
              title="Rangkum pengeluaran setiap proker menjadi 1 baris"
            >
              <Layers size={13} />
              Ringkas Proker
            </button>
            <button
              type="button"
              onClick={() => setGroupProker(false)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                !groupProker 
                  ? "bg-white text-blue-700 shadow-sm ring-1 ring-gray-200/50" 
                  : "text-gray-500 hover:text-gray-800 hover:bg-gray-200/50"
              }`}
              title="Tampilkan semua transaksi dirinci satu per satu"
            >
              Rinci Semua
            </button>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto">
          <div className="text-xs px-3.5 py-2 bg-blue-50 border border-blue-200/80 rounded-xl whitespace-nowrap hidden sm:flex items-center gap-2 text-blue-800 shadow-xs shadow-blue-100/50">
            <Wallet size={15} className="text-blue-600" />
            <span className="text-blue-600 font-medium">Saldo Kas:</span>
            <span className="font-bold text-blue-950">Rp {currentTotalSaldo.toLocaleString('id-ID')}</span>
          </div>
          {filter !== "Semua" && (
            <div className="text-xs px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl whitespace-nowrap hidden sm:block text-gray-700 shadow-xs">
              Total {filter}: <span className="font-bold text-gray-900">Rp {totalFiltered.toLocaleString('id-ID')}</span>
            </div>
          )}
          <div className="flex flex-wrap gap-2 w-full sm:w-auto">
            <button
              onClick={handleExportExcel}
              className="bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-xs"
            >
              <Download size={15} />
              Ekspor Excel
            </button>
            <button
              onClick={() => setIsBatchModalOpen(true)}
              className="bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-xs"
            >
              <Layers size={15} />
              Tambah Massal
            </button>
            <button
              onClick={openAdd}
              className="bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-white px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-sm"
            >
              <Plus size={15} />
              Tambah Data
            </button>
          </div>
        </div>
      </div>

      {/* Baris ringkasan di layar HP / mobile */}
      <div className="flex flex-wrap gap-2 sm:hidden">
        <div className="text-xs px-3 py-2 bg-blue-50 border border-blue-200 rounded-lg flex items-center gap-1.5 text-blue-800 flex-1">
          <Wallet size={14} className="text-blue-600" />
          <span>Saldo Kas: <strong className="text-blue-950">Rp {currentTotalSaldo.toLocaleString('id-ID')}</strong></span>
        </div>
        {filter !== "Semua" && (
          <div className="text-xs px-3 py-2 bg-gray-50 border rounded-lg flex items-center flex-1">
            <span>Total {filter}: <strong>Rp {totalFiltered.toLocaleString('id-ID')}</strong></span>
          </div>
        )}
      </div>

      <DataTable pagination pageSize={10} 
        data={tableData}
        columns={columns}
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
                  <Sparkles size={18} className="text-blue-50" />
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
              <div className="p-3 bg-red-50 text-red-600 text-sm rounded-xl font-medium">
                {errorMsg}
              </div>
            )}

            {/* Info Saldo Kas & Estimasi Saldo Baru */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 rounded-xl p-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 shadow-xs">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-blue-100 text-blue-700 rounded-lg">
                  <Wallet size={18} />
                </div>
                <div>
                  <p className="text-xs text-blue-600 font-medium">Saldo Kas Sebelum Transaksi Ini</p>
                  <p className="text-base font-bold text-blue-950">
                    Rp {currentTotalSaldo.toLocaleString('id-ID')}
                  </p>
                </div>
              </div>
              {formDataState.amount && !isNaN(Number(formDataState.amount)) && Number(formDataState.amount) > 0 && (
                <div className="sm:text-right border-t sm:border-t-0 pt-2 sm:pt-0 w-full sm:w-auto">
                  <p className="text-xs text-gray-500 font-medium">
                    Estimasi Saldo Setelah {formDataState.type}
                  </p>
                  <p className={`text-base font-bold ${
                    (formDataState.type === 'Pemasukan' 
                      ? currentTotalSaldo + Number(formDataState.amount) 
                      : currentTotalSaldo - Number(formDataState.amount)) >= 0 
                      ? 'text-green-700' : 'text-red-600'
                  }`}>
                    Rp {(
                      formDataState.type === 'Pemasukan'
                        ? currentTotalSaldo + Number(formDataState.amount)
                        : currentTotalSaldo - Number(formDataState.amount)
                    ).toLocaleString('id-ID')}
                  </p>
                </div>
              )}
            </div>
            
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
                <label className="text-sm font-medium text-gray-700">Link Bukti Tambahan (Opsional)</label>
                <input 
                  type="url"
                  value={formDataState.proof_url}
                  onChange={(e) => setFormDataState({...formDataState, proof_url: e.target.value})}
                  placeholder="Jika ada URL eksternal (pisahkan dengan koma jika banyak)"
                  className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-[var(--color-primary)] outline-none"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Keterkaitan Proker</label>
              <select 
                value={formDataState.program_id}
                onChange={(e) => setFormDataState({...formDataState, program_id: e.target.value})}
                className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-[var(--color-primary)] outline-none bg-white"
              >
                <option value="">Bukan Proker / Kebutuhan Internal</option>
                {programs.map((p) => (
                  <option key={p.id} value={p.id}>{p.title}</option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Upload Bukti Transaksi (Google Drive)</label>
              <div className="border-2 border-dashed border-gray-300 rounded-xl p-4 text-center hover:border-blue-50-hover transition-colors bg-blue-50/20">
                <input
                  type="file"
                  multiple
                  accept="image/*,.pdf"
                  onChange={(e) => setSelectedFiles(Array.from(e.target.files || []))}
                  className="w-full text-xs text-gray-500 file:mr-4 file:py-1.5 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-700 file:transition-colors cursor-pointer"
                />
                {selectedFiles.length > 0 && (
                  <div className="mt-2 text-xs font-bold text-green-600 text-left space-y-1">
                    {selectedFiles.map((f, i) => (
                      <p key={i}>✓ {f.name}</p>
                    ))}
                  </div>
                )}
                <p className="mt-1 text-[11px] text-gray-400">Anda dapat memilih lebih dari satu file. Bukti akan masuk ke folder Google Drive "Bendahara" secara otomatis.</p>
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
                {isLoading ? "Menyimpan & Upload Drive..." : "Simpan"}
              </button>
            </div>
          </form>
        </div>
      </DataModal>

      {/* Modal Daftar Bukti Transaksi */}
      <DataModal
        isOpen={!!selectedProofs}
        onClose={() => setSelectedProofs(null)}
        title={`Lampiran Bukti Transaksi (${selectedProofs?.urls.length || 0} File)`}
      >
        <div className="space-y-4">
          <div className="p-3 bg-blue-50/70 border border-blue-100 rounded-xl">
            <p className="text-xs text-blue-600 font-medium">Keterangan Transaksi:</p>
            <p className="text-sm font-semibold text-blue-950 mt-0.5">{selectedProofs?.title}</p>
          </div>

          <p className="text-xs text-gray-500">
            Klik tombol di bawah untuk membuka dan mengunduh berkas bukti transaksi dari Google Drive:
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-[50vh] overflow-y-auto p-1">
            {selectedProofs?.urls.map((url, idx) => (
              <a
                key={idx}
                href={url}
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-between p-3 rounded-xl border border-gray-200 bg-white hover:bg-blue-50/60 hover:border-blue-300 transition-all group shadow-2xs"
              >
                <div className="flex items-center gap-2.5 overflow-hidden">
                  <div className="p-2 bg-blue-100/70 text-blue-700 rounded-lg group-hover:bg-blue-600 group-hover:text-white transition-colors">
                    <ExternalLink size={14} />
                  </div>
                  <div className="truncate">
                    <p className="text-xs font-bold text-gray-800 group-hover:text-blue-700">
                      Bukti Transaksi #{idx + 1}
                    </p>
                    <p className="text-[11px] text-gray-400 truncate">Buka di Google Drive</p>
                  </div>
                </div>
                <span className="text-xs font-bold text-blue-600 group-hover:translate-x-0.5 transition-transform">
                  ↗
                </span>
              </a>
            ))}
          </div>

          <div className="flex justify-end pt-2 border-t">
            <button
              onClick={() => setSelectedProofs(null)}
              className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-semibold transition-colors"
            >
              Tutup
            </button>
          </div>
        </div>
      </DataModal>

      {/* Modal Rincian Proker */}
      <DataModal
        isOpen={!!selectedGroup}
        onClose={() => setSelectedGroup(null)}
        title={`Rincian Pengeluaran: ${selectedGroupTitle}`}
      >
        <div className="space-y-4">
          {/* Ringkasan Header */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 bg-purple-50/80 border border-purple-200/80 rounded-xl">
            <div>
              <p className="text-xs text-purple-700 font-medium">Total Pengeluaran Proker</p>
              <p className="text-lg font-bold text-purple-950">
                Rp {(selectedGroup || []).reduce((sum, t) => sum + Number(t.amount || 0), 0).toLocaleString('id-ID')}
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs text-purple-700 font-medium">Jumlah Transaksi</p>
              <p className="text-base font-bold text-purple-950">
                {(selectedGroup || []).length} Transaksi
              </p>
            </div>
          </div>

          {/* Sub-Tabel Rincian */}
          <div className="overflow-x-auto rounded-xl border border-gray-200 max-h-[50vh]">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50 text-gray-700 font-semibold border-b sticky top-0">
                <tr>
                  <th className="p-3 whitespace-nowrap">Tanggal</th>
                  <th className="p-3 whitespace-nowrap">Kategori</th>
                  <th className="p-3">Keterangan</th>
                  <th className="p-3 whitespace-nowrap">PJ</th>
                  <th className="p-3 text-right whitespace-nowrap">Nominal</th>
                  <th className="p-3 text-center whitespace-nowrap">Bukti</th>
                  <th className="p-3 text-center whitespace-nowrap">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {selectedGroup?.map((t: any) => (
                  <tr key={t.id} className="hover:bg-gray-50/80 transition-colors">
                    <td className="p-3 whitespace-nowrap text-gray-600">{t.transaction_date}</td>
                    <td className="p-3 whitespace-nowrap font-medium text-gray-800">{t.category}</td>
                    <td className="p-3 min-w-[180px] text-gray-700">{t.description || "-"}</td>
                    <td className="p-3 whitespace-nowrap text-gray-600">{t.responsible_person || "-"}</td>
                    <td className="p-3 whitespace-nowrap font-bold text-right text-rose-600">
                      - Rp {Number(t.amount).toLocaleString('id-ID')}
                    </td>
                    <td className="p-3 text-center whitespace-nowrap">
                      {t.proof_url ? (
                        <a 
                          href={t.proof_url.split(',')[0]} 
                          target="_blank" 
                          rel="noreferrer" 
                          className="text-blue-600 hover:underline font-semibold"
                        >
                          Lihat
                        </a>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="p-3 text-center whitespace-nowrap">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => { setSelectedGroup(null); openEdit(t); }}
                          className="px-2.5 py-1 text-blue-600 hover:bg-blue-50 rounded-lg text-xs font-medium transition-colors"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => { setSelectedGroup(null); openDelete(t); }}
                          className="px-2.5 py-1 text-red-600 hover:bg-red-50 rounded-lg text-xs font-medium transition-colors"
                        >
                          Hapus
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex justify-end pt-2 border-t">
            <button
              onClick={() => setSelectedGroup(null)}
              className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-semibold transition-colors"
            >
              Tutup
            </button>
          </div>
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

      <TransaksiBatchModal 
        isOpen={isBatchModalOpen}
        onClose={() => setIsBatchModalOpen(false)}
        programs={programs}
        onSuccess={() => setIsBatchModalOpen(false)}
        currentSaldo={currentTotalSaldo}
      />
    </div>
  );
}
