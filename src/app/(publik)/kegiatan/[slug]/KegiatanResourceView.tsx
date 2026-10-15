"use client";

import React, { useState } from 'react';
import { PublicEventResource, RegistrationStatus, PublishStatus } from '@/types/events';
import { 
  Link as LinkIcon, 
  FileText, 
  Copy, 
  Check, 
  ExternalLink, 
  Share2, 
  Lock, 
  Clock, 
  AlertCircle 
} from 'lucide-react';

interface Props {
  resources: PublicEventResource[];
  eventTitle: string;
  eventSummary: string | null;
  registrationStatus: RegistrationStatus;
  publishStatus: PublishStatus;
}

export default function KegiatanResourceView({
  resources,
  eventTitle,
  eventSummary,
  registrationStatus,
  publishStatus,
}: Props) {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [shareFeedback, setShareFeedback] = useState<string | null>(null);

  // Fallback Copy Function
  const handleCopy = async (id: string, text: string) => {
    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
      } else {
        // Fallback untuk browser yang membatasi clipboard API
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'fixed';
        textArea.style.opacity = '0';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
      }
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2500);
    } catch (err) {
      console.warn('Gagal menyalin:', err);
      alert('Gagal menyalin otomatis. Silakan salin teks secara manual.');
    }
  };

  // Handle Share Page
  const handleShare = async () => {
    const url = window.location.href;
    const shareText = `Halo! Simak informasi dan berkas kegiatan "${eventTitle}" di UKM Pilar Bangsa Untag Banyuwangi: ${url}`;

    try {
      if (navigator.share) {
        await navigator.share({
          title: eventTitle,
          text: eventSummary || eventTitle,
          url: url,
        });
      } else if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(url);
        setShareFeedback('Tautan halaman berhasil disalin!');
        setTimeout(() => setShareFeedback(null), 2500);
      }
    } catch {
      // User cancelled share
    }
  };

  const getWaShareUrl = () => {
    if (typeof window === 'undefined') return '#';
    const url = window.location.href;
    const text = `Halo! Simak informasi resmi kegiatan "${eventTitle}" UKM Pilar Bangsa: ${url}`;
    return `https://wa.me/?text=${encodeURIComponent(text)}`;
  };

  return (
    <div className="space-y-8">
      {/* Items Section */}
      <div className="space-y-6">
        {resources.map((item) => {
          // 1. SECTION HEADER
          if (item.item_type === 'section_header') {
            return (
              <div key={item.id} className="pt-6 first:pt-0">
                <div className="flex items-center gap-3">
                  <div className="w-1.5 h-6 bg-[#E31837] rounded-full"></div>
                  <h2 className="text-xl sm:text-2xl font-extrabold text-gray-900 tracking-tight">
                    {item.title}
                  </h2>
                </div>
                {item.description && (
                  <p className="text-xs sm:text-sm text-gray-500 mt-1 pl-4.5">
                    {item.description}
                  </p>
                )}
              </div>
            );
          }

          // 2. LINK ITEM
          if (item.item_type === 'link') {
            const isRegLink = item.link_role === 'registration';
            const isRegDisabled =
              isRegLink &&
              (registrationStatus === 'closed' ||
                registrationStatus === 'soon' ||
                publishStatus === 'archived');

            let urlHostname = '';
            try {
              if (item.url) {
                urlHostname = new URL(item.url).hostname;
              }
            } catch {
              urlHostname = '';
            }

            if (isRegDisabled) {
              return (
                <div
                  key={item.id}
                  className="p-5 sm:p-6 rounded-3xl bg-gray-50 border border-gray-200 opacity-80 space-y-3"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="p-2 rounded-xl bg-gray-200 text-gray-500">
                          <Lock size={18} />
                        </span>
                        <h3 className="font-bold text-gray-700 text-base sm:text-lg">
                          {item.title}
                        </h3>
                      </div>
                      {item.description && (
                        <p className="text-xs sm:text-sm text-gray-500 pl-10">
                          {item.description}
                        </p>
                      )}
                    </div>

                    <div className="sm:self-center pl-10 sm:pl-0">
                      <span className="inline-flex items-center gap-1.5 px-4 py-2 rounded-2xl bg-gray-200 text-gray-600 text-xs font-bold">
                        {registrationStatus === 'soon' ? (
                          <>
                            <Clock size={14} /> Segera Dibuka
                          </>
                        ) : (
                          <>
                            <Lock size={14} /> Pendaftaran Ditutup
                          </>
                        )}
                      </span>
                    </div>
                  </div>
                </div>
              );
            }

            return (
              <div
                key={item.id}
                className="group p-5 sm:p-6 rounded-3xl bg-white border border-gray-100 shadow-sm hover:shadow-xl hover:border-red-100 transition-all duration-300"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2.5 rounded-2xl bg-red-50 text-[#E31837] group-hover:bg-[#E31837] group-hover:text-white transition-colors shrink-0">
                        <LinkIcon size={20} />
                      </div>
                      <div>
                        <h3 className="font-bold text-gray-900 text-base sm:text-lg group-hover:text-[#E31837] transition-colors">
                          {item.title}
                        </h3>
                        {urlHostname && (
                          <span className="text-[11px] font-mono text-gray-400">
                            {urlHostname}
                          </span>
                        )}
                      </div>
                    </div>
                    {item.description && (
                      <p className="text-xs sm:text-sm text-gray-600 pl-11">
                        {item.description}
                      </p>
                    )}
                  </div>

                  <div className="pl-11 sm:pl-0">
                    <a
                      href={item.url || '#'}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`inline-flex items-center gap-2 px-6 py-3 rounded-2xl font-bold text-xs sm:text-sm shadow-sm transition-all hover:shadow-md ${
                        isRegLink
                          ? 'bg-[#008000] hover:bg-green-700 text-white'
                          : 'bg-[#E31837] hover:bg-red-700 text-white'
                      }`}
                    >
                      <span>{isRegLink ? 'Isi Formulir Pendaftaran' : 'Buka Tautan'}</span>
                      <ExternalLink size={15} />
                    </a>
                  </div>
                </div>
              </div>
            );
          }

          // 3. TEXT / CAPTION ITEM
          if (item.item_type === 'text') {
            const isCopied = copiedId === item.id;

            return (
              <div
                key={item.id}
                className="p-5 sm:p-6 rounded-3xl bg-white border border-gray-100 shadow-sm space-y-4"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-50 pb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-xl bg-emerald-50 text-emerald-700 shrink-0">
                      <FileText size={18} />
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900 text-base sm:text-lg">
                        {item.title}
                      </h3>
                      {item.description && (
                        <p className="text-xs text-gray-500 mt-0.5">{item.description}</p>
                      )}
                    </div>
                  </div>

                  {item.copyable && (
                    <button
                      type="button"
                      onClick={() => handleCopy(item.id, item.content || '')}
                      className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-xs ${
                        isCopied
                          ? 'bg-green-600 text-white'
                          : 'bg-gray-100 hover:bg-gray-200 text-gray-800'
                      }`}
                      title="Salin isi teks ke clipboard"
                    >
                      {isCopied ? <Check size={14} /> : <Copy size={14} />}
                      <span>{isCopied ? 'Berhasil Disalin!' : 'Salin Teks'}</span>
                    </button>
                  )}
                </div>

                {/* Content Box */}
                <div className="p-4 rounded-2xl bg-gray-50/80 border border-gray-100 text-gray-800 text-xs sm:text-sm font-sans whitespace-pre-wrap leading-relaxed select-all">
                  {item.content}
                </div>
              </div>
            );
          }

          return null;
        })}
      </div>

      {/* Share Section Card */}
      <div className="p-6 sm:p-8 rounded-3xl bg-gray-900 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-6 shadow-xl">
        <div className="space-y-1">
          <div className="text-xs font-bold text-[#FFD700] uppercase tracking-wider flex items-center gap-1.5">
            <Share2 size={14} />
            <span>Bagikan Kegiatan</span>
          </div>
          <h3 className="text-lg sm:text-xl font-bold">
            Bantu Sebarkan Informasi Ini
          </h3>
          <p className="text-xs sm:text-sm text-gray-300">
            Ajak teman dan rekan mahasiswa lain untuk ikut serta dalam kegiatan ini.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <a
            href={getWaShareUrl()}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-[#008000] hover:bg-green-700 text-white text-xs sm:text-sm font-bold shadow-md transition-all"
          >
            <span>Bagikan via WhatsApp</span>
          </a>

          <button
            type="button"
            onClick={handleShare}
            className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-white/10 hover:bg-white/20 text-white text-xs sm:text-sm font-bold transition-all border border-white/20"
          >
            <Copy size={15} />
            <span>Salin Tautan</span>
          </button>
        </div>
      </div>

      {shareFeedback && (
        <div className="p-3 bg-green-50 text-[#008000] border border-green-200 rounded-2xl text-xs font-semibold text-center">
          {shareFeedback}
        </div>
      )}
    </div>
  );
}
