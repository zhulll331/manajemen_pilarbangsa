"use client";

import { useState, useEffect, Suspense } from "react";
import { usePathname } from "next/navigation";
import Image from "next/image";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";
import { UploadQueueProvider } from "@/context/UploadQueueContext";
import { UploadQueueWidget } from "./UploadQueueWidget";

function DashboardMainSkeleton() {
  return (
    <div className="space-y-6 animate-pulse w-full">
      {/* Header skeleton */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-2">
          <div className="h-8 w-48 bg-gray-200 rounded-lg"></div>
          <div className="h-4 w-72 bg-gray-100 rounded-md"></div>
        </div>
        <div className="h-10 w-32 bg-gray-200 rounded-xl"></div>
      </div>

      {/* Stats Cards Skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <div className="h-4 w-20 bg-gray-200 rounded"></div>
              <div className="h-8 w-8 bg-gray-100 rounded-full"></div>
            </div>
            <div className="h-7 w-28 bg-gray-200 rounded"></div>
            <div className="h-3 w-36 bg-gray-100 rounded"></div>
          </div>
        ))}
      </div>

      {/* Content Area Skeleton */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
        <div className="flex items-center justify-between pb-4 border-b border-gray-100">
          <div className="h-6 w-36 bg-gray-200 rounded"></div>
          <div className="h-8 w-24 bg-gray-100 rounded-lg"></div>
        </div>
        <div className="space-y-3 pt-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 bg-gray-100 rounded-xl"></div>
                <div className="space-y-1.5">
                  <div className="h-4 w-40 bg-gray-200 rounded"></div>
                  <div className="h-3 w-24 bg-gray-100 rounded"></div>
                </div>
              </div>
              <div className="h-6 w-16 bg-gray-100 rounded-full"></div>
            </div>
          ))}
        </div>
      </div>
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
