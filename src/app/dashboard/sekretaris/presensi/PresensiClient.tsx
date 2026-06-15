"use client";

import { useState, useEffect, useMemo } from "react";
import { Save, CalendarCheck, Download } from "lucide-react";
import * as XLSX from "xlsx";
import { simpanPresensiMassal } from "./actions";

interface Member {
  id: string;
  name: string;
  division: string | null;
  faculty: string | null;
  generation: string | null;
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

export default function PresensiClient({
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
    XLSX.utils.book_append_sheet(workbook, worksheet, "Presensi");
    
    const wscols = [
      {wch: 5}, {wch: 25}, {wch: 20}, {wch: 20}, {wch: 10}, {wch: 15}
    ];
    worksheet['!cols'] = wscols;

    XLSX.writeFile(workbook, `Laporan_Presensi_${agendaName}.xlsx`);
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
                onClick={handleExportExcel}
                className="w-full sm:w-auto px-6 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
              >
                <Download size={18} />
                Ekspor Excel
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
