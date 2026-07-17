"use client";

import { useState } from "react";
import { Plus, Search, Trash2, Edit, ExternalLink, RefreshCw } from "lucide-react";
import { createBrowserClient } from "@supabase/ssr";

type Archive = {
  id: string;
  title: string;
  period: string;
  category: string;
  program_id: string | null;
  drive_url: string;
  created_at: string;
  programs?: { title: string } | null;
};

type Program = {
  id: string;
  title: string;
};

export default function ArsipClient({ initialArchives, programs }: { initialArchives: Archive[], programs: Program[] }) {
  const [archives, setArchives] = useState<Archive[]>(initialArchives);
  const [search, setSearch] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    id: "",
    title: "",
    period: "2022/2023",
    category: "Humas & Kerjasama",
    program_id: "",
    drive_url: ""
  });

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const filteredArchives = archives.filter(a => 
    a.title.toLowerCase().includes(search.toLowerCase()) ||
    a.category.toLowerCase().includes(search.toLowerCase()) ||
    a.period.toLowerCase().includes(search.toLowerCase())
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const payload = {
        title: formData.title,
        period: formData.period,
        category: formData.category,
        program_id: formData.program_id || null,
        drive_url: formData.drive_url,
      };

      // Resolve program title from local list (avoid join query that triggers schema cache error)
      const relatedProgram = programs.find(p => p.id === formData.program_id) || null;

      if (formData.id) {
        // Edit
        const { error } = await supabase.from("archives").update(payload).eq("id", formData.id);
        if (error) throw error;

        // Update local state without re-querying
        setArchives(archives.map(a => a.id === formData.id ? {
          ...a,
          ...payload,
          programs: relatedProgram ? { title: relatedProgram.title } : null,
        } : a));
      } else {
        // Create — get the inserted row id without join
        const { data, error } = await supabase.from("archives").insert([payload]).select().single();
        if (error) throw error;
        if (data) {
          const newArchive: Archive = {
            ...data,
            programs: relatedProgram ? { title: relatedProgram.title } : null,
          };
          setArchives([newArchive, ...archives]);
        }
      }
      
      setIsModalOpen(false);
      setFormData({ id: "", title: "", period: "2022/2023", category: "Humas & Kerjasama", program_id: "", drive_url: "" });
    } catch (err: any) {
      alert("Terjadi kesalahan: " + err.message);
    } finally {
      setLoading(false);
    }
  };


  const handleDelete = async (id: string) => {
    if (!confirm("Apakah Anda yakin ingin menghapus arsip ini?")) return;
    
    try {
      const { error } = await supabase.from("archives").delete().eq("id", id);
      if (error) throw error;
      setArchives(archives.filter(a => a.id !== id));
    } catch (err: any) {
      alert("Gagal menghapus: " + err.message);
    }
  };

  const openEdit = (archive: Archive) => {
    setFormData({
      id: archive.id,
      title: archive.title,
      period: archive.period,
      category: archive.category,
      program_id: archive.program_id || "",
      drive_url: archive.drive_url
    });
    setIsModalOpen(true);
  };

  const CATEGORIES = [
    "Humas & Kerjasama",
    "Penalaran & Program Kompetisi",
    "Riset & Penelitian",
    "Pengabdian & Advokasi"
  ];

  const PERIODS = [
    "2022/2023",
    "2023/2024",
    "2024/2025",
    "2025/2026",
    "2026/2027"
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Kelola Arsip Publik</h1>
          <p className="text-sm text-gray-500">Kelola tautan Google Drive arsip UKM untuk ditampilkan ke publik.</p>
        </div>
        <button 
          onClick={() => {
            setFormData({ id: "", title: "", period: "2022/2023", category: "Humas & Kerjasama", program_id: "", drive_url: "" });
            setIsModalOpen(true);
          }}
          className="flex items-center gap-2 bg-[var(--color-primary)] text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus size={20} />
          Tambah Arsip
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
        <div className="flex items-center gap-3 bg-gray-50 p-3 rounded-lg border border-gray-200 mb-6">
          <Search className="text-gray-400" size={20} />
          <input 
            type="text" 
            placeholder="Cari berdasarkan judul, periode, atau kategori..." 
            className="bg-transparent border-none focus:outline-none w-full text-sm"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-600">
            <thead className="bg-gray-50 text-gray-700 uppercase font-semibold border-b border-gray-200">
              <tr>
                <th className="px-4 py-3">Judul Arsip</th>
                <th className="px-4 py-3">Periode</th>
                <th className="px-4 py-3">Kategori</th>
                <th className="px-4 py-3">Program Kerja</th>
                <th className="px-4 py-3 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {filteredArchives.length > 0 ? (
                filteredArchives.map((archive) => (
                  <tr key={archive.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-800">{archive.title}</td>
                    <td className="px-4 py-3">
                      <span className="bg-gray-100 text-gray-800 px-2 py-1 rounded-md text-xs font-medium">
                        {archive.period}
                      </span>
                    </td>
                    <td className="px-4 py-3">{archive.category}</td>
                    <td className="px-4 py-3 text-gray-500">
                      {archive.programs?.title || "-"}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-2">
                        <a 
                          href={archive.drive_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Buka Drive"
                        >
                          <ExternalLink size={18} />
                        </a>
                        <button 
                          onClick={() => openEdit(archive)}
                          className="p-1.5 text-yellow-600 hover:bg-yellow-50 rounded-lg transition-colors"
                          title="Edit"
                        >
                          <Edit size={18} />
                        </button>
                        <button 
                          onClick={() => handleDelete(archive.id)}
                          className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Hapus"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                    Tidak ada arsip ditemukan.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-4 sm:p-6 border-b border-gray-100 shrink-0">
              <h2 className="text-xl font-bold text-gray-800">
                {formData.id ? "Edit Arsip" : "Tambah Arsip Baru"}
              </h2>
            </div>
            
            <div className="p-4 sm:p-6 overflow-y-auto">
              <form id="arsip-form" onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Judul Arsip <span className="text-red-500">*</span></label>
                  <input 
                    type="text" 
                    required
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    placeholder="Contoh: Arsip LPJ Seminar Nasional"
                    value={formData.title}
                    onChange={e => setFormData({...formData, title: e.target.value})}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Periode Kepengurusan</label>
                    <select 
                      className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                      value={formData.period}
                      onChange={e => setFormData({...formData, period: e.target.value})}
                    >
                      {PERIODS.map(p => <option key={p} value={p}>{p}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Kategori Program</label>
                    <select 
                      className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                      value={formData.category}
                      onChange={e => setFormData({...formData, category: e.target.value})}
                    >
                      {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Program Kerja Terkait (Opsional)</label>
                  <select 
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                    value={formData.program_id}
                    onChange={e => setFormData({...formData, program_id: e.target.value})}
                  >
                    <option value="">-- Tidak Terhubung ke Program --</option>
                    {programs.map(p => (
                      <option key={p.id} value={p.id}>{p.title}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tautan Google Drive <span className="text-red-500">*</span></label>
                  <input 
                    type="url" 
                    required
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm"
                    placeholder="https://drive.google.com/..."
                    value={formData.drive_url}
                    onChange={e => setFormData({...formData, drive_url: e.target.value})}
                  />
                  <p className="text-xs text-gray-500 mt-1">Pastikan tautan sudah diatur hak aksesnya di Google Drive.</p>
                </div>
              </form>
            </div>

            <div className="p-4 sm:p-6 border-t border-gray-100 flex justify-end gap-3 shrink-0 bg-gray-50">
              <button 
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 text-gray-600 font-medium hover:bg-gray-200 rounded-lg transition-colors"
                disabled={loading}
              >
                Batal
              </button>
              <button 
                type="submit"
                form="arsip-form"
                disabled={loading}
                className="flex items-center gap-2 bg-[var(--color-primary)] text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-70"
              >
                {loading ? <RefreshCw className="animate-spin" size={18} /> : "Simpan Arsip"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
