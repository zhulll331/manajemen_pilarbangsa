'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/utils/supabase/server'

export async function tambahProgram(formData: FormData) {
  const supabase = await createClient()
  
  const startDate = formData.get('start_date');
  const endDate = formData.get('end_date');

  const { error } = await supabase.from('programs').insert({
    title: formData.get('title'),
    description: formData.get('description'),
    division: formData.get('division'),
    person_in_charge: formData.get('person_in_charge'),
    status: formData.get('status'),
    start_date: startDate ? startDate : null,
    end_date: endDate ? endDate : null
  })

  if (error) throw new Error(error.message)
  revalidatePath('/dashboard/ketua/program')
  revalidatePath('/dashboard/ketua')
}

export async function editProgram(id: string, formData: FormData) {
  const supabase = await createClient()
  
  const startDate = formData.get('start_date');
  const endDate = formData.get('end_date');

  const { error } = await supabase.from('programs')
    .update({
      title: formData.get('title'),
      description: formData.get('description'),
      division: formData.get('division'),
      person_in_charge: formData.get('person_in_charge'),
      status: formData.get('status'),
      start_date: startDate ? startDate : null,
      end_date: endDate ? endDate : null
    })
    .eq('id', id)

  if (error) throw new Error(error.message)
  revalidatePath('/dashboard/ketua/program')
  revalidatePath('/dashboard/ketua')
}

export async function hapusProgram(id: string) {
  const supabase = await createClient()
  
  const { error } = await supabase.from('programs').delete().eq('id', id)

  if (error) throw new Error(error.message)
  revalidatePath('/dashboard/ketua/program')
  revalidatePath('/dashboard/ketua')
}

export async function importProgramBatch(data: any[]) {
  const supabase = await createClient()
  
  const formattedData = data.map(item => ({
    title: item.Judul || item.title || '',
    description: item.Deskripsi || item.description || null,
    division: item.Divisi || item.division || null,
    person_in_charge: item.PenanggungJawab || item.PIC || item.person_in_charge || null,
    status: item.Status || item.status || 'Berjalan',
    start_date: item.TanggalMulai || item.start_date || null,
    end_date: item.TanggalSelesai || item.end_date || null
  })).filter(item => item.title);

  if (formattedData.length === 0) {
    throw new Error("Tidak ada data yang valid untuk diimpor.");
  }

  const { error } = await supabase.from('programs').insert(formattedData)
  
  if (error) throw new Error(error.message)
  revalidatePath('/dashboard/ketua/program')
  revalidatePath('/dashboard/ketua')
}

export async function parseProgramKerja(ideText: string) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("Kunci API Gemini tidak ditemukan.");
  }

  const prompt = `Anda adalah asisten Ketua Organisasi. Ekstrak teks ide / brainstorming program kerja berikut ke dalam JSON.
Format JSON yang DIWAJIBKAN:
{
  "title": "string (Judul program yang formal dan representatif)",
  "description": "string (Deskripsi / tujuan rinci program)",
  "division": "string (Nama divisi yang paling cocok, misal: Humas, Pendidikan, Sosial. Jika tidak tahu, kosongkan)",
  "person_in_charge": "string (Nama penanggung jawab jika disebutkan, jika tidak ada kosongkan)"
}

Teks Ide Program:
"""
${ideText}
"""`;

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { responseMimeType: "application/json" }
        })
      }
    );

    if (!response.ok) throw new Error(response.statusText);
    const result = await response.json();
    const responseText = result.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!responseText) throw new Error("Respons AI kosong.");

    const parsed = JSON.parse(responseText.trim());
    return parsed;
  } catch (error: any) {
    throw new Error(error.message || "Gagal memproses dengan AI.");
  }
}
