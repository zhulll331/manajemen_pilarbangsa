'use client'

import React, { useEffect, useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { Plus, CheckCircle2, Clock, PlayCircle, Trash2, Edit3, Save, X, ExternalLink, RefreshCw, AlertCircle, FileCheck, FileText, Upload, Image as ImageIcon } from 'lucide-react'
import { uploadFileToDrive } from '@/utils/driveClientUpload'

interface ProgramItem {
  id: string
  title: string
  description?: string
  division?: string
  division_name?: string
  status: string
  start_date?: string
  end_date?: string
  person_in_charge?: string
  cover_image_url?: string
  gallery_drive_url?: string
  sk_url?: string
  laporan_url?: string
}

// Fungsi pembantu konversi URL Google Drive ke format direct render uc?export=view&id=ID
function convertGoogleDriveUrl(url: string): string {
  if (!url) return ''
  if (url.includes('uc?export=view') || !url.includes('drive.google.com')) {
    return url
  }
  const match = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/) || url.match(/id=([a-zA-Z0-9_-]+)/)
  if (match && match[1]) {
    return `https://drive.google.com/uc?export=view&id=${match[1]}`
  }
  return url
}

// Fungsi pembantu cerdas untuk mengonversi foto potrait (vertikal) menjadi landscape (horizontal 16:9)
// menggunakan HTML5 Canvas dengan efek blur background yang premium dan elegan
async function convertToLandscape(file: File): Promise<File> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.src = URL.createObjectURL(file);
    img.onload = () => {
      // Periksa apakah foto potrait (tinggi > lebar)
      if (img.height > img.width) {
        // Target resolusi landscape standar 16:9 (1200 x 675)
        const targetWidth = 1200;
        const targetHeight = 675;

        const canvas = document.createElement('canvas');
        canvas.width = targetWidth;
        canvas.height = targetHeight;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(file);
          return;
        }

        // 1. Gambar background gelap premium
        ctx.fillStyle = '#111827'; // Dark slate / black background
        ctx.fillRect(0, 0, targetWidth, targetHeight);

        // 2. Gambar versi blur di latar belakang sebagai efek sinematik
        ctx.save();
        ctx.filter = 'blur(25px) brightness(0.5)';
        const bgScale = targetWidth / img.width;
        const bgHeight = img.height * bgScale;
        ctx.drawImage(img, 0, (targetHeight - bgHeight) / 2, targetWidth, bgHeight);
        ctx.restore();

        // 3. Gambar foto asli tepat di tengah tanpa mengubah rasio (fit center)
        const scale = targetHeight / img.height;
        const newWidth = img.width * scale;
        const newHeight = targetHeight;
        const offsetX = (targetWidth - newWidth) / 2;
        const offsetY = 0;

        ctx.drawImage(img, offsetX, offsetY, newWidth, newHeight);

        canvas.toBlob((blob) => {
          if (blob) {
            const newFile = new File([blob], `landscape_${file.name}`, {
              type: file.type || 'image/jpeg',
              lastModified: Date.now(),
            });
            resolve(newFile);
          } else {
            resolve(file);
          }
        }, file.type || 'image/jpeg', 0.92);
      } else {
        // Jika foto sudah landscape/horizontal, langsung kembalikan aslinya
        resolve(file);
      }
    };
    img.onerror = () => resolve(file);
  });
}

export default function KelolaProkerPage() {
  const [programs, setPrograms] = useState<ProgramItem[]>([])
  const [loading, setLoading] = useState(true)
  const [divisionName, setDivisionName] = useState('Humas & Kerjasama')
  const [isEditing, setIsEditing] = useState(false)
  const [currentEditId, setCurrentEditId] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState('')
  const [successMessage, setSuccessMessage] = useState('')

  // Form States
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [status, setStatus] = useState('Belum Dimulai')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [coverUrl, setCoverUrl] = useState('')
  const [folderUrl, setFolderUrl] = useState('')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isConvertingImage, setIsConvertingImage] = useState(false)
  
  // Administrasi Wajib (SK & Laporan)
  const [skUrl, setSkUrl] = useState('')
  const [laporanUrl, setLaporanUrl] = useState('')
  const [selectedSkFile, setSelectedSkFile] = useState<File | null>(null)
  const [selectedLaporanFile, setSelectedLaporanFile] = useState<File | null>(null)

  const [uploadingFile, setUploadingFile] = useState(false)

  const supabase = createClient()

  useEffect(() => {
    fetchData()
  }, [])

  async function fetchData() {
    setLoading(true)
    setErrorMessage('')
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      const email = (user.email || '').toLowerCase()
      let divName = 'Humas & Kerjasama'
      let keyword = ''

      if (email.includes('humas')) { divName = 'Humas & Kerjasama'; keyword = 'humas' }
      else if (email.includes('riset')) { divName = 'Riset & Penelitian'; keyword = 'riset' }
      else if (email.includes('penalaran')) { divName = 'Penalaran & Program Kompetisi'; keyword = 'penalaran' }
      else if (email.includes('pengabdian')) { divName = 'Pengabdian & Advokasi'; keyword = 'pengabdian' }

      const { data: profile } = await supabase
        .from('profiles')
        .select('division_name')
        .eq('id', user.id)
        .single()

      if (profile?.division_name) {
        divName = profile.division_name
        const pDiv = divName.toLowerCase()
        if (pDiv.includes('humas')) keyword = 'humas'
        else if (pDiv.includes('riset')) keyword = 'riset'
        else if (pDiv.includes('penalaran')) keyword = 'penalaran'
        else if (pDiv.includes('pengabdian')) keyword = 'pengabdian'
      }
      setDivisionName(divName)

      // Ambil data proker
      const { data: prokerData, error } = await supabase
        .from('programs')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) {
        setErrorMessage('Gagal mengambil data dari tabel programs: ' + error.message)
      } else if (prokerData) {
        const formattedPrograms = prokerData.map((p: any) => {
          let desc = p.description || '';
          let cover = p.cover_image_url || '';
          let gallery = p.gallery_drive_url || '';
          let sk = p.sk_url || '';
          let lap = p.laporan_url || '';

          const coverMatch = desc.match(/\[COVER_URL\]:\s*([^\n\r]+)/);
          if (coverMatch && coverMatch[1]) cover = coverMatch[1].trim();

          const galleryMatch = desc.match(/\[GALLERY_URL\]:\s*([^\n\r]+)/);
          if (galleryMatch && galleryMatch[1]) gallery = galleryMatch[1].trim();

          const skMatch = desc.match(/\[SK_URL\]:\s*([^\n\r]+)/);
          if (skMatch && skMatch[1]) sk = skMatch[1].trim();

          const lapMatch = desc.match(/\[LAPORAN_URL\]:\s*([^\n\r]+)/);
          if (lapMatch && lapMatch[1]) lap = lapMatch[1].trim();

          const cleanDesc = desc
            .replace(/(\r?\n)*---+(\r?\n)*\[COVER_URL\]:[\s\S]*$/, '')
            .replace(/(\r?\n)*---+(\r?\n)*\[SK_URL\]:[\s\S]*$/, '');

          return {
            ...p,
            description: cleanDesc,
            cover_image_url: cover,
            gallery_drive_url: gallery,
            sk_url: sk,
            laporan_url: lap
          };
        });

        if (keyword) {
          const filtered = formattedPrograms.filter(p => {
            const div = (p.division || '').toLowerCase()
            return div.includes(keyword)
          })
          setPrograms(filtered)
        } else {
          setPrograms(formattedPrograms)
        }
      }
    }
    setLoading(false)
  }

  function resetForm() {
    setTitle('')
    setDescription('')
    setStatus('Belum Dimulai')
    setStartDate('')
    setEndDate('')
    setCoverUrl('')
    setFolderUrl('')
    setSkUrl('')
    setLaporanUrl('')
    setSelectedFile(null)
    setSelectedSkFile(null)
    setSelectedLaporanFile(null)
    setUploadingFile(false)
    setIsEditing(false)
    setCurrentEditId(null)
  }

  function handleEdit(p: ProgramItem) {
    setTitle(p.title || '')
    setDescription(p.description || '')
    setStatus(p.status || 'Belum Dimulai')
    setStartDate(p.start_date || '')
    setEndDate(p.end_date || '')
    setCoverUrl(p.cover_image_url || '')
    setFolderUrl(p.gallery_drive_url || '')
    setSkUrl(p.sk_url || '')
    setLaporanUrl(p.laporan_url || '')
    setSelectedFile(null)
    setSelectedSkFile(null)
    setSelectedLaporanFile(null)
    setUploadingFile(false)
    setCurrentEditId(p.id)
    setIsEditing(true)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  // Handler pemilihan file foto dengan konversi otomatis potrait ke landscape
  async function handleImageFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] || null;
    if (!file) {
      setSelectedFile(null);
      return;
    }
    if (file.type.startsWith('image/')) {
      setIsConvertingImage(true);
      try {
        const landscapeFile = await convertToLandscape(file);
        setSelectedFile(landscapeFile);
      } catch (err) {
        console.error('Gagal konversi landscape:', err);
        setSelectedFile(file);
      } finally {
        setIsConvertingImage(false);
      }
    } else {
      setSelectedFile(file);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setErrorMessage('')
    setSuccessMessage('')

    if (!title) {
      setErrorMessage('Judul Program Kerja wajib diisi!')
      return
    }

    setUploadingFile(true)
    let currentFolderId = folderUrl
    let finalSkUrl = skUrl
    let finalLaporanUrl = laporanUrl
    let currentCoverUrl = coverUrl

    try {
      // 1. Buat folder Proker di dalam folder Divisi masing-masing
      if (!currentFolderId) {
        const res = await fetch('/api/drive/create-folder', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ folderName: `Proker - ${title}`, parentFolderName: `Divisi - ${divisionName}` })
        })
        const data = await res.json()
        if (data.error) throw new Error(data.error)
        if (data.folderId) {
          currentFolderId = `https://drive.google.com/drive/folders/${data.folderId}`
          setFolderUrl(currentFolderId)
        }
      } else if (currentEditId && currentFolderId) {
        const match = currentFolderId.match(/folders\/([a-zA-Z0-9_-]+)/) || [null, currentFolderId]
        const fId = match[1] || currentFolderId
        if (fId && !fId.includes('http')) {
          await fetch('/api/drive/rename-folder', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ folderId: fId, newName: `Proker - ${title}` })
          })
        }
      }

      const fMatch = currentFolderId.match(/folders\/([a-zA-Z0-9_-]+)/) || [null, currentFolderId]
      const prokerFolderId = fMatch[1] || currentFolderId

      // 2. Upload Foto Pratinjau Utama
      if (selectedFile) {
        // Upload langsung dari browser ke Google Drive (melewati Vercel)
        const { url: coverUrl2 } = await uploadFileToDrive(
          selectedFile,
          prokerFolderId && !prokerFolderId.includes('http') ? prokerFolderId : undefined
        )
        currentCoverUrl = coverUrl2
        setCoverUrl(coverUrl2)
      }

      // 3. Upload File SK Sebelum Kegiatan
      if (selectedSkFile) {
        const { url: skUrl2 } = await uploadFileToDrive(
          selectedSkFile,
          prokerFolderId && !prokerFolderId.includes('http') ? prokerFolderId : undefined
        )
        finalSkUrl = skUrl2
        setSkUrl(skUrl2)
      }

      // 4. Upload File Laporan Setelah Kegiatan
      if (selectedLaporanFile) {
        const { url: lapUrl2 } = await uploadFileToDrive(
          selectedLaporanFile,
          prokerFolderId && !prokerFolderId.includes('http') ? prokerFolderId : undefined
        )
        finalLaporanUrl = lapUrl2
        setLaporanUrl(lapUrl2)
      }

      const directCoverUrl = convertGoogleDriveUrl(currentCoverUrl)

      const cleanDesc = description
        .replace(/(\r?\n)*---+(\r?\n)*\[COVER_URL\]:[\s\S]*$/, '')
        .replace(/(\r?\n)*---+(\r?\n)*\[SK_URL\]:[\s\S]*$/, '');

      const metaTags = `\n\n---\n[COVER_URL]: ${directCoverUrl || ''}\n[GALLERY_URL]: ${currentFolderId || ''}\n[SK_URL]: ${finalSkUrl || ''}\n[LAPORAN_URL]: ${finalLaporanUrl || ''}`;
      const combinedDescription = cleanDesc + metaTags;

      const payloadStrict = {
        title,
        description: combinedDescription,
        division: divisionName,
        person_in_charge: `Divisi ${divisionName}`,
        status,
        start_date: startDate || null,
        end_date: endDate || null
      }

      if (currentEditId) {
        const { error } = await supabase
          .from('programs')
          .update(payloadStrict)
          .eq('id', currentEditId)

        if (error) {
          setErrorMessage('Gagal memperbarui program kerja: ' + error.message)
        } else {
          setSuccessMessage('Program kerja dan berkas administrasi berhasil diperbarui!')
          resetForm()
          fetchData()
        }
      } else {
        const { error } = await supabase
          .from('programs')
          .insert([payloadStrict])

        if (error) {
          setErrorMessage('Gagal menambahkan program kerja: ' + error.message)
        } else {
          setSuccessMessage('Program kerja baru beserta berkas administrasi berhasil ditambahkan!')
          resetForm()
          fetchData()
        }
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Terjadi kesalahan sistem')
    } finally {
      setUploadingFile(false)
    }
  }

  async function handleQuickStatus(id: string, newStatus: string) {
    setErrorMessage('')
    setSuccessMessage('')
    const { error } = await supabase
      .from('programs')
      .update({ status: newStatus })
      .eq('id', id)

    if (error) {
      setErrorMessage('Gagal memperbarui status: ' + error.message)
    } else {
      setSuccessMessage(`Status berhasil diperbarui menjadi "${newStatus}"!`)
      fetchData()
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Apakah Anda yakin ingin menghapus program kerja ini beserta seluruh filenya di Google Drive?')) return
    setErrorMessage('')
    setSuccessMessage('')

    const target = programs.find(p => p.id === id);
    if (target) {
      if (target.cover_image_url && target.cover_image_url.includes('drive.google.com')) {
        await fetch('/api/drive/delete', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ fileUrl: target.cover_image_url })
        }).catch(err => console.error('Gagal hapus cover drive:', err));
      }
      if (target.sk_url && target.sk_url.includes('drive.google.com')) {
        await fetch('/api/drive/delete', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ fileUrl: target.sk_url })
        }).catch(err => console.error('Gagal hapus sk drive:', err));
      }
      if (target.laporan_url && target.laporan_url.includes('drive.google.com')) {
        await fetch('/api/drive/delete', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ fileUrl: target.laporan_url })
        }).catch(err => console.error('Gagal hapus laporan drive:', err));
      }
      if (target.gallery_drive_url && target.gallery_drive_url.includes('drive.google.com')) {
        await fetch('/api/drive/delete', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ fileUrl: target.gallery_drive_url })
        }).catch(err => console.error('Gagal hapus folder drive:', err));
      }
    }

    const { error } = await supabase
      .from('programs')
      .delete()
      .eq('id', id)

    if (error) {
      setErrorMessage('Gagal menghapus program kerja: ' + error.message)
    } else {
      setSuccessMessage('Program kerja dan seluruh file/folder di Google Drive berhasil dihapus permanen!')
      fetchData()
    }
  }

  return (
    <div className="space-y-12 max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
      {/* Header Panel */}
      <section className="bg-black text-white rounded-3xl p-8 sm:p-12 relative overflow-hidden shadow-2xl">
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-[#E31837] via-[#008000] to-[#FFD700]"></div>
        <div className="space-y-4 relative z-10">
          <div className="inline-flex items-center space-x-2 px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-md text-xs font-bold tracking-widest uppercase border border-white/20">
            <span>Kewajiban Administrasi Divisi</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
            Kelola Proker, SK & Laporan Kegiatan Divisi
          </h1>
          <p className="text-gray-300 text-base sm:text-lg max-w-2xl leading-relaxed">
            Setiap divisi wajib melampirkan <strong>SK sebelum kegiatan</strong> dan <strong>Laporan LPJ setelah kegiatan</strong>. Seluruh berkas otomatis tersimpan rapi di folder Google Drive divisi Anda untuk menghemat storage.
          </p>
        </div>
      </section>

      {/* Pesan Error & Success */}
      {errorMessage && (
        <div className="p-6 bg-red-50 border-l-8 border-[#E31837] text-red-900 rounded-2xl shadow-sm flex items-center space-x-3">
          <AlertCircle className="w-6 h-6 text-[#E31837] flex-shrink-0" />
          <span className="font-bold">{errorMessage}</span>
        </div>
      )}
      {successMessage && (
        <div className="p-6 bg-green-50 border-l-8 border-[#008000] text-green-900 rounded-2xl shadow-sm flex items-center space-x-3">
          <CheckCircle2 className="w-6 h-6 text-[#008000] flex-shrink-0" />
          <span className="font-bold">{successMessage}</span>
        </div>
      )}

      {/* Formulir Input & Edit */}
      <section className="bg-white border border-gray-200 rounded-3xl p-6 sm:p-10 shadow-xl space-y-8">
        <div className="flex items-center justify-between border-b border-gray-100 pb-4">
          <h3 className="text-2xl font-bold text-gray-900 flex items-center space-x-2">
            <span>{isEditing ? 'Edit Program Kerja & Dokumen' : 'Input Program Kerja & Dokumen Baru'}</span>
          </h3>
          {isEditing && (
            <button
              onClick={resetForm}
              className="inline-flex items-center space-x-1 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl text-sm transition-colors"
            >
              <X className="w-4 h-4" />
              <span>Batal Edit</span>
            </button>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Bagian 1: Informasi Dasar */}
          <div className="space-y-6">
            <h4 className="text-lg font-bold text-gray-800 border-l-4 border-black pl-3">1. Informasi Program Kerja</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2 md:col-span-2">
                <label className="block text-sm font-bold text-gray-700">Nama Program Kerja *</label>
                <input
                  type="text"
                  placeholder="Contoh: Riset Indeks Kesejahteraan Mahasiswa..."
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-gray-900 font-medium focus:outline-none focus:ring-2 focus:ring-black shadow-sm"
                  required
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <label className="block text-sm font-bold text-gray-700">Deskripsi Singkat</label>
                <textarea
                  rows={3}
                  placeholder="Jelaskan tujuan dan lingkup pelaksanaan program kerja ini..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-gray-900 font-medium focus:outline-none focus:ring-2 focus:ring-black shadow-sm"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-bold text-gray-700">Divisi Pelaksana</label>
                <input
                  type="text"
                  value={divisionName}
                  onChange={(e) => setDivisionName(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-100 border border-gray-200 rounded-2xl text-gray-800 font-bold shadow-sm"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-bold text-gray-700">Status Pelaksanaan</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-gray-900 font-bold focus:outline-none focus:ring-2 focus:ring-black shadow-sm"
                >
                  <option value="Belum Dimulai">Belum Dimulai</option>
                  <option value="Berjalan">Berjalan</option>
                  <option value="Sedang Berjalan">Sedang Berjalan</option>
                  <option value="Selesai">Selesai</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-bold text-gray-700">Tanggal Mulai</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-gray-900 font-medium focus:outline-none focus:ring-2 focus:ring-black shadow-sm"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-bold text-gray-700">Tanggal Selesai</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-gray-900 font-medium focus:outline-none focus:ring-2 focus:ring-black shadow-sm"
                />
              </div>
            </div>
          </div>

          {/* Bagian 2: Kelengkapan Administrasi Wajib Divisi (SK & Laporan) */}
          <div className="space-y-6 bg-blue-50/40 border border-blue-100 rounded-3xl p-6 sm:p-8">
            <div className="flex items-center space-x-3 border-b border-blue-200 pb-4">
              <div className="p-2.5 bg-blue-600 text-white rounded-2xl shadow-md">
                <FileCheck className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-xl font-extrabold text-blue-950">2. Kelengkapan Administrasi Wajib Divisi</h4>
                <p className="text-xs font-medium text-blue-800">Upload SK sebelum pelaksanaan dan Laporan LPJ setelah kegiatan selesai</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-2">
              {/* SK Sebelum Kegiatan */}
              <div className="bg-white p-6 rounded-2xl border border-blue-100 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <label className="block text-sm font-extrabold text-gray-900">📄 SK Sebelum Kegiatan (Wajib)</label>
                  <span className="text-[10px] font-bold px-2.5 py-1 bg-yellow-100 text-yellow-800 rounded-full">Pra-Kegiatan</span>
                </div>
                <p className="text-xs text-gray-500 leading-relaxed">
                  Surat Keputusan (SK) atau Surat Tugas kepanitiaan wajib diunggah sebelum program kerja mulai berjalan.
                </p>
                <div className="border-2 border-dashed border-gray-300 rounded-xl p-4 text-center hover:border-blue-500 transition-colors bg-blue-50/10">
                  <input
                    type="file"
                    accept=".pdf,.doc,.docx,.png,.jpg,.jpeg"
                    onChange={(e) => setSelectedSkFile(e.target.files?.[0] || null)}
                    className="w-full text-xs text-gray-500 file:mr-4 file:py-1.5 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-700 file:transition-colors cursor-pointer"
                  />
                  {selectedSkFile && (
                    <p className="mt-2 text-xs font-bold text-green-600">File SK terpilih: {selectedSkFile.name}</p>
                  )}
                  <p className="mt-1 text-[10px] text-gray-400">Otomatis masuk ke folder Drive Divisi &gt; Proker</p>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-700">Atau Tautan SK Eksternal</label>
                  <input
                    type="text"
                    placeholder="https://drive.google.com/file/d/..."
                    value={skUrl}
                    onChange={(e) => setSkUrl(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
                {skUrl && (
                  <div className="pt-1 flex items-center space-x-1 text-xs text-blue-600 font-bold">
                    <ExternalLink size={14} />
                    <a href={skUrl} target="_blank" rel="noreferrer" className="hover:underline">Buka File SK Saat Ini</a>
                  </div>
                )}
              </div>

              {/* Laporan Setelah Kegiatan */}
              <div className="bg-white p-6 rounded-2xl border border-blue-100 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <label className="block text-sm font-extrabold text-gray-900">📊 Laporan Setelah Kegiatan (Wajib)</label>
                  <span className="text-[10px] font-bold px-2.5 py-1 bg-green-100 text-green-800 rounded-full">Pasca-Kegiatan</span>
                </div>
                <p className="text-xs text-gray-500 leading-relaxed">
                  Laporan Pertanggungjawaban (LPJ) atau Laporan Hasil Pelaksanaan wajib diunggah setelah kegiatan selesai.
                </p>
                <div className="border-2 border-dashed border-gray-300 rounded-xl p-4 text-center hover:border-blue-500 transition-colors bg-blue-50/10">
                  <input
                    type="file"
                    accept=".pdf,.doc,.docx,.png,.jpg,.jpeg"
                    onChange={(e) => setSelectedLaporanFile(e.target.files?.[0] || null)}
                    className="w-full text-xs text-gray-500 file:mr-4 file:py-1.5 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-700 file:transition-colors cursor-pointer"
                  />
                  {selectedLaporanFile && (
                    <p className="mt-2 text-xs font-bold text-green-600">File Laporan terpilih: {selectedLaporanFile.name}</p>
                  )}
                  <p className="mt-1 text-[10px] text-gray-400">Otomatis masuk ke folder Drive Divisi &gt; Proker</p>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-700">Atau Tautan Laporan Eksternal</label>
                  <input
                    type="text"
                    placeholder="https://drive.google.com/file/d/..."
                    value={laporanUrl}
                    onChange={(e) => setLaporanUrl(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
                {laporanUrl && (
                  <div className="pt-1 flex items-center space-x-1 text-xs text-blue-600 font-bold">
                    <ExternalLink size={14} />
                    <a href={laporanUrl} target="_blank" rel="noreferrer" className="hover:underline">Buka File Laporan Saat Ini</a>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Bagian 3: Media & Dokumentasi Galeri */}
          <div className="space-y-6">
            <div className="flex items-center justify-between border-b border-gray-200 pb-3">
              <h4 className="text-lg font-bold text-gray-800 border-l-4 border-black pl-3">3. Galeri Foto & Dokumentasi Publik</h4>
              <span className="text-xs font-extrabold text-green-600 bg-green-50 px-3 py-1 rounded-full border border-green-200 flex items-center space-x-1">
                <ImageIcon className="w-3.5 h-3.5" />
                <span>Auto Potrait to Landscape 16:9</span>
              </span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2 md:col-span-2">
                <label className="block text-sm font-bold text-gray-700">Upload Foto Pratinjau Utama (Otomatis ke Google Drive & Auto-Landscape)</label>
                <div className="border-2 border-dashed border-gray-300 rounded-2xl p-6 text-center hover:border-black transition-colors bg-gray-50/50">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageFileChange}
                    className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-6 file:rounded-xl file:border-0 file:text-sm file:font-bold file:bg-black file:text-white hover:file:bg-[#E31837] file:transition-colors cursor-pointer"
                  />
                  {isConvertingImage && (
                    <p className="mt-3 text-sm font-bold text-blue-600 animate-pulse flex items-center justify-center space-x-2">
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Mendeteksi foto potrait & mengonversi ke landscape dengan blur background...</span>
                    </p>
                  )}
                  {!isConvertingImage && selectedFile && (
                    <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-xl inline-block">
                      <p className="text-sm font-extrabold text-green-700">✓ Siap diunggah: {selectedFile.name}</p>
                      {selectedFile.name.startsWith('landscape_') && (
                        <p className="text-xs font-bold text-blue-600 mt-1">✨ Foto potrait berhasil dikonversi otomatis menjadi landscape 16:9!</p>
                      )}
                    </div>
                  )}
                  <p className="mt-2 text-xs text-gray-400">Jika Anda mengunggah foto vertikal (potrait), sistem akan otomatis mengubahnya menjadi horizontal (landscape) dengan efek latar belakang sinematik.</p>
                </div>
              </div>

              <div className="space-y-2 md:col-span-2">
                <label className="block text-sm font-bold text-gray-700">Atau Link Foto Pratinjau Utama (Google Drive / Unsplash)</label>
                <input
                  type="text"
                  placeholder="https://drive.google.com/file/d/ID/view atau URL gambar eksternal..."
                  value={coverUrl}
                  onChange={(e) => setCoverUrl(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-gray-900 font-medium focus:outline-none focus:ring-2 focus:ring-black shadow-sm"
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <label className="block text-sm font-bold text-gray-700">Link Folder Dokumentasi Google Drive</label>
                <input
                  type="text"
                  placeholder="https://drive.google.com/drive/folders/ID-FOLDER..."
                  value={folderUrl}
                  onChange={(e) => setFolderUrl(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-gray-900 font-medium focus:outline-none focus:ring-2 focus:ring-black shadow-sm"
                />
              </div>
            </div>
          </div>

          <div className="pt-4 flex justify-end space-x-4">
            <button
              type="submit"
              disabled={uploadingFile || isConvertingImage}
              className="px-8 py-4 bg-black hover:bg-[#E31837] text-white font-extrabold rounded-2xl shadow-xl transition-all duration-300 flex items-center space-x-2 disabled:opacity-50"
            >
              <Save className="w-5 h-5" />
              <span>{uploadingFile ? 'Mengunggah ke Drive & Menyimpan...' : isEditing ? 'Simpan Perubahan' : 'Tambahkan Program Kerja'}</span>
            </button>
          </div>
        </form>
      </section>

      {/* Tabel Daftar Program Kerja & Status Kelengkapan Administrasi */}
      <section className="bg-white border border-gray-200 rounded-3xl p-6 sm:p-10 shadow-xl space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-gray-100 pb-4">
          <div>
            <h3 className="text-2xl font-bold text-gray-900">Daftar Program Kerja & Monitoring Administrasi</h3>
            <p className="text-sm text-gray-500">Pantau kelengkapan SK dan Laporan LPJ untuk setiap kegiatan divisi Anda</p>
          </div>
          <button
            onClick={fetchData}
            className="inline-flex items-center space-x-2 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl text-sm transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Muat Ulang Data</span>
          </button>
        </div>

        {loading ? (
          <div className="p-12 text-center text-gray-400 font-bold flex items-center justify-center space-x-2">
            <RefreshCw className="w-6 h-6 animate-spin" />
            <span>Mengambil data dari database Supabase...</span>
          </div>
        ) : programs.length === 0 ? (
          <div className="p-16 text-center bg-gray-50 rounded-3xl border border-gray-200 space-y-4">
            <AlertCircle className="w-12 h-12 text-gray-300 mx-auto" />
            <h4 className="text-xl font-bold text-gray-700">Belum Ada Program Kerja untuk Divisi Anda</h4>
            <p className="text-base text-gray-500 max-w-md mx-auto">
              Tabel programs di database Anda saat ini belum memiliki proker dengan nama divisi Anda ({divisionName}). Silakan isi formulir di atas untuk menambahkan data pertama Anda.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-200 text-xs font-extrabold text-gray-400 uppercase">
                  <th className="py-4 px-4">Nama Program & Divisi</th>
                  <th className="py-4 px-4">Status Kegiatan</th>
                  <th className="py-4 px-4">SK Sebelum Kegiatan</th>
                  <th className="py-4 px-4">Laporan Setelah Kegiatan</th>
                  <th className="py-4 px-4">Tombol Cepat Status</th>
                  <th className="py-4 px-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-sm font-medium text-gray-700">
                {programs.map((p) => (
                  <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                    <td className="py-4 px-4">
                      <div className="font-extrabold text-gray-900">{p.title}</div>
                      <div className="text-xs text-gray-400">{p.division || p.division_name || '-'}</div>
                    </td>
                    <td className="py-4 px-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold shadow-sm ${
                        p.status === 'Selesai'
                          ? 'bg-red-100 text-red-800 border border-red-200'
                          : p.status === 'Berjalan' || p.status === 'Sedang Berjalan'
                          ? 'bg-green-100 text-green-800 border border-green-200'
                          : 'bg-yellow-100 text-yellow-800 border border-yellow-200'
                      }`}>
                        {p.status}
                      </span>
                    </td>
                    
                    {/* SK Sebelum Kegiatan */}
                    <td className="py-4 px-4">
                      {p.sk_url ? (
                        <a href={p.sk_url} target="_blank" rel="noreferrer" className="inline-flex items-center space-x-1 px-3 py-1 bg-green-50 text-green-700 border border-green-200 rounded-xl text-xs font-bold hover:underline shadow-sm">
                          <FileCheck size={14} className="text-green-600" />
                          <span>Lihat SK</span>
                        </a>
                      ) : (
                        <span className="inline-flex items-center space-x-1 px-3 py-1 bg-yellow-50 text-yellow-800 border border-yellow-200 rounded-xl text-xs font-bold shadow-sm">
                          <AlertCircle size={14} className="text-yellow-600" />
                          <span>Wajib Upload SK</span>
                        </span>
                      )}
                    </td>

                    {/* Laporan Setelah Kegiatan */}
                    <td className="py-4 px-4">
                      {p.laporan_url ? (
                        <a href={p.laporan_url} target="_blank" rel="noreferrer" className="inline-flex items-center space-x-1 px-3 py-1 bg-green-50 text-green-700 border border-green-200 rounded-xl text-xs font-bold hover:underline shadow-sm">
                          <FileText size={14} className="text-green-600" />
                          <span>Lihat Laporan</span>
                        </a>
                      ) : p.status === 'Selesai' ? (
                        <span className="inline-flex items-center space-x-1 px-3 py-1 bg-red-50 text-[#E31837] border border-red-200 rounded-xl text-xs font-bold shadow-sm animate-pulse">
                          <AlertCircle size={14} className="text-[#E31837]" />
                          <span>Wajib Upload Laporan!</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center space-x-1 px-3 py-1 bg-gray-50 text-gray-500 border border-gray-200 rounded-xl text-xs font-medium shadow-sm">
                          <Clock size={14} className="text-gray-400" />
                          <span>Menunggu Selesai</span>
                        </span>
                      )}
                    </td>

                    <td className="py-4 px-4">
                      <div className="flex items-center space-x-1 flex-wrap gap-1">
                        <button
                          onClick={() => handleQuickStatus(p.id, 'Belum Dimulai')}
                          className="px-2.5 py-1 bg-yellow-50 hover:bg-yellow-100 text-yellow-700 border border-yellow-200 rounded-xl text-[11px] font-bold transition-colors shadow-sm"
                        >
                          Belum Dimulai
                        </button>
                        <button
                          onClick={() => handleQuickStatus(p.id, 'Berjalan')}
                          className="px-2.5 py-1 bg-green-50 hover:bg-green-100 text-green-700 border border-green-200 rounded-xl text-[11px] font-bold transition-colors shadow-sm"
                        >
                          Berjalan
                        </button>
                        <button
                          onClick={() => handleQuickStatus(p.id, 'Selesai')}
                          className="px-2.5 py-1 bg-red-50 hover:bg-red-100 text-[#E31837] border border-red-200 rounded-xl text-[11px] font-bold transition-colors shadow-sm flex items-center space-x-1"
                        >
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Selesai</span>
                        </button>
                      </div>
                    </td>
                    <td className="py-4 px-4 text-right space-x-2 whitespace-nowrap">
                      <button
                        onClick={() => handleEdit(p)}
                        className="p-2 bg-gray-100 hover:bg-black hover:text-white text-gray-700 rounded-xl transition-colors shadow-sm inline-block"
                        title="Upload SK / Laporan / Edit Proker"
                      >
                        <Upload className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(p.id)}
                        className="p-2 bg-red-50 hover:bg-[#E31837] hover:text-white text-[#E31837] rounded-xl transition-colors shadow-sm inline-block"
                        title="Hapus Proker"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  )
}
