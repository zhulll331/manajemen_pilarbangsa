import React from 'react';
import { ExternalLink, Calendar, CheckCircle2, Clock, PlayCircle } from 'lucide-react';

export interface ProgramWork {
  id: string;
  title: string;
  division: string;
  status: string;
  startDate?: string;
  endDate?: string;
  coverImageUrl: string;
  driveFolderUrl: string;
}

export function getDirectDriveImageUrl(url: string): string {
  if (!url) {
    return 'https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=800&q=80';
  }

  const match = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/) || url.match(/id=([a-zA-Z0-9_-]+)/);
  if (match && match[1]) {
    return `/api/drive/image?id=${match[1]}`;
  }
  return url;
}

export function ProgramCard({ program }: { program: ProgramWork }) {
  const directImageUrl = getDirectDriveImageUrl(program.coverImageUrl);

  const getStatusBadge = (status: string) => {
    const s = (status || '').toLowerCase();
    if (s.includes('selesai')) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-xs font-bold bg-red-50 text-[#E31837] border border-red-200">
          <CheckCircle2 className="w-3.5 h-3.5" aria-hidden="true" />
          <span>Selesai</span>
        </span>
      );
    }
    if (s.includes('jalan')) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-xs font-bold bg-green-50 text-[#008000] border border-green-200">
          <PlayCircle className="w-3.5 h-3.5" aria-hidden="true" />
          <span>Sedang Berjalan</span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-xs font-bold bg-gray-100 text-gray-700 border border-gray-200">
        <Clock className="w-3.5 h-3.5" aria-hidden="true" />
        <span>Belum Mulai</span>
      </span>
    );
  };

  return (
    <article className="bg-white rounded-lg overflow-hidden border border-gray-200 flex flex-col group pb-card-hover transition-colors hover:border-gray-300 hover:shadow-md">
      <div className="relative w-full aspect-[16/10] overflow-hidden bg-gray-100">
        <img
          src={directImageUrl}
          alt={program.title}
          width={640}
          height={400}
          loading="lazy"
          decoding="async"
          className="w-full h-full object-cover object-center group-hover:scale-[1.03] transition-transform duration-300"
          onError={(e) => {
            (e.target as HTMLImageElement).src =
              'https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=800&q=80';
          }}
        />
      </div>

      <div className="p-5 flex flex-col flex-grow justify-between gap-4">
        <div className="space-y-2.5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-xs font-bold text-[#E31837]">
              {program.division || 'Divisi Organisasi'}
            </span>
            {getStatusBadge(program.status)}
          </div>

          <h3 className="text-lg font-extrabold text-gray-900 group-hover:text-[#E31837] transition-colors line-clamp-2 leading-snug">
            {program.title}
          </h3>

          {program.startDate && (
            <div className="flex items-center gap-1.5 text-xs text-gray-500 font-medium">
              <Calendar className="w-3.5 h-3.5 text-gray-400 shrink-0" aria-hidden="true" />
              <span>
                {program.startDate} {program.endDate ? `— ${program.endDate}` : ''}
              </span>
            </div>
          )}
        </div>

        <div className="pt-3 border-t border-gray-100">
          <a
            href={program.driveFolderUrl || '#'}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full min-h-[42px] inline-flex items-center justify-center gap-2 bg-gray-50 hover:bg-gray-900 text-gray-800 hover:text-white font-semibold py-2 px-4 rounded-lg border border-gray-200 hover:border-gray-900 transition-colors text-sm"
          >
            <span>Lihat Dokumentasi Lengkap</span>
            <ExternalLink className="w-4 h-4 shrink-0" aria-hidden="true" />
          </a>
        </div>
      </div>
    </article>
  );
}
