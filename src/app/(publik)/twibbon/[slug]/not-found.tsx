import React from 'react';
import Link from 'next/link';
import { ArrowLeft, ImageOff } from 'lucide-react';
import { Section } from '@/components/ui/PublicPrimitives';

export default function TwibbonNotFoundPage() {
  return (
    <Section tone="white" containerSize="narrow">
      <div className="py-8 sm:py-14 space-y-5 max-w-xl">
        <ImageOff className="w-10 h-10 text-[#E31837]" aria-hidden="true" />

        <div className="space-y-2">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900">
            Twibbon ini belum tersedia.
          </h1>
          <p className="text-sm sm:text-base text-gray-600 leading-relaxed">
            Kampanye twibbon yang Anda cari belum dipublikasikan atau tautannya sudah tidak berlaku.
          </p>
        </div>

        <div className="pt-2">
          <Link
            href="/twibbon"
            className="inline-flex items-center justify-center gap-2 min-h-[44px] px-5 py-2.5 rounded-lg bg-[#E31837] hover:bg-red-700 text-white text-sm font-semibold transition-colors"
          >
            <ArrowLeft size={16} aria-hidden="true" />
            <span>Kembali ke Daftar Twibbon</span>
          </Link>
        </div>
      </div>
    </Section>
  );
}
