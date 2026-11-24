import { getSelectedPeriodForDashboard } from "@/lib/periods/server";
import { createClient } from "@/utils/supabase/server";
import SuratClient from "./SuratClient";

export default async function SuratPage() {
  const supabase = await createClient();
  const { selectedPeriod, schemaReady } = await getSelectedPeriodForDashboard();

  let query = supabase
    .from("letters")
    .select("*")
    .order("date", { ascending: false });

  if (schemaReady) {
    query = query.eq("period_id", selectedPeriod.id);
  }

  const { data: letters } = await query;

  return <SuratClient letters={letters || []} />;
}
