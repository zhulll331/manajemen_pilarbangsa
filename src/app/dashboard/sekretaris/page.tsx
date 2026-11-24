import { createClient } from "@/utils/supabase/server";
import DashboardSekretarisClient from "./DashboardSekretarisClient";
import { Suspense } from "react";
import { AttendanceOverview } from "@/components/AttendanceOverview";
import { AttendanceCardsSkeleton } from "@/components/AttendanceCards";
import { DisciplineAlertBanner } from "@/components/DisciplineAlertBanner";
import { getSelectedPeriodForDashboard } from "@/lib/periods/server";

export const dynamic = "force-dynamic";

export default async function DashboardSekretaris() {
  const supabase = await createClient();
  const { selectedPeriod, schemaReady } = await getSelectedPeriodForDashboard();
  const pid = schemaReady ? selectedPeriod.id : null;

  let qAnggota = supabase.from("members").select("*", { count: "exact", head: true }).or("status.is.null,status.neq.Diberhentikan");
  let qMasuk = supabase.from("letters").select("*", { count: "exact", head: true }).in("letter_type", ["Surat Masuk", "Masuk"]);
  let qKeluar = supabase.from("letters").select("*", { count: "exact", head: true }).in("letter_type", ["Surat Keluar", "Keluar"]);
  let qNotulensi = supabase.from("minutes").select("*", { count: "exact", head: true });
  let qMembers = supabase.from("members").select("name, division, status, created_at").order("created_at", { ascending: false }).limit(5);
  let qLetters = supabase.from("letters").select("letter_number, letter_type, date, subject, status").order("date", { ascending: false }).limit(20);
  let qMinutes = supabase.from("minutes").select("title, meeting_date, participants").order("meeting_date", { ascending: false }).limit(4);
  let qArchives = supabase.from("letters").select("subject, letter_type, sender, date").not("letter_type", "in", '("Masuk", "Keluar", "Surat Masuk", "Surat Keluar")').order("date", { ascending: false }).limit(4);

  if (pid) {
    qAnggota = qAnggota.eq("period_id", pid);
    qMasuk = qMasuk.eq("period_id", pid);
    qKeluar = qKeluar.eq("period_id", pid);
    qNotulensi = qNotulensi.eq("period_id", pid);
    qMembers = qMembers.eq("period_id", pid);
    qLetters = qLetters.eq("period_id", pid);
    qMinutes = qMinutes.eq("period_id", pid);
    qArchives = qArchives.eq("period_id", pid);
  }

  const [
    { count: totalAnggota },
    { count: suratMasuk },
    { count: suratKeluar },
    { count: totalNotulensi },
    { data: recentMembers },
    { data: rawRecentLetters },
    { data: recentMinutes },
    { data: recentArchives },
  ] = await Promise.all([
    qAnggota,
    qMasuk,
    qKeluar,
    qNotulensi,
    qMembers,
    qLetters,
    qMinutes,
    qArchives,
  ]);

  const getInitialNum = (numStr?: string | null) => {
    if (!numStr) return null;
    const match = numStr.trim().match(/^(\d+)/);
    return match ? parseInt(match[1], 10) : null;
  };

  const isUkm = (str?: string | null) => !!str && /UKM14/i.test(str);

  const ukmDates = (rawRecentLetters || [])
    .filter(l => isUkm(l.letter_number) && l.date)
    .map(l => new Date(l.date).getTime());
  const maxUkmDate =
    ukmDates.length > 0
      ? Math.max(...ukmDates)
      : rawRecentLetters?.[0]?.date
        ? new Date(rawRecentLetters[0].date).getTime()
        : 0;

  const recentLetters = (rawRecentLetters || []).toSorted((a, b) => {
    const isUkmA = isUkm(a.letter_number);
    const isUkmB = isUkm(b.letter_number);
    const numA = getInitialNum(a.letter_number);
    const numB = getInitialNum(b.letter_number);

    let timeA = a.date ? new Date(a.date).getTime() : 0;
    let timeB = b.date ? new Date(b.date).getTime() : 0;

    if (isUkmA && numA !== null) {
      timeA = maxUkmDate + (numA * 60 * 1000);
    }
    if (isUkmB && numB !== null) {
      timeB = maxUkmDate + (numB * 60 * 1000);
    }

    return timeB - timeA;
  }).slice(0, 5);

  return (
    <DashboardSekretarisClient
      disciplineAlert={
        <Suspense fallback={null}>
          <DisciplineAlertBanner period={selectedPeriod} schemaReady={schemaReady} />
        </Suspense>
      }
      attendanceOverview={<Suspense fallback={<AttendanceCardsSkeleton />}><AttendanceOverview canManage periodId={pid} /></Suspense>}
      totalAnggota={totalAnggota || 0}
      suratMasuk={suratMasuk || 0}
      suratKeluar={suratKeluar || 0}
      totalNotulensi={totalNotulensi || 0}
      recentMembers={recentMembers || []}
      recentLetters={recentLetters || []}
      recentMinutes={recentMinutes || []}
      recentArchives={recentArchives || []}
    />
  );
}
