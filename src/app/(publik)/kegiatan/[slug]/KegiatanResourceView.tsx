"use client";

import React, { useRef, useState } from 'react';
import Link from 'next/link';
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
  Sparkles,
  ArrowRight,
  Archive
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
  const [copyErrorId, setCopyErrorId] = useState<string | null>(null);
  const [shareFeedback, setShareFeedback] = useState<string | null>(null);
  const copyTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const shareTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Fallback Copy Function
  const handleCopy = async (id: string, text: string) => {
    if (copyTimerRef.current) clearTimeout(copyTimerRef.current);
    setCopyErrorId(null);

    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
      } else {
        // Fallback untuk browser yang membatasi clipboard API
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.setAttribute('readonly', '');
        textArea.style.position = 'fixed';
        textArea.style.opacity = '0';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        const ok = document.execCommand('copy');
        document.body.removeChild(textArea);
        if (!ok) throw new Error('Copy failed');
      }
      setCopiedId(id);
      copyTimerRef.current = setTimeout(() => setCopiedId(null), 2500);
    } catch (err) {
      console.warn('Gagal menyalin:', err);
      setCopiedId(null);
      setCopyErrorId(id);
      copyTimerRef.current = setTimeout(() => setCopyErrorId(null), 3500);
    }
  };

  // Handle Share Page
  const handleShare = async () => {
    const url = window.location.href;
    if (shareTimerRef.current) clearTimeout(shareTimerRef.current);

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
        shareTimerRef.current = setTimeout(() => setShareFeedback(null), 2500);
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
      {/* Banner Peringatan Arsip */}
      {publishStatus === 'archived' && (
        <div className="p-4 sm:p-5 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 flex items-start sm:items-center gap-3">
          <Archive size={18} className="text-amber-700 shrink-0 mt-0.5 sm:mt-0" aria-hidden="true" />
          <p className="text-sm font-semibold leading-relaxed">
            Kegiatan ini telah selesai dan diarsipkan. Semua tautan pendaftaran, twibbon, dan akses berkas dinonaktifkan.
          </p>
        </div>
      )}

      {/* Daftar Materi & Tautan */}
      <div>
        {resources.map((item) => {
          // 1. SECTION HEADER
          if (item.item_type === 'section_header') {
            return (
              <div key={item.id} className="pt-8 pb-3 first:pt-0 border-b border-gray-200">
                <h2 className="text-xl sm:text-2xl font-extrabold text-gray-900 tracking-tight border-l-4 border-[#E31837] pl-3">
                  {item.title}
                </h2>
                {item.description && (
                  <p className="text-sm text-gray-500 mt-1 pl-4">{item.description}</p>
                )}
              </div>
            );
          }

          // 2. LINK ITEM (Baris daftar bergaris)
          if (item.item_type === 'link') {
            const isEventArchived = publishStatus === 'archived';
            const isRegLink = item.link_role === 'registration';
            const isRegDisabled =
              isRegLink &&
              (registrationStatus === 'closed' ||
                registrationStatus === 'soon' ||
                isEventArchived);
            const isItemDisabled = isEventArchived || isRegDisabled;

            let urlHostname = '';
            let internalTwibbonPath: string | null = null;
            try {
              if (item.url) {
                if (item.url.startsWith('/twibbon/')) {
                  urlHostname = 'www.pilarbangsa.my.id';
                  internalTwibbonPath = item.url;
                } else {
                  const parsed = new URL(item.url);
                  urlHostname = parsed.hostname;
                  if (
                    (parsed.hostname === 'www.pilarbangsa.my.id' ||
                      parsed.hostname === 'pilarbangsa.my.id') &&
                    parsed.pathname.startsWith('/twibbon/')
                  ) {
                    internalTwibbonPath = parsed.pathname;
                  }
                }
              }
            } catch {
              urlHostname = '';
            }

            if (isItemDisabled) {
              let badgeLabel = 'Tautan Ditutup';
              let badgeIcon = <Lock size={14} aria-hidden="true" />;

              if (isEventArchived) {
                if (internalTwibbonPath) {
                  badgeLabel = 'Twibbon Ditutup';
                } else if (isRegLink) {
                  badgeLabel = 'Pendaftaran Ditutup';
                } else {
                  badgeLabel = 'Tautan Diarsipkan';
                }
              } else if (isRegLink && registrationStatus === 'soon') {
                badgeLabel = 'Segera Dibuka';
                badgeIcon = <Clock size={14} aria-hidden="true" />;
              }

              return (
                <div
                  key={item.id}
                  className="py-5 border-b border-gray-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4 opacity-75"
                >
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2.5">
                      <span className="p-2 rounded-lg bg-gray-100 text-gray-500 shrink-0">
                        {internalTwibbonPath ? (
                          <Sparkles size={16} aria-hidden="true" />
                        ) : (
                          <Lock size={16} aria-hidden="true" />
                        )}
                      </span>
                      <div className="min-w-0">
                        <h3 className="font-bold text-gray-700 text-base sm:text-lg leading-snug">
                          {item.title}
                        </h3>
                        {urlHostname && (
                          <span className="text-xs font-mono text-gray-400">{urlHostname}</span>
                        )}
                      </div>
                    </div>
                    {item.description && (
                      <p className="text-sm text-gray-500 pl-10">{item.description}</p>
                    )}
                  </div>

                  <div className="shrink-0">
                    <span className="inline-flex items-center justify-center gap-1.5 w-full sm:w-auto min-h-[44px] px-4 py-2 rounded-lg bg-gray-100 text-gray-600 text-xs sm:text-sm font-bold border border-gray-200 select-none cursor-not-allowed">
                      {badgeIcon}
                      <span>{badgeLabel}</span>
                    </span>
                  </div>
                </div>
              );
            }

            return (
              <div
                key={item.id}
                className="group py-5 border-b border-gray-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-2.5">
                    <span className="p-2 rounded-lg bg-red-50 text-[#E31837] shrink-0">
                      {internalTwibbonPath ? (
                        <Sparkles size={17} aria-hidden="true" />
                      ) : (
                        <LinkIcon size={17} aria-hidden="true" />
                      )}
                    </span>
                    <div className="min-w-0">
                      <h3 className="font-bold text-gray-900 text-base sm:text-lg group-hover:text-[#E31837] transition-colors leading-snug">
                        {item.title}
                      </h3>
                      {urlHostname && (
                        <span className="text-xs font-mono text-gray-400">{urlHostname}</span>
                      )}
                    </div>
                  </div>
                  {item.description && (
                    <p className="text-sm text-gray-600 pl-10">{item.description}</p>
                  )}
                </div>

                <div className="shrink-0">
                  {internalTwibbonPath ? (
                    <Link
                      href={internalTwibbonPath}
                      className="inline-flex items-center justify-center gap-2 w-full sm:w-auto min-h-[44px] px-5 py-2.5 rounded-lg font-semibold text-sm bg-[#E31837] hover:bg-red-700 text-white transition-colors"
                    >
                      <span>Buat &amp; Pasang Twibbon</span>
                      <ArrowRight size={15} aria-hidden="true" />
                    </Link>
                  ) : (
                    <a
                      href={item.url || '#'}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`inline-flex items-center justify-center gap-2 w-full sm:w-auto min-h-[44px] px-5 py-2.5 rounded-lg font-semibold text-sm transition-colors ${
                        isRegLink
                          ? 'bg-[#008000] hover:bg-green-700 text-white'
                          : 'bg-[#E31837] hover:bg-red-700 text-white'
                      }`}
                    >
                      <span>{isRegLink ? 'Isi Formulir Pendaftaran' : 'Buka Tautan'}</span>
                      <ExternalLink size={15} aria-hidden="true" />
                    </a>
                  )}
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
                className="my-5 p-4 sm:p-5 rounded-lg bg-gray-50 border border-gray-200 space-y-4"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-200 pb-3">
                  <div className="flex items-center gap-2.5">
                    <FileText size={18} className="text-[#008000] shrink-0" aria-hidden="true" />
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
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleCopy(item.id, item.content || '')}
                        aria-label={`Salin teks ${item.title}`}
                        className={`inline-flex items-center justify-center gap-2 w-full sm:w-auto min-h-[40px] px-4 py-2 rounded-lg text-xs sm:text-sm font-bold transition-colors ${
                          isCopied
                            ? 'bg-green-600 text-white'
                            : 'bg-white border border-gray-300 hover:bg-gray-100 text-gray-800'
                        }`}
                      >
                        {isCopied ? (
                          <Check size={14} aria-hidden="true" />
                        ) : (
                          <Copy size={14} aria-hidden="true" />
                        )}
                        <span>{isCopied ? 'Berhasil Disalin!' : 'Salin Teks'}</span>
                      </button>
                      <span role="status" className="sr-only">
                        {isCopied ? `Teks ${item.title} berhasil disalin.` : ''}
                      </span>
                    </div>
                  )}
                </div>

                {copyErrorId === item.id && (
                  <div
                    role="alert"
                    className="p-2.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-xs font-semibold"
                  >
                    Gagal menyalin otomatis. Silakan blok dan salin teks di bawah secara manual.
                  </div>
                )}

                <div className="p-4 rounded-lg bg-white border border-gray-200 text-gray-800 text-sm font-sans whitespace-pre-wrap leading-relaxed select-all">
                  {item.content}
                </div>
              </div>
            );
          }

          return null;
        })}
      </div>

      {/* Bagian Bagikan atau Pemberitahuan Arsip */}
      {publishStatus === 'archived' ? (
        <div className="p-5 sm:p-6 rounded-lg bg-gray-100 border border-gray-200 text-gray-700 flex items-start gap-3">
          <Archive size={20} className="text-gray-600 shrink-0 mt-0.5" aria-hidden="true" />
          <div>
            <h3 className="font-bold text-base text-gray-900">Arsip Resmi Kegiatan</h3>
            <p className="text-sm text-gray-600 mt-0.5">
              Kegiatan ini telah selesai. Seluruh formulir pendaftaran, pembuatan twibbon, dan tautan eksternal dinonaktifkan.
            </p>
          </div>
        </div>
      ) : (
        <div className="p-5 sm:p-6 rounded-lg bg-gray-50 border border-gray-200 flex flex-col sm:flex-row sm:items-center justify-between gap-5">
          <div className="space-y-1">
            <div className="text-xs font-bold text-[#E31837] uppercase tracking-wider flex items-center gap-1.5">
              <Share2 size={14} aria-hidden="true" />
              <span>Bagikan Kegiatan</span>
            </div>
            <h3 className="text-lg font-bold text-gray-900">Bantu Sebarkan Informasi Ini</h3>
            <p className="text-sm text-gray-600">
              Ajak teman dan rekan mahasiswa lain untuk ikut serta dalam kegiatan ini.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 shrink-0">
            <a
              href={getWaShareUrl()}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 min-h-[44px] px-4 py-2.5 rounded-lg bg-[#008000] hover:bg-green-700 text-white text-sm font-semibold transition-colors"
            >
              <span>Bagikan via WhatsApp</span>
            </a>

            <button
              type="button"
              onClick={handleShare}
              className="inline-flex items-center justify-center gap-2 min-h-[44px] px-4 py-2.5 rounded-lg bg-white hover:bg-gray-100 text-gray-800 text-sm font-semibold transition-colors border border-gray-300"
            >
              <Copy size={15} aria-hidden="true" />
              <span>Salin Tautan</span>
            </button>
          </div>
        </div>
      )}

      {shareFeedback && (
        <div
          role="status"
          className="p-3 bg-green-50 text-[#008000] border border-green-200 rounded-lg text-xs font-semibold text-center"
        >
          {shareFeedback}
        </div>
      )}
    </div>
  );
}
