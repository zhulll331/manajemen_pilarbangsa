"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ArrowUpRight, Menu, Search, X } from "lucide-react";
import { getDashboardMenu, getRoleLabel, isDashboardMenuActive } from "./dashboard-navigation";

export function Header({ role = "ketua", name = "Pengguna", onMenuClick, isMenuOpen = false }: {
  role?: string; name?: string; onMenuClick?: () => void; isMenuOpen?: boolean;
}) {
  const pathname = usePathname();
  const [query, setQuery] = useState("");
  const searchRef = useRef<HTMLDivElement>(null);
  const menus = getDashboardMenu(role);
  const current = pathname === "/dashboard/profil" ? "Profil saya" : menus.find(menu => isDashboardMenuActive(pathname, menu.href))?.label || "Dashboard";
  const results = menus.filter(menu => menu.label.toLocaleLowerCase("id").includes(query.trim().toLocaleLowerCase("id")));
  const initials = name.trim().split(/\s+/).slice(0, 2).map(part => part[0]).join("").toUpperCase();

  useEffect(() => {
    const close = (event: MouseEvent) => { if (!searchRef.current?.contains(event.target as Node)) setQuery(""); };
    document.addEventListener("click", close);
    return () => document.removeEventListener("click", close);
  }, []);

  return <header className="admin-header">
    <div className="admin-header-title">
      <button className="admin-menu-button" onClick={onMenuClick} aria-label="Buka navigasi" aria-expanded={isMenuOpen} aria-controls="admin-navigation"><Menu size={23} /></button>
      <div><p className="admin-eyebrow">RUANG PENGURUS <span>/ {getRoleLabel(role)}</span></p><p className="admin-current-page">{current}</p></div>
    </div>
    <div className="admin-header-actions">
      <div className="admin-search" ref={searchRef} role="search" aria-label="Cari menu pengurus" onKeyDown={event => { if (event.key === "Escape") setQuery(""); }}>
        <Search size={17} aria-hidden="true" />
        <input type="search" aria-label="Cari menu" placeholder="Cari menu…" value={query} onChange={event => setQuery(event.target.value)} />
        {query && <button onClick={() => setQuery("")} aria-label="Hapus pencarian"><X size={15} /></button>}
        {query.trim() && <nav className="admin-search-results" aria-label="Hasil pencarian menu">
          {results.length ? results.map(({ href, label, icon: Icon }) => <Link key={href} href={href} onClick={() => setQuery("")}><Icon size={17} />{label}<ArrowUpRight size={15} /></Link>) : <p>Tidak ada menu yang cocok.</p>}
        </nav>}
      </div>
      <Link href="/" className="admin-public-link">Website publik <ArrowUpRight size={15} /></Link>
      <Link href="/dashboard/profil" className="admin-profile" aria-label={`Profil ${name}`}>
        <span className="admin-avatar">{initials || "PB"}</span><span className="admin-profile-copy"><strong>{name}</strong><small>{getRoleLabel(role)}</small></span>
      </Link>
    </div>
  </header>;
}
