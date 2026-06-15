import { createClient } from "@/utils/supabase/server";
import IuranClient from "./IuranClient";

export default async function IuranPage() {
  const supabase = await createClient();

  // Fetch dues with member details
  const { data: dues } = await supabase
    .from("dues")
    .select("*, members(name)")
    .order("year", { ascending: false })
    .order("month", { ascending: false });

  // Fetch active members for dropdown
  const { data: members } = await supabase
    .from("members")
    .select("id, name")
    .order("name", { ascending: true });

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Iuran Anggota</h1>
        <p className="text-gray-600 mt-1">Kelola data pembayaran uang kas / iuran anggota organisasi.</p>
      </div>

      <IuranClient dues={dues || []} members={members || []} />
    </div>
  );
}
