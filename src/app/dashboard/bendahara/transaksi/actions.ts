'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/utils/supabase/server'
import { requireAuthUser } from '@/utils/auth-guard'

export async function tambahTransaksi(formData: FormData) {
  await requireAuthUser();
  const supabase = await createClient()
  const folder_id = formData.get('folder_id') as string || null;

  const amount = Number(formData.get('amount'));
  if (amount <= 0) throw new Error("Nominal transaksi harus lebih dari 0");

  const payloadAll = {
    transaction_date: formData.get('transaction_date'),
    type: formData.get('type'),
    category: formData.get('category'),
    amount,
    description: formData.get('description'),
    responsible_person: formData.get('responsible_person'),
    proof_url: formData.get('proof_url'),
    folder_id,
    program_id: formData.get('program_id') || null
  };

  const payloadFallback = {
    transaction_date: formData.get('transaction_date'),
    type: formData.get('type'),
    category: formData.get('category'),
    amount,
    description: formData.get('description'),
    responsible_person: formData.get('responsible_person'),
    proof_url: formData.get('proof_url'),
    program_id: formData.get('program_id') || null
  };

  let { data, error } = await supabase.from('finance_transactions').insert(payloadAll).select('id').single()
  if (error && error.message.includes('folder_id')) {
    const { data: fallbackData, error: fallbackError } = await supabase.from('finance_transactions').insert(payloadFallback).select('id').single()
    error = fallbackError
    data = fallbackData
  }

  if (error) throw new Error(error.message)
  revalidatePath('/dashboard', 'layout')
  return { id: data?.id }
}
export async function tambahTransaksiMassal(transactionsData: any[]) {
  await requireAuthUser();
  const supabase = await createClient()
  
  // Format data for insertion
  const payload = transactionsData.map(data => ({
    transaction_date: data.transaction_date,
    type: data.type,
    category: data.category,
    amount: Number(data.amount),
    description: data.description,
    responsible_person: data.responsible_person,
    proof_url: data.proof_url,
    folder_id: data.folder_id || null,
    program_id: data.program_id || null
  }));

  // Coba insert langsung dengan folder_id.
  let { data, error } = await supabase.from('finance_transactions').insert(payload).select('id')
  
  if (error && error.message.includes('folder_id')) {
    // Jika folder_id tidak valid di schema database, hapus atributnya sebagai fallback
    const payloadFallback = payload.map((p) => {
      const { folder_id, ...rest } = p;
      return rest;
    });
    const { data: fallbackData, error: fallbackError } = await supabase.from('finance_transactions').insert(payloadFallback).select('id')
    error = fallbackError
    data = fallbackData
  }

  if (error) throw new Error(error.message)
  revalidatePath('/dashboard', 'layout')
  return { data }
}

export async function editTransaksi(id: string, formData: FormData) {
  await requireAuthUser();
  const supabase = await createClient()
  const folder_id = formData.get('folder_id') as string || null;

  const amount = Number(formData.get('amount'));
  if (amount <= 0) throw new Error("Nominal transaksi harus lebih dari 0");

  const payloadAll = {
    transaction_date: formData.get('transaction_date'),
    type: formData.get('type'),
    category: formData.get('category'),
    amount,
    description: formData.get('description'),
    responsible_person: formData.get('responsible_person'),
    proof_url: formData.get('proof_url'),
    folder_id,
    program_id: formData.get('program_id') || null
  };

  const payloadFallback = {
    transaction_date: formData.get('transaction_date'),
    type: formData.get('type'),
    category: formData.get('category'),
    amount,
    description: formData.get('description'),
    responsible_person: formData.get('responsible_person'),
    proof_url: formData.get('proof_url'),
    program_id: formData.get('program_id') || null
  };

  let { error } = await supabase.from('finance_transactions').update(payloadAll).eq('id', id)
  if (error && error.message.includes('folder_id')) {
    const { error: fallbackError } = await supabase.from('finance_transactions').update(payloadFallback).eq('id', id)
    error = fallbackError
  }

  if (error) throw new Error(error.message)
  revalidatePath('/dashboard', 'layout')
}

export async function hapusTransaksi(id: string) {
  await requireAuthUser();
  const supabase = await createClient()
  
  const { error } = await supabase.from('finance_transactions').delete().eq('id', id)

  if (error) throw new Error(error.message)
  revalidatePath('/dashboard', 'layout')
}

export async function parseTransaksiHarian(transaksiText: string) {
  await requireAuthUser();
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("Kunci API Gemini tidak ditemukan.");
  }

  const prompt = `Anda adalah asisten Bendahara profesional. Ekstrak teks laporan transaksi berikut ke dalam JSON.
Format JSON yang DIWAJIBKAN:
{
  "type": "string (Hanya 'Pemasukan' atau 'Pengeluaran')",
  "category": "string (Kategori singkat, misal: 'Konsumsi', 'Transportasi', 'Iuran', 'Donasi', 'Perlengkapan')",
  "amount": "number (Hanya angka nominalnya, misal: 50000. Tanpa titik atau koma)",
  "description": "string (Keterangan singkat, misal: 'Beli aqua kardus untuk rapat')",
  "responsible_person": "string (Nama pihak terkait jika disebutkan, jika tidak ada kosongkan)"
}

Teks Laporan Transaksi:
"""
${transaksiText}
"""`;

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent?key=${apiKey}`,
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

export async function parseBatchTransaksiNemotron(transaksiText: string) {
  await requireAuthUser();
  const apiKey = process.env.NEMOTRON_API_KEY || process.env.NVIDIA_API_KEY || process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    throw new Error("Kunci API (NEMOTRON_API_KEY / NVIDIA_API_KEY) tidak ditemukan di .env.local");
  }

  const isNvidia = apiKey.startsWith('nvapi-');
  const apiUrl = isNvidia 
    ? 'https://integrate.api.nvidia.com/v1/chat/completions'
    : 'https://openrouter.ai/api/v1/chat/completions';
  
  // Model name can be different based on provider
  const model = isNvidia
    ? 'nvidia/llama-3.1-nemotron-70b-instruct'
    : 'nvidia/nemotron-3-ultra-550b-a55b:free';

  const prompt = `Anda adalah asisten Bendahara profesional. Ekstrak teks laporan transaksi/RAB berikut ke dalam array JSON berisi daftar transaksi.
Format JSON yang DIWAJIBKAN:
[
  {
    "type": "string (Hanya 'Pemasukan' atau 'Pengeluaran')",
    "category": "string (Kategori singkat, misal: 'Konsumsi', 'Transportasi', 'Honor', 'ATK')",
    "amount": "number (Hanya angka nominal total biayanya, misal: 50000. Tanpa titik atau koma)",
    "description": "string (Keterangan singkat, misal: 'Beli aqua kardus untuk rapat')",
    "responsible_person": "string (Nama pihak terkait jika disebutkan, jika tidak ada kosongkan)"
  }
]

Hanya kembalikan array JSON valid tanpa markdown block (\`\`\`json) dan tanpa teks apapun selain JSON. Jika ada field yang tidak diketahui, biarkan kosong.

Teks Laporan Transaksi:
"""
${transaksiText}
"""`;

  try {
    const response = await fetch(apiUrl, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model,
          messages: [{ role: "user", content: prompt }],
          temperature: 0.1
        })
      });

    if (!response.ok) {
        const errText = await response.text();
        throw new Error(errText);
    }
    const result = await response.json();
    let responseText = result.choices?.[0]?.message?.content;
    if (!responseText) throw new Error("Respons AI kosong.");

    // Clean up markdown block if present
    responseText = responseText.replace(/```json/gi, "").replace(/```/g, "").trim();

    const parsed = JSON.parse(responseText);
    if (!Array.isArray(parsed)) throw new Error("Format respons tidak sesuai (bukan array).");
    return parsed;
  } catch (error: any) {
    throw new Error(error.message || "Gagal memproses dengan AI Nemotron.");
  }
}

