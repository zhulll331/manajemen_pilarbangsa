import { createClient } from "@/utils/supabase/server";
import EvaluasiClient from "@/app/dashboard/sekretaris/evaluasi/EvaluasiClient";

export default async function KetuaEvaluasiPage() {
  const supabase = await createClient();

  // Fetch evaluations with program details
  const { data: evaluations } = await supabase
    .from("evaluations")
    .select("*, programs(title)")
    .order("created_at", { ascending: false });

  // Fetch active programs for dropdown
  const { data: programs } = await supabase
    .from("programs")
    .select("id, title")
    .order("title", { ascending: true });

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Evaluasi Organisasi</h1>
        <p className="text-gray-600 mt-1">Berikan masukan, catatan kekurangan, dan rekomendasi untuk setiap program kerja.</p>
      </div>

      <EvaluasiClient evaluations={evaluations || []} programs={programs || []} />
    </div>
  );
}
