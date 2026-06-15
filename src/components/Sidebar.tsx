"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  LayoutDashboard, 
  Users, 
  FileText, 
  Wallet, 
  Calendar, 
  CalendarCheck,
  ClipboardList, 
  FolderOpen,
  LogOut,
  UserCircle
} from "lucide-react";
import { logout } from "@/app/actions";

export function Sidebar({ role = "ketua" }: { role?: string }) {
  const pathname = usePathname();

  const getMenuLinks = () => {
    switch (role) {
      case "sekretaris":
        return [
          { href: "/dashboard/sekretaris", label: "Dashboard", icon: <LayoutDashboard size={20} /> },
          { href: "/dashboard/sekretaris/anggota", label: "Data Anggota", icon: <Users size={20} /> },
          { href: "/dashboard/sekretaris/surat", label: "Persuratan", icon: <FileText size={20} /> },
          { href: "/dashboard/sekretaris/notulensi", label: "Notulensi", icon: <ClipboardList size={20} /> },
          { href: "/dashboard/sekretaris/presensi", label: "Presensi", icon: <CalendarCheck size={20} /> },
          { href: "/dashboard/sekretaris/arsip", label: "Arsip Dokumen", icon: <FolderOpen size={20} /> },
          { href: "/dashboard/sekretaris/evaluasi", label: "Evaluasi", icon: <FileText size={20} /> },
        ];
      case "bendahara":
        return [
          { href: "/dashboard/bendahara", label: "Dashboard", icon: <LayoutDashboard size={20} /> },
          { href: "/dashboard/bendahara/transaksi", label: "Transaksi", icon: <Wallet size={20} /> },
          { href: "/dashboard/bendahara/iuran", label: "Iuran Anggota", icon: <Users size={20} /> },
          { href: "/dashboard/bendahara/laporan", label: "Laporan Keuangan", icon: <FileText size={20} /> },
        ];
      case "ketua":
      default:
        return [
          { href: "/dashboard/ketua", label: "Dashboard", icon: <LayoutDashboard size={20} /> },
          { href: "/dashboard/ketua/program", label: "Program Kerja", icon: <ClipboardList size={20} /> },
          { href: "/dashboard/ketua/agenda", label: "Agenda Organisasi", icon: <Calendar size={20} /> },
        ];
    }
  };

  const menus = getMenuLinks();

  return (
    <aside className="w-64 shrink-0 bg-[var(--color-primary)] text-white h-screen sticky top-0 flex flex-col transition-all">
      <div className="p-6 flex items-center justify-center border-b border-white/10">
        <div className="w-24 h-24 bg-white rounded-full p-2 flex items-center justify-center shadow-lg">
          <img src="/logo_pilar.svg" alt="Logo Pilar Bangsa" className="w-full h-full object-contain" />
        </div>
      </div>

      <nav className="flex-1 px-4 space-y-2 mt-4">
        {menus.map((menu, i) => {
          const isActive = pathname === menu.href;
          return (
            <Link
              key={i}
              href={menu.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                isActive 
                  ? "bg-white/20 font-medium" 
                  : "hover:bg-white/10 text-white/80 hover:text-white"
              }`}
            >
              {menu.icon}
              {menu.label}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-white/10 space-y-2">
        <Link
          href="/dashboard/profil"
          className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
            pathname === "/dashboard/profil" 
              ? "bg-white/20 font-medium" 
              : "hover:bg-white/10 text-white/80 hover:text-white"
          }`}
        >
          <UserCircle size={20} />
          Profil Saya
        </Link>
        <form action={logout}>
          <button 
            type="submit"
            className="w-full flex items-center gap-3 px-4 py-3 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
          >
            <LogOut size={20} />
            Keluar
          </button>
        </form>
      </div>
    </aside>
  );
}
