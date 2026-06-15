import { createClient } from "@/utils/supabase/server";
import PresensiClient from "./PresensiClient";

export default async function PresensiPage() {
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
    .select("id, name, division, faculty, generation")
    .eq("status", "Aktif")
    .order("name");

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Presensi Anggota</h1>
        <p className="text-gray-600 mt-1">Sistem presensi kelas untuk menandai kehadiran per kegiatan secara massal.</p>
      </div>

      <PresensiClient
        allAttendance={attendance || []}
        agendas={agendas || []}
        members={members || []}
      />
    </div>
  );
}
