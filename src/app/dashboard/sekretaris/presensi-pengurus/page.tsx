import { getSelectedPeriodForDashboard } from "@/lib/periods/server";
import { createClient } from "@/utils/supabase/server";
import PresensiPengurusClient from "./PresensiPengurusClient";

export default async function PresensiPengurusPage() {
  const supabase = await createClient();
  const { selectedPeriod, schemaReady } = await getSelectedPeriodForDashboard();

  let qAttendance = supabase.from("attendance").select("agenda_id, member_id, status");
  let qAgendas = supabase.from("agendas").select("id, title, date").order("date", { ascending: false });
  let qMembers = supabase
    .from("members")
    .select("id, name, division, faculty, generation, status")
    .eq("status", "Pengurus Aktif")
    .order("name");

  if (schemaReady) {
    qAttendance = qAttendance.eq("period_id", selectedPeriod.id);
    qAgendas = qAgendas.eq("period_id", selectedPeriod.id);
    qMembers = qMembers.eq("period_id", selectedPeriod.id);
  }

  const [{ data: attendance }, { data: agendas }, { data: members }] = await Promise.all([
    qAttendance,
    qAgendas,
    qMembers,
  ]);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Presensi Pengurus</h1>
        <p className="text-gray-600 mt-1">
          Sistem presensi khusus pengurus UKM Pilar Bangsa (Periode {selectedPeriod.code}).
        </p>
      </div>

      <PresensiPengurusClient
        allAttendance={attendance || []}
        agendas={agendas || []}
        members={members || []}
      />
    </div>
  );
}
