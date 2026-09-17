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

  // Ambil semua arsip, di-cache secara ISR (instant navigation)
  const { data } = await supabase
    .from("archives")
    .select("id, title, period, category, drive_url, programs(title)")
    .order("created_at", { ascending: false });

  const archives = (data as any[]) || [];

  return <ArsipPublikClient archives={archives} />;
}
