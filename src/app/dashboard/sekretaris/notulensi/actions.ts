'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/utils/supabase/server'

export async function tambahNotulensi(formData: FormData) {
  const supabase = await createClient()
  
  const { error } = await supabase.from('minutes').insert({
    title: formData.get('title') as string,
    meeting_date: formData.get('meeting_date') as string || null,
    participants: formData.get('participants') as string,
    discussion: formData.get('discussion') as string,
    decisions: formData.get('decisions') as string,
    follow_up: formData.get('follow_up') as string,
    file_url: formData.get('file_url') as string || null,
  })

  if (error) throw new Error(error.message)
  revalidatePath('/dashboard/sekretaris/notulensi')
}

export async function editNotulensi(formData: FormData) {
  const supabase = await createClient()
  const id = formData.get('id') as string

  const { error } = await supabase.from('minutes').update({
    title: formData.get('title') as string,
    meeting_date: formData.get('meeting_date') as string || null,
    participants: formData.get('participants') as string,
    discussion: formData.get('discussion') as string,
    decisions: formData.get('decisions') as string,
    follow_up: formData.get('follow_up') as string,
    file_url: formData.get('file_url') as string || null,
  }).eq('id', id)

  if (error) throw new Error(error.message)
  revalidatePath('/dashboard/sekretaris/notulensi')
}

export async function hapusNotulensi(id: string) {
  const supabase = await createClient()
  const { error } = await supabase.from('minutes').delete().eq('id', id)
  if (error) throw new Error(error.message)
  revalidatePath('/dashboard/sekretaris/notulensi')
}

export async function isGeminiConfigured() {
  return !!process.env.GEMINI_API_KEY;
}

export async function parseNotulensiRapat(notulenText: string) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("Kunci API Gemini tidak ditemukan.");
  }

  const prompt = `Anda adalah asisten Sekretaris profesional. Ekstrak teks notulensi rapat berikut ke dalam JSON.
Format JSON yang DIWAJIBKAN:
{
  "title": "string (Judul rapat, misal: Rapat Pleno Agustus)",
  "meeting_date": "string (Tanggal rapat jika disebutkan, format YYYY-MM-DD. Kosongkan jika tidak ada)",
  "participants": "string (Siapa saja yang hadir, pisahkan dengan koma)",
  "discussion": "string (Poin-poin pembahasan, gunakan list bullet dengan strip '-')",
  "decisions": "string (Kesimpulan/keputusan yang diambil, gunakan list bullet dengan strip '-')",
  "follow_up": "string (Tindak lanjut/tugas/langkah selanjutnya, gunakan list bullet dengan strip '-')"
}

Teks Notulensi:
"""
${notulenText}
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

    return JSON.parse(responseText.trim());
  } catch (error: any) {
    throw new Error(error.message || "Gagal memproses dengan AI.");
  }
}
