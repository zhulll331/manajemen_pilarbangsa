"use client";

import { useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { Plus, Trash2, Edit2, Link as LinkIcon, Image as ImageIcon } from "lucide-react";
import { useRouter } from "next/navigation";

type NewsLink = {
  id: string;
  title: string;
  url: string;
  image_url: string;
  created_at: string;
};

export default function BeritaClient({ initialData }: { initialData: NewsLink[] }) {
  const [data, setData] = useState<NewsLink[]>(initialData);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    title: "",
    url: "",
    image_url: ""
  });

  const supabase = createClient();
  const router = useRouter();

  const handleOpenModal = (news?: NewsLink) => {
    if (news) {
      setEditingId(news.id);
      setFormData({
        title: news.title,
        url: news.url,
        image_url: news.image_url
      });
    } else {
      setEditingId(null);
      setFormData({ title: "", url: "", image_url: "" });
    }
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (editingId) {
        const { error } = await supabase
          .from("news_links")
          .update(formData)
          .eq("id", editingId);
        
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("news_links")
          .insert([formData]);
        
        if (error) throw error;
      }

      setIsModalOpen(false);
      router.refresh();
      // Optimistic update
      const { data: newData } = await supabase.from("news_links").select("*").order('created_at', { ascending: false });
      if (newData) setData(newData);

    } catch (error) {
      console.error("Error saving news:", error);
      alert("Gagal menyimpan berita.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Hapus tautan berita ini?")) return;
    
    try {
      const { error } = await supabase.from("news_links").delete().eq("id", id);
      if (error) throw error;
      
      setData(data.filter(n => n.id !== id));
      router.refresh();
    } catch (error) {
      console.error("Error deleting:", error);
      alert("Gagal menghapus berita.");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <button
          onClick={() => handleOpenModal()}
          className="bg-[var(--color-primary)] text-white px-4 py-2 rounded-xl flex items-center gap-2 hover:bg-[#c1142e] transition-colors shadow-md"
        >
          <Plus size={20} />
          <span>Tambah Berita</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {data.map((news) => (
          <div key={news.id} className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow group flex flex-col">
            <div className="h-40 bg-gray-100 relative overflow-hidden">
              <img src={news.image_url} alt={news.title} className="w-full h-full object-cover" />
            </div>
            <div className="p-5 flex flex-col flex-grow">
              <h3 className="font-bold text-gray-900 mb-2 line-clamp-2">{news.title}</h3>
              <a href={news.url} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline flex items-center gap-1 mb-4 truncate">
                <LinkIcon size={14} />
                <span>{news.url}</span>
              </a>
              
              <div className="mt-auto pt-4 border-t border-gray-100 flex justify-end gap-2">
                <button 
                  onClick={() => handleOpenModal(news)}
                  className="p-2 text-gray-500 hover:bg-gray-100 hover:text-[var(--color-primary)] rounded-lg transition-colors"
                >
                  <Edit2 size={18} />
                </button>
                <button 
                  onClick={() => handleDelete(news.id)}
                  className="p-2 text-gray-500 hover:bg-red-50 hover:text-red-600 rounded-lg transition-colors"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          </div>
        ))}

        {data.length === 0 && (
          <div className="col-span-full p-12 text-center bg-gray-50 rounded-2xl border border-gray-200 border-dashed">
            <NewspaperIcon className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">Belum ada berita. Klik "Tambah Berita" untuk mulai.</p>
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h3 className="font-bold text-lg text-gray-900">
                {editingId ? "Edit Berita" : "Tambah Berita Baru"}
              </h3>
            </div>
            
            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Judul Berita</label>
                <input
                  required
                  type="text"
                  className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[var(--color-primary)] focus:border-[var(--color-primary)] outline-none transition-all"
                  placeholder="Contoh: UKM Pilar Bangsa Gandeng SDN 1..."
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1 flex items-center gap-1">
                  <LinkIcon size={14} /> Link Tujuan (URL)
                </label>
                <input
                  required
                  type="url"
                  className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[var(--color-primary)] focus:border-[var(--color-primary)] outline-none transition-all"
                  placeholder="https://..."
                  value={formData.url}
                  onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1 flex items-center gap-1">
                  <ImageIcon size={14} /> Link Gambar Preview (URL)
                </label>
                <input
                  required
                  type="url"
                  className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[var(--color-primary)] focus:border-[var(--color-primary)] outline-none transition-all"
                  placeholder="https://.../gambar.jpg"
                  value={formData.image_url}
                  onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                />
                <p className="text-xs text-gray-500 mt-1">Masukkan link gambar (bisa didapatkan dengan klik kanan gambar di web sumber, lalu 'Copy Image Address').</p>
              </div>

              {formData.image_url && (
                <div className="pt-2">
                  <p className="text-xs font-semibold text-gray-500 mb-2">Preview Gambar:</p>
                  <img src={formData.image_url} alt="Preview" className="w-full h-32 object-cover rounded-xl border border-gray-200" onError={(e) => (e.currentTarget.style.display = 'none')} />
                </div>
              )}

              <div className="pt-4 flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 font-semibold rounded-xl hover:bg-gray-200 transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="flex-1 px-4 py-2 bg-[var(--color-primary)] text-white font-semibold rounded-xl hover:bg-[#c1142e] transition-colors disabled:opacity-50"
                >
                  {isLoading ? "Menyimpan..." : "Simpan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function NewspaperIcon(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M4 22h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16a2 2 0 0 1-2 2Zm0 0a2 2 0 0 1-2-2v-9c0-1.1.9-2 2-2h2" />
      <path d="M18 14h-8" />
      <path d="M15 18h-5" />
      <path d="M10 6h8v4h-8V6Z" />
    </svg>
  );
}
