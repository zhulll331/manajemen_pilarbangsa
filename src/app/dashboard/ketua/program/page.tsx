import { createClient } from "@/utils/supabase/server";
import ProgramClient from "./ProgramClient";

export default async function ProgramPage() {
  const supabase = await createClient();

  const { data: programs } = await supabase
    .from("programs")
    .select("*")
    .order("created_at", { ascending: false });

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Program Kerja</h1>
        <p className="text-gray-600 mt-1">Kelola dan pantau seluruh program kerja organisasi.</p>
      </div>

      <ProgramClient programs={programs || []} />
    </div>
  );
}
