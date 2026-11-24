'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/utils/supabase/server'
import { requireWritablePeriod } from '@/lib/periods/server'
import { formatPeriodErrorMessage } from '@/lib/periods/utils'

export async function tambahSurat(formData: FormData) {
  const { periodId, schemaReady } = await requireWritablePeriod();
  const supabase = await createClient()

  const file_url = formData.get('file_url') as string || null;
  
  const payload: Record<string, unknown> = {
    letter_number: formData.get('letter_number') as string,
    letter_type: formData.get('letter_type') as string,
    date: formData.get('date') as string || null,
    sender: formData.get('sender') as string,
    recipient: formData.get('recipient') as string,
    subject: formData.get('subject') as string,
    file_url: file_url,
    status: formData.get('status') as string || 'Diterima',
  };
  if (schemaReady && periodId) {
    payload.period_id = periodId;
  }

  const { data, error } = await supabase.from('letters').insert(payload).select('id').single()

  if (error) throw new Error(formatPeriodErrorMessage(error, error.message))
  revalidatePath('/dashboard', 'layout')
  return { id: data.id }
}

export async function editSurat(formData: FormData) {
  const { periodId, schemaReady } = await requireWritablePeriod();
  const supabase = await createClient()
  const id = formData.get('id') as string

  const file_url = formData.get('file_url') as string || null;

  let query = supabase.from('letters').update({
    letter_number: formData.get('letter_number') as string,
    letter_type: formData.get('letter_type') as string,
    date: formData.get('date') as string || null,
    sender: formData.get('sender') as string,
    recipient: formData.get('recipient') as string,
    subject: formData.get('subject') as string,
    file_url: file_url,
    status: formData.get('status') as string,
  }).eq('id', id);

  if (schemaReady && periodId) query = query.eq('period_id', periodId);
  const { error } = await query;

  if (error) throw new Error(formatPeriodErrorMessage(error, error.message))
  revalidatePath('/dashboard', 'layout')
}

export async function hapusSurat(id: string) {
  const { periodId, schemaReady } = await requireWritablePeriod();
  const supabase = await createClient()
  let query = supabase.from('letters').delete().eq('id', id);
  if (schemaReady && periodId) query = query.eq('period_id', periodId);
  const { error } = await query;
  if (error) throw new Error(formatPeriodErrorMessage(error, error.message))
  revalidatePath('/dashboard', 'layout')
}

