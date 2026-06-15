'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/utils/supabase/server'

export async function tambahTransaksi(formData: FormData) {
  const supabase = await createClient()
  
  const { error } = await supabase.from('finance_transactions').insert({
    transaction_date: formData.get('transaction_date'),
    type: formData.get('type'),
    category: formData.get('category'),
    amount: Number(formData.get('amount')),
    description: formData.get('description'),
    responsible_person: formData.get('responsible_person'),
    proof_url: formData.get('proof_url')
  })

  if (error) throw new Error(error.message)
  revalidatePath('/dashboard/bendahara/transaksi')
  revalidatePath('/dashboard/bendahara')
}

export async function editTransaksi(id: string, formData: FormData) {
  const supabase = await createClient()
  
  const { error } = await supabase.from('finance_transactions')
    .update({
      transaction_date: formData.get('transaction_date'),
      type: formData.get('type'),
      category: formData.get('category'),
      amount: Number(formData.get('amount')),
      description: formData.get('description'),
      responsible_person: formData.get('responsible_person'),
      proof_url: formData.get('proof_url')
    })
    .eq('id', id)

  if (error) throw new Error(error.message)
  revalidatePath('/dashboard/bendahara/transaksi')
  revalidatePath('/dashboard/bendahara')
}

export async function hapusTransaksi(id: string) {
  const supabase = await createClient()
  
  const { error } = await supabase.from('finance_transactions').delete().eq('id', id)

  if (error) throw new Error(error.message)
  revalidatePath('/dashboard/bendahara/transaksi')
  revalidatePath('/dashboard/bendahara')
}

export async function parseTransaksiHarian(transaksiText: string) {
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
