import { createClient } from "@/utils/supabase/server";
import ArsipClient from "./ArsipClient";

export default async function ArsipPage() {
  const supabase = await createClient();

  const { data: archives } = await supabase
    .from("archives")
    .select("*")
    .order("created_at", { ascending: false });

  return <ArsipClient archives={archives || []} />;
}
