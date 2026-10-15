import React from 'react';
import { Metadata } from 'next';
import { createClient } from '@/utils/supabase/server';
import { PublicEvent } from '@/types/events';
import DaftarKegiatanClient from './DaftarKegiatanClient';
import { Calendar, Sparkles } from 'lucide-react';

export const revalidate = 60; // Otomatis revalidasi setiap 60 detik

export const metadata: Metadata = {
  title: 'Pusat Kegiatan | UKM Pilar Bangsa Untag Banyuwangi',
  description: 'Pusat informasi resmi, berkas panduan, twibbon, dan pendaftaran kegiatan mahasiswa UKM Pilar Bangsa Universitas 17 Agustus 1945 Banyuwangi.',
  keywords: [
    'Kegiatan Pilar Bangsa',
    'Diklat UKM Pilar Bangsa',
    'Pendaftaran Anggota Pilar Bangsa',
    'Untag Banyuwangi',
    'Pusat Kegiatan Mahasiswa',
  ],
  openGraph: {
    title: 'Pusat Kegiatan | UKM Pilar Bangsa Untag Banyuwangi',
    description: 'Pusat informasi resmi, berkas panduan, twibbon, dan pendaftaran kegiatan mahasiswa UKM Pilar Bangsa.',
    url: 'https://www.pilarbangsa.my.id/kegiatan',
    siteName: 'UKM Pilar Bangsa Untag Banyuwangi',
    locale: 'id_ID',
    type: 'website',
    images: [
      {
        url: '/og-image.webp',
        width: 1200,
        height: 630,
        alt: 'Pusat Kegiatan Pilar Bangsa',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Pusat Kegiatan | UKM Pilar Bangsa Untag Banyuwangi',
    description: 'Pusat informasi resmi, berkas panduan, twibbon, dan pendaftaran kegiatan mahasiswa UKM Pilar Bangsa.',
    images: ['/og-image.webp'],
  },
};

export default async function KegiatanPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const resolvedSearchParams = await searchParams;
  const initialTab = typeof resolvedSearchParams.tab === 'string' ? resolvedSearchParams.tab : 'aktif';

  const supabase = await createClient();

  const { data, error } = await supabase
    .from('public_events')
    .select('*')
    .in('publish_status', ['published', 'archived'])
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching public events:', error);
  }

  const events: PublicEvent[] = (data as PublicEvent[]) || [];

  return (
    <div className="space-y-12 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
      {/* Top Hero Banner */}
      <section className="bg-black text-white rounded-3xl p-8 sm:p-12 md:p-16 text-center relative overflow-hidden shadow-2xl">
        <div className="absolute inset-0 opacity-15 bg-[radial-gradient(#E31837_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none" />
        <div className="relative z-10 max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center space-x-2 px-4 py-1.5 rounded-full bg-red-950/80 text-[#FFD700] text-xs font-bold tracking-widest uppercase border border-red-800/60">
            <Sparkles className="w-3.5 h-3.5 text-[#FFD700]" />
            <span>Pusat Kegiatan & Informasi Publik</span>
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight leading-tight">
            Agenda & Kegiatan Resmi
          </h1>

          <p className="text-gray-300 text-sm sm:text-base md:text-lg max-w-2xl mx-auto leading-relaxed">
            Satu tempat resmi bagi peserta untuk menemukan informasi acara, tautan pendaftaran, twibbon, caption, dan berkas panduan kegiatan UKM Pilar Bangsa.
          </p>
        </div>
      </section>

      {/* Interactive List (Tabs, Search, Grid Cards) */}
      <section>
        <DaftarKegiatanClient initialEvents={events} initialTab={initialTab} />
      </section>
    </div>
  );
}
