'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'

export async function login(formData: FormData) {
  const supabase = await createClient()

  const data = {
    email: formData.get('email') as string,
    password: formData.get('password') as string,
  }

  const { error, data: authData } = await supabase.auth.signInWithPassword(data)

  if (error || !authData.user) {
    redirect('/login?error=' + encodeURIComponent('Login Gagal: Periksa email dan password Anda.'))
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, division_name')
    .eq('id', authData.user.id)
    .single()

  let userRole = profile?.role
  const email = authData.user.email?.toLowerCase() || ''

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
    userRole = 'divisi'
  } else if (!userRole) {
    userRole = 'ketua'
  }

  revalidatePath('/', 'layout')
  redirect(`/dashboard/${userRole}`)
}

export async function logout() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  revalidatePath('/', 'layout')
  redirect('/')
}
