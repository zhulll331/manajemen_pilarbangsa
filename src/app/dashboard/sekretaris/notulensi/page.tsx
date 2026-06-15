import { createClient } from "@/utils/supabase/server";
import NotulensiClient from "./NotulensiClient";

export default async function NotulensiPage() {
  const supabase = await createClient();

  const { data: minutes } = await supabase
    .from("minutes")
    .select("*")
    .order("meeting_date", { ascending: false });

  return <NotulensiClient minutes={minutes || []} />;
}
