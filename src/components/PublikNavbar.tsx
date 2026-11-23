"use client";

import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X, Home, Users, Briefcase, Archive, ArrowRight, Calendar } from "lucide-react";

export function PublikNavbar() {
  const pathname = usePathname();
  const [menuOpenPath, setMenuOpenPath] = useState<string | null>(null);
  const isMobileMenuOpen = menuOpenPath === pathname;
  const [isNavigating, setIsNavigating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isScrolled, setIsScrolled] = useState(false);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const headerContainerRef = useRef<HTMLElement>(null);
  const progressTimersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  // Deteksi scroll via IntersectionObserver sentinel tanpa scroll listener
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel || typeof IntersectionObserver === "undefined") return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsScrolled(!entry.isIntersecting);
      },
      {
        root: null,
        threshold: 0,
        rootMargin: "12px 0px 0px 0px",
      }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, []);

  // Tutup menu mobile dengan Escape atau klik/tap di luar header
  useEffect(() => {
    if (!isMobileMenuOpen) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setMenuOpenPath(null);
      }
    };

    const onPointerDown = (e: PointerEvent) => {
      if (
        headerContainerRef.current &&
        e.target instanceof Node &&
        !headerContainerRef.current.contains(e.target)
      ) {
        setMenuOpenPath(null);
      }
    };

    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("pointerdown", onPointerDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("pointerdown", onPointerDown);
    };
  }, [isMobileMenuOpen]);

  // Selesaikan progress bar navigasi setelah rute berubah (callback async agar tidak memicu cascading render)
  useEffect(() => {
    progressTimersRef.current.forEach(clearTimeout);
    progressTimersRef.current = [];
    const finishTimer = setTimeout(() => {
      setProgress(100);
    }, 0);
    const resetTimer = setTimeout(() => {
      setIsNavigating(false);
      setProgress(0);
    }, 200);
    return () => {
      clearTimeout(finishTimer);
      clearTimeout(resetTimer);
    };
  }, [pathname]);

  const handleLinkClick = (href: string) => {
    setMenuOpenPath(null);
    if (pathname === href) {
      return;
    }
    progressTimersRef.current.forEach(clearTimeout);
    setIsNavigating(true);
    setProgress(30);

    const step1 = setTimeout(() => setProgress(70), 100);
    const step2 = setTimeout(() => setProgress(90), 300);
    progressTimersRef.current = [step1, step2];
  };

  const navItems = [
    { href: "/", label: "Beranda", icon: <Home size={18} aria-hidden="true" /> },
    { href: "/tentang-kami", label: "Tentang Kami", icon: <Users size={18} aria-hidden="true" /> },
    { href: "/kegiatan", label: "Kegiatan", icon: <Calendar size={18} aria-hidden="true" /> },
    { href: "/program-kerja", label: "Program Kerja", icon: <Briefcase size={18} aria-hidden="true" /> },
    { href: "/arsip", label: "Arsip UKM", icon: <Archive size={18} aria-hidden="true" /> },
  ];

  return (
    <>
      <div ref={sentinelRef} aria-hidden="true" className="h-px w-full pointer-events-none" />

      {isNavigating && (
        <div
          className="fixed top-0 left-0 right-0 z-[100] h-1 bg-transparent overflow-hidden"
          aria-hidden="true"
        >
          <div
            className="h-full bg-gradient-to-r from-[#E31837] via-[#FFD700] to-[#008000] transition-all duration-300 ease-out motion-reduce:transition-none"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}

      <header
        ref={headerContainerRef}
        className={`sticky top-0 z-50 w-full bg-white/95 backdrop-blur-sm border-b border-gray-200 transition-shadow duration-200 motion-reduce:transition-none [overflow-anchor:none] ${
          isScrolled ? "shadow-sm" : ""
        }`}
      >
        <div className="max-w-6xl mx-auto px-5 sm:px-8 h-14 md:h-16 flex items-center justify-between gap-4">
          {/* Logo Untag (kiri) + Logo UKM Pilar Bangsa (kanan) */}
          <Link
            href="/"
            prefetch={true}
            onClick={() => handleLinkClick("/")}
            className="flex items-center gap-2.5 group rounded-lg py-1 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#E31837]"
          >
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 md:w-9 md:h-9 flex items-center justify-center shrink-0">
                <Image
                  src="/logo_untag.svg"
                  alt="Logo Universitas 17 Agustus 1945 Banyuwangi"
                  width={36}
                  height={36}
                  loading="eager"
                  className="object-contain w-full h-full"
                />
              </div>
              <div className="w-8 h-8 md:w-9 md:h-9 flex items-center justify-center shrink-0">
                <Image
                  src="/logo_pilar.svg"
                  alt="Logo UKM Pilar Bangsa"
                  width={36}
                  height={36}
                  loading="eager"
                  className="object-contain w-full h-full"
                />
              </div>
            </div>
            <div className="flex flex-col leading-tight">
              <span className="font-extrabold tracking-tight text-gray-900 text-base md:text-lg group-hover:text-[#E31837] transition-colors">
                Pilar Bangsa
              </span>
              <span className="hidden sm:block text-[10px] font-semibold text-gray-500 uppercase tracking-widest">
                Digital Office
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Bar */}
          <nav aria-label="Utama" className="hidden md:flex items-center gap-6 h-full">
            {navItems.map((item) => {
              const isActive =
                pathname === item.href ||
                (item.href !== "/" && pathname.startsWith(`${item.href}/`));
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  prefetch={true}
                  aria-current={isActive ? "page" : undefined}
                  onClick={() => handleLinkClick(item.href)}
                  className={`inline-flex items-center h-full text-sm font-semibold border-b-2 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#E31837] ${
                    isActive
                      ? "text-[#E31837] border-[#E31837]"
                      : "text-gray-700 hover:text-gray-900 border-transparent hover:border-gray-300"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {/* Mobile Hamburger Toggle */}
          <button
            type="button"
            onClick={() => setMenuOpenPath(isMobileMenuOpen ? null : pathname)}
            className="md:hidden inline-flex items-center justify-center min-w-[44px] min-h-[44px] rounded-lg text-gray-700 hover:text-gray-900 hover:bg-gray-100 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#E31837]"
            aria-label={isMobileMenuOpen ? "Tutup Menu" : "Buka Menu"}
            aria-expanded={isMobileMenuOpen}
            aria-controls="publik-mobile-menu"
          >
            {isMobileMenuOpen ? (
              <X size={22} aria-hidden="true" />
            ) : (
              <Menu size={22} aria-hidden="true" />
            )}
          </button>
        </div>

        {/* Mobile Full-Width Menu Panel */}
        {isMobileMenuOpen && (
          <nav
            id="publik-mobile-menu"
            aria-label="Utama Seluler"
            className="md:hidden w-full border-t border-gray-200 bg-white shadow-md"
          >
            {navItems.map((item) => {
              const isActive =
                pathname === item.href ||
                (item.href !== "/" && pathname.startsWith(`${item.href}/`));
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  prefetch={true}
                  aria-current={isActive ? "page" : undefined}
                  onClick={() => handleLinkClick(item.href)}
                  className={`flex items-center justify-between min-h-[48px] px-5 sm:px-8 py-3 border-b border-gray-100 last:border-b-0 text-base font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[#E31837] ${
                    isActive
                      ? "text-[#E31837] bg-red-50/50 border-l-4 border-l-[#E31837]"
                      : "text-gray-800 hover:bg-gray-50"
                  }`}
                >
                  <span className="flex items-center gap-3">
                    {item.icon}
                    <span>{item.label}</span>
                  </span>
                  {isActive && (
                    <ArrowRight size={16} className="text-[#E31837]" aria-hidden="true" />
                  )}
                </Link>
              );
            })}
          </nav>
        )}
      </header>
    </>
  );
}
