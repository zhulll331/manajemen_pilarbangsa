import { getSelectedPeriodForDashboard } from "@/lib/periods/server";
import { createClient } from "@/utils/supabase/server";
import AgendaClient from "./AgendaClient";

export default async function AgendaPage() {
  const supabase = await createClient();
  const { selectedPeriod, schemaReady } = await getSelectedPeriodForDashboard();

  let query = supabase
    .from("agendas")
    .select("*")
    .order("date", { ascending: false });

  if (schemaReady) {
    query = query.eq("period_id", selectedPeriod.id);
  }

  const { data: agendas } = await query;

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Agenda Organisasi</h1>
        <p className="text-gray-600 mt-1">
          Kelola jadwal kegiatan, rapat, dan acara organisasi (Periode {selectedPeriod.code}).
        </p>
      </div>

      <AgendaClient agendas={agendas || []} />
    </div>
  );
}
