import { getSelectedPeriodForDashboard } from "@/lib/periods/server";
import { createClient } from "@/utils/supabase/server";
import IuranClient from "./IuranClient";

export default async function IuranPage() {
  const supabase = await createClient();
  const { selectedPeriod, schemaReady } = await getSelectedPeriodForDashboard();

  let qDues = supabase
    .from("dues")
    .select("*, members(name)")
    .order("year", { ascending: false })
    .order("month", { ascending: false });

  let qMembers = supabase
    .from("members")
    .select("id, name, status")
    .order("name", { ascending: true });

  if (schemaReady) {
    qDues = qDues.eq("period_id", selectedPeriod.id);
    qMembers = qMembers.eq("period_id", selectedPeriod.id);
  }

  const [{ data: dues }, { data: members }] = await Promise.all([qDues, qMembers]);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Iuran Anggota</h1>
        <p className="text-gray-600 mt-1">
          Kelola data pembayaran uang kas / iuran anggota organisasi (Periode {selectedPeriod.code}).
        </p>
      </div>

      <IuranClient
        dues={dues || []}
        members={members || []}
        defaultStartYear={selectedPeriod.start_year}
      />
    </div>
  );
}
