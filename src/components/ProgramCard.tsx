import React from 'react'
import { ExternalLink, Calendar, Layers, CheckCircle2, Clock, PlayCircle } from 'lucide-react'

export interface ProgramWork {
  id: string
  title: string
  division: string
  status: string
  startDate?: string
  endDate?: string
  coverImageUrl: string
  driveFolderUrl: string
}

// Fungsi pembantu cerdas untuk mengonversi URL Google Drive ke Next.js Proxy Route (/api/drive/image?id=ID)
// Hal ini 100% wajib dilakukan karena Google Drive kini memblokir pemuatan langsung (uc?export=view) di tag <img> via CORS/Cookies
export function getDirectDriveImageUrl(url: string): string {
  if (!url) return 'https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=800&q=80'
  
  // Ekstrak ID unik file dari URL Google Drive
  const match = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/) || url.match(/id=([a-zA-Z0-9_-]+)/)
  if (match && match[1]) {
    return `/api/drive/image?id=${match[1]}`
  }
  return url
}

export function ProgramCard({ program }: { program: ProgramWork }) {
  const directImageUrl = getDirectDriveImageUrl(program.coverImageUrl)

  // Menentukan warna dan ikon berdasarkan status
  const getStatusBadge = (status: string) => {
    const s = (status || '').toLowerCase();
    if (s.includes('selesai')) {
      return (
        <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-bold bg-red-100 text-red-800 border border-red-200 shadow-sm">
          <CheckCircle2 className="w-3.5 h-3.5 text-[#E31837]" />
          <span>Selesai</span>
        </span>
      )
    } else if (s.includes('jalan')) {
      return (
        <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-bold bg-green-100 text-green-800 border border-green-200 shadow-sm">
          <PlayCircle className="w-3.5 h-3.5 text-[#008000]" />
          <span>Sedang Berjalan</span>
        </span>
      )
    } else {
      return (
        <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-bold bg-yellow-100 text-yellow-800 border border-yellow-200 shadow-sm">
          <Clock className="w-3.5 h-3.5" />
          <span>Belum Mulai</span>
        </span>
      )
    }
  }

  return (
    <div className="bg-white rounded-3xl overflow-hidden border border-gray-100 shadow-lg hover:shadow-2xl transition-all duration-300 flex flex-col group transform hover:-translate-y-1">
      {/* Container Foto Pratinjau Utama */}
      <div className="relative w-full h-56 overflow-hidden bg-gray-100">
        <div className="absolute inset-0 bg-black/10 group-hover:bg-black/20 transition-colors z-10" />
        <img
          src={directImageUrl}
          alt={program.title}
          className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700 ease-out"
          onError={(e) => {
            // Fallback terakhir jika ID file salah atau file telah terhapus di Drive
            (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=800&q=80';
          }}
        />
        {/* Label Divisi di Atas Foto */}
        <div className="absolute top-4 left-4 z-20">
          <span className="px-3 py-1.5 rounded-xl bg-black/70 backdrop-blur-md text-white font-bold text-xs shadow-md border border-white/20">
            {program.division || 'Divisi Organisasi'}
          </span>
        </div>
        {/* Status Label di Atas Foto */}
        <div className="absolute top-4 right-4 z-20">
          {getStatusBadge(program.status)}
        </div>
      </div>

      {/* Konten Utama Kartu */}
      <div className="p-6 sm:p-8 flex flex-col flex-grow space-y-6 justify-between">
        <div className="space-y-3">
          <h3 className="text-xl font-extrabold text-gray-900 group-hover:text-[#E31837] transition-colors line-clamp-2">
            {program.title}
          </h3>
          {program.startDate && (
            <div className="flex items-center space-x-2 text-sm text-gray-500 font-medium">
              <Calendar className="w-4 h-4 text-gray-400 flex-shrink-0" />
              <span>{program.startDate} {program.endDate ? `— ${program.endDate}` : ''}</span>
            </div>
          )}
        </div>

        {/* Tombol Lihat Dokumentasi Lengkap */}
        <div className="pt-2 border-t border-gray-100">
          <a
            href={program.driveFolderUrl || '#'}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full flex items-center justify-center space-x-2 bg-gray-50 hover:bg-black text-gray-700 hover:text-white font-bold py-3 px-4 rounded-2xl border border-gray-200 hover:border-black transition-all duration-300 group/btn shadow-sm hover:shadow-md"
          >
            <span>Lihat Dokumentasi Lengkap</span>
            <ExternalLink className="w-4 h-4 text-gray-400 group-hover/btn:text-[#FFD700] transition-colors" />
          </a>
        </div>
      </div>
    </div>
  )
}
