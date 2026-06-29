'use client'

import React, { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import { Image, Save, RefreshCw, CheckCircle2, Upload, AlertCircle } from 'lucide-react'

const defaultSlides = [
  {
    id: 1,
    title: "Pilar Bangsa Digital Office",
    subtitle: "Wadah Transformasi & Kolaborasi Mahasiswa Universitas",
    description: "Mewujudkan tata kelola organisasi yang modern, transparan, dan akuntabel berbasis sistem digital terpadu sesuai Misi ke-2 Kepengurusan 2026/2027.",
    image_url: "https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=1200&q=80",
    badge: "Transformasi Digital",
    accent_color: "#E31837" // Merah
  },
  {
    id: 2,
    title: "Tri Dharma Perguruan Tinggi",
    subtitle: "Pilar Pembelajaran, Penelitian, dan Pengabdian",
    description: "Bersama membangun bangsa melalui riset inovatif dan pengabdian masyarakat yang berkelanjutan dan tepat sasaran.",
    image_url: "https://images.unsplash.com/photo-1531482615713-2afd69097998?auto=format&fit=crop&w=1200&q=80",
    badge: "Inovasi & Riset",
    accent_color: "#008000" // Hijau
  },
  {
    id: 3,
    title: "Berlandaskan Trisakti Sukarno",
    subtitle: "Berdaulat, Berdikari, dan Berkepribadian",
    description: "Membentuk karakter kepemimpinan mahasiswa yang berakar pada budaya bangsa dan berdaya saing global.",
    image_url: "https://images.unsplash.com/photo-1517486808906-697b691ed59b?auto=format&fit=crop&w=1200&q=80",
    badge: "Kepemimpinan",
    accent_color: "#FFD700" // Kuning
  }
]

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
  const [slides, setSlides] = useState(defaultSlides)
  const [loading, setLoading] = useState(true)
  const [uploadingId, setUploadingId] = useState<number | null>(null)
  const [selectedFiles, setSelectedFiles] = useState<Record<number, File | null>>({})
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  const supabase = createClient()

  useEffect(() => {
    async function fetchBanners() {
      setLoading(true)
      const { data, error } = await supabase
        .from('banners')
        .select('*')
        .order('id', { ascending: true })

      if (!error && data && data.length > 0) {
        const merged = defaultSlides.map((def) => {
          const found = data.find((b: any) => b.id === def.id)
          if (found) {
            return {
              id: def.id,
              title: found.title || def.title,
              subtitle: found.subtitle || def.subtitle,
              description: found.description || def.description,
              image_url: found.image_url || def.image_url,
              badge: found.badge || def.badge,
              accent_color: found.accent_color || def.accent_color,
            }
          }
          return def
        })
        setSlides(merged)
      } else {
        // Lakukan inisialisasi awal ke database jika tabel masih kosong
        for (const item of defaultSlides) {
          await supabase.from('banners').insert([item]).select()
        }
        setSlides(defaultSlides)
      }
      setLoading(false)
    }

    fetchBanners()
  }, [])

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
        const formData = new FormData()
        formData.append('file', fileToUpload)
        formData.append('path', `Ketua > Banner Beranda > Slide ${id}`)

        const res = await fetch('/api/drive/upload', {
          method: 'POST',
          body: formData
        })

        if (!res.ok) {
          throw new Error('Gagal mengunggah gambar ke Google Drive')
        }

        const data = await res.json()
        if (data.url) {
          finalImageUrl = data.url
        }
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
        message: `Banner Slide #${id} berhasil diperbarui di Google Drive dan Supabase!`
      })
    } catch (err: any) {
      setNotification({
        type: 'error',
        message: err.message || `Terjadi kesalahan saat menyimpan Slide #${id}.`
      })
    } finally {
      setUploadingId(null)
    }
  }

  return (
    <div className="space-y-8 p-6 max-w-6xl mx-auto">
      {/* Header Panel */}
      <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="space-y-2 text-center md:text-left">
          <div className="inline-flex items-center space-x-2 px-3 py-1 bg-blue-50 text-[var(--color-primary)] text-xs font-bold rounded-full">
            <Image className="w-3.5 h-3.5" />
            <span>Hak Akses Eksklusif Ketua</span>
          </div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">
            Pengaturan Foto Banner Beranda
          </h1>
          <p className="text-gray-600 text-sm max-w-xl">
            Atur foto latar belakang, judul, subjudul, dan deskripsi pada *Hero Banner Slider* halaman Beranda Publik. Foto otomatis diunggah ke Google Drive dan dirender melalui API Proxy tanpa kendala CORS.
          </p>
        </div>
        <button
          onClick={() => window.location.reload()}
          className="inline-flex items-center space-x-2 px-6 py-3 bg-gray-50 hover:bg-gray-100 text-gray-700 font-bold rounded-2xl border border-gray-200 transition-all shadow-sm flex-shrink-0"
        >
          <RefreshCw className="w-4 h-4" />
          <span>Muat Ulang Data</span>
        </button>
      </div>

      {/* Notification Banner */}
      {notification && (
        <div className={`p-6 rounded-2xl flex items-center space-x-4 border shadow-sm ${
          notification.type === 'success' ? 'bg-green-50 border-green-200 text-green-800' : 'bg-red-50 border-red-200 text-red-800'
        }`}>
          {notification.type === 'success' ? <CheckCircle2 className="w-6 h-6 flex-shrink-0 text-green-600" /> : <AlertCircle className="w-6 h-6 flex-shrink-0 text-red-600" />}
          <span className="font-bold text-sm">{notification.message}</span>
        </div>
      )}

      {/* Loading state */}
      {loading ? (
        <div className="bg-white rounded-3xl p-16 text-center text-gray-400 font-bold flex items-center justify-center space-x-3 border border-gray-100 shadow-sm">
          <RefreshCw className="w-6 h-6 animate-spin text-[var(--color-primary)]" />
          <span>Mengambil pengaturan banner dari database Supabase...</span>
        </div>
      ) : (
        <div className="space-y-12">
          {slides.map((slide) => {
            const isUploading = uploadingId === slide.id
            const previewImage = selectedFiles[slide.id] ? URL.createObjectURL(selectedFiles[slide.id]!) : getCleanImageUrl(slide.image_url, defaultSlides[slide.id - 1]?.image_url)

            return (
              <div key={slide.id} className="bg-white rounded-3xl border border-gray-200 shadow-xl overflow-hidden grid grid-cols-1 lg:grid-cols-2 gap-0">
                {/* Visual Preview */}
                <div className="relative bg-black min-h-[350px] flex items-center justify-center p-8 overflow-hidden group">
                  <div className="absolute inset-0 bg-black/60 z-10" />
                  <img
                    src={previewImage}
                    alt={slide.title}
                    className="absolute inset-0 w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700"
                  />
                  <div className="relative z-20 text-white text-center space-y-4 max-w-md">
                    <div className="inline-block px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-white/10 backdrop-blur-md border border-white/20"
                         style={{ borderLeft: `4px solid ${slide.accent_color}` }}>
                      {slide.badge}
                    </div>
                    <h3 className="text-2xl font-extrabold tracking-tight leading-snug drop-shadow">
                      {slide.title}
                    </h3>
                    <p className="text-sm font-medium text-gray-200 drop-shadow">
                      {slide.subtitle}
                    </p>
                    <p className="text-xs text-gray-300 line-clamp-3 leading-relaxed">
                      {slide.description}
                    </p>
                    <div className="pt-2">
                      <span className="text-[10px] font-bold bg-black/50 text-gray-300 px-3 py-1 rounded-full border border-white/20">
                        Visualisasi Publik Slide #{slide.id}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Form Editor */}
                <div className="p-8 sm:p-10 flex flex-col justify-between space-y-6 bg-gray-50/50">
                  <div className="space-y-6">
                    <div className="flex items-center justify-between border-b border-gray-200 pb-4">
                      <h3 className="font-extrabold text-xl text-gray-900">
                        Form Pengaturan Slide #{slide.id}
                      </h3>
                      <span className="px-3 py-1 bg-gray-200 text-gray-800 text-xs font-extrabold rounded-full">
                        {slide.badge}
                      </span>
                    </div>

                    {/* Ubah Foto */}
                    <div className="space-y-2">
                      <label className="text-xs font-extrabold text-gray-700 uppercase tracking-wider block">
                        Unggah Foto Latar Belakang Baru (Google Drive)
                      </label>
                      <div className="relative">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleFileChange(slide.id, e.target.files ? e.target.files[0] : null)}
                          className="w-full px-4 py-3 bg-white border border-gray-300 rounded-2xl text-xs text-gray-700 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-extrabold file:bg-blue-50 file:text-[var(--color-primary)] hover:file:bg-blue-100 cursor-pointer focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] shadow-sm transition-all"
                        />
                      </div>
                      <p className="text-[11px] text-gray-500">Foto akan otomatis dikonversi dan disimpan ke Google Drive organisasi tanpa batas kuota.</p>
                    </div>

                    {/* Judul */}
                    <div className="space-y-2">
                      <label className="text-xs font-extrabold text-gray-700 uppercase tracking-wider block">
                        Judul Utama
                      </label>
                      <input
                        type="text"
                        value={slide.title}
                        onChange={(e) => handleTextChange(slide.id, 'title', e.target.value)}
                        className="w-full px-4 py-3 bg-white border border-gray-300 rounded-2xl text-sm font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] shadow-sm"
                      />
                    </div>

                    {/* Subjudul */}
                    <div className="space-y-2">
                      <label className="text-xs font-extrabold text-gray-700 uppercase tracking-wider block">
                        Subjudul
                      </label>
                      <input
                        type="text"
                        value={slide.subtitle}
                        onChange={(e) => handleTextChange(slide.id, 'subtitle', e.target.value)}
                        className="w-full px-4 py-3 bg-white border border-gray-300 rounded-2xl text-sm font-medium text-gray-800 focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] shadow-sm"
                      />
                    </div>

                    {/* Deskripsi */}
                    <div className="space-y-2">
                      <label className="text-xs font-extrabold text-gray-700 uppercase tracking-wider block">
                        Deskripsi Singkat
                      </label>
                      <textarea
                        rows={3}
                        value={slide.description}
                        onChange={(e) => handleTextChange(slide.id, 'description', e.target.value)}
                        className="w-full px-4 py-3 bg-white border border-gray-300 rounded-2xl text-xs font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] shadow-sm leading-relaxed"
                      />
                    </div>
                  </div>

                  {/* Save Button */}
                  <button
                    disabled={isUploading}
                    onClick={() => handleSave(slide.id)}
                    className={`w-full py-4 rounded-2xl font-extrabold text-white flex items-center justify-center space-x-2 shadow-lg hover:shadow-xl transition-all ${
                      isUploading ? 'bg-gray-400 cursor-not-allowed' : 'bg-[var(--color-primary)] hover:opacity-90 transform hover:-translate-y-0.5'
                    }`}
                  >
                    {isUploading ? (
                      <>
                        <RefreshCw className="w-5 h-5 animate-spin" />
                        <span>Mengunggah ke Google Drive & Mengupdate Supabase...</span>
                      </>
                    ) : (
                      <>
                        <Save className="w-5 h-5" />
                        <span>Simpan Perubahan Slide #{slide.id}</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
