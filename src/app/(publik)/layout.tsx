import React from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { LogIn, Share2, Mail, Globe } from 'lucide-react'
import { ShareButton } from '@/components/ShareButton'

export default function PublikLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col bg-white text-gray-900 selection:bg-gray-900 selection:text-white">
      {/* Top Accent Line (Merah, Hijau, Kuning) */}
      <div className="h-1.5 w-full grid grid-cols-3">
        <div className="bg-[#E31837]"></div>
        <div className="bg-[#008000]"></div>
        <div className="bg-[#FFD700]"></div>
      </div>

      {/* Header / Navbar */}
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-gray-100 shadow-sm transition-all duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          {/* Logo & Brand */}
          <Link href="/" className="flex items-center space-x-3 group">
            <div className="flex items-center space-x-2">
              <div className="w-12 h-12 bg-black rounded-2xl flex items-center justify-center p-2 shadow-md group-hover:scale-105 transition-transform duration-300">
                <Image 
                  src="/logo_pilar.svg" 
                  alt="Logo Pilar Bangsa" 
                  width={36} 
                  height={36} 
                  className="object-contain invert"
                />
              </div>
              <div className="w-12 h-12 bg-white border border-gray-200 rounded-2xl flex items-center justify-center p-2 shadow-md group-hover:scale-105 transition-transform duration-300">
                <Image 
                  src="/logo-untag-fix.svg" 
                  alt="Logo Universitas" 
                  width={36} 
                  height={36} 
                  className="object-contain"
                />
              </div>
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-extrabold tracking-tight text-gray-900 group-hover:text-[#E31837] transition-colors duration-300">
                Pilar Bangsa
              </span>
              <span className="text-xs font-medium text-gray-500 uppercase tracking-widest">
                Digital Office
              </span>
            </div>
          </Link>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center space-x-8">
            <Link 
              href="/" 
              className="font-bold text-sm tracking-wide text-gray-800 hover:text-[#E31837] transition-colors py-2"
            >
              Beranda
            </Link>
            <Link 
              href="/tentang" 
              className="font-bold text-sm tracking-wide text-gray-800 hover:text-[#008000] transition-colors py-2"
            >
              Tentang Kami
            </Link>
            <Link 
              href="/program-kerja" 
              className="font-bold text-sm tracking-wide text-gray-800 hover:text-[#FFD700] transition-colors py-2"
            >
              Program Kerja
            </Link>
          </nav>

          {/* Login Button */}
          <div className="flex items-center">
            <Link 
              href="/login" 
              className="flex items-center space-x-2 bg-black hover:bg-gray-800 text-white font-bold px-6 py-2.5 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-0.5"
            >
              <LogIn className="w-4 h-4" />
              <span>Login Pengurus</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full py-8">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-black text-white border-t border-gray-800 mt-20">
        {/* Top Accent Line in Footer */}
        <div className="h-1 w-full grid grid-cols-3">
          <div className="bg-[#E31837]"></div>
          <div className="bg-[#008000]"></div>
          <div className="bg-[#FFD700]"></div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
            {/* Column 1: About */}
            <div className="md:col-span-2 space-y-6">
              <div className="flex items-center space-x-3">
                <div className="flex items-center space-x-2">
                  <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center p-2 shadow-md">
                    <Image 
                      src="/logo_pilar.svg" 
                      alt="Logo Pilar Bangsa" 
                      width={36} 
                      height={36} 
                      className="object-contain"
                    />
                  </div>
                  <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center p-2 shadow-md">
                    <Image 
                      src="/logo-untag-fix.svg" 
                      alt="Logo Universitas" 
                      width={36} 
                      height={36} 
                      className="object-contain"
                    />
                  </div>
                </div>
                <div className="flex flex-col">
                  <span className="text-2xl font-extrabold tracking-tight text-white">
                    Pilar Bangsa
                  </span>
                  <span className="text-xs font-medium text-gray-400 uppercase tracking-widest">
                    Portal Publik & Organisasi
                  </span>
                </div>
              </div>
              <p className="text-gray-400 text-base leading-relaxed max-w-md">
                UKM Pilar Bangsa berdiri pada 20 April 2021 sebagai wadah pembinaan kepemimpinan mahasiswa berlandaskan nilai-nilai luhur Pancasila, Tri Dharma Perguruan Tinggi, dan Trisakti Sukarno.
              </p>
              <div className="flex space-x-4 text-gray-400">
                <ShareButton />
                <a href="mailto:ukmpilarbangsa@gmail.com" title="Email UKM Pilar Bangsa" className="p-2 bg-gray-900 rounded-xl hover:text-white hover:bg-gray-800 transition-colors flex items-center gap-2 px-3 text-sm font-medium border border-gray-800 shadow-sm">
                  <Mail className="w-4 h-4 text-[#FFD700]" />
                  <span>Email</span>
                </a>
                <a href="https://www.instagram.com/ukmpilarbangsa?igsh=MWxtOHlhaGlrczNl" target="_blank" rel="noopener noreferrer" title="Instagram UKM Pilar Bangsa" className="p-2 bg-gray-900 rounded-xl hover:text-white hover:bg-gray-800 transition-colors flex items-center gap-2 px-3 text-sm font-medium border border-gray-800 shadow-sm">
                  <svg className="w-4 h-4 text-[#008000]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect width="20" height="20" x="2" y="2" rx="5" ry="5"/>
                    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
                    <line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/>
                  </svg>
                  <span>Instagram</span>
                </a>
              </div>
            </div>

            {/* Column 2: Quick Links */}
            <div className="space-y-6">
              <h3 className="text-lg font-bold text-white tracking-wide border-l-4 border-[#E31837] pl-3">
                Menu Utama
              </h3>
              <ul className="space-y-3.5 text-gray-400 font-medium">
                <li>
                  <Link href="/" className="hover:text-white transition-colors flex items-center space-x-2">
                    <span>Beranda</span>
                  </Link>
                </li>
                <li>
                  <Link href="/tentang" className="hover:text-white transition-colors flex items-center space-x-2">
                    <span>Tentang Kami</span>
                  </Link>
                </li>
                <li>
                  <Link href="/program-kerja" className="hover:text-white transition-colors flex items-center space-x-2">
                    <span>Program Kerja</span>
                  </Link>
                </li>
                <li>
                  <Link href="/login" className="hover:text-white transition-colors flex items-center space-x-2">
                    <span>Login Internal</span>
                  </Link>
                </li>
              </ul>
            </div>

            {/* Column 3: Kontak & Alamat */}
            <div className="space-y-6">
              <h3 className="text-lg font-bold text-white tracking-wide border-l-4 border-[#FFD700] pl-3">
                Sekretariat & Kontak
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
                    Jalan Laksda Jl. Adi Sucipto, Taman Baru, Banyuwangi Sub-District, Banyuwangi Regency, East Java 68416<br />
                    <span className="text-xs text-blue-400 underline mt-1 block">📍 Buka di Google Maps</span>
                  </a>
                </div>

                <div>
                  <p className="font-semibold text-white mb-1">WhatsApp (Sekretaris):</p>
                  <div className="space-y-2">
                    <a 
                      href="https://wa.me/6285607851580?text=Hai%20kak%2C%20saya%20berminat%20untuk%20bergabung%20di%20UKM%20Pilar%20Bangsa..." 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center space-x-2 text-gray-300 hover:text-[#008000] transition-colors"
                    >
                      <span className="w-2 h-2 rounded-full bg-[#008000]"></span>
                      <span>+62 856-0785-1580 (Sekre 1)</span>
                    </a>
                    <a 
                      href="https://wa.me/6283853945812?text=Hai%20kak%2C%20saya%20berminat%20untuk%20bergabung%20di%20UKM%20Pilar%20Bangsa..." 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center space-x-2 text-gray-300 hover:text-[#008000] transition-colors"
                    >
                      <span className="w-2 h-2 rounded-full bg-[#008000]"></span>
                      <span>+62 838-5394-5812 (Sekre 2)</span>
                    </a>
                  </div>
                </div>

                <div>
                  <p className="font-semibold text-white mb-1">Email Resmi:</p>
                  <a href="mailto:ukmpilarbangsa@gmail.com" className="hover:text-blue-400 transition-colors">
                    ukmpilarbangsa@gmail.com
                  </a>
                </div>
              </div>
            </div>
          </div>

          <div className="border-t border-gray-900 mt-12 pt-8 flex flex-col md:flex-row items-center justify-between text-sm text-gray-500">
            <p>&copy; 2026 UKM Pilar Bangsa. Seluruh hak cipta dilindungi.</p>
            <p className="mt-4 md:mt-0 flex items-center space-x-1">
              <span>Mewujudkan Organisasi Modern & Transparan</span>
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
