import { getSelectedPeriodForDashboard } from "@/lib/periods/server";
import { createClient } from "@/utils/supabase/server";
import ProgramClient from "./ProgramClient";

export default async function ProgramPage() {
  const supabase = await createClient();
  const { selectedPeriod, schemaReady } = await getSelectedPeriodForDashboard();

  let query = supabase
    .from("programs")
    .select("*")
    .order("created_at", { ascending: false });

  if (schemaReady) {
    query = query.eq("period_id", selectedPeriod.id);
  }

  const { data: programs } = await query;

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Program Kerja</h1>
        <p className="text-gray-600 mt-1">
          Kelola dan pantau seluruh program kerja organisasi (Periode {selectedPeriod.code}).
        </p>
      </div>

      <ProgramClient programs={programs || []} />
    </div>
  );
}
