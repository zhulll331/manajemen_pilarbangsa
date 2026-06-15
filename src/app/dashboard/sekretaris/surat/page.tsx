import { createClient } from "@/utils/supabase/server";
import SuratClient from "./SuratClient";

export default async function SuratPage() {
  const supabase = await createClient();

  const { data: letters } = await supabase
    .from("letters")
    .select("*")
    .order("date", { ascending: false });

  return <SuratClient letters={letters || []} />;
}
