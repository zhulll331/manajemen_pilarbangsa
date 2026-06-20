'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/utils/supabase/server'

export async function tambahIuran(formData: FormData) {
  const supabase = await createClient()
  
  const memberId = formData.get('member_id');
  const paymentDate = formData.get('payment_date');

  const { error } = await supabase.from('dues').insert({
    member_id: memberId === "" ? null : memberId,
    month: Number(formData.get('month')),
    year: Number(formData.get('year')),
    amount: Number(formData.get('amount')),
    status: formData.get('status'),
    payment_date: paymentDate ? paymentDate : null,
    proof_url: formData.get('proof_url')
  })

  if (error) throw new Error(error.message)
  revalidatePath('/dashboard', 'layout')
}

export async function editIuran(id: string, formData: FormData) {
  const supabase = await createClient()
  
  const memberId = formData.get('member_id');
  const paymentDate = formData.get('payment_date');

  const { error } = await supabase.from('dues')
    .update({
      member_id: memberId === "" ? null : memberId,
      month: Number(formData.get('month')),
      year: Number(formData.get('year')),
      amount: Number(formData.get('amount')),
      status: formData.get('status'),
      payment_date: paymentDate ? paymentDate : null,
      proof_url: formData.get('proof_url')
    })
    .eq('id', id)

  if (error) throw new Error(error.message)
  revalidatePath('/dashboard', 'layout')
}

export async function hapusIuran(id: string) {
  const supabase = await createClient()
  
  const { error } = await supabase.from('dues').delete().eq('id', id)

  if (error) throw new Error(error.message)
  revalidatePath('/dashboard', 'layout')
}

export async function tambahIuranMassal(data: any[]) {
  const supabase = await createClient()
  
  const { error } = await supabase.from('dues').insert(data)

  if (error) throw new Error(error.message)
  revalidatePath('/dashboard', 'layout')
}
