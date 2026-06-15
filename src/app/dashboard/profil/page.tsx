import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import ProfilClient from "./ProfilClient";

export default async function ProfilPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/");
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  if (!profile) {
    return <div>Error loading profile.</div>;
  }

  const profileData = {
    id: profile.id,
    email: user.email || "",
    full_name: profile.full_name,
    role: profile.role
  };

  return (
    <ProfilClient profile={profileData} />
  );
}
