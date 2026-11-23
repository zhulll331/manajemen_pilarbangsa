import React, { Suspense } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Mail } from 'lucide-react';
import { ShareButton } from '@/components/ShareButton';
import { PublikNavbar } from '@/components/PublikNavbar';
import PublikLoading from './loading';

export default function PublikLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col bg-white text-gray-900 selection:bg-gray-900 selection:text-white [overflow-anchor:none]">
      <a href="#publik-main" className="publik-skip-link">
        Langsung ke konten utama
      </a>

      {/* Header & Navbar Standar Penuh Lebar */}
      <PublikNavbar />

      {/* Main Content Full-Width (kontainer diatur per section/halaman) */}
      <main id="publik-main" tabIndex={-1} className="flex-grow w-full outline-none">
        <Suspense fallback={<PublikLoading />}>
          {children}
        </Suspense>
      </main>

      {/* Footer Penuh Lebar */}
      <footer className="bg-black text-white border-t border-gray-800">
        {/* Garis 3 Warna Brand UKM Pilar Bangsa */}
        <div className="h-1 w-full grid grid-cols-3" aria-hidden="true">
          <div className="bg-[#E31837]" />
          <div className="bg-[#008000]" />
          <div className="bg-[#FFD700]" />
        </div>

        <div className="max-w-6xl mx-auto px-5 sm:px-8 py-12 md:py-16">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-10 md:gap-12">
            {/* Kolom 1: Identitas Organisasi */}
            <div className="md:col-span-2 space-y-5">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-11 h-11 flex items-center justify-center shrink-0">
                    <Image
                      src="/logo_untag.svg"
                      alt="Logo Universitas 17 Agustus 1945 Banyuwangi"
                      width={44}
                      height={44}
                      className="object-contain w-full h-full"
                    />
                  </div>
                  <div className="w-11 h-11 flex items-center justify-center shrink-0">
                    <Image
                      src="/logo_pilar.svg"
                      alt="Logo UKM Pilar Bangsa"
                      width={44}
                      height={44}
                      className="object-contain w-full h-full"
                    />
                  </div>
                </div>
                <div className="flex flex-col">
                  <span className="text-xl font-extrabold tracking-tight text-white">
                    Pilar Bangsa
                  </span>
                  <span className="text-xs font-medium text-gray-400 uppercase tracking-widest">
                    Portal Publik &amp; Organisasi
                  </span>
                </div>
              </div>

              <p className="text-gray-400 text-sm sm:text-base leading-relaxed max-w-md">
                UKM Pilar Bangsa berdiri pada 20 April 2021 sebagai wadah pembinaan kepemimpinan mahasiswa berlandaskan nilai-nilai luhur Pancasila, Tri Dharma Perguruan Tinggi, dan Trisakti Sukarno.
              </p>

              <div className="flex flex-wrap items-center gap-3 text-gray-300">
                <ShareButton />
                <a
                  href="mailto:ukmpilarbangsa@gmail.com"
                  title="Email UKM Pilar Bangsa"
                  className="inline-flex items-center gap-2 min-h-[40px] px-3.5 py-2 bg-gray-900 rounded-lg hover:text-white hover:bg-gray-800 transition-colors text-sm font-medium border border-gray-800"
                >
                  <Mail className="w-4 h-4 text-[#FFD700]" aria-hidden="true" />
                  <span>Email</span>
                </a>
                <a
                  href="https://www.instagram.com/ukmpilarbangsa?igsh=MWxtOHlhaGlrczNl"
                  target="_blank"
                  rel="noopener noreferrer"
                  title="Instagram UKM Pilar Bangsa"
                  className="inline-flex items-center gap-2 min-h-[40px] px-3.5 py-2 bg-gray-900 rounded-lg hover:text-white hover:bg-gray-800 transition-colors text-sm font-medium border border-gray-800"
                >
                  <svg
                    className="w-4 h-4 text-[#008000]"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
                    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                    <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
                  </svg>
                  <span>Instagram</span>
                </a>
              </div>
            </div>

            {/* Kolom 2: Navigasi Menu */}
            <div className="space-y-4">
              <h3 className="text-base font-bold text-white tracking-wide border-l-4 border-[#E31837] pl-3">
                Menu Utama
              </h3>
              <ul className="space-y-2.5 text-gray-400 font-medium text-sm sm:text-base">
                <li>
                  <Link href="/" className="hover:text-white transition-colors inline-block py-1">
                    Beranda
                  </Link>
                </li>
                <li>
                  <Link
                    href="/tentang-kami"
                    className="hover:text-white transition-colors inline-block py-1"
                  >
                    Tentang Kami
                  </Link>
                </li>
                <li>
                  <Link
                    href="/kegiatan"
                    className="hover:text-white transition-colors inline-block py-1"
                  >
                    Kegiatan
                  </Link>
                </li>
                <li>
                  <Link
                    href="/twibbon"
                    className="hover:text-white transition-colors inline-block py-1"
                  >
                    Twibbon
                  </Link>
                </li>
                <li>
                  <Link
                    href="/program-kerja"
                    className="hover:text-white transition-colors inline-block py-1"
                  >
                    Program Kerja
                  </Link>
                </li>
                <li>
                  <Link href="/arsip" className="hover:text-white transition-colors inline-block py-1">
                    Arsip UKM
                  </Link>
                </li>
                <li>
                  <Link
                    href="/qr"
                    className="hover:text-[#FFD700] transition-colors inline-block py-1"
                  >
                    QR Code Generator
                  </Link>
                </li>
              </ul>
            </div>

            {/* Kolom 3: Kontak & Alamat */}
            <div className="space-y-4">
              <h3 className="text-base font-bold text-white tracking-wide border-l-4 border-[#FFD700] pl-3">
                Sekretariat &amp; Kontak
              </h3>
              <div className="space-y-4 text-gray-400 text-sm leading-relaxed">
                <div>
                  <p className="font-semibold text-white mb-1">Alamat Sekretariat:</p>
                  <a
                    href="https://maps.app.goo.gl/Kqw7VtiUXvSuqFFS6"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-[#FFD700] transition-colors inline-block"
                  >
                    Jalan Laksda Jl. Adi Sucipto, Taman Baru, Kec. Banyuwangi, Kabupaten Banyuwangi, Jawa Timur 68416
                    <span className="text-xs text-blue-400 underline mt-1 block">
                      Buka di Google Maps
                    </span>
                  </a>
                </div>

                <div>
                  <p className="font-semibold text-white mb-1.5">WhatsApp (Sekretaris):</p>
                  <div className="space-y-2">
                    <a
                      href="https://wa.me/6285607851580?text=Hai%20kak%2C%20saya%20berminat%20untuk%20bergabung%20di%20UKM%20Pilar%20Bangsa..."
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-gray-300 hover:text-[#38C172] transition-colors py-0.5"
                    >
                      <span className="w-2 h-2 rounded-full bg-[#008000] shrink-0" />
                      <span>+62 856-0785-1580 (Sekre 1)</span>
                    </a>
                    <a
                      href="https://wa.me/6283853945812?text=Hai%20kak%2C%20saya%20berminat%20untuk%20bergabung%20di%20UKM%20Pilar%20Bangsa..."
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-gray-300 hover:text-[#38C172] transition-colors py-0.5"
                    >
                      <span className="w-2 h-2 rounded-full bg-[#008000] shrink-0" />
                      <span>+62 838-5394-5812 (Sekre 2)</span>
                    </a>
                  </div>
                </div>

                <div>
                  <p className="font-semibold text-white mb-1">Email Resmi:</p>
                  <a
                    href="mailto:ukmpilarbangsa@gmail.com"
                    className="break-all hover:text-blue-400 transition-colors"
                  >
                    ukmpilarbangsa@gmail.com
                  </a>
                </div>
              </div>
            </div>
          </div>

          <div className="border-t border-gray-800 mt-10 pt-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-sm text-gray-500">
            <p>&copy; 2026 UKM Pilar Bangsa. Seluruh hak cipta dilindungi.</p>
            <p>Mewujudkan Organisasi Modern &amp; Transparan</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
