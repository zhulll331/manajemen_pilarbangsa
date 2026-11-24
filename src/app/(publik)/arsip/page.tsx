import { Metadata } from "next";
import { createClient } from "@supabase/supabase-js";
import { ArsipPublikClient } from "./ArsipPublikClient";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "Arsip UKM | Pilar Bangsa",
  description: "Dokumen dan arsip Unit Kegiatan Mahasiswa (UKM) Pilar Bangsa",
};

export default async function ArsipPublikPage() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  // Ambil semua arsip + daftar periode dinamis dari DB (cache ISR)
  const [{ data }, { data: periodRows }] = await Promise.all([
    supabase
      .from("archives")
      .select("id, title, period, category, drive_url, programs(title)")
      .order("created_at", { ascending: false }),
    supabase
      .from("periods")
      .select("code, status, start_year")
      .order("start_year", { ascending: false }),
  ]);

  const archives = ((data as Array<{
    id: string;
    title: string;
    period: string;
    category: string;
    drive_url: string;
    programs?: { title: string }[] | { title: string } | null;
  }>) || []).map((row) => ({
    ...row,
    programs: Array.isArray(row.programs) ? row.programs[0] ?? null : row.programs ?? null,
  }));

  const periodSet = new Set<string>();
  for (const p of (periodRows as Array<{ code?: string }> | null) || []) {
    if (p?.code) periodSet.add(p.code);
  }
  for (const a of archives) {
    if (a.period) periodSet.add(a.period);
  }
  const availablePeriods = Array.from(periodSet).sort((a, b) => b.localeCompare(a));

  return <ArsipPublikClient archives={archives} availablePeriods={availablePeriods} />;
}
