'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/utils/supabase/server'

export async function tambahAgenda(formData: FormData) {
  const supabase = await createClient()
  
  const agendaDate = formData.get('date');
  const agendaTime = formData.get('time');
  const folder_id = formData.get('folder_id') as string || null;

  const payloadAll = {
    title: formData.get('title'),
    description: formData.get('description'),
    date: agendaDate ? agendaDate : null,
    time: agendaTime ? agendaTime : null,
    location: formData.get('location'),
    category: formData.get('category'),
    folder_id
  };

  const payloadFallback = {
    title: formData.get('title'),
    description: formData.get('description'),
    date: agendaDate ? agendaDate : null,
    time: agendaTime ? agendaTime : null,
    location: formData.get('location'),
    category: formData.get('category')
  };

  let { error } = await supabase.from('agendas').insert(payloadAll)
  if (error && error.message.includes('folder_id')) {
    const { error: fallbackError } = await supabase.from('agendas').insert(payloadFallback)
    error = fallbackError
  }

  if (error) throw new Error(error.message)
  revalidatePath('/dashboard', 'layout')
}

export async function editAgenda(id: string, formData: FormData) {
  const supabase = await createClient()
  
  const agendaDate = formData.get('date');
  const agendaTime = formData.get('time');
  const folder_id = formData.get('folder_id') as string || null;

  const payloadAll = {
    title: formData.get('title'),
    description: formData.get('description'),
    date: agendaDate ? agendaDate : null,
    time: agendaTime ? agendaTime : null,
    location: formData.get('location'),
    category: formData.get('category'),
    folder_id
  };

  const payloadFallback = {
    title: formData.get('title'),
    description: formData.get('description'),
    date: agendaDate ? agendaDate : null,
    time: agendaTime ? agendaTime : null,
    location: formData.get('location'),
    category: formData.get('category')
  };

  let { error } = await supabase.from('agendas').update(payloadAll).eq('id', id)
  if (error && error.message.includes('folder_id')) {
    const { error: fallbackError } = await supabase.from('agendas').update(payloadFallback).eq('id', id)
    error = fallbackError
  }

  if (error) throw new Error(error.message)
  revalidatePath('/dashboard', 'layout')
}

export async function hapusAgenda(id: string) {
  const supabase = await createClient()
  
  const { error } = await supabase.from('agendas').delete().eq('id', id)

  if (error) throw new Error(error.message)
  revalidatePath('/dashboard', 'layout')
}
