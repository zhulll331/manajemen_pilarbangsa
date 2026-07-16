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
  revalidatePath('/dashboard', 'layout')
}

export async function tambahNotulensiDanOtomasi(
  notulensiData: { title: string, meeting_date: string, participants: string, discussion: string, decisions: string, follow_up: string, file_url: string },
  agendaData: { title: string, category: string, date: string } | null,
  presensiData: { member_id: string, name: string, status: string }[] | null
) {
  const supabase = await createClient()

  // 1. Tambah Notulensi
  const { data: insertedMinute, error: minuteError } = await supabase.from('minutes').insert(notulensiData).select().single();
  if (minuteError) throw new Error("Gagal menyimpan Notulensi: " + minuteError.message);

  // 2. Jika ada Agenda, tambahkan Agenda
  let newAgendaId = null;
  if (agendaData && agendaData.title) {
    const { data: insertedAgenda, error: agendaError } = await supabase.from('agendas').insert({
      title: agendaData.title,
      category: agendaData.category || 'Lainnya',
      date: agendaData.date || null,
      description: "Dibuat otomatis dari Notulensi: " + notulensiData.title
    }).select().single();

    if (!agendaError && insertedAgenda) {
      newAgendaId = insertedAgenda.id;
    }
  }

  // 3. Jika ada Presensi & Agenda, tambahkan Presensi
  if (newAgendaId && presensiData && presensiData.length > 0) {
    const recordsToInsert = presensiData.map(p => ({
      agenda_id: newAgendaId,
      member_id: p.member_id,
      status: p.status || 'Hadir'
    }));

    await supabase.from('attendance').insert(recordsToInsert);
  }

  revalidatePath('/dashboard', 'layout')
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
  revalidatePath('/dashboard', 'layout')
}

export async function hapusNotulensi(id: string) {
  const supabase = await createClient()
  const { error } = await supabase.from('minutes').delete().eq('id', id)
  if (error) throw new Error(error.message)
  revalidatePath('/dashboard', 'layout')
}

export async function isGeminiConfigured() {
  return !!process.env.OPENROUTER_API_KEY;
}

export async function parseNotulensiRapat(notulenText: string) {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    throw new Error("Kunci API OpenRouter tidak ditemukan. Harap tambahkan OPENROUTER_API_KEY di .env.local");
  }

  const supabase = await createClient();
  const { data: membersData } = await supabase.from('members').select('id, name');
  const membersListStr = membersData ? membersData.map(m => `- ${m.name} (ID: ${m.id})`).join("\n") : "Data anggota kosong.";

  const prompt = `Anda adalah asisten Sekretaris profesional. Ekstrak teks notulensi rapat dan cocokkan data kehadiran dengan daftar anggota resmi berikut:
${membersListStr}

Catatan Notulensi Kotor:
"""
${notulenText}
"""

Instruksi:
1. Ekstrak data Notulensi (Judul, Tanggal, Pembahasan, Keputusan, Tindak Lanjut).
2. Tentukan Agenda Rapat (Judul Agenda, Kategori [Rapat Pengurus/Rapat Anggota/dsb], Tanggal).
3. Ekstrak siapa saja yang hadir/izin/sakit dan COCOKKAN namanya dengan daftar anggota resmi di atas (Fuzzy match).
4. PENTING UNTUK PRESENSI: Jika ada nama yang TIDAK mencantumkan keterangan (misal hanya disebut namanya saja), maka asumsikan dia "Hadir".
5. Identifikasi kekurangan data: Jika di teks tidak ada penyebutan peserta sama sekali, set "missing_info": ["participants_missing"].

Format JSON yang DIWAJIBKAN:
{
  "notulensi": {
    "title": "string (Judul rapat)",
    "meeting_date": "string (Tanggal rapat YYYY-MM-DD. Kosongkan jika tidak ada)",
    "participants": "string (Siapa saja yang hadir, pisahkan dengan koma)",
    "discussion": "string (Poin pembahasan, gunakan list bullet dengan strip '-')",
    "decisions": "string (Kesimpulan rapat, gunakan list bullet dengan strip '-')",
    "follow_up": "string (Tindak lanjut rapat, gunakan list bullet dengan strip '-')"
  },
  "agenda": {
    "title": "string (Judul agenda, biasanya mirip judul rapat)",
    "category": "string (Pilih kategori rapat yang sesuai)",
    "date": "string (Tanggal YYYY-MM-DD)"
  },
  "presensi": [
    { "member_id": "id-dari-daftar-resmi", "name": "Nama Resmi", "status": "Hadir/Izin/Sakit/Alpa" }
  ],
  "missing_info": [ "participants_missing" ]
}`;

  try {
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://pilarbangsa-official.vercel.app", 
        "X-Title": "Pilar Bangsa Management" 
      },
      body: JSON.stringify({
        model: "nvidia/nemotron-3-ultra-550b-a55b:free",
        messages: [{ role: "user", content: prompt }]
      })
    });

    if (!response.ok) throw new Error(response.statusText);
    const result = await response.json();
    let responseText = result.choices?.[0]?.message?.content;
    
    if (!responseText) throw new Error("Respons AI kosong.");

    // Bersihkan format markdown jika model Nemotron membungkus JSON dengan backtick
    responseText = responseText.replace(/```json/g, '').replace(/```/g, '').trim();

    return JSON.parse(responseText);
  } catch (error: any) {
    throw new Error(error.message || "Gagal memproses dengan AI (OpenRouter).");
  }
}
