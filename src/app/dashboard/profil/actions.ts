'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/utils/supabase/server'

export async function updateProfile(formData: FormData) {
  const supabase = await createClient()

  // Get current user to ensure we are updating the right profile
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    throw new Error("Sesi telah berakhir, silakan login ulang.")
  }

  const fullName = formData.get('full_name')

  const { error } = await supabase
    .from('profiles')
    .update({ full_name: fullName })
    .eq('id', user.id)

  if (error) {
    throw new Error(error.message)
  }

  // Revalidate to update Header in layout
  revalidatePath('/dashboard', 'layout')
}
