'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/utils/supabase/server'

export async function tambahEvaluasi(formData: FormData) {
  const supabase = await createClient()
  
  const programId = formData.get('program_id');

  const { error } = await supabase.from('evaluations').insert({
    program_id: programId === "" ? null : programId,
    title: formData.get('title'),
    strengths: formData.get('strengths'),
    weaknesses: formData.get('weaknesses'),
    recommendations: formData.get('recommendations')
  })

  if (error) throw new Error(error.message)
  revalidatePath('/dashboard/sekretaris/evaluasi')
  revalidatePath('/dashboard/sekretaris')
}

export async function editEvaluasi(id: string, formData: FormData) {
  const supabase = await createClient()
  
  const programId = formData.get('program_id');

  const { error } = await supabase.from('evaluations')
    .update({
      program_id: programId === "" ? null : programId,
      title: formData.get('title'),
      strengths: formData.get('strengths'),
      weaknesses: formData.get('weaknesses'),
      recommendations: formData.get('recommendations')
    })
    .eq('id', id)

  if (error) throw new Error(error.message)
  revalidatePath('/dashboard/sekretaris/evaluasi')
  revalidatePath('/dashboard/sekretaris')
}

export async function hapusEvaluasi(id: string) {
  const supabase = await createClient()
  
  const { error } = await supabase.from('evaluations').delete().eq('id', id)

  if (error) throw new Error(error.message)
  revalidatePath('/dashboard/sekretaris/evaluasi')
  revalidatePath('/dashboard/sekretaris')
}

export async function isGeminiConfigured() {
  return !!process.env.GEMINI_API_KEY;
}

export async function parseNotulenEvaluasi(notulenText: string) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error(
      "Kunci API Gemini (GEMINI_API_KEY) tidak ditemukan di environment. Silakan tambahkan kunci tersebut di file .env.local."
    );
  }

  const prompt = `Anda adalah asisten organisasi profesional. Analisis teks notulensi rapat evaluasi berikut dan ekstrak informasi utama untuk form evaluasi. 
Hasilkan respon dalam format JSON murni. Format JSON yang DIWAJIBKAN:
{
  "title": "string (Judul evaluasi singkat dan jelas, contoh: 'Evaluasi Seminar Teknologi' atau 'Evaluasi Kinerja Divisi Humas Bulan Juli')",
  "strengths": "string (Poin-poin kelebihan, keberhasilan, atau hal positif yang didiskusikan. Gunakan format list bullet dengan tanda hubung '-', pastikan ada enter di setiap poinnya)",
  "weaknesses": "string (Poin-poin kelemahan, kendala, masalah, atau hal negatif yang dihadapi. Gunakan format list bullet dengan tanda hubung '-', pastikan ada enter di setiap poinnya)",
  "recommendations": "string (Saran perbaikan, tindak lanjut, atau rekomendasi di masa mendatang. Gunakan format list bullet dengan tanda hubung '-', pastikan ada enter di setiap poinnya)"
}

Teks Notulensi Rapat:
"""
${notulenText}
"""`;

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: prompt,
                },
              ],
            },
          ],
          generationConfig: {
            responseMimeType: "application/json",
          },
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Gemini API Error:", errorText);
      throw new Error("Gagal menghubungi Gemini API: " + response.statusText);
    }

    const result = await response.json();
    const responseText = result.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!responseText) {
      throw new Error("Respons dari Gemini API kosong.");
    }

    const parsedData = JSON.parse(responseText.trim());
    return parsedData;
  } catch (error: any) {
    console.error("Error parsing notulen:", error);
    throw new Error(error.message || "Gagal memproses notulensi menggunakan AI.");
  }
}
