"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import { ArrowUpRight, LogOut, PanelLeftClose, PanelLeftOpen, UserCircle, X } from "lucide-react";
import { logout } from "@/app/actions";
import { getDashboardMenu, isDashboardMenuActive } from "./dashboard-navigation";

export function Sidebar({ role = "ketua", isOpen = false, setIsOpen, expanded = false, onToggleExpanded }: {
  role?: string; isOpen?: boolean; setIsOpen?: (value: boolean) => void;
  expanded?: boolean; onToggleExpanded?: () => void;
}) {
  const pathname = usePathname();
  const sidebarRef = useRef<HTMLElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    const previousFocus = document.activeElement as HTMLElement | null;
    closeRef.current?.focus();
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsOpen?.(false);
      if (event.key !== "Tab") return;
      const controls = Array.from(sidebarRef.current?.querySelectorAll<HTMLElement>("a[href], button") || [])
        .filter(element => element.getClientRects().length > 0);
      const first = controls[0];
      const last = controls[controls.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
    };
    document.addEventListener("keydown", handleKey);
    return () => { document.removeEventListener("keydown", handleKey); previousFocus?.focus(); };
  }, [isOpen, setIsOpen]);

  return <>
    {isOpen && <div className="admin-nav-backdrop" onClick={() => setIsOpen?.(false)} aria-hidden="true" />}
    <aside ref={sidebarRef} id="admin-navigation" aria-label="Navigasi pengurus"
      className={`admin-sidebar ${isOpen ? "is-open" : ""} ${expanded ? "is-expanded" : ""}`}>
      <Link href="/" className="admin-brand" aria-label="Pilar Bangsa — website publik">
        <Image src="/logo_pilar.svg" alt="" width={46} height={46} priority />
        <span className="admin-nav-label"><strong>Pilar Bangsa</strong><small>DIGITAL OFFICE</small></span>
      </Link>
      <button ref={closeRef} onClick={() => setIsOpen?.(false)} className="admin-mobile-close" aria-label="Tutup navigasi"><X size={20} /></button>
      <button className="admin-rail-toggle" onClick={onToggleExpanded} aria-expanded={expanded} aria-controls="admin-menu-items"
        aria-label={expanded ? "Ringkas sidebar" : "Perluas sidebar"} title={expanded ? "Ringkas sidebar" : "Perluas sidebar"}>
        {expanded ? <PanelLeftClose size={19} /> : <PanelLeftOpen size={19} />}
        <span className="admin-nav-label">Ringkas menu</span>
      </button>
      <nav id="admin-menu-items" className="admin-menu" aria-label="Menu utama">
        {getDashboardMenu(role).map(({ href, label, icon: Icon }) => <Link key={href} href={href}
          onClick={() => setIsOpen?.(false)} className="admin-nav-item"
          aria-current={isDashboardMenuActive(pathname, href) ? "page" : undefined} aria-label={label} title={label}>
          <Icon size={21} strokeWidth={1.7} /><span className="admin-nav-label">{label}</span>
        </Link>)}
      </nav>
      <div className="admin-sidebar-bottom">
        <Link href="/" className="admin-nav-item" aria-label="Website publik" title="Website publik"><ArrowUpRight size={21} /><span className="admin-nav-label">Website publik</span></Link>
        <Link href="/dashboard/profil" onClick={() => setIsOpen?.(false)} className="admin-nav-item"
          aria-current={pathname === "/dashboard/profil" ? "page" : undefined} aria-label="Profil saya" title="Profil saya">
          <UserCircle size={21} /><span className="admin-nav-label">Profil saya</span>
        </Link>
        <form action={logout}><button type="submit" className="admin-nav-item admin-logout" aria-label="Keluar" title="Keluar">
          <LogOut size={20} /><span className="admin-nav-label">Keluar</span>
        </button></form>
        <div className="admin-identity-line" aria-hidden="true"><i /><i /><i /></div>
      </div>
    </aside>
  </>;
}
