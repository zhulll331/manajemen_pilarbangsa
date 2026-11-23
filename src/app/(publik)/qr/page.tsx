import React from 'react';
import { Metadata } from 'next';
import QrGeneratorClient from '@/components/qr/QrGeneratorClient';
import { QrCode, ShieldCheck, Zap, CheckCircle2 } from 'lucide-react';
import { PageHeader, Section, SectionHeading } from '@/components/ui/PublicPrimitives';

export const metadata: Metadata = {
  title: 'QR Code Generator Gratis dengan Logo Tengah | UKM Pilar Bangsa',
  description:
    'Buat QR Code kustom gratis tanpa iklan dan tanpa batas masa aktif. Pasang logo tengah (UKM Pilar Bangsa, Untag, WhatsApp, Instagram, Google Maps, Gemini AI, atau upload logo sendiri), atur warna gradien, dan unduh PNG HD 2048px / SVG.',
  keywords: [
    'QR Code Generator',
    'Buat QR Code dengan Logo',
    'Link to QR Code Gratis',
    'QR Code Generator Tanpa Iklan',
    'QR Code WhatsApp Generator',
    'QR Code Google Maps',
    'QR Code UKM Pilar Bangsa',
    'Untag Banyuwangi',
  ],
  alternates: {
    canonical: 'https://www.pilarbangsa.my.id/qr',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  openGraph: {
    title: 'Link to QR Code Generator Kustom dengan Logo | UKM Pilar Bangsa',
    description:
      'Ubah link website, WhatsApp, Google Maps, dan formulir menjadi QR Code berlogo secara instan. Gratis, tanpa redirect iklan, dan aktif selamanya.',
    url: 'https://www.pilarbangsa.my.id/qr',
    siteName: 'UKM Pilar Bangsa Untag Banyuwangi',
    locale: 'id_ID',
    type: 'website',
    images: [
      {
        url: 'https://www.pilarbangsa.my.id/qr/opengraph-image',
        width: 1200,
        height: 630,
        alt: 'QR Code Generator Kustom UKM Pilar Bangsa',
        type: 'image/png',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Link to QR Code Generator Kustom dengan Logo | UKM Pilar Bangsa',
    description:
      'Ubah link website, WhatsApp, Google Maps, dan formulir menjadi QR Code berlogo secara instan. Gratis, tanpa redirect iklan, dan aktif selamanya.',
    images: ['https://www.pilarbangsa.my.id/qr/opengraph-image'],
  },
};

export default function QrGeneratorPage() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebApplication',
        name: 'QR Code Generator Kustom UKM Pilar Bangsa',
        url: 'https://www.pilarbangsa.my.id/qr',
        applicationCategory: 'UtilitiesApplication',
        operatingSystem: 'All',
        offers: {
          '@type': 'Offer',
          price: '0',
          priceCurrency: 'IDR',
        },
        description:
          'Alat pembuat QR Code kustom gratis dengan template logo tengah (Pilar Bangsa, Maskot UKM, Untag, Google, Gemini, Google Maps, WhatsApp, Instagram) yang langsung mengarah ke URL tujuan tanpa perantara.',
      },
      {
        '@type': 'FAQPage',
        mainEntity: [
          {
            '@type': 'Question',
            name: 'Apakah QR Code yang dibuat memiliki batas waktu (kadaluarsa)?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'Tidak. QR Code yang dihasilkan bersifat Direct Static QR Code yang mengenkode langsung tautan tujuan Anda tanpa server perantara, sehingga aktif selamanya dan bebas iklan.',
            },
          },
          {
            '@type': 'Question',
            name: 'Apakah bisa menambahkan logo di tengah QR Code?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'Ya, tersedia 19 template logo siap pakai (Logo Pilar Bangsa, Maskot UKM, Untag, WhatsApp, Instagram, Google Maps, Google Gemini, YouTube, TikTok, dll.) serta fitur unggah logo sendiri dengan tingkat koreksi kesalahan Level H (30%).',
            },
          },
        ],
      },
    ],
  };

  return (
    <div className="w-full">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <PageHeader
        breadcrumbs={[
          { label: 'Beranda', href: '/' },
          { label: 'QR Code Generator' },
        ]}
        eyebrow="Direct Scan • Aktif Selamanya • Bebas Iklan"
        title="Link to QR Code Generator"
        description="Buat QR Code kustom beresolusi tinggi dengan logo resmi UKM Pilar Bangsa, Google, Gemini, WhatsApp, Instagram, Google Maps, atau logo Anda sendiri."
        meta={
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs sm:text-sm font-semibold text-gray-700">
            <span className="inline-flex items-center gap-1.5 text-[#008000]">
              <ShieldCheck className="w-4 h-4 shrink-0" aria-hidden="true" />
              <span>100% Proses Lokal di Browser</span>
            </span>
            <span className="inline-flex items-center gap-1.5 text-gray-700">
              <Zap className="w-4 h-4 shrink-0 text-[#E31837]" aria-hidden="true" />
              <span>Unduh PNG 2048px &amp; Vektor SVG</span>
            </span>
          </div>
        }
      />

      <Section tone="white" ariaLabel="Studio Kustomisasi QR Code">
        <QrGeneratorClient />
      </Section>

      <Section tone="muted" bordered ariaLabel="Keunggulan QR Code Generator">
        <div className="space-y-10">
          <div className="flex items-start gap-3">
            <QrCode className="w-6 h-6 text-[#E31837] shrink-0 mt-1" aria-hidden="true" />
            <SectionHeading
              title="Keunggulan QR Code Generator UKM Pilar Bangsa"
              description="Dirancang khusus untuk kebutuhan publikasi kegiatan kampus yang cepat, tahan lama, dan tajam untuk dicetak."
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-10 text-sm sm:text-base text-gray-600 leading-relaxed">
            <div className="border-t-2 border-[#008000] pt-4 space-y-2">
              <div className="font-bold text-gray-900 flex items-center gap-2">
                <CheckCircle2 size={16} className="text-[#008000] shrink-0" aria-hidden="true" />
                <span>Langsung Menuju Tujuan (Direct Scan)</span>
              </div>
              <p>
                QR Code mengenkode URL asli secara langsung tanpa layanan pemendek perantara. Pengunjung langsung tiba di halaman tujuan tanpa iklan dan QR aktif selamanya.
              </p>
            </div>

            <div className="border-t-2 border-[#E31837] pt-4 space-y-2">
              <div className="font-bold text-gray-900 flex items-center gap-2">
                <CheckCircle2 size={16} className="text-[#E31837] shrink-0" aria-hidden="true" />
                <span>Koreksi Kesalahan Level H (30%)</span>
              </div>
              <p>
                Menggunakan standar ISO/IEC 18004 Reed-Solomon Level H yang mampu memulihkan hingga 30% area matriks, sehingga penempatan logo di tengah tetap cepat dipindai.
              </p>
            </div>

            <div className="border-t-2 border-gray-400 pt-4 space-y-2">
              <div className="font-bold text-gray-900 flex items-center gap-2">
                <CheckCircle2 size={16} className="text-amber-600 shrink-0" aria-hidden="true" />
                <span>Kualitas Cetak Banner &amp; Spanduk</span>
              </div>
              <p>
                Mendukung pengunduhan PNG Ultra HD (2048×2048 piksel) maupun SVG Vektor murni yang tajam untuk dicetak pada poster kegiatan, sertifikat, maupun media sosial.
              </p>
            </div>
          </div>
        </div>
      </Section>
    </div>
  );
}

