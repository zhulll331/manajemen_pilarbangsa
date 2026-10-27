import React from 'react';
import Link from 'next/link';
import { ArrowLeft, ImageOff } from 'lucide-react';

export default function TwibbonNotFoundPage() {
  return (
    <div className="max-w-xl mx-auto px-4 sm:px-6 py-12 sm:py-20">
      <div className="bg-white rounded-3xl border border-gray-100 shadow-lg p-8 sm:p-12 text-center space-y-6">
        <div className="w-16 h-16 rounded-2xl bg-red-50 text-[#E31837] flex items-center justify-center mx-auto">
          <ImageOff className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <h1 className="text-xl sm:text-2xl font-extrabold text-gray-900">
            Twibbon ini belum tersedia. Kembali ke daftar twibbon.
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 leading-relaxed">
            Kampanye twibbon yang Anda cari belum dipublikasikan atau tautannya sudah tidak berlaku.
          </p>
        </div>

        <div className="pt-2">
          <Link
            href="/twibbon"
            className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl bg-[#E31837] hover:bg-red-700 text-white text-xs sm:text-sm font-extrabold transition-all shadow-md"
          >
            <ArrowLeft size={16} />
            <span>Kembali ke Daftar Twibbon</span>
          </Link>
        </div>
      </div>
    </div>
  );
}

