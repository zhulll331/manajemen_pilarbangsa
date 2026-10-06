import Link from "next/link";
import { ArrowUpRight, CalendarCheck } from "lucide-react";
import type { AttendanceMetric } from "@/utils/attendance";

export function AttendanceCards({ members, officers, canManage = false }: {
  members: AttendanceMetric; officers: AttendanceMetric; canManage?: boolean;
}) {
  return <section className="attendance-section" aria-label="Ringkasan kehadiran">
    <div className="attendance-heading">
      <span><CalendarCheck size={14} /> PARTISIPASI ORGANISASI</span>
      <h2>Setiap kehadiran<br />punya arti.</h2>
      <p>Ringkasan presensi anggota dan pengurus aktif hingga hari ini.</p>
    </div>
    {[
      { label: "Kehadiran anggota", metric: members, color: "#297548", href: "/dashboard/sekretaris/presensi" },
      { label: "Kehadiran pengurus", metric: officers, color: "#c81735", href: "/dashboard/sekretaris/presensi-pengurus" },
    ].map(({ label, metric, color, href }) => <div className="attendance-card" key={label}>
      <div className="attendance-dial" aria-label={`${label}: ${metric.percentage === null ? "belum tersedia" : `${metric.percentage}%`}`}>
        <svg viewBox="0 0 100 100" aria-hidden="true"><circle cx="50" cy="50" r="43" fill="none" stroke="#e5e9df" strokeWidth="6" /><circle cx="50" cy="50" r="43" fill="none" stroke={color} strokeWidth="6" strokeLinecap={metric.percentage ? "round" : "butt"} pathLength="100" strokeDasharray={`${metric.percentage ?? 0} 100`} /></svg>
        <strong aria-hidden="true">{metric.percentage === null ? "—" : `${metric.percentage.toLocaleString("id-ID")}%`}</strong>
      </div>
      <div><h3>{label}</h3><p>{metric.state === "unavailable" ? "Data belum dapat dimuat." : metric.state === "empty" ? "Belum ada presensi tercatat." : `${metric.present.toLocaleString("id-ID")} hadir dari ${metric.recorded.toLocaleString("id-ID")} catatan presensi`}</p>
        {canManage && <Link href={href}>Lihat presensi <ArrowUpRight size={13} /></Link>}
      </div>
    </div>)}
    <p className="attendance-footnote">Hadir ÷ seluruh catatan Hadir, Izin, Sakit, dan Alpa. Seluruh periode untuk anggota/pengurus yang saat ini aktif, dengan tanggal agenda hingga hari ini (WIB). Presensi kosong dan agenda mendatang tidak dihitung.</p>
  </section>;
}

export function AttendanceCardsSkeleton() {
  return <div className="attendance-section animate-pulse" role="status" aria-label="Memuat ringkasan kehadiran"><div className="h-24 rounded-xl bg-white/50" /><div className="h-24 rounded-xl bg-white/50" /><div className="h-24 rounded-xl bg-white/50" /></div>;
}
