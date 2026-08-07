'use client'

import React, { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import { Image as ImageIcon, Save, RefreshCw, CheckCircle2, Upload, AlertCircle, Trash2, Plus } from 'lucide-react'
import { compressImageIfNeeded } from '@/utils/compressImage'

function getCleanImageUrl(url: string, defaultImg: string) {
  if (!url) return defaultImg
  if (url.includes('drive.google.com')) {
    const match = url.match(/id=([^&]+)/) || url.match(/d\/([a-zA-Z0-9_-]+)/)
    if (match && match[1]) {
      return `/api/drive/image?id=${match[1]}`
    }
  }
  return url
}

export default function BannerManagementPage() {
  const [slides, setSlides] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [uploadingId, setUploadingId] = useState<number | null>(null)
  const [selectedFiles, setSelectedFiles] = useState<Record<number, File | null>>({})
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  const supabase = createClient()

  useEffect(() => {
    fetchBanners()
  }, [])

  async function fetchBanners() {
    setLoading(true)
    const { data, error } = await supabase
      .from('banners')
      .select('*')
      .order('id', { ascending: true })

    if (!error && data) {
      setSlides(data)
    }
    setLoading(false)
  }

  const handleTextChange = (id: number, field: string, value: string) => {
    setSlides(prev => prev.map(s => s.id === id ? { ...s, [field]: value } : s))
  }

  const handleFileChange = (id: number, file: File | null) => {
    setSelectedFiles(prev => ({ ...prev, [id]: file }))
  }

  const handleSave = async (id: number) => {
    setUploadingId(id)
    setNotification(null)
    const currentSlide = slides.find(s => s.id === id)
    if (!currentSlide) {
      setUploadingId(null)
      return
    }

    try {
      let finalImageUrl = currentSlide.image_url
      const fileToUpload = selectedFiles[id]

      if (fileToUpload) {
        // 1. Kompres gambar (max 1MB, max 1920px)
        const compressed = await compressImageIfNeeded(fileToUpload, 1, 1920)
        
        // 2. Buat nama file unik
        const ext = compressed.type === 'image/png' ? 'png' : 'jpg'
        const fileName = `banner-${currentSlide.id}-${Date.now()}.${ext}`
        
        // 3. Upload ke Supabase Storage
        const { error: uploadError } = await supabase.storage
          .from('banner-images')
          .upload(fileName, compressed, { upsert: true, contentType: compressed.type })
        
        if (uploadError) {
          throw new Error('Gagal mengunggah gambar ke Supabase: ' + uploadError.message)
        }
        
        // 4. Ambil URL publik
        const { data: publicUrlData } = supabase.storage.from('banner-images').getPublicUrl(fileName)
        finalImageUrl = publicUrlData.publicUrl
      }

      // Update Supabase
      const { error } = await supabase
        .from('banners')
        .upsert({
          id: currentSlide.id,
          title: currentSlide.title,
          subtitle: currentSlide.subtitle,
          description: currentSlide.description,
          image_url: finalImageUrl,
          badge: currentSlide.badge,
          accent_color: currentSlide.accent_color
        })

      if (error) {
        throw error
      }

      // Update state lokal
      setSlides(prev => prev.map(s => s.id === id ? { ...s, image_url: finalImageUrl } : s))
      setSelectedFiles(prev => ({ ...prev, [id]: null }))
      setNotification({
        type: 'success',
        message: `Banner berhasil diperbarui di Supabase Storage!`
      })
    } catch (error: any) {
      setNotification({
        type: 'error',
        message: error.message || 'Terjadi kesalahan saat menyimpan banner.'
      })
    } finally {
      setUploadingId(null)
      setTimeout(() => setNotification(null), 4000)
    }
  }

  const handleAddBanner = async () => {
    try {
       const nextId = slides.length > 0 ? Math.max(...slides.map(s => Number(s.id))) + 1 : 1;
       const newBanner = {
         id: nextId,
         title: "Judul Baru",
         subtitle: "Sub Judul",
         description: "Deskripsi",
         image_url: "",
         badge: "Baru",
         accent_color: "#E31837"
       }
       const { data, error } = await supabase.from('banners').insert([newBanner]).select()
       if (error) throw error
       if (data && data.length > 0) {
         setSlides(prev => [...prev, data[0]])
         setNotification({ type: 'success', message: 'Banner baru berhasil ditambahkan' })
       }
    } catch (err: any) {
       setNotification({ type: 'error', message: err.message || 'Gagal menambahkan banner' })
    }
  }

  const handleDeleteBanner = async (id: number) => {
    if (!confirm('Apakah Anda yakin ingin menghapus banner ini?')) return;
    try {
      // Cari nama file jika url-nya dari supabase
      const currentSlide = slides.find(s => s.id === id);
      if (currentSlide && currentSlide.image_url && currentSlide.image_url.includes('.supabase.co/storage/v1/object/public/banner-images/')) {
        const parts = currentSlide.image_url.split('/');
        const fileName = parts[parts.length - 1];
        if (fileName) {
          await supabase.storage.from('banner-images').remove([fileName]);
        }
      }

      const { error } = await supabase.from('banners').delete().eq('id', id);
      if (error) throw error;
      setSlides(prev => prev.filter(s => s.id !== id));
      setNotification({ type: 'success', message: 'Banner berhasil dihapus' });
    } catch (err: any) {
      setNotification({ type: 'error', message: err.message || 'Gagal menghapus banner' });
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500">
        <RefreshCw className="animate-spin mr-2" size={24} />
        Memuat data banner...
      </div>
    )
  }

  return (
    <div className="space-y-6 relative pb-20">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Pengaturan Banner (Fleksibel)</h1>
          <p className="text-gray-600 mt-1">Kelola slide banner yang tampil di halaman beranda publik. Terintegrasi dengan Google Drive.</p>
        </div>
        <button 
          onClick={handleAddBanner}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors shadow-sm"
        >
          <Plus size={20} />
          Tambah Banner
        </button>
      </div>

      {notification && (
        <div className={`fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg flex items-center gap-3 text-white animate-in slide-in-from-top-2 ${notification.type === 'success' ? 'bg-green-600' : 'bg-red-600'}`}>
          {notification.type === 'success' ? <CheckCircle2 size={24} /> : <AlertCircle size={24} />}
          <span className="font-medium">{notification.message}</span>
        </div>
      )}

      {slides.map((slide, index) => (
        <div key={slide.id} className="bg-white rounded-xl shadow-sm border p-6 flex flex-col xl:flex-row gap-8">
          {/* Kolom Kiri: Form Input */}
          <div className="flex-1 space-y-4">
            <div className="flex items-center gap-3 pb-2 border-b">
              <span className="bg-gray-100 text-gray-600 px-3 py-1 rounded-full text-sm font-semibold">
                Slide #{index + 1}
              </span>
              <button 
                onClick={() => handleDeleteBanner(slide.id)}
                className="text-red-500 hover:bg-red-50 p-2 rounded-full transition-colors ml-auto"
                title="Hapus Banner"
              >
                <Trash2 size={20} />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Judul Utama</label>
                <input
                  type="text"
                  value={slide.title}
                  onChange={(e) => handleTextChange(slide.id, 'title', e.target.value)}
                  className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Sub Judul</label>
                <input
                  type="text"
                  value={slide.subtitle}
                  onChange={(e) => handleTextChange(slide.id, 'subtitle', e.target.value)}
                  className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Deskripsi Lengkap</label>
              <textarea
                value={slide.description}
                onChange={(e) => handleTextChange(slide.id, 'description', e.target.value)}
                rows={3}
                className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-500 outline-none resize-none"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Teks Badge</label>
                <input
                  type="text"
                  value={slide.badge}
                  onChange={(e) => handleTextChange(slide.id, 'badge', e.target.value)}
                  className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Warna Aksen (Hex)</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={slide.accent_color}
                    onChange={(e) => handleTextChange(slide.id, 'accent_color', e.target.value)}
                    className="w-10 h-10 rounded cursor-pointer border-0 p-0"
                  />
                  <input
                    type="text"
                    value={slide.accent_color}
                    onChange={(e) => handleTextChange(slide.id, 'accent_color', e.target.value)}
                    className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-500 outline-none uppercase"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Ganti Gambar Latar (Otomatis Upload ke Supabase Storage)</label>
              <div className="flex items-center gap-3">
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleFileChange(slide.id, e.target.files?.[0] || null)}
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />
                {selectedFiles[slide.id] && (
                  <span className="text-xs font-medium text-blue-600 whitespace-nowrap bg-blue-50 px-2 py-1 rounded">
                    Siap diunggah
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-500 mt-2">Disarankan rasio 16:9 (Landscape) dengan ukuran minimal 1280x720 untuk hasil terbaik.</p>
            </div>
            
            <div className="pt-4 border-t mt-4 flex justify-end">
               <button
                onClick={() => handleSave(slide.id)}
                disabled={uploadingId === slide.id}
                className={`flex items-center justify-center gap-2 px-6 py-2.5 rounded-lg text-white font-medium transition-all ${
                  uploadingId === slide.id 
                    ? 'bg-gray-400 cursor-not-allowed' 
                    : selectedFiles[slide.id] 
                      ? 'bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-600/30 ring-2 ring-blue-600 ring-offset-2'
                      : 'bg-gray-800 hover:bg-gray-900'
                }`}
              >
                {uploadingId === slide.id ? (
                  <>
                    <RefreshCw className="animate-spin" size={18} />
                    Menyimpan & Mengunggah...
                  </>
                ) : (
                  <>
                    {selectedFiles[slide.id] ? <Upload size={18} /> : <Save size={18} />}
                    Simpan Perubahan
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Kolom Kanan: Live Preview */}
          <div className="xl:w-1/3 flex flex-col bg-gray-50 rounded-lg border overflow-hidden">
            <div className="p-3 bg-gray-100 border-b flex items-center justify-between">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Live Preview</span>
              <div className="flex gap-1">
                <div className="w-2.5 h-2.5 rounded-full bg-red-400"></div>
                <div className="w-2.5 h-2.5 rounded-full bg-amber-400"></div>
                <div className="w-2.5 h-2.5 rounded-full bg-green-400"></div>
              </div>
            </div>
            <div className="relative aspect-video w-full bg-gray-200 group overflow-hidden">
              <img 
                src={selectedFiles[slide.id] ? URL.createObjectURL(selectedFiles[slide.id]!) : getCleanImageUrl(slide.image_url, '')}
                alt={slide.title}
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent flex flex-col justify-end p-4">
                <span 
                  className="text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded backdrop-blur-md mb-2 w-fit border border-white/20 shadow-xl"
                  style={{ backgroundColor: `${slide.accent_color}CC`, color: 'white' }}
                >
                  {slide.badge}
                </span>
                <h4 className="text-white font-bold text-sm leading-tight mb-1">{slide.title}</h4>
                <p className="text-white/80 text-[10px] line-clamp-2">{slide.subtitle}</p>
              </div>
            </div>
          </div>
        </div>
      ))}
      
      {slides.length === 0 && (
         <div className="text-center p-12 bg-white rounded-xl border">
            <ImageIcon className="mx-auto h-12 w-12 text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-900">Belum ada Banner</h3>
            <p className="mt-1 text-sm text-gray-500">Mulai tambahkan banner untuk ditampilkan di halaman beranda.</p>
            <div className="mt-6">
              <button
                onClick={handleAddBanner}
                className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg"
              >
                <Plus size={20} />
                Tambah Banner Perdana
              </button>
            </div>
         </div>
      )}
    </div>
  )
}
