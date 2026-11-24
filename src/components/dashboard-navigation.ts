import { Archive, Brain, Calendar, CalendarCheck, Camera, ClipboardList, FileText, FolderOpen, History, Image, LayoutDashboard, QrCode, Users, Wallet } from "lucide-react";
import type { LucideIcon } from "lucide-react";

export interface DashboardMenuItem { href: string; label: string; icon: LucideIcon }
const menus: Record<string, DashboardMenuItem[]> = {
  sekretaris: [
    { href: "/dashboard/sekretaris", label: "Ringkasan", icon: LayoutDashboard },
    { href: "/dashboard/sekretaris/anggota", label: "Data Anggota", icon: Users },
    { href: "/dashboard/sekretaris/surat", label: "Arsip & Persuratan", icon: FileText },
    { href: "/dashboard/sekretaris/notulensi", label: "Notulensi", icon: ClipboardList },
    { href: "/dashboard/sekretaris/agenda", label: "Agenda Organisasi", icon: Calendar },
    { href: "/dashboard/sekretaris/presensi", label: "Presensi Anggota", icon: CalendarCheck },
    { href: "/dashboard/sekretaris/presensi-pengurus", label: "Presensi Pengurus", icon: CalendarCheck },
    { href: "/dashboard/sekretaris/arsip-lama", label: "Arsip Lama", icon: Archive },
    { href: "/dashboard/sekretaris/evaluasi", label: "Evaluasi", icon: FileText },
    { href: "/dashboard/periode", label: "Periode Kepengurusan", icon: History },
  ],
  bendahara: [
    { href: "/dashboard/bendahara", label: "Ringkasan", icon: LayoutDashboard },
    { href: "/dashboard/bendahara/transaksi", label: "Transaksi", icon: Wallet },
    { href: "/dashboard/bendahara/iuran", label: "Iuran Anggota", icon: Users },
    { href: "/dashboard/bendahara/laporan", label: "Laporan Keuangan", icon: FileText },
  ],
  humas: [
    { href: "/dashboard/humas/kegiatan", label: "Kelola Kegiatan", icon: Calendar },
    { href: "/dashboard/humas/twibbon", label: "Kelola Twibbon", icon: Image },
    { href: "/qr", label: "QR Code Generator", icon: QrCode },
    { href: "/dashboard/humas/proker", label: "Kelola Proker", icon: ClipboardList },
    { href: "/dashboard/humas/berita", label: "Kelola Berita", icon: FileText },
    { href: "/dashboard/humas/knowledge", label: "Basis Pengetahuan AI", icon: Brain },
    { href: "/dashboard/humas/banner", label: "Pengaturan Banner", icon: FolderOpen },
    { href: "/dashboard/humas/momen", label: "Momen Pilar Bangsa", icon: Camera },
    { href: "/dashboard/humas/pengaturan", label: "Tokoh & Pemimpin", icon: Users },
    { href: "/dashboard/humas/arsip", label: "Arsip Publik", icon: Archive },
  ],
  ketua: [
    { href: "/dashboard/ketua", label: "Ringkasan", icon: LayoutDashboard },
    { href: "/dashboard/sekretaris/anggota", label: "Data Anggota", icon: Users },
    { href: "/dashboard/ketua/program", label: "Program Kerja", icon: ClipboardList },
    { href: "/dashboard/ketua/evaluasi", label: "Evaluasi", icon: FileText },
    { href: "/dashboard/bendahara/laporan", label: "Laporan Keuangan", icon: Wallet },
    { href: "/dashboard/humas/twibbon", label: "Kelola Twibbon", icon: Image },
    { href: "/qr", label: "QR Code Generator", icon: QrCode },
    { href: "/dashboard/periode", label: "Periode Kepengurusan", icon: History },
  ],
};
// Preserve existing role destinations. Authorization remains on the server.
export function getDashboardMenu(role: string) { return menus[role] || menus.ketua; }
export function getRoleLabel(role: string) {
  return ({ ketua: "Ketua", sekretaris: "Sekretaris", bendahara: "Bendahara", humas: "Humas", divisi: "Divisi" } as Record<string, string>)[role] || role;
}
export function isDashboardMenuActive(pathname: string, href: string) {
  return pathname === href || (href.split("/").length > 3 && pathname.startsWith(`${href}/`));
}
export function getDashboardPageTitle(pathname: string, role: string): string {
  const ownMatch = getDashboardMenu(role).find((i) => isDashboardMenuActive(pathname, i.href));
  if (ownMatch) return ownMatch.label;

  const anyMatch = Object.values(menus)
    .flat()
    .find((i) => isDashboardMenuActive(pathname, i.href));
  if (anyMatch) return anyMatch.label;

  if (pathname === "/dashboard/profil" || pathname.startsWith("/dashboard/profil/")) {
    return "Profil Akun";
  }
  if (pathname === "/dashboard/periode" || pathname.startsWith("/dashboard/periode/")) {
    return "Periode Kepengurusan";
  }
  return "Ringkasan";
}
