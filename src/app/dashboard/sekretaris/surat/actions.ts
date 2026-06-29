'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/utils/supabase/server'

export async function tambahSurat(formData: FormData) {
  const supabase = await createClient()

  const file_url = formData.get('file_url') as string || null;
  
  const { error } = await supabase.from('letters').insert({
    letter_number: formData.get('letter_number') as string,
    letter_type: formData.get('letter_type') as string,
    date: formData.get('date') as string || null,
    sender: formData.get('sender') as string,
    recipient: formData.get('recipient') as string,
    subject: formData.get('subject') as string,
    file_url: file_url,
    status: formData.get('status') as string || 'Diterima',
  })

  if (error) throw new Error(error.message)
  revalidatePath('/dashboard', 'layout')
}

export async function editSurat(formData: FormData) {
  const supabase = await createClient()
  const id = formData.get('id') as string

  const file_url = formData.get('file_url') as string || null;

  const { error } = await supabase.from('letters').update({
    letter_number: formData.get('letter_number') as string,
    letter_type: formData.get('letter_type') as string,
    date: formData.get('date') as string || null,
    sender: formData.get('sender') as string,
    recipient: formData.get('recipient') as string,
    subject: formData.get('subject') as string,
    file_url: file_url,
    status: formData.get('status') as string,
  }).eq('id', id)

  if (error) throw new Error(error.message)
  revalidatePath('/dashboard', 'layout')
}

export async function hapusSurat(id: string) {
  const supabase = await createClient()
  const { error } = await supabase.from('letters').delete().eq('id', id)
  if (error) throw new Error(error.message)
  revalidatePath('/dashboard', 'layout')
}
