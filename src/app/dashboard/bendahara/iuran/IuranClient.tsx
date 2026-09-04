"use client";

import { useState, useEffect, useMemo } from "react";
import { Plus, CheckCircle, ExternalLink, Download, Users, Sparkles, Loader2, Bot, Save } from "lucide-react";
import * as XLSX from "xlsx";
import { DataModal } from "@/components/DataModal";
import { DeleteConfirm } from "@/components/DeleteConfirm";
import { DataTable } from "@/components/DataTable";
import { tambahIuran, editIuran, hapusIuran, tambahIuranMassal, parseIuranAI, tambahIuranMassalAI, isGeminiConfigured } from "./actions";
import {
  MONTHS,
  CURRENT_YEAR,
  getActivePeriodStartYear,
  generatePeriodOptions,
  getPeriodMonths,
  formatMatrixData
} from "@/utils/finance";

const DYNAMIC_YEARS = generatePeriodOptions();

export default function IuranClient({ dues, members }: { dues: any[], members: any[] }) {
  const [filterYear, setFilterYear] = useState<number>(getActivePeriodStartYear());

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isMassalModalOpen, setIsMassalModalOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [selectedData, setSelectedData] = useState<any>(null);
  const [selectedMemberDetails, setSelectedMemberDetails] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const [showAI, setShowAI] = useState(false);
  const [aiText, setAiText] = useState("");
  const [isProcessingAI, setIsProcessingAI] = useState(false);
  const [hasGemini, setHasGemini] = useState(false);
  const [unmatchedNames, setUnmatchedNames] = useState<string[]>([]);
  const [parsedPreview, setParsedPreview] = useState<any[]>([]);
  const [aiDescription, setAiDescription] = useState("");

  useEffect(() => {
    isGeminiConfigured().then(setHasGemini).catch(() => {});
  }, []);

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

  const periodMonths = useMemo(() => getPeriodMonths(filterYear), [filterYear]);
  const matrixData = useMemo(() => formatMatrixData(dues, members, filterYear), [dues, members, filterYear]);

  const summaryStats = useMemo(() => {
    const totalAnggota = matrixData.length;
    const lunasCount = matrixData.filter((r: any) => r.tunggakan === 0).length;
    const belumLunasCount = matrixData.filter((r: any) => r.tunggakan > 0).length;
    const totalTerkumpul = matrixData.reduce((acc: number, r: any) => acc + (r.totalTerkumpul || 0), 0);
    return { totalAnggota, lunasCount, belumLunasCount, totalTerkumpul };
  }, [matrixData]);

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

  const handleProcessAI = async () => {
    if (!aiText.trim()) return;
    setIsProcessingAI(true);
    setUnmatchedNames([]);
    setParsedPreview([]);
    
    try {
      const result = await parseIuranAI(aiText, members.map(m => ({ id: m.id, name: m.name })));
      
      if (result.unmatched_names) {
        setUnmatchedNames(result.unmatched_names);
      }
      
      const matchedData = result.matched || [];
      const newPreview: any[] = [];
      
      matchedData.forEach((m: any) => {
        let remaining = Number(m.total_amount) || 0;
        
        // Kumpulkan semua bulan yang belum lunas dalam periode berjalan
        const unpaidMonths: {month: number, year: number}[] = [];
        for (const pm of periodMonths) {
          const isPaid = dues.some(d => d.member_id === m.member_id && d.month === pm.month && d.year === pm.year && d.status === 'Lunas');
          if (!isPaid) {
            unpaidMonths.push({ month: pm.month, year: pm.year });
          }
        }
        
        let nextUnpaidIndex = 0;
        const details: string[] = [];
        const entries: any[] = [];
        
        // Jika semuanya Lunas di periode ini, fallback ke bulan pertama periode (atau lanjut berurutan)
        let lastMonth = periodMonths[0].month;
        let lastYear = periodMonths[0].year;
        // Adjust if we fallback to before periodMonths[0] so that +1 starts at periodMonths[0]
        lastMonth -= 1;
        if (lastMonth < 1) {
          lastMonth = 12;
          lastYear -= 1;
        }

        while (remaining > 0) {
          let targetMonth: number;
          let targetYear: number;

          if (nextUnpaidIndex < unpaidMonths.length) {
            targetMonth = unpaidMonths[nextUnpaidIndex].month;
            targetYear = unpaidMonths[nextUnpaidIndex].year;
            nextUnpaidIndex++;
          } else {
            // Jika melebihi daftar belum lunas, lanjutkan secara berurutan
            targetMonth = lastMonth + 1;
            targetYear = lastYear;
            if (targetMonth > 12) {
              targetMonth = 1;
              targetYear++;
            }
          }
          
          lastMonth = targetMonth;
          lastYear = targetYear;

          if (remaining >= 5000) {
            entries.push({
              member_id: m.member_id,
              month: targetMonth,
              year: targetYear,
              amount: 5000,
              status: "Lunas",
              payment_date: new Date().toISOString().split('T')[0]
            });
            details.push(`${MONTHS.find(mn => mn.value === targetMonth)?.label} ${targetYear} (Lunas)`);
            remaining -= 5000;
          } else {
            entries.push({
              member_id: m.member_id,
              month: targetMonth,
              year: targetYear,
              amount: remaining,
              status: "Belum Lunas",
              payment_date: new Date().toISOString().split('T')[0]
            });
            details.push(`${MONTHS.find(mn => mn.value === targetMonth)?.label} ${targetYear} (Sisa ${remaining})`);
            remaining = 0;
          }
        }
        
        newPreview.push({
          member_id: m.member_id,
          name: m.name,
          total_amount: m.total_amount,
          entries: entries,
          detailsStr: details.join(", ")
        });
      });
      
      setParsedPreview(newPreview);
      
    } catch (e: any) {
      alert(e.message || "Gagal memproses AI");
    } finally {
      setIsProcessingAI(false);
    }
  };

  const handleSaveAI = async () => {
    if (parsedPreview.length === 0) return;
    setIsLoading(true);
    
    try {
      const allEntries = parsedPreview.flatMap(p => p.entries);
      const totalAmount = parsedPreview.reduce((sum, p) => sum + Number(p.total_amount), 0);
      const desc = aiDescription.trim() || `Pemasukan Iuran Massal via AI (${allEntries.length} entri bulan)`;
      
      await tambahIuranMassalAI(allEntries, totalAmount, desc);
      
      setShowAI(false);
      setAiText("");
      setParsedPreview([]);
      setUnmatchedNames([]);
      setAiDescription("");
      alert("Berhasil menyimpan iuran massal dan mencatat pemasukan!");
    } catch (error: any) {
      alert(error.message || "Gagal menyimpan");
    } finally {
      setIsLoading(false);
    }
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
    } catch (error: any) {
      setErrorMsg(error.message || "Terjadi kesalahan saat menghapus data");
    } finally {
      setIsLoading(false);
    }
  };

  const handleExportExcel = () => {
    
    const exportData = matrixData.map((d, index) => {
      const row: any = {
        "No": index + 1,
        "Nama Anggota": d.member,
      };
      
      periodMonths.forEach(pm => {
        const header = `${pm.label.substring(0, 3)} ${pm.year.toString().substring(2)}`;
        row[header] = d[pm.key].status === 'Lunas' ? "Lunas" : "-";
      });
      
      row["Total Terkumpul (Rp)"] = d.totalTerkumpul;
      row["Tunggakan (Bulan)"] = d.tunggakan;
      
      return row;
    });

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, `Periode_${filterYear}-${filterYear+1}`);
    
    const wscols = [
      {wch: 5}, {wch: 25}, 
      ...periodMonths.map(() => ({wch: 10})),
      {wch: 20}, {wch: 15}
    ];
    worksheet['!cols'] = wscols;

    XLSX.writeFile(workbook, `Laporan_Iuran_Periode_${filterYear}-${filterYear+1}.xlsx`);
  };

  const columns = useMemo(() => [
    { 
      key: "member", 
      label: "Anggota",
      render: (row: any) => <span className="font-semibold whitespace-nowrap text-gray-800">{row.member}</span>
    },
    ...periodMonths.map(pm => ({
      key: pm.key,
      label: `${pm.label.substring(0, 3)} ${pm.year.toString().substring(2)}`,
      render: (row: any) => (
        <span 
          className="flex justify-center"
          title={row[pm.key].status === 'Lunas' ? `Lunas Rp${row[pm.key].amount?.toLocaleString('id-ID')}` : undefined}
        >
          {row[pm.key].status === 'Lunas' ? (
             <CheckCircle size={16} className="text-green-500" />
          ) : (
             <span className="text-gray-300">-</span>
          )}
        </span>
      )
    })),
    {
      key: "total",
      label: "Terkumpul",
      render: (row: any) => <span className="font-medium text-green-700 whitespace-nowrap">Rp {row.totalTerkumpul.toLocaleString('id-ID')}</span>
    },
    {
      key: "tunggakan",
      label: "Tunggakan",
      render: (row: any) => <span className={`font-medium ${row.tunggakan > 0 ? 'text-red-600' : 'text-gray-500'}`}>{row.tunggakan} Bln</span>
    },
    {
      key: "actions",
      label: "Aksi",
      render: (row: any) => (
        <button 
          onClick={() => {
            setSelectedMemberDetails(row);
            setIsDetailsOpen(true);
          }}
          className="text-blue-600 hover:text-blue-800 text-xs flex items-center gap-1 font-medium whitespace-nowrap border border-blue-200 px-2 py-1 rounded bg-blue-50 hover:bg-blue-100"
        >
          Lihat Detail
        </button>
      )
    }
  ], [periodMonths]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <select 
            value={filterYear}
            onChange={(e) => setFilterYear(Number(e.target.value))}
            className="p-2 border rounded-lg outline-none bg-white min-w-[120px]"
          >
            {DYNAMIC_YEARS.map(y => <option key={y} value={y}>Periode {y}/{y+1}</option>)}
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
            className="bg-white border border-[var(--color-primary)] text-[var(--color-primary)] hover:bg-blue-50 px-4 py-2 rounded-lg flex items-center gap-2 transition-colors flex-1 sm:flex-none justify-center"
          >
            <Plus size={20} />
            Catat 1 per 1
          </button>
          <button
            onClick={openMassal}
            className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors flex-1 sm:flex-none justify-center shadow-md shadow-blue-200"
          >
            <Users size={20} />
            Catat Massal
          </button>
        </div>
      </div>

      {/* Ringkasan Status Iuran Periode Ini */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex items-center gap-3">
          <div className="p-2.5 bg-blue-50 text-blue-600 rounded-lg">
            <Users size={20} />
          </div>
          <div>
            <p className="text-xs text-gray-500 font-medium">Total Anggota</p>
            <p className="text-lg font-bold text-gray-800">{summaryStats.totalAnggota} Org</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex items-center gap-3">
          <div className="p-2.5 bg-green-50 text-green-600 rounded-lg">
            <CheckCircle size={20} />
          </div>
          <div>
            <p className="text-xs text-gray-500 font-medium">Sudah Lunas</p>
            <p className="text-lg font-bold text-green-600">{summaryStats.lunasCount} Org</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex items-center gap-3">
          <div className="p-2.5 bg-amber-50 text-amber-600 rounded-lg">
            <Users size={20} />
          </div>
          <div>
            <p className="text-xs text-gray-500 font-medium">Belum Lunas / Nunggak</p>
            <p className="text-lg font-bold text-amber-600">{summaryStats.belumLunasCount} Org</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex items-center gap-3">
          <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-lg">
            <Download size={20} />
          </div>
          <div>
            <p className="text-xs text-gray-500 font-medium">Total Kas Terkumpul</p>
            <p className="text-lg font-bold text-gray-800">Rp {summaryStats.totalTerkumpul.toLocaleString('id-ID')}</p>
          </div>
        </div>
      </div>

      {/* AI Mass Kas Panel */}
      {hasGemini && (
        <div className="bg-white rounded-2xl shadow-sm border border-blue-100 overflow-hidden mb-6">
          <button 
            onClick={() => setShowAI(!showAI)}
            className="w-full flex justify-between items-center p-4 bg-gradient-to-r from-blue-50 to-indigo-50 hover:from-blue-100 hover:to-indigo-100 transition-colors"
          >
            <div className="flex items-center gap-2 text-blue-700 font-semibold">
              <Sparkles size={18} className="text-blue-500" />
              <span>Input Iuran Cepat (AI)</span>
            </div>
            <span className="text-xs text-blue-600 font-medium">
              {showAI ? "Tutup Panel" : "Buka Panel"}
            </span>
          </button>
          
          {showAI && (
            <div className="p-4 border-t border-blue-100 bg-white">
              <p className="text-sm text-gray-600 mb-4">
                Tempelkan teks laporan bayar kas (misal dari WhatsApp) di bawah ini. AI akan secara otomatis memecah nominal uang besar menjadi beberapa bulan berturut-turut.
              </p>
              
              <div className="mb-3">
              </div>

              <textarea
                value={aiText}
                onChange={(e) => setAiText(e.target.value)}
                placeholder="Contoh:&#10;Andi 15000&#10;Budi 5k&#10;Siti 12.000"
                className="w-full p-3 border rounded-xl focus:ring-2 focus:ring-blue-500 outline-none min-h-[120px] text-sm font-mono text-gray-700 mb-3 bg-gray-50"
              />
              
              <button
                onClick={handleProcessAI}
                disabled={isProcessingAI || !aiText.trim()}
                className="flex items-center justify-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 w-full sm:w-auto"
              >
                {isProcessingAI ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    <span>AI Sedang Memproses...</span>
                  </>
                ) : (
                  <>
                    <Bot size={18} />
                    <span>Pratinjau dengan AI</span>
                  </>
                )}
              </button>

              {/* Unmatched Names Warning */}
              {unmatchedNames.length > 0 && (
                <div className="mt-4 bg-orange-50 border-l-4 border-orange-500 p-4 rounded-r-xl shadow-sm">
                  <h3 className="font-bold text-orange-800 mb-1">Peringatan: Anggota Tidak Terdaftar</h3>
                  <p className="text-sm text-orange-700 mb-2">
                    AI menemukan nama-nama berikut tetapi <strong>tidak ada</strong> di database anggota resmi.
                  </p>
                  <ul className="list-disc list-inside text-sm text-orange-800 font-medium">
                    {unmatchedNames.map((name, i) => <li key={i}>{name}</li>)}
                  </ul>
                </div>
              )}

              {/* Preview Data */}
              {parsedPreview.length > 0 && (
                <div className="mt-4 border rounded-xl overflow-hidden">
                  <div className="bg-gray-50 p-3 border-b flex justify-between items-center">
                    <h4 className="font-semibold text-gray-700">Hasil Pratinjau Pembagian Bulan</h4>
                  </div>
                  <div className="overflow-x-auto max-h-[300px]">
                    <table className="w-full text-left text-sm text-gray-600">
                      <thead className="bg-white text-gray-700 sticky top-0 border-b">
                        <tr>
                          <th className="p-3 font-medium">Nama Anggota</th>
                          <th className="p-3 font-medium">Total Uang</th>
                          <th className="p-3 font-medium">Rincian Bulan (Dibuat otomatis)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y bg-white">
                        {parsedPreview.map((item, idx) => (
                          <tr key={idx} className="hover:bg-gray-50">
                            <td className="p-3 font-medium">{item.name}</td>
                            <td className="p-3">Rp {item.total_amount.toLocaleString('id-ID')}</td>
                            <td className="p-3">
                              <div className="flex flex-wrap gap-1">
                                {item.entries.map((entry: any, i: number) => (
                                  <span key={i} className={`px-2 py-1 text-xs rounded-full border ${entry.status === 'Lunas' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-yellow-50 text-yellow-700 border-yellow-200'}`}>
                                    {MONTHS.find(mn => mn.value === entry.month)?.label} {entry.year} ({entry.status === 'Lunas' ? 'Lunas' : `Sisa Rp${entry.amount.toLocaleString('id-ID')}`})
                                  </span>
                                ))}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div className="p-4 bg-gray-50 border-t flex flex-col sm:flex-row gap-3">
                    <input 
                      type="text"
                      value={aiDescription}
                      onChange={e => setAiDescription(e.target.value)}
                      placeholder="Keterangan Pemasukan (opsional, misal: Iuran dari WA)"
                      className="flex-1 p-2 border rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
                    />
                    <button
                      onClick={handleSaveAI}
                      disabled={isLoading}
                      className="px-5 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2 whitespace-nowrap"
                    >
                      {isLoading ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                      Simpan ke Database
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      <DataTable pagination pageSize={20} 
        data={matrixData}
        columns={columns}
        emptyMessage={`Belum ada data anggota.`}
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

          <div className="bg-blue-50 border border-blue-100 p-4 rounded-xl space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-blue-800 uppercase tracking-wider">Bulan</label>
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
                <label className="text-xs font-semibold text-blue-800 uppercase tracking-wider">Tahun</label>
                <input 
                  type="number" 
                  value={massalData.year}
                  onChange={(e) => setMassalData({...massalData, year: Number(e.target.value)})}
                  className="w-full p-2 text-sm border-0 rounded-lg focus:ring-2 focus:ring-[var(--color-primary)] outline-none"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-blue-800 uppercase tracking-wider">Nominal Pukul Rata</label>
                <input 
                  type="number" 
                  value={massalData.amount}
                  onChange={(e) => setMassalData({...massalData, amount: Number(e.target.value)})}
                  className="w-full p-2 text-sm border-0 rounded-lg focus:ring-2 focus:ring-[var(--color-primary)] outline-none"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-blue-800 uppercase tracking-wider">Tanggal Bayar</label>
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
                className="text-xs text-blue-600 hover:text-blue-800 font-medium"
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
              Telah dipilih: <span className="font-bold text-blue-600">{selectedMembers.length}</span> anggota
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
              className="px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-lg transition-colors disabled:opacity-50"
            >
              {isLoading ? "Menyimpan..." : "Simpan Data Massal"}
            </button>
          </div>
        </form>
      </DataModal>

      {/* DETAILS MODAL */}
      <DataModal
        isOpen={isDetailsOpen}
        onClose={() => setIsDetailsOpen(false)}
        title={`Detail Transaksi: ${selectedMemberDetails?.member || ""}`}
      >
        <div className="space-y-4">
          <div className="flex justify-between bg-blue-50 p-3 rounded-lg border border-blue-100">
            <div>
              <p className="text-xs text-blue-700 font-semibold uppercase">Total Terkumpul Periode {filterYear}/{filterYear+1}</p>
              <p className="text-lg font-bold text-blue-900">Rp {selectedMemberDetails?.totalTerkumpul?.toLocaleString('id-ID') || 0}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-red-700 font-semibold uppercase">Tunggakan</p>
              <p className="text-lg font-bold text-red-900">{selectedMemberDetails?.tunggakan || 0} Bulan</p>
            </div>
          </div>
          
          <div className="overflow-x-auto border rounded-xl">
            <table className="w-full text-left text-sm text-gray-600">
              <thead className="bg-gray-50 text-gray-700 border-b">
                <tr>
                  <th className="p-3 font-medium">Periode</th>
                  <th className="p-3 font-medium">Nominal</th>
                  <th className="p-3 font-medium">Tgl Bayar</th>
                  <th className="p-3 font-medium">Bukti</th>
                  <th className="p-3 font-medium">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y bg-white">
                {selectedMemberDetails?.transactions?.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-4 text-center text-gray-500">Belum ada transaksi di tahun ini.</td>
                  </tr>
                ) : (
                  selectedMemberDetails?.transactions
                    ?.sort((a: any, b: any) => a.month - b.month)
                    .map((trx: any) => (
                    <tr key={trx.id} className="hover:bg-gray-50">
                      <td className="p-3">{MONTHS.find(m => m.value === trx.month)?.label} {trx.year}</td>
                      <td className="p-3">Rp {trx.amount?.toLocaleString('id-ID')}</td>
                      <td className="p-3">{trx.payment_date || "-"}</td>
                      <td className="p-3">
                        {trx.proof_url ? (
                          <a href={trx.proof_url} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline flex items-center gap-1">
                            <ExternalLink size={14} /> Lihat
                          </a>
                        ) : "-"}
                      </td>
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          <button onClick={() => { setIsDetailsOpen(false); openEdit(trx); }} className="text-blue-600 hover:text-blue-800 text-xs font-medium">Edit</button>
                          <button onClick={() => { setIsDetailsOpen(false); openDelete(trx); }} className="text-red-600 hover:text-red-800 text-xs font-medium">Hapus</button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
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
