'use client'

import React, { useEffect, useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { Plus, CheckCircle2, Clock, PlayCircle, FileText, RefreshCw } from 'lucide-react'
import Link from 'next/link'

interface ProgramItem {
  id: string
  title: string
  description?: string
  division?: string
  division_name?: string
  status: string
  start_date?: string
  end_date?: string
  cover_image_url?: string
  gallery_drive_url?: string
  link_foto_utama?: string
  link_folder_drive?: string
}

export default function DivisiDashboardPage() {
  const [programs, setPrograms] = useState<ProgramItem[]>([])
  const [loading, setLoading] = useState(true)
  const [divisionName, setDivisionName] = useState('Semua Divisi')
  const [userEmail, setUserEmail] = useState('')

  const supabase = createClient()

  useEffect(() => {
    async function loadData() {
      setLoading(true)
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setUserEmail(user.email || '')
        const email = (user.email || '').toLowerCase()
        let divName = 'Umum & Divisi'
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
        const { data: prokerData } = await supabase
          .from('programs')
          .select('*')
          .order('created_at', { ascending: false })

        if (prokerData) {
          // Filter ketat berdasarkan divisi (mendukung kolom division dari Ketua maupun division_name dari Divisi)
          if (keyword) {
            const filtered = prokerData.filter(p => {
              const div = (p.division || p.division_name || '').toLowerCase()
              return div.includes(keyword)
            })
            setPrograms(filtered)
          } else {
            setPrograms(prokerData)
          }
        }
      }
      setLoading(false)
    }

    loadData()
  }, [])

  const totalProker = programs.length
  const selesai = programs.filter(p => p.status === 'Selesai').length
  const berjalan = programs.filter(p => p.status === 'Berjalan' || p.status === 'Sedang Berjalan').length
  const belumMulai = programs.filter(p => p.status === 'Direncanakan' || p.status === 'Belum Dimulai').length

  return (
    <div className="space-y-10 max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
      {/* Header Panel */}
      <section className="bg-black text-white rounded-3xl p-8 sm:p-12 relative overflow-hidden shadow-2xl">
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-[#E31837] via-[#008000] to-[#FFD700]"></div>
        <div className="space-y-4 relative z-10">
          <div className="inline-flex items-center space-x-2 px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-md text-xs font-bold tracking-widest uppercase border border-white/20">
            <span>Bidang: {divisionName}</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight leading-tight">
            Ringkasan Eksekutif Divisi
          </h1>
          <p className="text-gray-300 text-base sm:text-lg max-w-2xl leading-relaxed">
            Selamat datang, <span className="text-[#FFD700] font-bold">{userEmail}</span>. Panel ini didesain khusus untuk mengelola, memantau, dan memperbarui rekapitulasi Program Kerja divisi Anda secara independen.
          </p>
          <div className="pt-4">
            <Link
              href="/dashboard/divisi/proker"
              className="inline-flex items-center space-x-3 px-8 py-4 bg-white text-black hover:bg-[#E31837] hover:text-white font-extrabold rounded-2xl shadow-xl transition-all duration-300 transform hover:-translate-y-1"
            >
              <Plus className="w-5 h-5" />
              <span>Kelola Program Kerja (CRUD)</span>
            </Link>
          </div>
        </div>
      </section>

      {/* Grid Statistik Dinamis */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-md hover:shadow-xl transition-shadow flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-extrabold text-gray-500 uppercase tracking-wider">Total Program</span>
            <div className="w-10 h-10 rounded-2xl bg-gray-100 text-gray-700 flex items-center justify-center font-bold">
              <FileText className="w-5 h-5" />
            </div>
          </div>
          <div className="text-4xl font-extrabold text-gray-900">{totalProker}</div>
          <p className="text-xs text-gray-400">Proker khusus divisi Anda</p>
        </div>

        <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-md hover:shadow-xl transition-shadow flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-extrabold text-gray-500 uppercase tracking-wider">Belum Mulai</span>
            <div className="w-10 h-10 rounded-2xl bg-yellow-50 text-yellow-600 flex items-center justify-center font-bold">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <div className="text-4xl font-extrabold text-yellow-600">{belumMulai}</div>
          <p className="text-xs text-gray-400">Status perencanaan awal</p>
        </div>

        <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-md hover:shadow-xl transition-shadow flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-extrabold text-gray-500 uppercase tracking-wider">Sedang Berjalan</span>
            <div className="w-10 h-10 rounded-2xl bg-green-50 text-[#008000] flex items-center justify-center font-bold">
              <PlayCircle className="w-5 h-5" />
            </div>
          </div>
          <div className="text-4xl font-extrabold text-[#008000]">{berjalan}</div>
          <p className="text-xs text-gray-400">Tahap eksekusi aktif</p>
        </div>

        <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-md hover:shadow-xl transition-shadow flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-extrabold text-gray-500 uppercase tracking-wider">Selesai</span>
            <div className="w-10 h-10 rounded-2xl bg-red-50 text-[#E31837] flex items-center justify-center font-bold">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
          <div className="text-4xl font-extrabold text-[#E31837]">{selesai}</div>
          <p className="text-xs text-gray-400">Dokumentasi & laporan tuntas</p>
        </div>
      </div>

      {/* Daftar Program Terkini */}
      <section className="bg-white border border-gray-100 rounded-3xl p-6 sm:p-8 shadow-md space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-gray-100 pb-4">
          <div>
            <h3 className="text-xl font-extrabold text-gray-900">Program Kerja Terkini Divisi</h3>
            <p className="text-sm text-gray-500">Daftar cepat aktivitas proker yang berada di bawah pengawasan divisi Anda</p>
          </div>
          <Link
            href="/dashboard/divisi/proker"
            className="px-6 py-2.5 bg-black hover:bg-[#E31837] text-white font-bold rounded-xl text-sm transition-colors shadow-sm"
          >
            Kelola Lengkap
          </Link>
        </div>

        {loading ? (
          <div className="p-12 text-center text-gray-400 font-bold flex items-center justify-center space-x-2">
            <RefreshCw className="w-5 h-5 animate-spin" />
            <span>Memuat data proker dari database...</span>
          </div>
        ) : programs.length === 0 ? (
          <div className="p-12 text-center bg-gray-50 rounded-2xl border border-gray-200 space-y-3">
            <FileText className="w-10 h-10 text-gray-300 mx-auto" />
            <h4 className="text-lg font-bold text-gray-700">Belum Ada Program Kerja untuk Divisi Anda</h4>
            <p className="text-sm text-gray-500 max-w-md mx-auto">
              Silakan klik tombol &quot;Kelola Program Kerja (CRUD)&quot; di atas untuk mulai menambahkan data proker pertama divisi Anda.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-200 text-xs font-extrabold text-gray-400 uppercase">
                  <th className="py-4 px-4">Nama Program</th>
                  <th className="py-4 px-4">Divisi</th>
                  <th className="py-4 px-4">Status</th>
                  <th className="py-4 px-4">Tanggal Pelaksanaan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-sm font-medium text-gray-700">
                {programs.slice(0, 5).map((p) => (
                  <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                    <td className="py-4 px-4 font-bold text-gray-900">{p.title}</td>
                    <td className="py-4 px-4">{p.division || p.division_name || '-'}</td>
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
                    <td className="py-4 px-4 text-gray-500">
                      {p.start_date || '-'} s.d {p.end_date || '-'}
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
