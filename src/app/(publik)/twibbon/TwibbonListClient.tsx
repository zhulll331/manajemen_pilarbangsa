"use client";

import React, { useEffect, useRef } from 'react';
import Link from 'next/link';
import type { TwibbonPublicCampaignCard } from '@/types/twibbon';
import { GsapCardGroup } from '@/components/motion/GsapCardGroup';
import { createSampleDiklatFrameCanvas } from '@/lib/twibbon/renderer';
import { formatEventDateWib } from '@/utils/eventDate';
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
      <div className="border-y border-gray-200 py-14 text-center space-y-4">
        <ImageIcon className="w-10 h-10 text-gray-300 mx-auto" aria-hidden="true" />
        <p className="text-base sm:text-lg font-bold text-gray-800">
          Belum ada twibbon yang tersedia. Cek lagi nanti, ya.
        </p>
        <div className="pt-1">
          <Link
            href="/kegiatan"
            className="inline-flex items-center gap-2 text-sm font-bold text-[#E31837] hover:underline"
          >
            <span>Lihat Agenda &amp; Kegiatan UKM Pilar Bangsa</span>
            <ArrowRight size={15} aria-hidden="true" />
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
        className={`group pb-card-hover bg-white rounded-lg border border-gray-200 overflow-hidden transition-colors flex flex-col hover:shadow-md ${
          isArchivedSection
            ? 'opacity-85 hover:opacity-100'
            : 'hover:border-gray-300'
        }`}
      >
        <Link
          href={`/twibbon/${campaign.slug}`}
          className="relative aspect-square w-full bg-gray-50 overflow-hidden block border-b border-gray-200"
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
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-[11px] font-bold bg-gray-900/90 text-white uppercase tracking-wider">
                <Archive size={12} aria-hidden="true" /> Arsip Kampanye
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-[11px] font-bold bg-[#E31837] text-white uppercase tracking-wider">
                <Sparkles size={12} aria-hidden="true" /> Resmi 1080×1080
              </span>
            )}
          </div>
        </Link>

        <div className="p-5 flex-1 flex flex-col justify-between gap-4">
          <div className="space-y-2">
            <div className="text-xs text-gray-500 font-medium">
              Dipublikasikan{' '}
              {new Date(campaign.published_at).toLocaleDateString('id-ID', {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
              })}
            </div>

            <h2 className="text-lg font-extrabold text-gray-900 group-hover:text-[#E31837] transition-colors leading-snug">
              <Link href={`/twibbon/${campaign.slug}`}>{campaign.title}</Link>
            </h2>

            {campaign.description && (
              <p className="text-sm text-gray-600 line-clamp-2 leading-relaxed">
                {campaign.description}
              </p>
            )}

            {campaign.event && (
              <div className="pt-2 space-y-1 border-t border-gray-100 text-xs text-gray-600">
                <div className="font-bold text-gray-800 line-clamp-1">
                  Kegiatan: {campaign.event.title}
                </div>
                {campaign.event.starts_at && (
                  <div className="flex items-center gap-1.5 text-gray-500">
                    <Calendar size={13} className="text-[#E31837] shrink-0" aria-hidden="true" />
                    <span>
                      {formatEventDateWib(campaign.event.starts_at, {
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
                    <MapPin size={13} className="text-[#008000] shrink-0" aria-hidden="true" />
                    <span className="line-clamp-1">{campaign.event.location}</span>
                  </div>
                )}
              </div>
            )}
          </div>

          <Link
            href={`/twibbon/${campaign.slug}`}
            className={`w-full min-h-[44px] inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition-colors ${
              isArchivedSection
                ? 'bg-gray-100 hover:bg-gray-200 text-gray-800'
                : 'bg-[#E31837] hover:bg-red-700 text-white'
            }`}
          >
            <span>Gunakan Twibbon</span>
            <ArrowRight size={16} aria-hidden="true" />
          </Link>
        </div>
      </article>
    );
  };

  return (
    <div className="space-y-12">
      {/* Kampanye Aktif (Published) */}
      {activeCampaigns.length > 0 ? (
        <section aria-label="Kampanye Twibbon Aktif" className="space-y-6">
          <div className="flex items-center justify-between border-b border-gray-200 pb-3">
            <h2 className="text-xl sm:text-2xl font-extrabold text-gray-900 tracking-tight border-l-4 border-[#E31837] pl-3">
              Kampanye Aktif
            </h2>
            <span className="text-xs font-bold text-gray-600">{activeCampaigns.length} Kampanye</span>
          </div>

          <GsapCardGroup className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {activeCampaigns.map((c) => renderCard(c, false))}
          </GsapCardGroup>
        </section>
      ) : (
        <div className="border-y border-gray-200 py-10 text-center">
          <p className="text-sm sm:text-base font-bold text-gray-700">
            Belum ada twibbon aktif yang tersedia. Cek lagi nanti, ya.
          </p>
        </div>
      )}

      {/* Bagian Arsip Kampanye */}
      {archivedCampaigns.length > 0 && (
        <section
          aria-label="Arsip Kampanye Twibbon"
          className="pt-8 border-t border-gray-200 space-y-6"
        >
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Archive className="w-5 h-5 text-gray-500" aria-hidden="true" />
              <h2 className="text-lg sm:text-xl font-extrabold text-gray-800">
                Arsip Kampanye Twibbon
              </h2>
            </div>
            <p className="text-sm text-gray-500">
              Kampanye dari kegiatan yang telah selesai namun tetap dapat diakses untuk dokumentasi.
            </p>
          </div>

          <GsapCardGroup className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {archivedCampaigns.map((c) => renderCard(c, true))}
          </GsapCardGroup>
        </section>
      )}
    </div>
  );
}

