import { createClient } from "@/utils/supabase/server";
import DashboardSekretarisClient from "./DashboardSekretarisClient";

export default async function DashboardSekretaris() {
  const supabase = await createClient();

  // Counts
  const { count: totalAnggota } = await supabase.from("members").select("*", { count: "exact", head: true });
  const { count: suratMasuk } = await supabase.from("letters").select("*", { count: "exact", head: true }).eq("letter_type", "Masuk");
  const { count: suratKeluar } = await supabase.from("letters").select("*", { count: "exact", head: true }).eq("letter_type", "Keluar");
  const { count: totalNotulensi } = await supabase.from("minutes").select("*", { count: "exact", head: true });

  // Recent members
  const { data: recentMembers } = await supabase
    .from("members")
    .select("name, division, status, created_at")
    .order("created_at", { ascending: false })
    .limit(5);

  // Recent letters
  const { data: recentLetters } = await supabase
    .from("letters")
    .select("letter_number, letter_type, date, subject, status")
    .order("date", { ascending: false })
    .limit(5);

  // Recent minutes
  const { data: recentMinutes } = await supabase
    .from("minutes")
    .select("title, meeting_date, participants")
    .order("meeting_date", { ascending: false })
    .limit(4);

  // Recent archives
  const { data: recentArchives } = await supabase
    .from("archives")
    .select("title, category, uploaded_by, created_at")
    .order("created_at", { ascending: false })
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
