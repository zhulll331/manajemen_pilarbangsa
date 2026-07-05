"use client";

import { useState } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { Save, Plus, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";

type Misi = {
  id: string;
  title: string;
  desc: string;
  pasal: string;
  color: string;
};

type VisiMisiData = {
  visi: string;
  misi: Misi[];
};

export default function VisiMisiClient({ initialData }: { initialData?: VisiMisiData }) {
  const defaultData: VisiMisiData = {
    visi: "Menjadikan UKM Pilar Bangsa sebagai wadah...",
    misi: []
  };

  const [data, setData] = useState<VisiMisiData>(initialData || defaultData);
  const [isLoading, setIsLoading] = useState(false);

  const supabase = createClientComponentClient();
  const router = useRouter();

  const handleSave = async () => {
    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('website_settings')
        .upsert(
          { setting_key: 'visi_misi', setting_value: data as any },
          { onConflict: 'setting_key' }
        );

      if (error) throw error;
      alert("Visi & Misi berhasil diperbarui!");
      router.refresh();
    } catch (error) {
      console.error("Error saving visi misi:", error);
      alert("Gagal menyimpan Visi & Misi.");
    } finally {
      setIsLoading(false);
    }
  };

  const addMisi = () => {
    const newMisi: Misi = {
      id: String(data.misi.length + 1),
      title: "Misi Baru",
      desc: "",
      pasal: "",
      color: "#E31837"
    };
    setData({ ...data, misi: [...data.misi, newMisi] });
  };

  const updateMisi = (index: number, field: keyof Misi, value: string) => {
    const newMisi = [...data.misi];
    newMisi[index] = { ...newMisi[index], [field]: value };
    setData({ ...data, misi: newMisi });
  };

  const deleteMisi = (index: number) => {
    const newMisi = [...data.misi];
    newMisi.splice(index, 1);
    // Re-assign IDs
    newMisi.forEach((m, i) => m.id = String(i + 1));
    setData({ ...data, misi: newMisi });
  };

  return (
    <div className="space-y-8">
      {/* Visi Section */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 space-y-4">
        <h2 className="text-xl font-bold text-gray-900 border-b border-gray-100 pb-2">Visi Kepengurusan</h2>
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Teks Visi Utama</label>
          <textarea
            rows={4}
            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[var(--color-primary)] focus:border-[var(--color-primary)] outline-none transition-all resize-none"
            value={data.visi}
            onChange={(e) => setData({ ...data, visi: e.target.value })}
            placeholder="Tuliskan visi kepengurusan..."
          />
        </div>
      </div>

      {/* Misi Section */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 space-y-6">
        <div className="flex justify-between items-center border-b border-gray-100 pb-2">
          <h2 className="text-xl font-bold text-gray-900">Misi Kepengurusan</h2>
          <button 
            onClick={addMisi}
            className="text-sm bg-green-50 text-green-700 px-3 py-1.5 rounded-lg font-semibold hover:bg-green-100 flex items-center gap-1"
          >
            <Plus size={16} /> Tambah Misi
          </button>
        </div>

        <div className="space-y-6">
          {data.misi.map((m, i) => (
            <div key={i} className="p-4 bg-gray-50 border border-gray-200 rounded-xl space-y-4 relative group">
              <button 
                onClick={() => deleteMisi(i)}
                className="absolute top-4 right-4 p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                title="Hapus Misi"
              >
                <Trash2 size={18} />
              </button>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Misi Ke-{m.id} (Judul Utama)</label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-1 focus:ring-[var(--color-primary)] outline-none"
                    value={m.title}
                    onChange={(e) => updateMisi(i, 'title', e.target.value)}
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Deskripsi Lengkap</label>
                  <textarea
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-1 focus:ring-[var(--color-primary)] outline-none resize-none"
                    value={m.desc}
                    onChange={(e) => updateMisi(i, 'desc', e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Landasan AD/ART (Opsional)</label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-1 focus:ring-[var(--color-primary)] outline-none"
                    value={m.pasal}
                    onChange={(e) => updateMisi(i, 'pasal', e.target.value)}
                    placeholder="Contoh: Pasal 5"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Warna Aksen Blok</label>
                  <select
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-1 focus:ring-[var(--color-primary)] outline-none"
                    value={m.color}
                    onChange={(e) => updateMisi(i, 'color', e.target.value)}
                  >
                    <option value="#E31837">Merah Pilar (#E31837)</option>
                    <option value="#008000">Hijau Pilar (#008000)</option>
                    <option value="#FFD700">Kuning Pilar (#FFD700)</option>
                  </select>
                </div>
              </div>
            </div>
          ))}
          {data.misi.length === 0 && (
            <p className="text-gray-500 text-center py-4">Belum ada misi. Silakan tambahkan.</p>
          )}
        </div>
      </div>

      <div className="flex justify-end pt-4 sticky bottom-6 z-10">
        <button
          onClick={handleSave}
          disabled={isLoading}
          className="bg-[var(--color-primary)] text-white px-8 py-3 rounded-xl flex items-center gap-2 font-bold text-lg hover:bg-[#c1142e] transition-colors shadow-xl disabled:opacity-50"
        >
          <Save size={24} />
          {isLoading ? "Menyimpan..." : "Simpan Perubahan"}
        </button>
      </div>
    </div>
  );
}
