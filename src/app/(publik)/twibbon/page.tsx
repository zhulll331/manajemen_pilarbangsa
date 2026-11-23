import React from 'react';
import { Metadata } from 'next';
import { fetchPublicTwibbonCampaignList } from '@/lib/twibbon/server-service';
import TwibbonListClient from './TwibbonListClient';
import { ShieldCheck } from 'lucide-react';
import { PageHeader, Section } from '@/components/ui/PublicPrimitives';

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
        url: 'https://www.pilarbangsa.my.id/twibbon/opengraph-image',
        width: 1200,
        height: 630,
        alt: 'Katalog Twibbon Resmi UKM Pilar Bangsa',
        type: 'image/png',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Twibbon Pilar Bangsa | UKM Pilar Bangsa Untag Banyuwangi',
    description:
      'Pasang bingkai Twibbon resmi 1080×1080 dan salin caption kegiatan UKM Pilar Bangsa langsung dari perangkat Anda tanpa login.',
    images: ['https://www.pilarbangsa.my.id/twibbon/opengraph-image'],
  },
};

export default async function TwibbonCatalogPage() {
  const campaigns = await fetchPublicTwibbonCampaignList();

  return (
    <div className="w-full">
      <PageHeader
        breadcrumbs={[
          { label: 'Beranda', href: '/' },
          { label: 'Twibbon' },
        ]}
        eyebrow="Bebas Iklan • Tanpa Login • 100% Lokal"
        title="Twibbon Pilar Bangsa"
        description="Pilih bingkai resmi kegiatan UKM Pilar Bangsa, atur posisi foto Anda secara instan di perangkat sendiri, unduh PNG 1080×1080, dan salin caption resmi."
        meta={
          <p className="inline-flex items-center gap-2 text-xs sm:text-sm text-[#008000] font-semibold">
            <ShieldCheck className="w-4 h-4 shrink-0" aria-hidden="true" />
            <span>
              Foto diproses lokal di browser Anda dan tidak diunggah ke server.
            </span>
          </p>
        }
      />

      <Section tone="white" ariaLabel="Daftar kampanye Twibbon">
        <TwibbonListClient campaigns={campaigns} />
      </Section>
    </div>
  );
}
