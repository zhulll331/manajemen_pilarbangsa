'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/utils/supabase/server'

export async function tambahIuran(formData: FormData) {
  const supabase = await createClient()
  
  const memberId = formData.get('member_id');
  const paymentDate = formData.get('payment_date');

  const { error } = await supabase.from('dues').insert({
    member_id: memberId === "" ? null : memberId,
    month: Number(formData.get('month')),
    year: Number(formData.get('year')),
    amount: Number(formData.get('amount')),
    status: formData.get('status'),
    payment_date: paymentDate ? paymentDate : null,
    proof_url: formData.get('proof_url')
  })

  if (error) throw new Error(error.message)
  revalidatePath('/dashboard', 'layout')
}

export async function editIuran(id: string, formData: FormData) {
  const supabase = await createClient()
  
  const memberId = formData.get('member_id');
  const paymentDate = formData.get('payment_date');

  const { error } = await supabase.from('dues')
    .update({
      member_id: memberId === "" ? null : memberId,
      month: Number(formData.get('month')),
      year: Number(formData.get('year')),
      amount: Number(formData.get('amount')),
      status: formData.get('status'),
      payment_date: paymentDate ? paymentDate : null,
      proof_url: formData.get('proof_url')
    })
    .eq('id', id)

  if (error) throw new Error(error.message)
  revalidatePath('/dashboard', 'layout')
}

export async function hapusIuran(id: string) {
  const supabase = await createClient()
  
  const { error } = await supabase.from('dues').delete().eq('id', id)

  if (error) throw new Error(error.message)
  revalidatePath('/dashboard', 'layout')
}

export async function tambahIuranMassal(data: any[]) {
  const supabase = await createClient()
  
  const { error } = await supabase.from('dues').insert(data)

  if (error) throw new Error(error.message)
  revalidatePath('/dashboard', 'layout')
}

export async function isGeminiConfigured() {
  return !!process.env.GEMINI_API_KEY;
}

export async function parseIuranAI(rawText: string, members: { id: string, name: string }[]) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("API Key Gemini tidak ditemukan. Hubungi admin.");

  const membersListStr = members.map(m => `- ${m.name} (ID: ${m.id})`).join("\n");

  const prompt = `
Anda adalah sistem pengekstrak data pembayaran iuran kas.
Tugas Anda membaca teks kotor dari catatan HP, dan mencocokkannya dengan daftar anggota resmi berikut:
${membersListStr}

Catatan kotor:
"""
${rawText}
"""

Instruksi:
1. Ekstrak siapa saja yang membayar iuran dan BERAPA TOTAL NOMINAL uang yang mereka bayarkan dari teks kotor.
   (Misal: "Andi 15k" berarti 15000, "Budi bayar 5000" berarti 5000). Nominal HARUS angka.
2. **PENTING**: Jika hanya tertulis nama saja tanpa nominal uang (contoh: "Andi", "Budi"), asumsikan nominal uangnya adalah 5000.
3. Cocokkan nama mereka dengan daftar anggota resmi di atas secara fuzzy.
4. Kumpulkan SEMUA NAMA yang ada di catatan kotor tetapi TIDAK BERHASIL DICOCOKKAN dengan daftar resmi ke dalam array "unmatched_names".
5. Format output HARUS berupa JSON murni dengan format object seperti berikut, tanpa backticks atau teks tambahan apa pun. Contoh:
{
  "matched": [
    { "member_id": "id-dari-daftar", "name": "Nama Resmi", "total_amount": 15000 }
  ],
  "unmatched_names": [
    "Nama Asing 1", "Bukan Anggota 2"
  ]
}
  `;

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

    return JSON.parse(responseText.trim());
  } catch (error: any) {
    throw new Error(error.message || "Gagal memproses dengan AI.");
  }
}

export async function tambahIuranMassalAI(duesData: any[], totalAmount: number, description: string) {
  const supabase = await createClient();
  
  // 1. Insert dues
  if (duesData.length > 0) {
    const { error: duesError } = await supabase.from('dues').insert(duesData);
    if (duesError) throw new Error("Gagal menyimpan iuran: " + duesError.message);
  }

  // 2. Insert finance transaction
  if (totalAmount > 0) {
    const payloadTransaction = {
      transaction_date: new Date().toISOString().split('T')[0],
      type: 'Pemasukan',
      category: 'Iuran',
      amount: totalAmount,
      description: description,
      responsible_person: 'Bendahara (Via AI)',
      proof_url: null
    };

    const { error: transError } = await supabase.from('finance_transactions').insert(payloadTransaction);
    if (transError) throw new Error("Gagal mencatat transaksi keuangan: " + transError.message);
  }

  revalidatePath('/dashboard', 'layout');
}
