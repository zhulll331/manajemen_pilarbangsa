import { getSelectedPeriodForDashboard } from "@/lib/periods/server";
import { createClient } from "@/utils/supabase/server";
import NotulensiClient from "./NotulensiClient";

export default async function NotulensiPage() {
  const supabase = await createClient();
  const { selectedPeriod, schemaReady } = await getSelectedPeriodForDashboard();

  let query = supabase
    .from("minutes")
    .select("*")
    .order("meeting_date", { ascending: false });

  if (schemaReady) {
    query = query.eq("period_id", selectedPeriod.id);
  }

  const { data: minutes } = await query;

  return <NotulensiClient minutes={minutes || []} />;
}
