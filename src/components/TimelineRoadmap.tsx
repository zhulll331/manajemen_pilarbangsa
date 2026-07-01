'use client'

import React, { useState, useEffect } from 'react'
import { Calendar, Clock, CalendarPlus, Flag, AlertCircle, RefreshCw } from 'lucide-react'
import { createClient } from '@/utils/supabase/client'

// Dummy Data Acara (Roadmap Satu Periode Penuh 2026-2027) sebagai Fallback
const dummyEvents = [
  {
    id: '1',
    title: 'Pilar Strategic Partnership & Gathering',
    date: '2026-07-15',
    time: '09:00',
    division: 'Humas & Kerjasama',
    description: 'Penggalangan kemitraan strategis bersama universitas, media, dan instansi korporat untuk pendanaan dan kolaborasi kegiatan.'
  },
  {
    id: '2',
    title: 'Olimpiade Pemikiran Kritis Mahasiswa',
    date: '2026-08-22',
    time: '08:30',
    division: 'Penalaran & Program Kompetisi',
    description: 'Ajang kompetisi debat dan penulisan esai tingkat nasional guna mengasah ketajaman bernalar para mahasiswa.'
  },
  {
    id: '3',
    title: 'Simposium Riset & Teknologi Terapan',
    date: '2026-09-14',
    time: '10:00',
    division: 'Riset & Penelitian',
    description: 'Deseminasi hasil penelitian mahasiswa terkait pengembangan teknologi tepat guna bagi masyarakat pedesaan.'
  },
  {
    id: '4',
    title: 'Pilar Mengajar & Desa Binaan Ke-1',
    date: '2026-10-10',
    time: '07:00',
    division: 'Pengabdian & Advokasi',
    description: 'Penerjunan relawan pengajar ke sekolah-sekolah di pelosok daerah guna memperkuat inklusivitas pendidikan dasar.'
  },
  {
    id: '5',
    title: 'Media & Alumni Network Connect',
    date: '2026-11-20',
    time: '13:30',
    division: 'Humas & Kerjasama',
    description: 'Pembangunan relasi berkelanjutan bersama jaringan alumni UKM Pilar Bangsa guna pendampingan karir dan beasiswa.'
  },
  {
    id: '6',
    title: 'Kompetisi Rancangan Bisnis Digital',
    date: '2026-12-12',
    time: '09:00',
    division: 'Penalaran & Program Kompetisi',
    description: 'Kompetisi merancang solusi bisnis digital masa depan dengan menghadirkan para juri dari ekosistem startup.'
  },
  {
    id: '7',
    title: 'Penyusunan Indeks Kesejahteraan Mahasiswa',
    date: '2027-01-18',
    time: '14:00',
    division: 'Riset & Penelitian',
    description: 'Pengumpulan data survei independen untuk mengukur kepuasan dan kesejahteraan mahasiswa di lingkungan kampus.'
  },
  {
    id: '8',
    title: 'Advokasi Biaya Pendidikan & Beasiswa',
    date: '2027-02-25',
    time: '15:00',
    division: 'Pengabdian & Advokasi',
    description: 'Pendampingan hukum dan konsultasi beasiswa bagi mahasiswa yang mengalami kendala finansial dalam perkuliahan.'
  },
  {
    id: '9',
    title: 'Pilar Bangsa International Public Lecture',
    date: '2027-03-20',
    time: '09:00',
    division: 'Humas & Kerjasama',
    description: 'Kuliah umum internasional secara hybrid dengan menghadirkan narasumber profesor terkemuka dari universitas dunia.'
  },
  {
    id: '10',
    title: 'Hackathon Inovasi Sosial 24 Jam',
    date: '2027-04-15',
    time: '08:00',
    division: 'Penalaran & Program Kompetisi',
    description: 'Pembuatan solusi inovatif kemasyarakatan dalam ajang maraton pemrograman dan perancangan ide selama 24 jam penuh.'
  },
  {
    id: '11',
    title: 'Pameran Prototipe Hasil Penelitian',
    date: '2027-05-12',
    time: '11:00',
    division: 'Riset & Penelitian',
    description: 'Gelar pameran terbuka di aula utama kampus untuk mempublikasikan prototipe alat riset karya tim peneliti mahasiswa.'
  },
  {
    id: '12',
    title: 'Bakti Sosial Akbar Akhir Periode',
    date: '2027-06-25',
    time: '08:00',
    division: 'Pengabdian & Advokasi',
    description: 'Kegiatan bakti sosial puncak berupa layanan kesehatan gratis dan pembagian paket sembako di desa binaan Pilar Bangsa.'
  }
]

const divisionsList = [
  'Semua',
  'Humas & Kerjasama',
  'Penalaran & Program Kompetisi',
  'Riset & Penelitian',
  'Pengabdian & Advokasi'
]

const monthsList = [
  'Satu Periode Penuh',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni'
]

const monthMap: Record<string, string> = {
  'Juli': '07', 'Agustus': '08', 'September': '09', 'Oktober': '10', 'November': '11', 'Desember': '12',
  'Januari': '01', 'Februari': '02', 'Maret': '03', 'April': '04', 'Mei': '05', 'Juni': '06'
}

// Fungsi pembantu untuk meng-generate tautan Google Calendar Event Template
function generateGoogleCalendarUrl(event: { title: string; date: string; time: string; description: string; division: string }) {
  const cleanDate = event.date.replace(/-/g, '')
  const cleanTime = event.time.replace(/:/g, '') + '00'
  const startDateTime = `${cleanDate}T${cleanTime}`
  
  // Asumsi durasi default 2 jam
  const [hour, min] = event.time.split(':').map(Number)
  const endHour = String((hour + 2) % 24).padStart(2, '0')
  const endDateTime = `${cleanDate}T${endHour}${min}00`

  const details = `${event.description}\n\nDivisi Pelaksana: ${event.division}\n\nDipublikasikan secara resmi oleh UKM Pilar Bangsa`

  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: event.title,
    dates: `${startDateTime}/${endDateTime}`,
    details: details,
    location: 'Sekretariat UKM Pilar Bangsa & Lokasi Kegiatan',
  })

  return `https://calendar.google.com/calendar/render?${params.toString()}`
}

// Helper untuk format tanggal estetik (ID)
function formatDateIndo(dateStr: string) {
  if (!dateStr || !dateStr.includes('-')) return dateStr
  const parts = dateStr.split('-')
  const year = parts[0]
  const monthNum = parts[1]
  const day = parts[2]
  const monthsIndo = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember']
  const monthName = monthsIndo[parseInt(monthNum, 10) - 1] || 'Bulan'
  return `${day} ${monthName} ${year}`
}

// Helper warna badge divisi
function getDivisionBadgeClass(division: string) {
  const d = (division || '').toLowerCase()
  if (d.includes('humas')) return 'bg-blue-50 text-blue-700 border-blue-200'
  if (d.includes('penalaran')) return 'bg-purple-50 text-purple-700 border-purple-200'
  if (d.includes('riset')) return 'bg-amber-50 text-amber-700 border-amber-200'
  return 'bg-green-50 text-green-700 border-green-200'
}

export function TimelineRoadmap() {
  const [divisionFilter, setDivisionFilter] = useState('Semua')
  const [monthFilter, setMonthFilter] = useState('Satu Periode Penuh')
  const [events, setEvents] = useState(dummyEvents)
  const [loading, setLoading] = useState(true)

  const supabase = createClient()

  useEffect(() => {
    async function fetchLivePrograms() {
      setLoading(true)
      const { data, error } = await supabase
        .from('programs')
        .select('*')
        .order('start_date', { ascending: true })

      if (!error && data && data.length > 0) {
        const liveEvents = data.map((p: any) => {
          let desc = p.description || ''
          // Bersihkan deskripsi murni dari block metadata [COVER_URL] dll
          const cleanDesc = desc.split('---')[0].replace(/\[COVER_URL\]:[\s\S]*/, '').trim()

          // Gunakan start_date atau fallback ke format YYYY-MM-DD standar
          const dateStr = p.start_date || '2026-07-15'

          return {
            id: p.id,
            title: p.title || 'Program Kerja Organisasi',
            date: dateStr,
            time: '09:00', // Waktu standar pelaksanaan kegiatan
            division: p.division || p.division_name || 'Humas & Kerjasama',
            description: cleanDesc || 'Pelaksanaan program kerja unggulan divisi dalam rangka meningkatkan kapasitas kelembagaan UKM Pilar Bangsa.'
          }
        })
        setEvents(liveEvents)
      } else {
        setEvents(dummyEvents)
      }
      setLoading(false)
    }

    fetchLivePrograms()
  }, [])

  // Filter logika
  const filteredEvents = events.filter(event => {
    if (divisionFilter !== 'Semua' && event.division !== divisionFilter) {
      return false
    }
    if (monthFilter !== 'Satu Periode Penuh') {
      const parts = (event.date || '').split('-')
      const monthNumber = parts[1]
      if (monthNumber !== monthMap[monthFilter]) {
        return false
      }
    }
    return true
  })

  return (
    <section className="bg-white border border-gray-100 rounded-3xl p-6 sm:p-12 shadow-xl my-16 space-y-12 relative overflow-hidden">
      {/* Latar Belakang Eksklusif */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-[radial-gradient(#E31837_1px,transparent_1px)] [background-size:20px_20px] opacity-5 pointer-events-none" />
      
      {/* Judul & Kontrol Filter */}
      <div className="max-w-4xl mx-auto text-center space-y-8 relative z-10">
        <div className="inline-flex items-center space-x-2 px-4 py-1.5 rounded-full bg-black text-white text-xs sm:text-sm font-extrabold tracking-wider uppercase shadow-md">
          <Flag className="w-4 h-4 text-[#FFD700]" />
          <span>Timeline Kegiatan Organisasi</span>
        </div>

        <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-gray-900 tracking-tight">
          Perjalanan Kami: Periode 2026-2027
        </h2>

        <p className="text-base sm:text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed">
          Peta jalan (*roadmap*) pelaksanaan seluruh program kerja unggulan UKM Pilar Bangsa selama satu periode kepengurusan penuh yang terhubung langsung secara real-time dengan database.
        </p>

        {/* Barisan Kontrol Filter */}
        <div className="pt-4 flex flex-col items-center space-y-6 border-t border-gray-100">
          {/* 1. Filter Divisi (Pill Buttons) */}
          <div className="flex flex-wrap justify-center gap-2">
            {divisionsList.map((div) => (
              <button
                key={div}
                onClick={() => setDivisionFilter(div)}
                className={`px-4 py-2.5 rounded-full text-xs sm:text-sm font-extrabold transition-all duration-300 shadow-sm ${
                  divisionFilter === div
                    ? 'bg-black text-white shadow-lg transform scale-105'
                    : 'bg-gray-50 text-gray-600 hover:bg-gray-100 border border-gray-200'
                }`}
              >
                {div}
              </button>
            ))}
          </div>

          {/* 2. Filter Waktu (Dropdown/Select) */}
          <div className="w-full max-w-xs flex flex-col items-center space-y-2">
            <label className="text-xs font-bold text-gray-500 uppercase tracking-widest flex items-center space-x-1">
              <Calendar className="w-3.5 h-3.5 text-[#E31837]" />
              <span>Filter Berdasarkan Waktu</span>
            </label>
            <select
              value={monthFilter}
              onChange={(e) => setMonthFilter(e.target.value)}
              className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-2xl text-gray-900 font-bold focus:outline-none focus:ring-2 focus:ring-black shadow-sm text-center cursor-pointer appearance-none bg-no-repeat bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20width%3D%2212%22%20height%3D%2212%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%2020%2020%22%20fill%3D%22currentColor%22%3E%3Cpath%20fill-rule%3D%22evenodd%22%20d%3D%22M5.293%207.293a1%201%200%20011.414%200L10%2010.586l3.293-3.293a1%201%200%20111.414%201.414l-4%204a1%201%200%2001-1.414%200l-4-4a1%201%200%20010-1.414z%22%20clip-rule%3D%22evenodd%22%2F%3E%3C%2Fsvg%3E')] bg-[position:right_16px_center]"
            >
              {monthsList.map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Tampilan Loading */}
      {loading ? (
        <div className="p-16 text-center text-gray-400 font-bold flex items-center justify-center space-x-2">
          <RefreshCw className="w-6 h-6 animate-spin text-[#E31837]" />
          <span>Memuat data roadmap program kerja langsung dari Supabase...</span>
        </div>
      ) : filteredEvents.length === 0 ? (
        <div className="p-12 text-center bg-gray-50 rounded-3xl border border-gray-200 space-y-3 max-w-xl mx-auto">
          <AlertCircle className="w-12 h-12 text-gray-300 mx-auto" />
          <h4 className="font-bold text-gray-800 text-lg">Tidak Ada Kegiatan</h4>
          <p className="text-gray-500 text-sm">
            Tidak ada program kerja untuk kombinasi filter Divisi ({divisionFilter}) dan Bulan ({monthFilter}). Silakan pilih filter lainnya.
          </p>
        </div>
      ) : (
        <div className="relative pt-8">
          
          {/* Timeline Horizontal Scrollable */}
          <div className="block overflow-x-auto pb-8 pt-2 px-4 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
            <div className="flex space-x-6 md:space-x-8 w-max min-w-full items-center justify-start py-4 px-4 relative">
              
              {/* Garis Memanjang Utama */}
              <div className="absolute inset-x-0 top-[210px] h-1.5 bg-gradient-to-r from-gray-200 via-black to-gray-200 z-0" />

              {filteredEvents.map((event, index) => {
                const isEven = index % 2 === 0
                const calUrl = generateGoogleCalendarUrl(event)
                const badgeClass = getDivisionBadgeClass(event.division)

                return (
                  <div key={event.id} className="flex-shrink-0 w-[260px] md:w-72 h-[420px] flex flex-col justify-between relative z-10">
                    
                    {/* SLIDE ATAS: Jika Node Genap (0, 2, 4), isi card di sini */}
                    <div className="h-[190px] flex flex-col justify-end">
                      {isEven && (
                        <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-xl hover:shadow-2xl transition-all duration-300 flex flex-col space-y-3 relative group transform hover:-translate-y-1">
                          <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[10px] border-l-transparent border-r-[10px] border-r-transparent border-t-[10px] border-t-black"></div>
                          
                          <div className="flex items-center justify-between">
                            <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold border ${badgeClass}`}>
                              {event.division}
                            </span>
                            <span className="text-[10px] font-black text-gray-400">#{index + 1}</span>
                          </div>

                          <h3 className="font-extrabold text-sm md:text-base text-gray-900 group-hover:text-[#E31837] transition-colors line-clamp-2 leading-snug">
                            {event.title}
                          </h3>

                          <div className="flex items-center space-x-3 text-[10px] md:text-xs text-gray-500 font-bold border-y border-gray-100 py-1.5">
                            <div className="flex items-center space-x-1">
                              <Calendar className="w-3 h-3 text-gray-400" />
                              <span>{formatDateIndo(event.date)}</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <Clock className="w-3 h-3 text-gray-400" />
                              <span>{event.time}</span>
                            </div>
                          </div>

                          <p className="text-[10px] md:text-xs text-gray-600 line-clamp-2 leading-relaxed">
                            {event.description}
                          </p>

                          {/* Integrasi Kalender */}
                          <div className="pt-1">
                            <a
                              href={calUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="w-full flex items-center justify-center space-x-1.5 bg-gray-50 hover:bg-black text-gray-700 hover:text-white border border-gray-200 hover:border-black font-bold py-1.5 px-3 rounded-lg text-[10px] md:text-xs transition-all shadow-sm group/btn"
                            >
                              <CalendarPlus className="w-3 h-3 text-gray-400 group-hover/btn:text-[#FFD700] transition-colors" />
                              <span>Simpan</span>
                            </a>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* TITIK TENGAH (Node) */}
                    <div className="h-[40px] flex items-center justify-center relative">
                      <div className="w-8 h-8 rounded-full bg-black border-[4px] border-white shadow-md flex items-center justify-center z-20 group-hover:scale-110 transition-transform duration-300">
                        <div className="w-2 h-2 rounded-full bg-[#FFD700]"></div>
                      </div>
                    </div>

                    {/* SLIDE BAWAH: Jika Node Ganjil (1, 3, 5), isi card di sini */}
                    <div className="h-[190px] flex flex-col justify-start">
                      {!isEven && (
                        <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-xl hover:shadow-2xl transition-all duration-300 flex flex-col space-y-3 relative group transform hover:translate-y-1 mt-2">
                          <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[10px] border-l-transparent border-r-[10px] border-r-transparent border-b-[10px] border-b-black"></div>
                          
                          <div className="flex items-center justify-between">
                            <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold border ${badgeClass}`}>
                              {event.division}
                            </span>
                            <span className="text-[10px] font-black text-gray-400">#{index + 1}</span>
                          </div>

                          <h3 className="font-extrabold text-sm md:text-base text-gray-900 group-hover:text-[#E31837] transition-colors line-clamp-2 leading-snug">
                            {event.title}
                          </h3>

                          <div className="flex items-center space-x-3 text-[10px] md:text-xs text-gray-500 font-bold border-y border-gray-100 py-1.5">
                            <div className="flex items-center space-x-1">
                              <Calendar className="w-3 h-3 text-gray-400" />
                              <span>{formatDateIndo(event.date)}</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <Clock className="w-3 h-3 text-gray-400" />
                              <span>{event.time}</span>
                            </div>
                          </div>

                          <p className="text-[10px] md:text-xs text-gray-600 line-clamp-2 leading-relaxed">
                            {event.description}
                          </p>

                          {/* Integrasi Kalender */}
                          <div className="pt-1">
                            <a
                              href={calUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="w-full flex items-center justify-center space-x-1.5 bg-gray-50 hover:bg-black text-gray-700 hover:text-white border border-gray-200 hover:border-black font-bold py-1.5 px-3 rounded-lg text-[10px] md:text-xs transition-all shadow-sm group/btn"
                            >
                              <CalendarPlus className="w-3 h-3 text-gray-400 group-hover/btn:text-[#FFD700] transition-colors" />
                              <span>Simpan</span>
                            </a>
                          </div>
                        </div>
                      )}
                    </div>

                  </div>
                )
              })}
            </div>
          </div>

        </div>
      )}
    </section>
  )
}
