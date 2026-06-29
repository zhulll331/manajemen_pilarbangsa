import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { DashboardLayoutClient } from "@/components/DashboardLayoutClient";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  let userRole = profile?.role;
  const email = user.email?.toLowerCase() || '';

  if (
    userRole === 'divisi' ||
    userRole === 'admin_divisi' ||
    userRole === 'humas' ||
    userRole === 'riset' ||
    userRole === 'penalaran' ||
    userRole === 'pengabdian' ||
    email.includes('humas') ||
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
