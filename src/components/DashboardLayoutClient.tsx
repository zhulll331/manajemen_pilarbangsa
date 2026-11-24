"use client";

import { useState, useEffect, Suspense, useTransition } from "react";
import { usePathname, useRouter } from "next/navigation";
import Image from "next/image";
import { Lock, RotateCcw } from "lucide-react";
import { selectDashboardPeriodAction } from "@/app/dashboard/periode/actions";
import type { OrganizationPeriod } from "@/lib/periods/types";
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
  periods = [],
  selectedPeriod,
  activePeriod,
  isLocked = false,
  schemaReady = false,
}: {
  children: React.ReactNode;
  role: string;
  name: string;
  periods?: OrganizationPeriod[];
  selectedPeriod?: OrganizationPeriod;
  activePeriod?: OrganizationPeriod;
  isLocked?: boolean;
  schemaReady?: boolean;
}) {
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [returningToActive, startTransition] = useTransition();
  const pathname = usePathname();
  const router = useRouter();
  const isOverview = ["/dashboard/ketua", "/dashboard/sekretaris", "/dashboard/bendahara"].includes(pathname);

  useEffect(() => {
    const desktop = window.matchMedia("(min-width: 768px)");
    const closeOnDesktop = () => { if (desktop.matches) setSidebarOpen(false); };
    desktop.addEventListener("change", closeOnDesktop);
    return () => desktop.removeEventListener("change", closeOnDesktop);
  }, []);

  const handleReturnActive = () => {
    if (!activePeriod) return;
    startTransition(async () => {
      await selectDashboardPeriodAction(activePeriod.id);
      router.refresh();
    });
  };

  return (
    <UploadQueueProvider>
      <div className="admin-shell">
        <a className="admin-skip-link" href="#admin-main">Langsung ke konten</a>
        <Sidebar role={role} isOpen={isSidebarOpen} setIsOpen={setSidebarOpen} />
        <div className="admin-workspace" inert={isSidebarOpen || undefined}>
          <Header
            role={role}
            name={name}
            isMenuOpen={isSidebarOpen}
            onMenuClick={() => setSidebarOpen(true)}
            periods={periods}
            selectedPeriod={selectedPeriod}
            schemaReady={schemaReady}
          />
          <main id="admin-main" className="admin-content" tabIndex={-1}>
            {isLocked && selectedPeriod && (
              <div
                role="status"
                className="mb-5 px-4 py-3 rounded-2xl bg-amber-50 border border-amber-300 text-amber-950 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="flex items-start sm:items-center gap-2.5 text-sm">
                  <Lock size={18} className="shrink-0 text-amber-700 mt-0.5 sm:mt-0" />
                  <div>
                    <p className="font-semibold">
                      Mode Arsip Terkunci — Periode {selectedPeriod.code} ({selectedPeriod.name})
                    </p>
                    <p className="text-xs text-amber-800">
                      Data periode sebelumnya bersifat referensi historis (hanya baca) dan terkunci permanen dari perubahan.
                    </p>
                  </div>
                </div>
                {activePeriod && activePeriod.id !== selectedPeriod.id && (
                  <button
                    type="button"
                    disabled={returningToActive}
                    onClick={handleReturnActive}
                    className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-900 text-white text-xs font-semibold hover:bg-amber-800 transition-colors shrink-0 disabled:opacity-60"
                  >
                    <RotateCcw size={14} />
                    Kembali ke Periode Aktif ({activePeriod.code})
                  </button>
                )}
              </div>
            )}

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
