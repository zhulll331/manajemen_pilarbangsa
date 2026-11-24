import { getSelectedPeriodForDashboard } from "@/lib/periods/server";
import { createClient } from "@/utils/supabase/server";
import EvaluasiClient from "./EvaluasiClient";

export default async function EvaluasiPage() {
  const supabase = await createClient();
  const { selectedPeriod, schemaReady } = await getSelectedPeriodForDashboard();

  let evalQuery = supabase
    .from("evaluations")
    .select("*, programs(title)")
    .order("created_at", { ascending: false });
  let progQuery = supabase
    .from("programs")
    .select("id, title")
    .order("title", { ascending: true });

  if (schemaReady) {
    evalQuery = evalQuery.eq("period_id", selectedPeriod.id);
    progQuery = progQuery.eq("period_id", selectedPeriod.id);
  }

  const [{ data: evaluations }, { data: programs }] = await Promise.all([
    evalQuery,
    progQuery,
  ]);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Evaluasi Organisasi</h1>
        <p className="text-gray-600 mt-1">
          Berikan masukan, catatan kekurangan, dan rekomendasi program kerja (Periode {selectedPeriod.code}).
        </p>
      </div>

      <EvaluasiClient evaluations={evaluations || []} programs={programs || []} />
    </div>
  );
}
