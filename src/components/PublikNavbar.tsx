"use client";

import React, { useState, useEffect, useTransition } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LogIn, Menu, X, Home, Users, Briefcase, Archive, ArrowRight } from "lucide-react";

export function PublikNavbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);
  const [progress, setProgress] = useState(0);

  // Close mobile menu & reset navigation progress on pathname change
  useEffect(() => {
    setIsMobileMenuOpen(false);
    setProgress(100);
    const timer = setTimeout(() => {
      setIsNavigating(false);
      setProgress(0);
    }, 200);
    return () => clearTimeout(timer);
  }, [pathname]);

  // Handler for link clicks to provide immediate visual feedback
  const handleLinkClick = (href: string) => {
    if (pathname === href) return;
    setIsNavigating(true);
    setProgress(30);

    const step1 = setTimeout(() => setProgress(70), 100);
    const step2 = setTimeout(() => setProgress(90), 300);

    return () => {
      clearTimeout(step1);
      clearTimeout(step2);
    };
  };

  const navItems = [
    { href: "/", label: "Beranda", icon: <Home size={18} /> },
    { href: "/tentang-kami", label: "Tentang Kami", icon: <Users size={18} /> },
    { href: "/program-kerja", label: "Program Kerja", icon: <Briefcase size={18} /> },
    { href: "/arsip", label: "Arsip UKM", icon: <Archive size={18} /> },
  ];

  return (
    <>
      {/* Top Animated Progress Bar for instant navigation feedback */}
      {isNavigating && (
        <div className="fixed top-0 left-0 right-0 z-[100] h-1 bg-transparent overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-[#E31837] via-[#FFD700] to-[#008000] transition-all duration-300 ease-out shadow-sm"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}

      {/* Top Accent Line (Merah, Hijau, Kuning) */}
      <div className="h-1.5 w-full grid grid-cols-3">
        <div className="bg-[#E31837]"></div>
        <div className="bg-[#008000]"></div>
        <div className="bg-[#FFD700]"></div>
      </div>

      {/* Header / Navbar */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-gray-100 shadow-sm transition-all duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          {/* Logo & Brand */}
          <Link 
            href="/" 
            prefetch={true}
            onClick={() => handleLinkClick("/")}
            className="flex items-center space-x-2 sm:space-x-3 group"
          >
            <div className="flex items-center space-x-2 sm:space-x-3">
              <div className="w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center group-hover:scale-105 transition-transform duration-300">
                <Image 
                  src="/logo_pilar.svg" 
                  alt="Logo Pilar Bangsa" 
                  width={48} 
                  height={48} 
                  className="object-contain w-full h-full drop-shadow-sm"
                  priority
                />
              </div>
              <div className="w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center group-hover:scale-105 transition-transform duration-300">
                <Image 
                  src="/logo_untag.svg" 
                  alt="Logo Universitas" 
                  width={48} 
                  height={48} 
                  className="object-contain w-full h-full drop-shadow-sm scale-[1.25]"
                  priority
                />
              </div>
            </div>
            <div className="flex flex-col">
              <span className="text-base sm:text-xl font-extrabold tracking-tight text-gray-900 group-hover:text-[#E31837] transition-colors duration-300">
                Pilar Bangsa
              </span>
              <span className="hidden sm:block text-[10px] sm:text-xs font-medium text-gray-500 uppercase tracking-widest">
                Digital Office
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center space-x-2 lg:space-x-3">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link 
                  key={item.href}
                  href={item.href}
                  prefetch={true}
                  onClick={() => handleLinkClick(item.href)}
                  className={`relative font-bold text-sm tracking-wide px-4 py-2 rounded-xl transition-all duration-200 ${
                    isActive
                      ? "text-[#E31837] bg-red-50/80 shadow-xs"
                      : "text-gray-700 hover:text-gray-900 hover:bg-gray-50"
                  }`}
                >
                  {item.label}
                  {isActive && (
                    <span className="absolute bottom-1 left-4 right-4 h-0.5 bg-[#E31837] rounded-full" />
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Desktop Action & Mobile Toggle */}
          <div className="flex items-center gap-3">
            <Link 
              href="/login" 
              prefetch={true}
              onClick={() => handleLinkClick("/login")}
              className="flex items-center space-x-1.5 sm:space-x-2 bg-black hover:bg-gray-800 text-white font-bold px-4 py-2 sm:px-6 sm:py-2.5 rounded-xl shadow-md hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5 active:translate-y-0"
            >
              <LogIn className="w-4 h-4" />
              <span className="hidden sm:inline">Login Pengurus</span>
            </Link>

            {/* Mobile Hamburger Button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2 rounded-xl text-gray-700 hover:text-gray-900 hover:bg-gray-100 transition-colors"
              aria-label="Buka Menu"
            >
              {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Dropdown */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-gray-100 bg-white/95 backdrop-blur-lg px-4 py-4 space-y-2 shadow-lg animate-in slide-in-from-top-2 duration-200">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  prefetch={true}
                  onClick={() => handleLinkClick(item.href)}
                  className={`flex items-center justify-between px-4 py-3 rounded-xl font-bold text-sm transition-colors ${
                    isActive
                      ? "text-[#E31837] bg-red-50 font-extrabold"
                      : "text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {item.icon}
                    <span>{item.label}</span>
                  </div>
                  {isActive && <ArrowRight size={16} className="text-[#E31837]" />}
                </Link>
              );
            })}
          </div>
        )}
      </header>
    </>
  );
}
