'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/utils/supabase/server'

export async function tambahAnggota(formData: FormData) {
  const supabase = await createClient()

  const { error } = await supabase.from('members').insert({
    name: formData.get('name'),
    nim: formData.get('nim'),
    faculty: formData.get('faculty'),
    study_program: formData.get('study_program'),
    generation: formData.get('generation'),
    phone: formData.get('phone'),
    division: formData.get('division'),
    status: formData.get('status')
  })

  if (error) throw new Error(error.message)
  revalidatePath('/dashboard/sekretaris/anggota')
}

export async function editAnggota(id: string, formData: FormData) {
  const supabase = await createClient()

  const { error } = await supabase.from('members')
    .update({
      name: formData.get('name'),
      nim: formData.get('nim'),
      faculty: formData.get('faculty'),
      study_program: formData.get('study_program'),
      generation: formData.get('generation'),
      phone: formData.get('phone'),
      division: formData.get('division'),
      status: formData.get('status')
    })
    .eq('id', id)

  if (error) throw new Error(error.message)
  revalidatePath('/dashboard/sekretaris/anggota')
}

export async function hapusAnggota(id: string) {
  const supabase = await createClient()

  const { error } = await supabase.from('members').delete().eq('id', id)

  if (error) throw new Error(error.message)
  revalidatePath('/dashboard/sekretaris/anggota')
}

export async function importAnggotaBatch(data: any[]) {
  const supabase = await createClient()
  
  // Format data to match DB column names
  const formattedData = data.map(item => ({
    name: item.Nama || item.name || '',
    nim: item.NIM || item.nim || null,
    faculty: item.Fakultas || item.faculty || null,
    study_program: item.Prodi || item.study_program || null,
    generation: item.Angkatan || item.generation || null,
    phone: item.Telepon || item.phone || null,
    division: item.Divisi || item.division || null,
    status: item.Status || item.status || 'Aktif'
  })).filter(item => item.name); // only insert rows that have at least a name

  if (formattedData.length === 0) {
    throw new Error("Tidak ada data yang valid untuk diimpor.");
  }

  const { error } = await supabase.from('members').insert(formattedData)
  
  if (error) throw new Error(error.message)
  revalidatePath('/dashboard/sekretaris/anggota')
}
