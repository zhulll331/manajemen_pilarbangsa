import { createClient } from "@/utils/supabase/server";
import PresensiPengurusClient from "./PresensiPengurusClient";

export default async function PresensiPengurusPage() {
  const supabase = await createClient();

  const { data: attendance } = await supabase
    .from("attendance")
    .select("agenda_id, member_id, status");

  const { data: agendas } = await supabase
    .from("agendas")
    .select("id, title, date")
    .order("date", { ascending: false });

  const { data: members } = await supabase
    .from("members")
    .select("id, name, division, faculty, generation, status")
    .eq("status", "Pengurus Aktif")
    .order("name");

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Presensi Pengurus</h1>
        <p className="text-gray-600 mt-1">Sistem presensi khusus untuk pengurus UKM Pilar Bangsa.</p>
      </div>

      <PresensiPengurusClient
        allAttendance={attendance || []}
        agendas={agendas || []}
        members={members || []}
      />
    </div>
  );
}
