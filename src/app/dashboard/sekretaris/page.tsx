import { createClient } from "@/utils/supabase/server";
import DashboardSekretarisClient from "./DashboardSekretarisClient";

export default async function DashboardSekretaris() {
  const supabase = await createClient();

  // Counts
  const { count: totalAnggota } = await supabase.from("members").select("*", { count: "exact", head: true });
  const { count: suratMasuk } = await supabase.from("letters").select("*", { count: "exact", head: true }).in("letter_type", ["Surat Masuk", "Masuk"]);
  const { count: suratKeluar } = await supabase.from("letters").select("*", { count: "exact", head: true }).in("letter_type", ["Surat Keluar", "Keluar"]);
  const { count: totalNotulensi } = await supabase.from("minutes").select("*", { count: "exact", head: true });

  // Recent members
  const { data: recentMembers } = await supabase
    .from("members")
    .select("name, division, status, created_at")
    .order("created_at", { ascending: false })
    .limit(5);

  // Recent letters
  const { data: rawRecentLetters } = await supabase
    .from("letters")
    .select("letter_number, letter_type, date, subject, status")
    .order("date", { ascending: false })
    .limit(20);

  const getInitialNum = (numStr?: string | null) => {
    if (!numStr) return null;
    const match = numStr.trim().match(/^(\d+)/);
    return match ? parseInt(match[1], 10) : null;
  };

  const isUkm = (str?: string | null) => !!str && /UKM14/i.test(str);

  const ukmDates = (rawRecentLetters || [])
    .filter(l => isUkm(l.letter_number) && l.date)
    .map(l => new Date(l.date).getTime());
  const maxUkmDate = ukmDates.length > 0 ? Math.max(...ukmDates) : Date.now();

  const recentLetters = [...(rawRecentLetters || [])].sort((a, b) => {
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

  // Recent minutes
  const { data: recentMinutes } = await supabase
    .from("minutes")
    .select("title, meeting_date, participants")
    .order("meeting_date", { ascending: false })
    .limit(4);

  // Recent archives (letters excluding standard mail)
  const { data: recentArchives } = await supabase
    .from("letters")
    .select("subject, letter_type, sender, date")
    .not("letter_type", "in", '("Masuk", "Keluar", "Surat Masuk", "Surat Keluar")')
    .order("date", { ascending: false })
    .limit(4);

  return (
    <DashboardSekretarisClient
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
