import React from 'react';
import { Metadata } from 'next';
import QrGeneratorClient from '@/components/qr/QrGeneratorClient';
import { QrCode, ShieldCheck, Sparkles, Zap, CheckCircle2 } from 'lucide-react';

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
    <div className="space-y-12 max-w-7xl mx-auto px-2 sm:px-4 py-2 sm:py-6">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Hero Section */}
      <section className="bg-black text-white rounded-3xl p-8 sm:p-12 text-center relative overflow-hidden shadow-2xl">
        <div className="absolute inset-0 opacity-15 bg-[radial-gradient(#E31837_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none" />
        <div className="relative z-10 max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center space-x-2 px-4 py-1.5 rounded-full bg-red-950/80 text-[#FFD700] text-xs font-bold tracking-widest uppercase border border-red-800/60">
            <Sparkles className="w-3.5 h-3.5 text-[#FFD700]" />
            <span>Direct Scan • Aktif Selamanya • Bebas Iklan</span>
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight leading-tight">
            Link to QR Code Generator
          </h1>

          <p className="text-gray-300 text-sm sm:text-base md:text-lg max-w-2xl mx-auto leading-relaxed">
            Buat QR Code kustom beresolusi tinggi dengan logo resmi UKM Pilar Bangsa, Google, Gemini, WhatsApp, Instagram, Google Maps, atau logo Anda sendiri. Saat di-scan, kamera langsung menuju tautan tujuan.
          </p>

          <div className="pt-1 flex flex-wrap items-center justify-center gap-4 text-xs text-emerald-300 font-semibold">
            <span className="inline-flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 shrink-0" />
              <span>100% Proses Lokal di Browser</span>
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Zap className="w-4 h-4 shrink-0 text-[#FFD700]" />
              <span>Unduh PNG 2048px & Vektor SVG</span>
            </span>
          </div>
        </div>
      </section>

      {/* Main Interactive Studio */}
      <section aria-label="Studio Kustomisasi QR Code">
        <QrGeneratorClient />
      </section>

      {/* SEO & Panduan Singkat */}
      <section className="bg-gray-50 rounded-3xl border border-gray-100 p-6 sm:p-10 space-y-6">
        <div className="flex items-center gap-2.5">
          <QrCode className="w-6 h-6 text-[#E31837]" />
          <h2 className="text-xl sm:text-2xl font-extrabold text-gray-900">
            Keunggulan QR Code Generator UKM Pilar Bangsa
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm text-gray-600 leading-relaxed">
          <div className="bg-white p-5 rounded-2xl border border-gray-100 space-y-2">
            <div className="font-bold text-gray-900 flex items-center gap-2">
              <CheckCircle2 size={16} className="text-[#008000]" />
              <span>Langsung Menuju Tujuan (Direct Scan)</span>
            </div>
            <p>
              QR Code mengenkode URL asli secara langsung tanpa layanan pemendek perantara. Pengunjung yang memindai barcode akan langsung tiba di halaman tujuan tanpa jeda iklan dan QR tidak akan pernah kadaluarsa.
            </p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-gray-100 space-y-2">
            <div className="font-bold text-gray-900 flex items-center gap-2">
              <CheckCircle2 size={16} className="text-[#E31837]" />
              <span>Koreksi Kesalahan Level H (30%)</span>
            </div>
            <p>
              Menggunakan standar ISO/IEC 18004 Reed-Solomon Level H yang mampu memulihkan hingga 30% area matriks, sehingga penempatan logo di tengah barcode tetap sangat cepat dipindai oleh semua kamera ponsel.
            </p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-gray-100 space-y-2">
            <div className="font-bold text-gray-900 flex items-center gap-2">
              <CheckCircle2 size={16} className="text-[#D97706]" />
              <span>Kualitas Cetak Banner & Spanduk</span>
            </div>
            <p>
              Mendukung pengunduhan dalam format PNG Ultra HD (2048×2048 piksel) maupun SVG Vektor murni yang tajam untuk dicetak pada poster kegiatan, ID card kepanitiaan, sertifikat, maupun media sosial.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
