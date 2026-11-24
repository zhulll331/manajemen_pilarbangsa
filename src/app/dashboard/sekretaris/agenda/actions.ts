'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/utils/supabase/server'
import { requireWritablePeriod } from '@/lib/periods/server'
import { formatPeriodErrorMessage } from '@/lib/periods/utils'

export async function tambahAgenda(formData: FormData) {
  const { periodId, schemaReady } = await requireWritablePeriod();
  const supabase = await createClient()
  
  const agendaDate = formData.get('date');
  const agendaTime = formData.get('time');
  const folder_id = formData.get('folder_id') as string || null;

  const payloadAll: Record<string, unknown> = {
    title: formData.get('title'),
    description: formData.get('description'),
    date: agendaDate ? agendaDate : null,
    time: agendaTime ? agendaTime : null,
    location: formData.get('location'),
    category: formData.get('category'),
    folder_id,
  };

  const payloadFallback: Record<string, unknown> = {
    title: formData.get('title'),
    description: formData.get('description'),
    date: agendaDate ? agendaDate : null,
    time: agendaTime ? agendaTime : null,
    location: formData.get('location'),
    category: formData.get('category'),
  };

  if (schemaReady && periodId) {
    payloadAll.period_id = periodId;
    payloadFallback.period_id = periodId;
  }

  let { error } = await supabase.from('agendas').insert(payloadAll)
  if (error && error.message.includes('folder_id')) {
    const { error: fallbackError } = await supabase.from('agendas').insert(payloadFallback)
    error = fallbackError
  }

  if (error) throw new Error(formatPeriodErrorMessage(error, error.message))
  revalidatePath('/dashboard', 'layout')
}

export async function editAgenda(id: string, formData: FormData) {
  const { periodId, schemaReady } = await requireWritablePeriod();
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

  let q1 = supabase.from('agendas').update(payloadAll).eq('id', id);
  if (schemaReady && periodId) q1 = q1.eq('period_id', periodId);
  let { error } = await q1;
  if (error && error.message.includes('folder_id')) {
    let q2 = supabase.from('agendas').update(payloadFallback).eq('id', id);
    if (schemaReady && periodId) q2 = q2.eq('period_id', periodId);
    const { error: fallbackError } = await q2;
    error = fallbackError
  }

  if (error) throw new Error(formatPeriodErrorMessage(error, error.message))
  revalidatePath('/dashboard', 'layout')
}

export async function hapusAgenda(id: string) {
  const { periodId, schemaReady } = await requireWritablePeriod();
  const supabase = await createClient()
  
  let query = supabase.from('agendas').delete().eq('id', id);
  if (schemaReady && periodId) query = query.eq('period_id', periodId);
  const { error } = await query;

  if (error) throw new Error(formatPeriodErrorMessage(error, error.message))
  revalidatePath('/dashboard', 'layout')
}

