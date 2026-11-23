import React from 'react';
import { Metadata } from 'next';
import { createClient } from '@/utils/supabase/server';
import { PublicEvent } from '@/types/events';
import DaftarKegiatanClient from './DaftarKegiatanClient';
import { PageHeader, Section } from '@/components/ui/PublicPrimitives';

export const revalidate = 60;

export const metadata: Metadata = {
  title: 'Pusat Kegiatan | UKM Pilar Bangsa Untag Banyuwangi',
  description:
    'Pusat informasi resmi, berkas panduan, twibbon, dan pendaftaran kegiatan mahasiswa UKM Pilar Bangsa Universitas 17 Agustus 1945 Banyuwangi.',
  keywords: [
    'Kegiatan Pilar Bangsa',
    'Diklat UKM Pilar Bangsa',
    'Pendaftaran Anggota Pilar Bangsa',
    'Untag Banyuwangi',
    'Pusat Kegiatan Mahasiswa',
  ],
  openGraph: {
    title: 'Pusat Kegiatan | UKM Pilar Bangsa Untag Banyuwangi',
    description:
      'Pusat informasi resmi, berkas panduan, twibbon, dan pendaftaran kegiatan mahasiswa UKM Pilar Bangsa.',
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
    description:
      'Pusat informasi resmi, berkas panduan, twibbon, dan pendaftaran kegiatan mahasiswa UKM Pilar Bangsa.',
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
    <div className="w-full">
      <PageHeader
        breadcrumbs={[
          { label: 'Beranda', href: '/' },
          { label: 'Kegiatan' },
        ]}
        eyebrow="Pusat Kegiatan & Informasi Publik"
        title="Agenda & Kegiatan Resmi"
        description="Satu tempat resmi bagi peserta untuk menemukan informasi acara, tautan pendaftaran, twibbon, caption, dan berkas panduan kegiatan UKM Pilar Bangsa."
      />

      <Section tone="white" ariaLabel="Daftar agenda dan kegiatan resmi">
        <DaftarKegiatanClient initialEvents={events} initialTab={initialTab} />
      </Section>
    </div>
  );
}
