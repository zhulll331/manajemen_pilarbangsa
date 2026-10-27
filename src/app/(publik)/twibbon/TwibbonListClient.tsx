"use client";

import React, { useEffect, useRef } from 'react';
import Link from 'next/link';
import type { TwibbonPublicCampaignCard } from '@/types/twibbon';
import { createSampleDiklatFrameCanvas } from '@/lib/twibbon/renderer';
import {
  Sparkles,
  Calendar,
  MapPin,
  ArrowRight,
  Archive,
  Image as ImageIcon,
} from 'lucide-react';

interface TwibbonListClientProps {
  campaigns: TwibbonPublicCampaignCard[];
}

function BuiltinFrameThumbnail({ title }: { title: string }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const sample = createSampleDiklatFrameCanvas();
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    canvas.width = 540;
    canvas.height = 540;
    ctx.fillStyle = '#F9FAFB';
    ctx.fillRect(0, 0, 540, 540);
    ctx.drawImage(sample, 0, 0, 540, 540);
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-label={`Thumbnail ${title}`}
      className="w-full h-full object-cover"
    />
  );
}

export default function TwibbonListClient({ campaigns }: TwibbonListClientProps) {
  const activeCampaigns = campaigns.filter((c) => c.state === 'published');
  const archivedCampaigns = campaigns.filter((c) => c.state === 'archived');

  if (campaigns.length === 0) {
    return (
      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-10 sm:p-16 text-center max-w-2xl mx-auto space-y-4">
        <div className="w-16 h-16 rounded-2xl bg-red-50 text-[#E31837] flex items-center justify-center mx-auto">
          <ImageIcon className="w-8 h-8" />
        </div>
        <p className="text-base sm:text-lg font-bold text-gray-800">
          Belum ada twibbon yang tersedia. Cek lagi nanti, ya.
        </p>
        <div className="pt-2">
          <Link
            href="/kegiatan"
            className="inline-flex items-center gap-2 text-sm font-bold text-[#E31837] hover:underline"
          >
            <span>Lihat Agenda & Kegiatan UKM Pilar Bangsa</span>
            <ArrowRight size={15} />
          </Link>
        </div>
      </div>
    );
  }

  const renderCard = (campaign: TwibbonPublicCampaignCard, isArchivedSection: boolean) => {
    const displayImgUrl = campaign.thumbnail_url || campaign.frame_url;
    const isBuiltin = displayImgUrl.startsWith('builtin:');

    return (
      <article
        key={campaign.id}
        className={`group bg-white rounded-3xl border overflow-hidden transition-all duration-300 flex flex-col ${
          isArchivedSection
            ? 'border-gray-200 opacity-90 hover:opacity-100'
            : 'border-gray-100 shadow-md hover:shadow-xl hover:border-red-100'
        }`}
      >
        <Link
          href={`/twibbon/${campaign.slug}`}
          className="relative aspect-square w-full bg-gray-50 overflow-hidden block border-b border-gray-100"
        >
          {isBuiltin ? (
            <BuiltinFrameThumbnail title={campaign.title} />
          ) : (
            <img
              src={displayImgUrl}
              alt={`Bingkai Twibbon ${campaign.title}`}
              className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-300"
              loading="lazy"
            />
          )}

          <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
            {isArchivedSection ? (
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[11px] font-bold bg-gray-900/85 text-white backdrop-blur-xs uppercase tracking-wider">
                <Archive size={12} /> Arsip Kampanye
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[11px] font-bold bg-[#E31837] text-white shadow-xs uppercase tracking-wider">
                <Sparkles size={12} /> Resmi 1080×1080
              </span>
            )}
          </div>
        </Link>

        <div className="p-6 flex-1 flex flex-col justify-between space-y-5">
          <div className="space-y-2.5">
            <div className="flex items-center justify-between gap-2 text-xs text-gray-400 font-medium">
              <span>
                Dipublikasikan{' '}
                {new Date(campaign.published_at).toLocaleDateString('id-ID', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                })}
              </span>
            </div>

            <h2 className="text-lg sm:text-xl font-extrabold text-gray-900 group-hover:text-[#E31837] transition-colors leading-snug">
              <Link href={`/twibbon/${campaign.slug}`}>{campaign.title}</Link>
            </h2>

            {campaign.description && (
              <p className="text-xs sm:text-sm text-gray-600 line-clamp-2 leading-relaxed">
                {campaign.description}
              </p>
            )}

            {campaign.event && (
              <div className="pt-2 space-y-1.5 border-t border-gray-50 text-xs text-gray-600">
                <div className="font-bold text-gray-800 line-clamp-1">
                  Kegiatan: {campaign.event.title}
                </div>
                {campaign.event.starts_at && (
                  <div className="flex items-center gap-1.5 text-gray-500">
                    <Calendar size={13} className="text-[#E31837] shrink-0" />
                    <span>
                      {new Date(campaign.event.starts_at).toLocaleDateString('id-ID', {
                        weekday: 'long',
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                      })}
                    </span>
                  </div>
                )}
                {campaign.event.location && (
                  <div className="flex items-center gap-1.5 text-gray-500">
                    <MapPin size={13} className="text-[#008000] shrink-0" />
                    <span className="line-clamp-1">{campaign.event.location}</span>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="pt-2">
            <Link
              href={`/twibbon/${campaign.slug}`}
              className={`w-full inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-2xl text-xs sm:text-sm font-extrabold transition-all shadow-xs ${
                isArchivedSection
                  ? 'bg-gray-100 hover:bg-gray-200 text-gray-800'
                  : 'bg-[#E31837] hover:bg-red-700 text-white shadow-md hover:shadow-lg'
              }`}
            >
              <span>Gunakan Twibbon</span>
              <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </article>
    );
  };

  return (
    <div className="space-y-12">
      {/* Kampanye Aktif (Published) */}
      {activeCampaigns.length > 0 ? (
        <section aria-label="Kampanye Twibbon Aktif" className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-1.5 h-6 bg-[#E31837] rounded-full" />
              <h2 className="text-xl sm:text-2xl font-extrabold text-gray-900 tracking-tight">
                Kampanye Aktif
              </h2>
            </div>
            <span className="text-xs font-bold text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
              {activeCampaigns.length} Kampanye
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {activeCampaigns.map((c) => renderCard(c, false))}
          </div>
        </section>
      ) : (
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-8 text-center">
          <p className="text-sm sm:text-base font-bold text-gray-700">
            Belum ada twibbon yang tersedia. Cek lagi nanti, ya.
          </p>
        </div>
      )}

      {/* Bagian Arsip Kampanye (Terpisah & Berlabel Jelas) */}
      {archivedCampaigns.length > 0 && (
        <section
          aria-label="Arsip Kampanye Twibbon"
          className="pt-8 border-t border-gray-200 space-y-6"
        >
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <Archive className="w-5 h-5 text-gray-500" />
              <h2 className="text-lg sm:text-xl font-extrabold text-gray-800">
                Arsip Kampanye Twibbon
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-gray-500">
              Kampanye dari kegiatan yang telah selesai namun tetap dapat diakses untuk dokumentasi.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {archivedCampaigns.map((c) => renderCard(c, true))}
          </div>
        </section>
      )}
    </div>
  );
}

