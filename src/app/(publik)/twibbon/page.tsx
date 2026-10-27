import React from 'react';
import { Metadata } from 'next';
import { fetchPublicTwibbonCampaignList } from '@/lib/twibbon/server-service';
import TwibbonListClient from './TwibbonListClient';
import { Sparkles, ShieldCheck } from 'lucide-react';

export const revalidate = 60;

export const metadata: Metadata = {
  title: 'Twibbon Pilar Bangsa | UKM Pilar Bangsa Untag Banyuwangi',
  description:
    'Pasang bingkai Twibbon resmi 1080×1080 dan salin caption kegiatan UKM Pilar Bangsa langsung dari perangkat Anda tanpa login.',
  keywords: [
    'Twibbon Pilar Bangsa',
    'Twibbon Diklat Kepemimpinan UKM Pilar Bangsa',
    'Untag Banyuwangi',
    'Twibbon Resmi UKM Pilar Bangsa',
  ],
  alternates: {
    canonical: 'https://www.pilarbangsa.my.id/twibbon',
  },
  openGraph: {
    title: 'Twibbon Pilar Bangsa | UKM Pilar Bangsa Untag Banyuwangi',
    description:
      'Pasang bingkai Twibbon resmi 1080×1080 dan salin caption kegiatan UKM Pilar Bangsa langsung dari perangkat Anda tanpa login.',
    url: 'https://www.pilarbangsa.my.id/twibbon',
    siteName: 'UKM Pilar Bangsa Untag Banyuwangi',
    locale: 'id_ID',
    type: 'website',
    images: [
      {
        url: '/og-image.webp',
        width: 1200,
        height: 630,
        alt: 'Twibbon Pilar Bangsa',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Twibbon Pilar Bangsa | UKM Pilar Bangsa Untag Banyuwangi',
    description:
      'Pasang bingkai Twibbon resmi 1080×1080 dan salin caption kegiatan UKM Pilar Bangsa langsung dari perangkat Anda tanpa login.',
    images: ['/og-image.webp'],
  },
};

export default async function TwibbonCatalogPage() {
  const campaigns = await fetchPublicTwibbonCampaignList();

  return (
    <div className="space-y-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
      {/* Hero Banner */}
      <section className="bg-black text-white rounded-3xl p-8 sm:p-12 text-center relative overflow-hidden shadow-2xl">
        <div className="absolute inset-0 opacity-15 bg-[radial-gradient(#E31837_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none" />
        <div className="relative z-10 max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center space-x-2 px-4 py-1.5 rounded-full bg-red-950/80 text-[#FFD700] text-xs font-bold tracking-widest uppercase border border-red-800/60">
            <Sparkles className="w-3.5 h-3.5 text-[#FFD700]" />
            <span>Bebas Iklan • Tanpa Login • 100% Lokal</span>
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight leading-tight">
            Twibbon Pilar Bangsa
          </h1>

          <p className="text-gray-300 text-sm sm:text-base md:text-lg max-w-2xl mx-auto leading-relaxed">
            Pilih bingkai resmi kegiatan UKM Pilar Bangsa, atur posisi foto Anda secara instan di perangkat sendiri, unduh hasil PNG 1080×1080, dan salin caption resmi.
          </p>

          <div className="pt-1 flex items-center justify-center gap-2 text-xs text-emerald-300 font-semibold">
            <ShieldCheck className="w-4 h-4 shrink-0" />
            <span>Foto Anda diproses di perangkat ini dan tidak diunggah ke server UKM Pilar Bangsa.</span>
          </div>
        </div>
      </section>

      {/* Daftar Kampanye */}
      <TwibbonListClient campaigns={campaigns} />
    </div>
  );
}

