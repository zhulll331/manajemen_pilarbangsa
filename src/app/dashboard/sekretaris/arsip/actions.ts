'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/utils/supabase/server'

export async function tambahArsip(formData: FormData) {
  const supabase = await createClient()

  let file_url = formData.get('file_url') as string || null;
  const file = formData.get('file') as File | null;

  if (file && file.size > 0) {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 10)}.${fileExt}`;
    const filePath = `arsip/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('dokumen')
      .upload(filePath, file);

    if (uploadError) throw new Error(uploadError.message);

    const { data: { publicUrl } } = supabase.storage
      .from('dokumen')
      .getPublicUrl(filePath);
      
    file_url = publicUrl;
  }
  
  const { error } = await supabase.from('archives').insert({
    title: formData.get('title') as string,
    category: formData.get('category') as string,
    description: formData.get('description') as string,
    file_url: file_url,
    uploaded_by: formData.get('uploaded_by') as string,
  })

  if (error) throw new Error(error.message)
  revalidatePath('/dashboard', 'layout')
}

export async function editArsip(formData: FormData) {
  const supabase = await createClient()
  const id = formData.get('id') as string

  let file_url = formData.get('file_url') as string || null;
  const file = formData.get('file') as File | null;

  if (file && file.size > 0) {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 10)}.${fileExt}`;
    const filePath = `arsip/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('dokumen')
      .upload(filePath, file);

    if (uploadError) throw new Error(uploadError.message);

    const { data: { publicUrl } } = supabase.storage
      .from('dokumen')
      .getPublicUrl(filePath);
      
    file_url = publicUrl;
  }

  const { error } = await supabase.from('archives').update({
    title: formData.get('title') as string,
    category: formData.get('category') as string,
    description: formData.get('description') as string,
    file_url: file_url,
    uploaded_by: formData.get('uploaded_by') as string,
  }).eq('id', id)

  if (error) throw new Error(error.message)
  revalidatePath('/dashboard', 'layout')
}

export async function hapusArsip(id: string) {
  const supabase = await createClient()
  const { error } = await supabase.from('archives').delete().eq('id', id)
  if (error) throw new Error(error.message)
  revalidatePath('/dashboard', 'layout')
}
