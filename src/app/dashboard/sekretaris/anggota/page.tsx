import { getSelectedPeriodForDashboard } from "@/lib/periods/server";
import { createClient } from "@/utils/supabase/server";
import AnggotaClient from "./AnggotaClient";

export const dynamic = "force-dynamic";

export default async function AnggotaPage() {
  const supabase = await createClient();
  const { selectedPeriod, isLocked, schemaReady } =
    await getSelectedPeriodForDashboard();

  let query = supabase
    .from("members")
    .select("*")
    .order("created_at", { ascending: false });

  if (schemaReady) {
    query = query.eq("period_id", selectedPeriod.id);
  }

  const { data: members } = await query;

  const aiConfigured = Boolean(
    process.env.GEMINI_API_KEY ||
      process.env.GROQ_API_KEY ||
      process.env.OPENROUTER_API_KEY
  );

  return (
    <AnggotaClient
      members={members || []}
      isLocked={isLocked}
      periodCode={selectedPeriod.code}
      aiConfigured={aiConfigured}
    />
  );
}
