'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Save, Plus, Trash2, ArrowUp, ArrowDown } from 'lucide-react';
import { createClient } from '@/utils/supabase/client';

interface StrukturData {
  pembina: {
    nama: string;
    jabatan: string;
    ig: string;
    link: string;
    foto: string;
  };
  ketuaUmum: {
    id: string;
    nama: string;
    periode: string;
    jabatan: string;
    ig: string;
    link: string;
    foto: string;
  }[];
}

const defaultStruktur: StrukturData = {
  pembina: {
    nama: 'Sahru Romadloni, S.PD., M.PD',
    jabatan: 'Pembina UKM Pilar Bangsa',
    ig: '@sahru_romadloni',
    link: 'https://www.instagram.com/sahru_romadloni?igsh=ZXQ1NmRyb3V5ZWZr',
    foto: '/umum-ukm/pembina-ukm.webp'
  },
  ketuaUmum: [
    {
      id: '5',
      nama: 'Firdausi Nuzula',
      periode: '2026-2027',
      jabatan: 'Ketua Umum Kelima',
      ig: '@_zhull_03',
      link: 'https://www.instagram.com/_zhull_03?igsh=cjN1MTB0cnd6N2Zl',
      foto: '/umum-ukm/kak-nuzul.webp'
    },
    {
      id: '4',
      nama: 'Lidia Yesa Mega Wijayanti',
      periode: '2025-2026',
      jabatan: 'Ketua Umum Keempat',
      ig: '@lidia_megaa',
      link: 'https://www.instagram.com/lidia_megaa?igsh=b2Z2em1mcDM2cjJr',
      foto: '/umum-ukm/kak-lidia.webp'
    },
    {
      id: '3',
      nama: 'Aisyah Nabilla Pasha',
      periode: '2024-2025',
      jabatan: 'Ketua Umum Ketiga',
      ig: '@pashaa.a.n',
      link: 'https://www.instagram.com/pashaa.a.n?igsh=MXJrM2wwN2xndG5pOA==',
      foto: '/umum-ukm/kak-aisyah.webp'
    },
    {
      id: '2',
      nama: 'Putri Luvita Dewi',
      periode: '2023-2024',
      jabatan: 'Ketua Umum Kedua',
      ig: '@luvita_dewii',
      link: 'https://www.instagram.com/luvita_dewii?igsh=dGZqdXEyOHE3Y2Vm',
      foto: '/umum-ukm/kak-luvita.webp'
    },
    {
      id: '1',
      nama: 'Anisa Lutvia Marsya',
      periode: '2021-2023',
      jabatan: 'Ketua Umum Pertama',
      ig: '@anisaalutvia',
      link: 'https://www.instagram.com/anisaalutvia?igsh=MWxzbHZnYXJ2bXk1aQ==',
      foto: '/umum-ukm/kak-anisa.webp'
    }
  ]
};

export default function StrukturPimpinanClient({ initialData }: { initialData?: StrukturData | null }) {
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);
  const [data, setData] = useState<StrukturData>(initialData || defaultStruktur);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from('website_settings')
        .upsert(
          { setting_key: 'struktur_pimpinan', setting_value: data as unknown as Record<string, unknown> },
          { onConflict: 'setting_key' }
        );

      if (error) throw error;
      
      alert('Data Struktur Pimpinan berhasil disimpan!');
      router.refresh();
    } catch (err: any) {
      alert(`Gagal menyimpan: ${err.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddKetua = () => {
    const newId = Date.now().toString();
    setData({
      ...data,
      ketuaUmum: [
        { id: newId, nama: '', periode: '', jabatan: 'Ketua Umum Keenam', ig: '@', link: '', foto: '/umum-ukm/placeholder.webp' },
        ...data.ketuaUmum
      ]
    });
  };

  const handleRemoveKetua = (id: string) => {
    if (confirm('Yakin ingin menghapus ketua umum ini?')) {
      setData({
        ...data,
        ketuaUmum: data.ketuaUmum.filter(k => k.id !== id)
      });
    }
  };

  const moveKetua = (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === data.ketuaUmum.length - 1) return;

    const newList = [...data.ketuaUmum];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    
    // Swap
    [newList[index], newList[targetIndex]] = [newList[targetIndex], newList[index]];
    setData({ ...data, ketuaUmum: newList });
  };

  const handleKetuaChange = (id: string, field: string, value: string) => {
    setData({
      ...data,
      ketuaUmum: data.ketuaUmum.map(k => k.id === id ? { ...k, [field]: value } : k)
    });
  };

  const handlePembinaChange = (field: string, value: string) => {
    setData({
      ...data,
      pembina: { ...data.pembina, [field]: value }
    });
  };

  return (
    <div className="space-y-8">
      {/* Pembina Section */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-4">
        <h2 className="text-xl font-bold text-gray-900 border-b border-gray-100 pb-2">Profil Pembina</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700">Nama Lengkap</label>
            <input 
              type="text" 
              value={data.pembina.nama} 
              onChange={(e) => handlePembinaChange('nama', e.target.value)}
              className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#E31837] focus:bg-white transition-colors"
            />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700">Jabatan Teks</label>
            <input 
              type="text" 
              value={data.pembina.jabatan} 
              onChange={(e) => handlePembinaChange('jabatan', e.target.value)}
              className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#E31837] focus:bg-white transition-colors"
            />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700">Username Instagram</label>
            <input 
              type="text" 
              value={data.pembina.ig} 
              onChange={(e) => handlePembinaChange('ig', e.target.value)}
              className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#E31837] focus:bg-white transition-colors"
            />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700">URL Instagram</label>
            <input 
              type="text" 
              value={data.pembina.link} 
              onChange={(e) => handlePembinaChange('link', e.target.value)}
              className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#E31837] focus:bg-white transition-colors"
            />
          </div>
          <div className="space-y-1 md:col-span-2">
            <label className="text-sm font-medium text-gray-700">Path Foto (Asset)</label>
            <input 
              type="text" 
              value={data.pembina.foto} 
              onChange={(e) => handlePembinaChange('foto', e.target.value)}
              className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#E31837] focus:bg-white transition-colors"
              placeholder="/umum-ukm/pembina-ukm.webp"
            />
            <p className="text-xs text-gray-500 mt-1">Gunakan foto di folder public, misal: <code className="bg-gray-100 px-1 rounded">/umum-ukm/pembina-ukm.webp</code></p>
          </div>
        </div>
      </div>

      {/* Ketua Umum Section */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-6">
        <div className="flex items-center justify-between border-b border-gray-100 pb-2">
          <h2 className="text-xl font-bold text-gray-900">Ketua Umum dari Masa ke Masa</h2>
          <button 
            onClick={handleAddKetua}
            className="flex items-center space-x-2 text-sm bg-gray-100 text-gray-800 px-3 py-1.5 rounded-lg hover:bg-gray-200 transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Data</span>
          </button>
        </div>

        <div className="space-y-4">
          {data.ketuaUmum.map((ketua, index) => (
            <div key={ketua.id} className="p-4 bg-gray-50 border border-gray-200 rounded-xl relative group">
              <div className="absolute right-4 top-4 flex items-center space-x-2">
                <button 
                  onClick={() => moveKetua(index, 'up')} 
                  disabled={index === 0}
                  className="p-1.5 bg-white border border-gray-200 rounded shadow-sm text-gray-600 disabled:opacity-30 hover:bg-gray-100"
                >
                  <ArrowUp className="w-4 h-4" />
                </button>
                <button 
                  onClick={() => moveKetua(index, 'down')} 
                  disabled={index === data.ketuaUmum.length - 1}
                  className="p-1.5 bg-white border border-gray-200 rounded shadow-sm text-gray-600 disabled:opacity-30 hover:bg-gray-100"
                >
                  <ArrowDown className="w-4 h-4" />
                </button>
                <button 
                  onClick={() => handleRemoveKetua(ketua.id)}
                  className="p-1.5 bg-white border border-red-200 rounded shadow-sm text-red-500 hover:bg-red-50"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-8 md:mt-2">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-gray-500">Nama</label>
                  <input 
                    type="text" 
                    value={ketua.nama} 
                    onChange={(e) => handleKetuaChange(ketua.id, 'nama', e.target.value)}
                    className="w-full px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#E31837]"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-gray-500">Periode (Misal: 2026-2027)</label>
                  <input 
                    type="text" 
                    value={ketua.periode} 
                    onChange={(e) => handleKetuaChange(ketua.id, 'periode', e.target.value)}
                    className="w-full px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#E31837]"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-gray-500">Urutan (Misal: Ketua Umum Kelima)</label>
                  <input 
                    type="text" 
                    value={ketua.jabatan} 
                    onChange={(e) => handleKetuaChange(ketua.id, 'jabatan', e.target.value)}
                    className="w-full px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#E31837]"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-gray-500">Username IG</label>
                  <input 
                    type="text" 
                    value={ketua.ig} 
                    onChange={(e) => handleKetuaChange(ketua.id, 'ig', e.target.value)}
                    className="w-full px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#E31837]"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-gray-500">Link URL Instagram</label>
                  <input 
                    type="text" 
                    value={ketua.link} 
                    onChange={(e) => handleKetuaChange(ketua.id, 'link', e.target.value)}
                    className="w-full px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#E31837]"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-gray-500">Path Foto (Asset)</label>
                  <input 
                    type="text" 
                    value={ketua.foto} 
                    onChange={(e) => handleKetuaChange(ketua.id, 'foto', e.target.value)}
                    className="w-full px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#E31837]"
                    placeholder="/umum-ukm/kak-nuzul.webp"
                  />
                </div>
              </div>
            </div>
          ))}
          {data.ketuaUmum.length === 0 && (
            <p className="text-center text-gray-500 py-6 text-sm">Belum ada data ketua umum. Silakan tambah.</p>
          )}
        </div>
      </div>

      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="flex items-center space-x-2 bg-[#E31837] text-white px-8 py-3 rounded-xl font-bold shadow-lg shadow-red-500/30 hover:bg-[#C0152D] hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:hover:translate-y-0"
        >
          <Save className="w-5 h-5" />
          <span>{isSaving ? 'Menyimpan...' : 'Simpan Perubahan'}</span>
        </button>
      </div>
    </div>
  );
}
