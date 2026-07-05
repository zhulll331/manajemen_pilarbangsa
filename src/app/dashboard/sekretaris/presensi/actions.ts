'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/utils/supabase/server'

// Keep old actions if needed, or remove them. We'll replace with simpanPresensiMassal.
export async function simpanPresensiMassal(agenda_id: string, presensiData: { member_id: string, status: string }[]) {
  const supabase = await createClient()

  if (!agenda_id) throw new Error("Agenda belum dipilih")

  // Delete all existing attendance for this agenda first
  const { error: deleteError } = await supabase
    .from('attendance')
    .delete()
    .eq('agenda_id', agenda_id)

  if (deleteError) throw new Error("Gagal menghapus data presensi lama: " + deleteError.message)

  // Insert the new ones
  if (presensiData.length > 0) {
    const recordsToInsert = presensiData.map(p => ({
      agenda_id: agenda_id,
      member_id: p.member_id,
      status: p.status
    }))

    const { error: insertError } = await supabase
      .from('attendance')
      .insert(recordsToInsert)

    if (insertError) throw new Error("Gagal menyimpan presensi baru: " + insertError.message)
  }

  revalidatePath('/dashboard', 'layout')
}

export async function isGeminiConfigured() {
  return !!process.env.GEMINI_API_KEY;
}

export async function parsePresensiAI(rawText: string, members: { id: string, name: string }[]) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("API Key Gemini tidak ditemukan. Hubungi admin.");

  const membersListStr = members.map(m => `- ${m.name} (ID: ${m.id})`).join("\n");

  const prompt = `
Anda adalah sistem pengekstrak presensi.
Tugas Anda adalah membaca teks kotor dari catatan HP, dan mencocokkannya dengan daftar anggota resmi berikut:
${membersListStr}

Catatan kotor:
"""
${rawText}
"""

Instruksi:
1. Ekstrak siapa saja yang hadir, izin, atau sakit dari teks kotor.
2. Cocokkan nama mereka dengan daftar anggota resmi di atas secara fuzzy (misal singkatan/nama panggilan).
3. Untuk setiap orang yang berhasil dicocokkan, tentukan status presensinya: "Hadir", "Izin", atau "Sakit".
4. Abaikan orang yang tidak ada di dalam daftar resmi.
5. Jika ada orang dalam teks kotor yang tidak jelas statusnya, asumsikan "Hadir".
6. Format output HARUS berupa JSON murni dengan format array of objects, tanpa backticks atau teks tambahan apa pun. Contoh:
[
  { "member_id": "id-dari-daftar", "name": "Nama Resmi", "status": "Hadir" }
]
  `;

  try {
    const response = await fetch(
      \`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=\${apiKey}\`,
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
