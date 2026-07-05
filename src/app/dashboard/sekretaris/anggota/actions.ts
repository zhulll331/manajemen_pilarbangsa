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
  revalidatePath('/dashboard', 'layout')
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
  revalidatePath('/dashboard', 'layout')
}

export async function hapusAnggota(id: string) {
  const supabase = await createClient()

  const { error } = await supabase.from('members').delete().eq('id', id)

  if (error) throw new Error(error.message)
  revalidatePath('/dashboard', 'layout')
}

export async function importAnggotaBatch(data: any[]) {
  const supabase = await createClient()
  
  // Format data to match DB column names
  const rawData = data.map(item => ({
    name: item.Nama || item.name || '',
    nim: item.NIM || item.nim || null,
    faculty: item.Fakultas || item.faculty || null,
    study_program: item.Prodi || item.study_program || null,
    generation: item.Angkatan || item.generation || null,
    phone: item.Telepon || item.phone || null,
    division: item.Divisi || item.division || null,
    status: item.Status || item.status || 'Aktif'
  })).filter(item => item.name); // only insert rows that have at least a name

  // 1. Mencegah duplikasi dari file Excel itu sendiri
  const uniqueMap = new Map();
  rawData.forEach(item => {
    // Gunakan NIM sebagai key utama, atau Nama (huruf kecil) jika NIM kosong
    const key = item.nim ? String(item.nim).trim() : item.name.toLowerCase().trim();
    if (!uniqueMap.has(key)) {
      uniqueMap.set(key, item);
    }
  });
  const formattedData = Array.from(uniqueMap.values());

  if (formattedData.length === 0) {
    throw new Error("Tidak ada data yang valid untuk diimpor.");
  }

  // 2. Mengambil data dari database untuk mengecek duplikasi
  const { data: existingMembers, error: fetchError } = await supabase.from('members').select('nim, name');
  if (fetchError) throw new Error(fetchError.message);

  const existingKeys = new Set();
  existingMembers?.forEach(member => {
    if (member.nim) existingKeys.add(String(member.nim).trim());
    if (member.name) existingKeys.add(member.name.toLowerCase().trim());
  });

  // 3. Menyaring hanya data yang benar-benar baru
  const newDataToInsert = formattedData.filter(item => {
    const nimKey = item.nim ? String(item.nim).trim() : null;
    const nameKey = item.name.toLowerCase().trim();
    
    if (nimKey && existingKeys.has(nimKey)) return false;
    if (existingKeys.has(nameKey)) return false;
    return true;
  });

  // Jika semua data sudah ada, langsung sukses tanpa error
  if (newDataToInsert.length === 0) {
    revalidatePath('/dashboard', 'layout')
    return;
  }

  const { error } = await supabase.from('members').insert(newDataToInsert)
  
  if (error) throw new Error(error.message)
  revalidatePath('/dashboard', 'layout')
}
