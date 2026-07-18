"use client";

import { useState, useEffect, useMemo } from "react";
import { Save, CalendarCheck, Download, Sparkles, Loader2, Bot } from "lucide-react";
import * as XLSX from "xlsx";
import { simpanPresensiMassal, parsePresensiAI, isGeminiConfigured } from "./actions";

interface Member {
  id: string;
  name: string;
  division: string | null;
  faculty: string | null;
  generation: string | null;
  status: string;
}

interface Agenda {
  id: string;
  title: string;
  date: string;
}

interface AttendanceRecord {
  agenda_id: string;
  member_id: string;
  status: string;
}

export default function PresensiPengurusClient({
  allAttendance,
  agendas,
  members,
}: {
  allAttendance: AttendanceRecord[];
  agendas: Agenda[];
  members: Member[];
}) {
  const [selectedAgenda, setSelectedAgenda] = useState<string>("");
  const [filterDivisi, setFilterDivisi] = useState<string>("Semua");
  const [filterFakultas, setFilterFakultas] = useState<string>("Semua");
  const [filterAngkatan, setFilterAngkatan] = useState<string>("Semua");
  
  const [attendanceMap, setAttendanceMap] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState({ text: "", type: "" });
  
  const [showAI, setShowAI] = useState(false);
  const [aiText, setAiText] = useState("");
  const [isProcessingAI, setIsProcessingAI] = useState(false);
  const [hasGemini, setHasGemini] = useState(false);
  const [unmatchedNames, setUnmatchedNames] = useState<string[]>([]);

  useEffect(() => {
    isGeminiConfigured().then(setHasGemini).catch(() => {});
  }, []);

  // Extract unique filter options
  const divisions = ["Semua", ...Array.from(new Set(members.map(m => m.division).filter(Boolean)))];
  const faculties = ["Semua", ...Array.from(new Set(members.map(m => m.faculty).filter(Boolean)))];
  const generations = ["Semua", ...Array.from(new Set(members.map(m => m.generation).filter(Boolean)))];

  // When agenda changes, load existing attendance data
  useEffect(() => {
    if (selectedAgenda) {
      const existing = allAttendance.filter(a => a.agenda_id === selectedAgenda);
      const newMap: Record<string, string> = {};
      existing.forEach(a => {
        newMap[a.member_id] = a.status;
      });
      setAttendanceMap(newMap);
      setSaveMessage({ text: "", type: "" });
    } else {
      setAttendanceMap({});
    }
  }, [selectedAgenda, allAttendance]);

  // Filter members
  const filteredMembers = useMemo(() => {
    return members.filter(m => {
      if (filterDivisi !== "Semua" && m.division !== filterDivisi) return false;
      if (filterFakultas !== "Semua" && m.faculty !== filterFakultas) return false;
      if (filterAngkatan !== "Semua" && m.generation !== filterAngkatan) return false;
      return true;
    });
  }, [members, filterDivisi, filterFakultas, filterAngkatan]);

  const handleProcessAI = async () => {
    if (!aiText.trim()) return;
    if (!selectedAgenda) {
      alert("Silakan pilih agenda terlebih dahulu.");
      return;
    }
    setIsProcessingAI(true);
    setUnmatchedNames([]);
    try {
      const result = await parsePresensiAI(aiText, members.map(m => ({ id: m.id, name: m.name })));
      
      const matchedData = result.matched || [];
      const parsedMap = new Map<string, string>(matchedData.map((r: any) => [r.member_id, r.status]));
      
      setAttendanceMap(prev => {
        const newMap = { ...prev };
        // Hanya update status yang ditemukan di notulensi.
        // Yang tidak ditemukan dibiarkan kosong (tidak di-Alpa).
        filteredMembers.forEach(m => {
          if (parsedMap.has(m.id)) {
            newMap[m.id] = parsedMap.get(m.id)!;
          }
        });
        return newMap;
      });
      setShowAI(false);
      setAiText("");
      
      if (result.unmatched_names && result.unmatched_names.length > 0) {
        setUnmatchedNames(result.unmatched_names);
        setSaveMessage({ text: "Berhasil mencocokkan sebagian data. Ada nama yang tidak terdaftar di database anggota!", type: "warning" });
      } else {
        setSaveMessage({ text: "Berhasil mencocokkan data! Anggota yang tidak ada di notulensi dibiarkan kosong.", type: "success" });
      }
    } catch (e: any) {
      alert(e.message || "Gagal memproses dengan AI.");
    } finally {
      setIsProcessingAI(false);
    }
  };

  const handleStatusChange = (memberId: string, status: string) => {
    setAttendanceMap(prev => ({ ...prev, [memberId]: status }));
  };

  const handleMarkAll = (status: string) => {
    setAttendanceMap(prev => {
      const newMap = { ...prev };
      filteredMembers.forEach(m => {
        newMap[m.id] = status;
      });
      return newMap;
    });
  };

  const handleSave = async () => {
    if (!selectedAgenda) {
      setSaveMessage({ text: "Silakan pilih Agenda terlebih dahulu.", type: "error" });
      return;
    }

    setIsSaving(true);
    setSaveMessage({ text: "", type: "" });

    const payload = Object.keys(attendanceMap).map(memberId => ({
      member_id: memberId,
      status: attendanceMap[memberId]
    }));

    try {
      await simpanPresensiMassal(selectedAgenda, payload);
      setSaveMessage({ text: "Presensi berhasil disimpan!", type: "success" });
    } catch (error: any) {
      setSaveMessage({ text: error.message || "Gagal menyimpan.", type: "error" });
    } finally {
      setIsSaving(false);
    }
  };

  const handleExportExcel = () => {
    if (!selectedAgenda) return;
    
    const agendaName = agendas.find(a => a.id === selectedAgenda)?.title || "Agenda";

    const exportData = filteredMembers.map((member, index) => ({
      "No": index + 1,
      "Nama Anggota": member.name,
      "Divisi": member.division || "-",
      "Fakultas": member.faculty || "-",
      "Angkatan": member.generation || "-",
      "Kehadiran": attendanceMap[member.id] || "Belum Diisi",
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Presensi Pengurus");
    
    const wscols = [
      {wch: 5}, {wch: 25}, {wch: 20}, {wch: 20}, {wch: 10}, {wch: 15}
    ];
    worksheet['!cols'] = wscols;

    XLSX.writeFile(workbook, `Laporan_Presensi_Pengurus_${agendaName}.xlsx`);
  };

  const handleExportAllExcel = () => {
    if (agendas.length === 0) {
      alert("Tidak ada agenda untuk diekspor.");
      return;
    }

    const workbook = XLSX.utils.book_new();

    // Iterate through all agendas
    agendas.forEach(agenda => {
      // Get all attendance for this specific agenda
      const agendaAttendance = allAttendance.filter(a => a.agenda_id === agenda.id);
      const agendaAttendanceMap: Record<string, string> = {};
      agendaAttendance.forEach(a => {
        agendaAttendanceMap[a.member_id] = a.status;
      });

      // Prepare data for the worksheet using all members (unfiltered by current UI filters to ensure complete recap)
      const exportData = members.map((member, index) => ({
        "No": index + 1,
        "Nama Anggota": member.name,
        "Divisi": member.division || "-",
        "Fakultas": member.faculty || "-",
        "Angkatan": member.generation || "-",
        "Kehadiran": agendaAttendanceMap[member.id] || "Belum Diisi",
      }));

      const worksheet = XLSX.utils.json_to_sheet(exportData);
      
      const wscols = [
        {wch: 5}, {wch: 30}, {wch: 20}, {wch: 20}, {wch: 10}, {wch: 15}
      ];
      worksheet['!cols'] = wscols;

      // Safe sheet name (max 31 chars and no invalid chars)
      let safeSheetName = agenda.title.replace(/[:\\/?*\[\]]/g, '').trim().substring(0, 31);
      if (!safeSheetName) safeSheetName = `Agenda_${agenda.id.substring(0, 8)}`;

      // Try appending sheet, handle duplicate names if they occur
      try {
        XLSX.utils.book_append_sheet(workbook, worksheet, safeSheetName);
      } catch (e) {
        // If sheet name already exists or invalid, use a fallback
        XLSX.utils.book_append_sheet(workbook, worksheet, `Agenda_${Math.floor(Math.random() * 1000)}`);
      }
    });
    XLSX.writeFile(workbook, `Rekapan_Presensi_Pengurus_Lengkap.xlsx`);
  };

  return (
    <div className="space-y-6">
      {/* Top Configuration Bar */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-gray-500 uppercase">Pilih Agenda</label>
            <select
              value={selectedAgenda}
              onChange={(e) => setSelectedAgenda(e.target.value)}
              className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-[var(--color-primary)] outline-none bg-gray-50"
            >
              <option value="" disabled>-- Pilih Kegiatan/Rapat --</option>
              {agendas.map(a => (
                <option key={a.id} value={a.id}>{a.title} ({a.date || 'Tanpa Tanggal'})</option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-gray-500 uppercase">Filter Divisi</label>
            <select
              value={filterDivisi}
              onChange={(e) => setFilterDivisi(e.target.value)}
              className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-[var(--color-primary)] outline-none"
            >
              {divisions.map(d => <option key={d as string} value={d as string}>{d}</option>)}
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-gray-500 uppercase">Filter Fakultas</label>
            <select
              value={filterFakultas}
              onChange={(e) => setFilterFakultas(e.target.value)}
              className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-[var(--color-primary)] outline-none"
            >
              {faculties.map(f => <option key={f as string} value={f as string}>{f}</option>)}
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-gray-500 uppercase">Filter Angkatan</label>
            <select
              value={filterAngkatan}
              onChange={(e) => setFilterAngkatan(e.target.value)}
              className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-[var(--color-primary)] outline-none"
            >
              {generations.map(g => <option key={g as string} value={g as string}>{g}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* AI Mass Attendance Panel */}
      {selectedAgenda && hasGemini && (
        <div className="bg-white rounded-2xl shadow-sm border border-blue-100 overflow-hidden">
          <button 
            onClick={() => setShowAI(!showAI)}
            className="w-full flex justify-between items-center p-4 bg-gradient-to-r from-blue-50 to-indigo-50 hover:from-blue-100 hover:to-indigo-100 transition-colors"
          >
            <div className="flex items-center gap-2 text-blue-700 font-semibold">
              <Sparkles size={18} className="text-blue-500" />
              <span>Input Presensi Cepat (AI)</span>
            </div>
            <span className="text-xs text-blue-600 font-medium">
              {showAI ? "Tutup Panel" : "Buka Panel"}
            </span>
          </button>
          
          {showAI && (
            <div className="p-4 border-t border-blue-100 bg-white">
              <p className="text-sm text-gray-600 mb-3">
                Tempelkan (paste) daftar presensi dari WhatsApp atau HP Anda di bawah ini. AI akan secara otomatis mencocokkan nama dan mendata siapa saja yang Hadir, Izin, Sakit. <br/>
                <strong className="text-red-500">Penting: Anggota yang namanya tidak ada di catatan otomatis akan dianggap Alpa.</strong>
              </p>
              <textarea
                value={aiText}
                onChange={(e) => setAiText(e.target.value)}
                placeholder="Contoh:&#10;Hadir: Budi, Siti, Andi&#10;Izin: Joko&#10;Sakit: Doni"
                className="w-full p-3 border rounded-xl focus:ring-2 focus:ring-blue-500 outline-none min-h-[150px] text-sm font-mono text-gray-700 mb-3 bg-gray-50"
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
                    <span>Proses dengan AI</span>
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      )}



      {unmatchedNames.length > 0 && (
        <div className="bg-orange-50 border-l-4 border-orange-500 p-4 rounded-r-xl shadow-sm">
          <h3 className="font-bold text-orange-800 mb-1">Peringatan: Anggota Tidak Terdaftar</h3>
          <p className="text-sm text-orange-700 mb-2">
            AI menemukan nama-nama berikut di catatan presensi Anda, tetapi <strong>tidak ada</strong> di database anggota resmi. Mereka diabaikan.
          </p>
          <ul className="list-disc list-inside text-sm text-orange-800 font-medium">
            {unmatchedNames.map((name, i) => <li key={i}>{name}</li>)}
          </ul>
        </div>
      )}

      {/* Main Presensi Area */}
      {selectedAgenda ? (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-4 bg-gray-50 border-b flex justify-between items-center">
            <h3 className="font-semibold text-gray-800">Daftar Anggota ({filteredMembers.length})</h3>
            <div className="flex gap-2 text-sm">
              <span className="hidden sm:inline text-gray-500 my-auto mr-2">Tandai semua:</span>
              <button onClick={() => handleMarkAll("Hadir")} className="px-3 py-1 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors font-medium">H</button>
              <button onClick={() => handleMarkAll("Izin")} className="px-3 py-1 bg-yellow-100 text-yellow-700 rounded-lg hover:bg-yellow-200 transition-colors font-medium">I</button>
              <button onClick={() => handleMarkAll("Sakit")} className="px-3 py-1 bg-orange-100 text-orange-700 rounded-lg hover:bg-orange-200 transition-colors font-medium">S</button>
              <button onClick={() => handleMarkAll("Alpa")} className="px-3 py-1 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors font-medium">A</button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-600">
              <thead className="bg-white text-gray-700 border-b">
                <tr>
                  <th className="py-3 px-4 font-medium">Nama Anggota</th>
                  <th className="py-3 px-4 font-medium">Detail</th>
                  <th className="py-3 px-4 font-medium text-center">Kehadiran</th>
                </tr>
              </thead>
              <tbody>
                {filteredMembers.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="py-10 text-center text-gray-400">Tidak ada anggota yang cocok dengan filter.</td>
                  </tr>
                ) : (
                  filteredMembers.map((member) => {
                    const status = attendanceMap[member.id];
                    return (
                      <tr key={member.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/50 transition-colors">
                        <td className="py-3 px-4 font-medium text-gray-800">{member.name}</td>
                        <td className="py-3 px-4 text-xs">
                          <span className="text-gray-500">{member.division || '-'}</span> • <span className="text-gray-500">{member.faculty || '-'}</span> • <span className="text-gray-500">{member.generation || '-'}</span>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex justify-center gap-1 sm:gap-2">
                            <button 
                              onClick={() => handleStatusChange(member.id, "Hadir")}
                              className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs transition-colors ${status === 'Hadir' ? 'bg-green-500 text-white shadow-md' : 'bg-gray-100 text-gray-400 hover:bg-gray-200'}`}
                              title="Hadir"
                            >H</button>
                            <button 
                              onClick={() => handleStatusChange(member.id, "Izin")}
                              className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs transition-colors ${status === 'Izin' ? 'bg-yellow-500 text-white shadow-md' : 'bg-gray-100 text-gray-400 hover:bg-gray-200'}`}
                              title="Izin"
                            >I</button>
                            <button 
                              onClick={() => handleStatusChange(member.id, "Sakit")}
                              className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs transition-colors ${status === 'Sakit' ? 'bg-orange-500 text-white shadow-md' : 'bg-gray-100 text-gray-400 hover:bg-gray-200'}`}
                              title="Sakit"
                            >S</button>
                            <button 
                              onClick={() => handleStatusChange(member.id, "Alpa")}
                              className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs transition-colors ${status === 'Alpa' ? 'bg-red-500 text-white shadow-md' : 'bg-gray-100 text-gray-400 hover:bg-gray-200'}`}
                              title="Alpa"
                            >A</button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          <div className="p-4 border-t flex flex-col sm:flex-row items-center justify-between gap-4">
            {saveMessage.text ? (
              <span className={`text-sm font-medium ${saveMessage.type === 'error' ? 'text-red-500' : 'text-green-500'}`}>
                {saveMessage.text}
              </span>
            ) : <span className="hidden sm:block" />}
            
            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
              <button
                onClick={handleExportAllExcel}
                className="w-full sm:w-auto px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
                title="Unduh Rekapan Semua Agenda (Multi-Sheet)"
              >
                <Download size={18} />
                Rekapan Lengkap
              </button>
              <button
                onClick={handleExportExcel}
                className="w-full sm:w-auto px-6 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
                title="Unduh Agenda Ini Saja"
              >
                <Download size={18} />
                Ekspor Saat Ini
              </button>
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="w-full sm:w-auto px-6 py-2.5 bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-white rounded-xl font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isSaving ? "Menyimpan..." : (
                  <>
                    <Save size={18} />
                    Simpan Presensi
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-gray-50 border-2 border-dashed border-gray-200 rounded-2xl p-12 flex flex-col items-center justify-center text-gray-400">
          <CalendarCheck size={48} className="mb-4 opacity-50" />
          <p>Pilih Agenda terlebih dahulu untuk mulai mengisi presensi.</p>
        </div>
      )}
    </div>
  );
}
