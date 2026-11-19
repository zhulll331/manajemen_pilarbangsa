"use client";

import { useState, useEffect, Suspense } from "react";
import { usePathname } from "next/navigation";
import Image from "next/image";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";
import { UploadQueueProvider } from "@/context/UploadQueueContext";
import { UploadQueueWidget } from "./UploadQueueWidget";
import { PilarLoader } from "./PilarLoader";

function DashboardMainSkeleton() {
  return (
    <div className="flex flex-col items-center justify-center w-full min-h-[calc(100dvh-190px)] gap-3.5 text-center">
      <PilarLoader size="md" label="Memuat halaman dashboard" />
      <p className="text-xs font-medium text-[#686e68] tracking-wide">
        Sabarr yah...
      </p>
    </div>
  );
}

export function DashboardLayoutClient({
  children,
  role,
  name,
}: {
  children: React.ReactNode;
  role: string;
  name: string;
}) {
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const pathname = usePathname();
  const isOverview = ["/dashboard/ketua", "/dashboard/sekretaris", "/dashboard/bendahara"].includes(pathname);

  useEffect(() => {
    const desktop = window.matchMedia("(min-width: 768px)");
    const closeOnDesktop = () => { if (desktop.matches) setSidebarOpen(false); };
    desktop.addEventListener("change", closeOnDesktop);
    return () => desktop.removeEventListener("change", closeOnDesktop);
  }, []);

  return (
    <UploadQueueProvider>
      <div className="admin-shell">
        <a className="admin-skip-link" href="#admin-main">Langsung ke konten</a>
        <Sidebar role={role} isOpen={isSidebarOpen} setIsOpen={setSidebarOpen} expanded={expanded} onToggleExpanded={() => setExpanded(value => !value)} />
        <div className="admin-workspace" inert={isSidebarOpen || undefined}>
          <Header 
            role={role} 
            name={name} 
            isMenuOpen={isSidebarOpen}
            onMenuClick={() => setSidebarOpen(true)} 
          />
          <main id="admin-main" className="admin-content" tabIndex={-1}>
            {isOverview && <section className="admin-welcome" aria-label="Selamat datang">
              <div><p className="admin-eyebrow">PILAR BANGSA DIGITAL OFFICE</p><h1>Bergerak bersama,<br className="admin-mobile-break" /> berdampak nyata.</h1><p>Selamat datang, {name}. Mari lihat perkembangan organisasi hari ini.</p></div>
              <div className="admin-welcome-seal"><Image src="/logo_untag.svg" alt="Universitas 17 Agustus 1945 Banyuwangi" width={48} height={48} /><span>BERKOLABORASI.<br /><strong>BERKONTRIBUSI.</strong></span></div>
            </section>}
            <Suspense fallback={<DashboardMainSkeleton />}>
              {children}
            </Suspense>
          </main>
        </div>
        <UploadQueueWidget />
      </div>
    </UploadQueueProvider>
  );
}
