'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/utils/supabase/server'

export async function tambahAgenda(formData: FormData) {
  const supabase = await createClient()
  
  const agendaDate = formData.get('date');
  const agendaTime = formData.get('time');

  const { error } = await supabase.from('agendas').insert({
    title: formData.get('title'),
    description: formData.get('description'),
    date: agendaDate ? agendaDate : null,
    time: agendaTime ? agendaTime : null,
    location: formData.get('location'),
    category: formData.get('category')
  })

  if (error) throw new Error(error.message)
  revalidatePath('/dashboard/ketua/agenda')
  revalidatePath('/dashboard/ketua')
}

export async function editAgenda(id: string, formData: FormData) {
  const supabase = await createClient()
  
  const agendaDate = formData.get('date');
  const agendaTime = formData.get('time');

  const { error } = await supabase.from('agendas')
    .update({
      title: formData.get('title'),
      description: formData.get('description'),
      date: agendaDate ? agendaDate : null,
      time: agendaTime ? agendaTime : null,
      location: formData.get('location'),
      category: formData.get('category')
    })
    .eq('id', id)

  if (error) throw new Error(error.message)
  revalidatePath('/dashboard/ketua/agenda')
  revalidatePath('/dashboard/ketua')
}

export async function hapusAgenda(id: string) {
  const supabase = await createClient()
  
  const { error } = await supabase.from('agendas').delete().eq('id', id)

  if (error) throw new Error(error.message)
  revalidatePath('/dashboard/ketua/agenda')
  revalidatePath('/dashboard/ketua')
}
