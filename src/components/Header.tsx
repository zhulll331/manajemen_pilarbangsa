"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import { ArrowUpRight, CalendarClock, Lock, Menu, Search, X } from "lucide-react";
import { selectDashboardPeriodAction } from "@/app/dashboard/periode/actions";
import type { OrganizationPeriod } from "@/lib/periods/types";
import { canManagePeriodsRole } from "@/lib/periods/utils";
import { getDashboardMenu, getDashboardPageTitle, getRoleLabel } from "./dashboard-navigation";

export function Header({
  role = "ketua",
  name = "Pengguna",
  onMenuClick,
  isMenuOpen = false,
  periods = [],
  selectedPeriod,
  schemaReady = false,
}: {
  role?: string;
  name?: string;
  onMenuClick?: () => void;
  isMenuOpen?: boolean;
  periods?: OrganizationPeriod[];
  selectedPeriod?: OrganizationPeriod;
  schemaReady?: boolean;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [switchingPeriod, startTransition] = useTransition();
  const items = getDashboardMenu(role);
  const current = getDashboardPageTitle(pathname, role);
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const results = query.trim()
    ? items.filter((i) => i.label.toLowerCase().includes(query.toLowerCase())).slice(0, 6)
    : [];

  useEffect(() => {
    const close = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) setOpen(false);
    };
    const esc = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", esc);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("keydown", esc);
    };
  }, []);

  const handlePeriodChange = (periodId: string) => {
    startTransition(async () => {
      await selectDashboardPeriodAction(periodId);
      router.refresh();
    });
  };

  const showPeriodSwitcher = schemaReady && periods.length > 0 && selectedPeriod;
  const managerRole = canManagePeriodsRole(role);

  return (
    <header className="admin-header">
      <div className="admin-header-title">
        <button
          className="admin-menu-button"
          onClick={onMenuClick}
          aria-label="Buka navigasi"
          aria-expanded={isMenuOpen}
          aria-controls="admin-navigation"
        >
          <Menu size={23} />
        </button>
        <div>
          <p className="admin-eyebrow">
            RUANG PENGURUS <span>/ {getRoleLabel(role)}</span>
          </p>
          <p className="admin-current-page">{current}</p>
        </div>
      </div>

      <div className="admin-header-actions">
        {showPeriodSwitcher && (
          <div className="flex items-center gap-1.5">
            <label
              htmlFor="admin-period-switcher"
              className="hidden sm:inline-flex items-center gap-1 text-xs font-semibold text-gray-500"
              title="Pilih Periode Kepengurusan"
            >
              {selectedPeriod.status === "locked" ? (
                <Lock size={14} className="text-amber-600" />
              ) : (
                <CalendarClock size={14} className="text-emerald-600" />
              )}
            </label>
            <select
              id="admin-period-switcher"
              value={selectedPeriod.id}
              disabled={switchingPeriod}
              onChange={(e) => handlePeriodChange(e.target.value)}
              aria-label="Pilih periode kepengurusan"
              className={`h-9 px-2.5 rounded-lg border text-xs font-semibold outline-none transition cursor-pointer ${
                selectedPeriod.status === "locked"
                  ? "bg-amber-50 border-amber-300 text-amber-900"
                  : "bg-emerald-50/70 border-emerald-200 text-emerald-900"
              } disabled:opacity-60`}
            >
              {periods.map((period) => (
                <option key={period.id} value={period.id}>
                  {period.code} {period.status === "active" ? "(Aktif)" : period.status === "locked" ? "(Terkunci)" : "(Draft)"}
                </option>
              ))}
            </select>
            {managerRole && (
              <Link
                href="/dashboard/periode"
                title="Kelola & Ganti Periode Kepengurusan"
                className="hidden md:inline-flex items-center px-2.5 h-9 rounded-lg border border-gray-200 bg-white text-xs font-medium text-gray-700 hover:bg-gray-50 transition-colors whitespace-nowrap"
              >
                Kelola
              </Link>
            )}
          </div>
        )}

        <div className="admin-search" ref={searchRef}>
          <Search size={18} />
          <input
            type="search"
            value={query}
            onFocus={() => setOpen(true)}
            onChange={(e) => {
              setQuery(e.target.value);
              setOpen(true);
            }}
            placeholder="Cari menu..."
            aria-label="Cari menu"
          />
          {query && (
            <button type="button" onClick={() => setQuery("")} aria-label="Hapus pencarian">
              <X size={16} />
            </button>
          )}
          {open && query.trim() && (
            <div className="admin-search-results" role="listbox">
              {results.length ? (
                results.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => {
                      setOpen(false);
                      setQuery("");
                    }}
                  >
                    <item.icon size={17} />
                    <span>{item.label}</span>
                  </Link>
                ))
              ) : (
                <p>Menu tidak ditemukan.</p>
              )}
            </div>
          )}
        </div>
        <Link href="/" className="admin-public-link">
          <ArrowUpRight size={17} />
          <span>Website</span>
        </Link>
        <Link href="/dashboard/profil" className="admin-avatar" aria-label={`Profil ${name}`}>
          {(name.trim()[0] || "P").toUpperCase()}
        </Link>
      </div>
    </header>
  );
}
