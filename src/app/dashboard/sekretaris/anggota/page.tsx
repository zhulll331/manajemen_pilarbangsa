import { createClient } from "@/utils/supabase/server";
import AnggotaClient from "./AnggotaClient";

export default async function AnggotaPage() {
  const supabase = await createClient();

  const { data: members } = await supabase
    .from("members")
    .select("*")
    .order("created_at", { ascending: false });

  return <AnggotaClient members={members || []} />;
}
