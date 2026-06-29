'use client'

import React, { useState, useEffect } from 'react'
import { ProgramCard, ProgramWork } from '@/components/ProgramCard'
import { Layers, Search, Filter, RefreshCw } from 'lucide-react'
import { createClient } from '@/utils/supabase/client'

// Dummy Data Mewakili 4 Wakil Ketua Bidang (Divisi) sebagai Fallback
const dummyPrograms: ProgramWork[] = [
  // 1. Humas & Kerjasama
  {
    id: '1',
    title: 'Pilar Bangsa Strategic Partnership & University Expo 2026',
    division: 'Humas & Kerjasama',
    status: 'Selesai',
    startDate: '10 Jan 2026',
    endDate: '15 Jan 2026',
    coverImageUrl: 'https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=800&q=80',
    driveFolderUrl: 'https://drive.google.com/drive/folders/dummy-folder-humas-1'
  },
  {
    id: '2',
    title: 'Alumni Network Gathering & Mentorship Seri I',
    division: 'Humas & Kerjasama',
    status: 'Sedang Berjalan',
    startDate: '1 Feb 2026',
    endDate: '30 Jul 2026',
    coverImageUrl: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=800&q=80',
    driveFolderUrl: 'https://drive.google.com/drive/folders/dummy-folder-humas-2'
  },
  // 2. Penalaran & Program Kompetisi
  {
    id: '3',
    title: 'Pemusatan Latihan Kompetisi Karya Tulis Ilmiah Tingkat Nasional',
    division: 'Penalaran & Program Kompetisi',
    status: 'Sedang Berjalan',
    startDate: '15 Mar 2026',
    endDate: '15 Mei 2026',
    coverImageUrl: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?auto=format&fit=crop&w=800&q=80',
    driveFolderUrl: 'https://drive.google.com/drive/folders/dummy-folder-penalaran-1'
  },
  {
    id: '4',
    title: 'Olimpiade Debat Mahasiswa Universitas & Kritis Kebebasan',
    division: 'Penalaran & Program Kompetisi',
    status: 'Belum Mulai',
    startDate: '10 Jun 2026',
    endDate: '20 Jun 2026',
    coverImageUrl: 'https://images.unsplash.com/photo-1543269865-cbf427effbad?auto=format&fit=crop&w=800&q=80',
    driveFolderUrl: 'https://drive.google.com/drive/folders/dummy-folder-penalaran-2'
  },
  // 3. Riset & Penelitian
  {
    id: '5',
    title: 'Riset Indeks Kesejahteraan Mahasiswa & Evaluasi Transparansi Kampus',
    division: 'Riset & Penelitian',
    status: 'Selesai',
    startDate: '1 Feb 2026',
    endDate: '28 Feb 2026',
    coverImageUrl: 'https://images.unsplash.com/photo-1531482615713-2afd69097998?auto=format&fit=crop&w=800&q=80',
    driveFolderUrl: 'https://drive.google.com/drive/folders/dummy-folder-riset-1'
  },
  {
    id: '6',
    title: 'Pengembangan Prototype Platform Edukasi Pilar Bangsa AI',
    division: 'Riset & Penelitian',
    status: 'Sedang Berjalan',
    startDate: '1 Mar 2026',
    endDate: '31 Agu 2026',
    coverImageUrl: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=800&q=80',
    driveFolderUrl: 'https://drive.google.com/drive/folders/dummy-folder-riset-2'
  },
  // 4. Pengabdian & Advokasi
  {
    id: '7',
    title: 'Pilar Bangsa Mengajar: Bakti Pendidikan untuk Sekolah Terluar',
    division: 'Pengabdian & Advokasi',
    status: 'Selesai',
    startDate: '5 Jan 2026',
    endDate: '25 Jan 2026',
    coverImageUrl: 'https://images.unsplash.com/photo-1517486808906-697b691ed59b?auto=format&fit=crop&w=800&q=80',
    driveFolderUrl: 'https://drive.google.com/drive/folders/dummy-folder-pengabdian-1'
  },
  {
    id: '8',
    title: 'Posko Advokasi UKT & Klinik Layanan Terpadu Kesejahteraan Mahasiswa',
    division: 'Pengabdian & Advokasi',
    status: 'Sedang Berjalan',
    startDate: '1 Jan 2026',
    endDate: '31 Des 2026',
    coverImageUrl: 'https://images.unsplash.com/photo-1509062522246-3755977927d7?auto=format&fit=crop&w=800&q=80',
    driveFolderUrl: 'https://drive.google.com/drive/folders/dummy-folder-pengabdian-2'
  }
]

const divisions = [
  'Semua Divisi',
  'Humas & Kerjasama',
  'Penalaran & Program Kompetisi',
  'Riset & Penelitian',
  'Pengabdian & Advokasi'
]

const statuses = ['Semua Status', 'Belum Mulai', 'Sedang Berjalan', 'Selesai']

export default function ProgramKerjaPage() {
  const [selectedDivision, setSelectedDivision] = useState('Semua Divisi')
  const [selectedStatus, setSelectedStatus] = useState('Semua Status')
  const [searchQuery, setSearchQuery] = useState('')
  const [programs, setPrograms] = useState<ProgramWork[]>(dummyPrograms)
  const [loading, setLoading] = useState(true)

  const supabase = createClient()

  useEffect(() => {
    async function fetchDatabasePrograms() {
      setLoading(true)
      const { data, error } = await supabase
        .from('programs')
        .select('*')
        .order('created_at', { ascending: false })

      if (!error && data && data.length > 0) {
        const livePrograms: ProgramWork[] = data.map((p: any) => {
          let desc = p.description || '';
          let cover = p.cover_image_url || p.link_foto_utama || '';
          let gallery = p.gallery_drive_url || p.link_folder_drive || '';

          const coverMatch = desc.match(/\[COVER_URL\]:\s*([^\n\r]+)/);
          if (coverMatch && coverMatch[1]) cover = coverMatch[1].trim();

          const galleryMatch = desc.match(/\[GALLERY_URL\]:\s*([^\n\r]+)/);
          if (galleryMatch && galleryMatch[1]) gallery = galleryMatch[1].trim();

          return {
            id: p.id,
            title: p.title || 'Program Kerja',
            division: p.division || p.division_name || 'Humas & Kerjasama',
            status: p.status || 'Belum Mulai',
            startDate: p.start_date || '',
            endDate: p.end_date || '',
            coverImageUrl: cover || 'https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=800&q=80',
            driveFolderUrl: gallery || 'https://drive.google.com'
          }
        })
        setPrograms(livePrograms)
      } else {
        setPrograms(dummyPrograms)
      }
      setLoading(false)
    }

    fetchDatabasePrograms()
  }, [])

  // Filter Programs
  const filteredPrograms = programs.filter((program) => {
    const matchDivision = selectedDivision === 'Semua Divisi' || (program.division && program.division.toLowerCase().includes(selectedDivision.toLowerCase()))
    
    let matchStatus = true;
    if (selectedStatus !== 'Semua Status') {
      const pStat = (program.status || '').toLowerCase();
      const sStat = selectedStatus.toLowerCase();
      if (sStat === 'belum mulai') {
        matchStatus = pStat.includes('belum');
      } else if (sStat === 'sedang berjalan') {
        matchStatus = pStat.includes('jalan');
      } else if (sStat === 'selesai') {
        matchStatus = pStat.includes('selesai');
      }
    }

    const matchSearch = (program.title || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                        (program.division || '').toLowerCase().includes(searchQuery.toLowerCase())
    return matchDivision && matchStatus && matchSearch
  })

  return (
    <div className="space-y-16 py-8">
      {/* Header Section */}
      <section className="bg-black text-white rounded-3xl p-12 md:p-16 relative overflow-hidden shadow-2xl text-center">
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-[#E31837] via-[#008000] to-[#FFD700]"></div>
        <div className="max-w-4xl mx-auto space-y-6 relative z-10">
          <div className="inline-flex items-center space-x-2 px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-md text-xs md:text-sm font-bold tracking-widest uppercase border border-white/20">
            <span>Portal Transparansi Organisasi</span>
          </div>
          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight leading-tight">
            Katalog Lengkap Program Kerja
          </h1>
          <p className="text-lg sm:text-2xl text-gray-300 max-w-2xl mx-auto leading-relaxed">
            Pantau secara langsung perkembangan aktivitas, jadwal pelaksanaan, dan akses seluruh bukti dokumentasi dari 4 Wakil Ketua Bidang.
          </p>
        </div>
      </section>

      {/* Filter & Search Bar Section */}
      <section className="bg-gray-50 border border-gray-100 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          {/* Search Input */}
          <div className="relative w-full md:w-96">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Cari nama proker atau divisi..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-white border border-gray-200 rounded-2xl text-gray-800 font-medium focus:outline-none focus:ring-2 focus:ring-black shadow-sm transition-all"
            />
          </div>

          {/* Status Select / Buttons */}
          <div className="flex items-center space-x-2 w-full md:w-auto overflow-x-auto pb-2 md:pb-0">
            <span className="text-xs font-extrabold text-gray-400 uppercase tracking-widest px-2 hidden lg:inline">Status:</span>
            {statuses.map((status) => (
              <button
                key={status}
                onClick={() => setSelectedStatus(status)}
                className={`px-4 py-2.5 rounded-2xl text-sm font-bold transition-all whitespace-nowrap shadow-sm ${
                  selectedStatus === status
                    ? 'bg-black text-white shadow-md'
                    : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-100'
                }`}
              >
                {status}
              </button>
            ))}
          </div>
        </div>

        {/* Division Filter Tabs */}
        <div className="border-t border-gray-200 pt-6">
          <div className="flex items-center gap-2 overflow-x-auto pb-2">
            <span className="text-xs font-extrabold text-gray-400 uppercase tracking-widest px-2 hidden lg:inline">Divisi:</span>
            {divisions.map((division) => (
              <button
                key={division}
                onClick={() => setSelectedDivision(division)}
                className={`px-5 py-3 rounded-2xl text-sm font-extrabold transition-all whitespace-nowrap shadow-sm ${
                  selectedDivision === division
                    ? 'bg-[#E31837] text-white shadow-lg shadow-red-500/20'
                    : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-100'
                }`}
              >
                {division}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Program Work Grid Section */}
      {loading ? (
        <div className="p-16 text-center text-gray-400 font-bold flex items-center justify-center space-x-2">
          <RefreshCw className="w-6 h-6 animate-spin" />
          <span>Memuat data program kerja langsung dari Supabase...</span>
        </div>
      ) : filteredPrograms.length === 0 ? (
        <div className="bg-white border border-gray-100 rounded-3xl p-16 text-center shadow-sm space-y-4">
          <Filter className="w-12 h-12 text-gray-300 mx-auto" />
          <h3 className="text-2xl font-bold text-gray-800">Tidak Ada Program Kerja Ditemukan</h3>
          <p className="text-gray-500 max-w-md mx-auto">
            Tidak ada program kerja yang cocok dengan filter atau kata kunci pencarian Anda. Silakan atur ulang kriteria pencarian.
          </p>
          <button
            onClick={() => {
              setSelectedDivision('Semua Divisi')
              setSelectedStatus('Semua Status')
              setSearchQuery('')
            }}
            className="inline-flex items-center space-x-2 px-6 py-3 bg-black text-white font-bold rounded-2xl shadow hover:bg-gray-800 transition-all"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Atur Ulang Filter</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredPrograms.map((program) => (
            <ProgramCard key={program.id} program={program} />
          ))}
        </div>
      )}

      {/* Catatan Panduan Transparansi */}
      <section className="bg-gradient-to-r from-gray-900 to-black text-white rounded-3xl p-8 sm:p-12 shadow-xl flex flex-col md:flex-row items-center justify-between gap-8 border-l-8 border-[#FFD700]">
        <div className="space-y-3 max-w-2xl">
          <h3 className="text-2xl font-extrabold tracking-tight">Menjaga Amanah AD/ART Pasal 10</h3>
          <p className="text-gray-300 text-sm sm:text-base leading-relaxed">
            Setiap akhir kegiatan, 4 Wakil Ketua Bidang diwajibkan memperbarui status program kerja dan mengunggah dokumentasi ke dalam folder Google Drive resmi organisasi untuk menjamin transparansi akuntabilitas publik.
          </p>
        </div>
        <div className="flex-shrink-0">
          <a
            href="/login"
            className="px-8 py-4 bg-white text-black font-extrabold rounded-2xl shadow-xl hover:bg-gray-100 transition-all duration-300 inline-block hover:-translate-y-1"
          >
            Akses Panel Admin Divisi
          </a>
        </div>
      </section>
    </div>
  )
}
