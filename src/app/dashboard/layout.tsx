import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { DashboardLayoutClient } from "@/components/DashboardLayoutClient";

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

  // Jalankan verifikasi user dan pengambilan profile secara paralel
  const [userResult, profileResult] = await Promise.all([
    supabase.auth.getUser(),
    supabase.from('profiles').select('*').eq('id', session.user.id).single(),
  ]);

  const user = userResult.data.user;
  if (!user) {
    redirect("/login");
  }

  const profile = profileResult.data;

  let userRole = profile?.role;
  const email = user.email?.toLowerCase() || '';

  if (email.includes('humas') || userRole === 'humas') {
    userRole = 'humas';
  } else if (
    userRole === 'divisi' ||
    userRole === 'admin_divisi' ||
    userRole === 'riset' ||
    userRole === 'penalaran' ||
    userRole === 'pengabdian' ||
    email.includes('riset') ||
    email.includes('penalaran') ||
    email.includes('pengabdian') ||
    email.includes('divisi') ||
    email.includes('wakilketua')
  ) {
    userRole = 'divisi';
  } else if (!userRole) {
    userRole = 'ketua';
  }

  return (
    <DashboardLayoutClient 
      role={userRole} 
      name={profile?.full_name || user.email}
    >
      {children}
    </DashboardLayoutClient>
  );
}
