'use client'

import React, { useRef } from 'react'
import Image from 'next/image'
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react'

interface StrukturData {
  pembina: {
    nama: string
    jabatan: string
    ig: string
    link: string
    foto: string
  }
  ketuaUmum: {
    id: string
    nama: string
    periode: string
    jabatan: string
    ig: string
    link: string
    foto: string
  }[]
}

interface StrukturPimpinanProps {
  initialData?: StrukturData | null
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
}

export function StrukturPimpinan({ initialData }: StrukturPimpinanProps) {
  const scrollRef = useRef<HTMLDivElement>(null)
  
  const data = initialData || defaultStruktur
  const pembina = data.pembina
  const ketuaUmum = data.ketuaUmum
  
  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const { current } = scrollRef
      const scrollAmount = direction === 'left' ? -350 : 350
      current.scrollBy({ left: scrollAmount, behavior: 'smooth' })
    }
  }

  return (
    <div className="bg-[#111111] rounded-[2.5rem] py-16 px-6 sm:px-12 shadow-2xl relative overflow-hidden border border-white/5 my-16">
      {/* Background Gradient Effect */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[300px] bg-gradient-to-b from-white/10 to-transparent blur-3xl pointer-events-none rounded-full opacity-50"></div>
      
      <div className="relative z-10 max-w-7xl mx-auto space-y-16">
        
        {/* Header Section */}
        <div className="text-center sm:text-left flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="space-y-2">
            <h2 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight">
              Tokoh & Pemimpin
            </h2>
            <p className="text-gray-400 text-sm md:text-base max-w-xl">
              Mengenal lebih dekat para penggerak dan pemimpin UKM Pilar Bangsa yang telah berdedikasi membangun organisasi.
            </p>
          </div>
        </div>

        {/* Pembina Section (Highlight) */}
        <div className="flex flex-col md:flex-row items-center gap-8 bg-white/5 border border-white/10 rounded-3xl p-6 md:p-10 backdrop-blur-md">
          <div className="w-40 h-40 md:w-56 md:h-56 rounded-2xl overflow-hidden relative shadow-2xl flex-shrink-0 border-2 border-white/10">
            <Image 
              src={convertGoogleDriveUrl(pembina.foto)} 
              alt={pembina.nama}
              fill
              className="object-cover"
              sizes="(max-w-768px) 160px, 224px"
            />
            {/* Overlay Gradient */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
          </div>
          <div className="flex flex-col justify-center space-y-4 text-center md:text-left">
            <div className="inline-block px-4 py-1.5 rounded-full bg-[#E31837]/20 border border-[#E31837]/30 text-[#E31837] text-xs font-black tracking-widest uppercase self-center md:self-start">
              {pembina.jabatan}
            </div>
            <div>
              <h3 className="text-2xl md:text-4xl font-black text-white tracking-tight mb-2">
                {pembina.nama}
              </h3>
              <p className="text-gray-400 text-sm md:text-base">
                Beliau senantiasa membimbing, mengarahkan, serta menginspirasi seluruh mahasiswa agar dapat menjalankan Tri Dharma Perguruan Tinggi dengan semangat kebangsaan yang tinggi.
              </p>
            </div>
            <div className="pt-2">
              <a 
                href={pembina.link}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center space-x-2 bg-white text-black px-6 py-2.5 rounded-full font-bold text-sm hover:bg-gray-200 transition-colors"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
                  <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
                  <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
                </svg>
                <span>Follow {pembina.ig}</span>
              </a>
            </div>
          </div>
        </div>

        <hr className="border-white/10" />

        {/* Carousel Ketua Umum */}
        <div className="space-y-8">
          <div className="flex items-end justify-between">
            <div className="space-y-1">
              <h3 className="text-2xl font-bold text-white tracking-tight">Ketua Umum dari Masa ke Masa</h3>
              <p className="text-gray-400 text-sm">Menjaga nyala api semangat estafet kepemimpinan.</p>
            </div>
            <div className="hidden sm:flex items-center space-x-3">
              <button 
                onClick={() => scroll('left')}
                className="w-10 h-10 rounded-full bg-white/10 text-white flex items-center justify-center hover:bg-white/20 transition-colors backdrop-blur-md"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button 
                onClick={() => scroll('right')}
                className="w-10 h-10 rounded-full bg-white/10 text-white flex items-center justify-center hover:bg-white/20 transition-colors backdrop-blur-md"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div 
            ref={scrollRef}
            className="flex overflow-x-auto gap-6 pb-8 snap-x snap-mandatory hide-scrollbar"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {ketuaUmum.map((tokoh, idx) => (
              <div 
                key={idx} 
                className="relative w-[280px] h-[400px] flex-shrink-0 snap-center rounded-3xl overflow-hidden group border border-white/10 shadow-xl bg-[#1A1A1A]"
              >
                {/* Image */}
                <Image 
                  src={convertGoogleDriveUrl(tokoh.foto)} 
                  alt={tokoh.nama}
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-110"
                  sizes="280px"
                />
                
                {/* Top Badge (Jabatan) */}
                <div className="absolute top-4 left-4 z-20">
                  <span className="px-3 py-1 bg-black/50 backdrop-blur-md text-white/90 text-[10px] font-bold uppercase tracking-wider rounded-lg border border-white/10">
                    {tokoh.jabatan}
                  </span>
                </div>

                {/* Dark Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent z-10 opacity-90 group-hover:opacity-100 transition-opacity"></div>

                {/* Content Details */}
                <div className="absolute bottom-0 left-0 w-full p-6 z-20 flex flex-col justify-end h-full">
                  
                  {/* Name and Period */}
                  <div className="mb-4 transform translate-y-2 group-hover:translate-y-0 transition-transform duration-300">
                    <h4 className="text-2xl font-extrabold text-white leading-tight mb-1">
                      {tokoh.nama}
                    </h4>
                    <div className="flex items-center space-x-1.5 text-gray-300">
                      <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center">
                        <Calendar className="w-3 h-3 text-white" />
                      </div>
                      <span className="text-xs font-bold uppercase tracking-widest text-white/80">{tokoh.periode}</span>
                    </div>
                  </div>

                  {/* Connect / Instagram Row */}
                  <div className="flex items-center justify-between pt-4 border-t border-white/10 opacity-0 group-hover:opacity-100 transform translate-y-4 group-hover:translate-y-0 transition-all duration-300">
                    <div className="flex items-center space-x-2">
                      <div className="w-8 h-8 rounded-full overflow-hidden bg-gray-800 relative">
                        <Image 
                          src={convertGoogleDriveUrl(tokoh.foto)}
                          alt={tokoh.ig}
                          fill
                          className="object-cover"
                        />
                      </div>
                      <span className="text-white text-xs font-medium">{tokoh.ig}</span>
                    </div>
                    <a 
                      href={tokoh.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bg-white text-black text-xs font-bold px-4 py-2 rounded-full hover:bg-gray-200 transition-colors"
                    >
                      Connect
                    </a>
                  </div>

                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Global Style for hiding scrollbar */}
      <style dangerouslySetInnerHTML={{__html: `
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
      `}} />
    </div>
  )
}
