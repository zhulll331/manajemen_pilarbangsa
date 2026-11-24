import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { DashboardLayoutClient } from "@/components/DashboardLayoutClient";
import { getSelectedPeriodForDashboard } from "@/lib/periods/server";
import { resolveEffectiveRole } from "@/lib/periods/utils";
import "./dashboard.css";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  
  // Ambil sesi langsung dari cookie tanpa network call berlebih
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user) {
    redirect("/login");
  }

  // Jalankan verifikasi user, pengambilan profile, dan periode secara paralel
  const [userResult, profileResult, periodState] = await Promise.all([
    supabase.auth.getUser(),
    supabase.from('profiles').select('*').eq('id', session.user.id).single(),
    getSelectedPeriodForDashboard(),
  ]);

  const user = userResult.data.user;
  if (!user) {
    redirect("/login");
  }

  const profile = profileResult.data;
  const userRole = resolveEffectiveRole(profile?.role, user.email);

  return (
    <DashboardLayoutClient 
      role={userRole} 
      name={profile?.full_name || user.email}
      periods={periodState.periods}
      selectedPeriod={periodState.selectedPeriod}
      activePeriod={periodState.activePeriod}
      isLocked={periodState.isLocked}
      schemaReady={periodState.schemaReady}
    >
      {children}
    </DashboardLayoutClient>
  );
}
