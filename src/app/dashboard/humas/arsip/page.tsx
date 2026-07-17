import { Metadata } from "next";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import ArsipClient from "./ArsipClient";

export const metadata: Metadata = {
  title: "Kelola Arsip Publik | Dashboard Humas",
  description: "Pengelolaan arsip publik UKM",
};

export default async function ArsipPage() {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
      },
    }
  );

  // Ambil data arsip
  const { data: archives } = await supabase
    .from("archives")
    .select("*, programs(title)")
    .order("created_at", { ascending: false });

  // Ambil data program kerja untuk dropdown (hanya yang sudah ada di database)
  const { data: programs } = await supabase
    .from("programs")
    .select("id, title")
    .order("created_at", { ascending: false });

  return <ArsipClient initialArchives={archives || []} programs={programs || []} />;
}
