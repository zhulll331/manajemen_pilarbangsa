"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X, Home, Users, Briefcase, Archive, ArrowRight, Calendar } from "lucide-react";

export function PublikNavbar() {
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isScrolled, setIsScrolled] = useState(false);

  // Shrink on scroll
  useEffect(() => {
    const onScroll = () => setIsScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

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
    { href: "/kegiatan", label: "Kegiatan", icon: <Calendar size={18} /> },
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

      {/* Floating pill navbar (backdrop blur + shrink on scroll) */}
      <div className="sticky top-0 z-50 px-3 sm:px-6 pointer-events-none">
        <div
          className={`relative mx-auto pointer-events-auto transition-all duration-300 ease-out ${
            isScrolled ? "max-w-4xl mt-2" : "max-w-6xl mt-3 sm:mt-4"
          }`}
        >
          <header
            className={`flex items-center justify-between rounded-full border backdrop-blur-xl transition-all duration-300 ease-out ${
              isScrolled
                ? "h-14 pl-3 pr-2 sm:pl-4 bg-white/70 border-white/60 shadow-lg shadow-black/10"
                : "h-[72px] pl-4 pr-3 sm:pl-6 bg-white/80 border-gray-200/70 shadow-md shadow-black/5"
            }`}
          >
            {/* Logo & Brand: Untag (kiri) — UKM Pilar Bangsa (kanan) */}
            <Link
              href="/"
              prefetch={true}
              onClick={() => handleLinkClick("/")}
              className="flex items-center gap-2 sm:gap-3 group"
            >
              <div className="flex items-center gap-1.5 sm:gap-2">
                <div
                  className={`flex items-center justify-center shrink-0 transition-all duration-300 group-hover:scale-105 ${
                    isScrolled ? "w-8 h-8 sm:w-9 sm:h-9" : "w-10 h-10 sm:w-12 sm:h-12"
                  }`}
                >
                  <Image
                    src="/logo_untag.svg"
                    alt="Logo Universitas 17 Agustus 1945 Banyuwangi"
                    width={48}
                    height={48}
                    className="object-contain w-full h-full drop-shadow-sm"
                    priority
                  />
                </div>
                <div
                  className={`flex items-center justify-center shrink-0 transition-all duration-300 group-hover:scale-105 ${
                    isScrolled ? "w-8 h-8 sm:w-9 sm:h-9" : "w-10 h-10 sm:w-12 sm:h-12"
                  }`}
                >
                  <Image
                    src="/logo_pilar.svg"
                    alt="Logo UKM Pilar Bangsa"
                    width={48}
                    height={48}
                    className="object-contain w-full h-full drop-shadow-sm"
                    priority
                  />
                </div>
              </div>
              <div className="flex flex-col leading-tight">
                <span
                  className={`font-extrabold tracking-tight text-gray-900 group-hover:text-[#E31837] transition-all duration-300 ${
                    isScrolled ? "text-sm sm:text-base" : "text-base sm:text-xl"
                  }`}
                >
                  Pilar Bangsa
                </span>
                <span
                  className={`hidden sm:block text-[10px] font-medium text-gray-500 uppercase tracking-widest overflow-hidden transition-all duration-300 ${
                    isScrolled ? "max-h-0 opacity-0" : "max-h-4 opacity-100"
                  }`}
                >
                  Digital Office
                </span>
              </div>
            </Link>

            {/* Desktop Navigation Links */}
            <nav className="hidden md:flex items-center gap-1">
              {navItems.map((item) => {
                const isActive =
                  pathname === item.href ||
                  (item.href !== "/" && pathname.startsWith(`${item.href}/`));
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    prefetch={true}
                    onClick={() => handleLinkClick(item.href)}
                    className={`font-bold text-sm tracking-wide rounded-full transition-all duration-200 ${
                      isScrolled ? "px-3 py-1.5" : "px-4 py-2"
                    } ${
                      isActive
                        ? "text-[#E31837] bg-red-50/90"
                        : "text-gray-700 hover:text-gray-900 hover:bg-gray-900/5"
                    }`}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </nav>

            {/* Mobile Toggle */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2.5 rounded-full text-gray-700 hover:text-gray-900 hover:bg-gray-900/5 transition-colors"
              aria-label="Buka Menu"
              aria-expanded={isMobileMenuOpen}
            >
              {isMobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </header>

          {/* Mobile Navigation Dropdown (floating card) */}
          {isMobileMenuOpen && (
            <div className="md:hidden absolute left-0 right-0 top-full mt-2 rounded-3xl border border-white/60 bg-white/85 backdrop-blur-xl p-3 space-y-1 shadow-xl shadow-black/10 animate-in slide-in-from-top-2 duration-200">
              {navItems.map((item) => {
                const isActive =
                  pathname === item.href ||
                  (item.href !== "/" && pathname.startsWith(`${item.href}/`));
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    prefetch={true}
                    onClick={() => handleLinkClick(item.href)}
                    className={`flex items-center justify-between px-4 py-3 rounded-2xl font-bold text-sm transition-colors ${
                      isActive
                        ? "text-[#E31837] bg-red-50 font-extrabold"
                        : "text-gray-700 hover:bg-gray-900/5"
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
        </div>
      </div>    </>
  );
}
