import { Metadata } from "next";
import { getSelectedPeriodForDashboard } from "@/lib/periods/server";
import { isSchemaMissingError } from "@/lib/periods/utils";
import { createClient } from "@/utils/supabase/server";
import ArsipClient from "./ArsipClient";

export const metadata: Metadata = {
  title: "Kelola Arsip Publik | Dashboard Humas",
  description: "Pengelolaan arsip publik UKM",
};

export default async function ArsipPage() {
  const supabase = await createClient();
  const { selectedPeriod, periods, isLocked, schemaReady } =
    await getSelectedPeriodForDashboard();

  let qArchives = supabase
    .from("archives")
    .select("*, programs(title)")
    .order("created_at", { ascending: false });

  let qPrograms = supabase
    .from("programs")
    .select("id, title")
    .order("created_at", { ascending: false });

  if (schemaReady) {
    qArchives = qArchives.eq("period_id", selectedPeriod.id);
    qPrograms = qPrograms.eq("period_id", selectedPeriod.id);
  }

  const [{ data: initialArchivesData, error: archErr }, { data: initialProgramsData }] = await Promise.all([
    qArchives,
    qPrograms,
  ]);
  let archives = initialArchivesData;
  let programs = initialProgramsData;

  if (schemaReady && isSchemaMissingError(archErr)) {
    const [aFallback, pFallback] = await Promise.all([
      supabase.from("archives").select("*, programs(title)").order("created_at", { ascending: false }),
      supabase.from("programs").select("id, title").order("created_at", { ascending: false }),
    ]);
    archives = aFallback.data;
    programs = pFallback.data;
  }

  const periodCodes = Array.from(
    new Set([
      ...periods.map((p) => p.code),
      "2022/2023",
      "2023/2024",
      "2024/2025",
      "2025/2026",
      "2026/2027",
    ])
  ).sort((a, b) => b.localeCompare(a));

  return (
    <ArsipClient
      initialArchives={archives || []}
      programs={programs || []}
      periodId={schemaReady ? selectedPeriod.id : null}
      activePeriodCode={selectedPeriod.code}
      periodOptions={periodCodes}
      isLocked={isLocked}
    />
  );
}
