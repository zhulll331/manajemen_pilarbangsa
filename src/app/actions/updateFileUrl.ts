'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/utils/supabase/server'
import { requireAuthUser } from '@/utils/auth-guard'

export interface UpdateRecordFileUrlParams {
  table: string
  id: string
  field: string
  url: string
  append?: boolean
  additionalFields?: Record<string, any>
}

export async function updateRecordFileUrl({
  table,
  id,
  field,
  url,
  append = false,
  additionalFields = {}
}: UpdateRecordFileUrlParams) {
  await requireAuthUser()
  const supabase = await createClient()

  if (table === 'letters') {
    const updatePayload: Record<string, any> = {
      [field]: url,
      ...additionalFields
    }
    const { error } = await supabase
      .from('letters')
      .update(updatePayload)
      .eq('id', id)

    if (error) throw new Error(`Gagal memperbarui file surat: ${error.message}`)
  } else if (table === 'finance_transactions') {
    let finalUrl = url
    if (append && field === 'proof_url') {
      const { data: current, error: fetchErr } = await supabase
        .from('finance_transactions')
        .select('proof_url')
        .eq('id', id)
        .single()

      if (!fetchErr && current?.proof_url) {
        const existingList = current.proof_url.split(',').map((u: string) => u.trim()).filter(Boolean)
        if (!existingList.includes(url)) {
          existingList.push(url)
        }
        finalUrl = existingList.join(',')
      }
    }

    const updatePayload: Record<string, any> = {
      [field]: finalUrl,
      ...additionalFields
    }

    let { error } = await supabase
      .from('finance_transactions')
      .update(updatePayload)
      .eq('id', id)

    if (error && error.message.includes('folder_id')) {
      delete updatePayload.folder_id
      const { error: fallbackErr } = await supabase
        .from('finance_transactions')
        .update(updatePayload)
        .eq('id', id)
      error = fallbackErr
    }

    if (error) throw new Error(`Gagal memperbarui bukti transaksi: ${error.message}`)
  } else if (table === 'programs') {
    // Ambil data program saat ini
    const { data: prog, error: fetchErr } = await supabase
      .from('programs')
      .select('*')
      .eq('id', id)
      .single()

    if (fetchErr) throw new Error(`Gagal mengambil data program: ${fetchErr.message}`)

    let desc = prog.description || ''
    let cover = prog.cover_image_url || ''
    let gallery = prog.gallery_drive_url || ''
    let sk = prog.sk_url || ''
    let lap = prog.laporan_url || ''

    // Parse existing tags if present
    const coverMatch = desc.match(/\[COVER_URL\]:\s*([^\n\r]+)/)
    if (coverMatch && coverMatch[1]) cover = coverMatch[1].trim()

    const galleryMatch = desc.match(/\[GALLERY_URL\]:\s*([^\n\r]+)/)
    if (galleryMatch && galleryMatch[1]) gallery = galleryMatch[1].trim()

    const skMatch = desc.match(/\[SK_URL\]:\s*([^\n\r]+)/)
    if (skMatch && skMatch[1]) sk = skMatch[1].trim()

    const lapMatch = desc.match(/\[LAPORAN_URL\]:\s*([^\n\r]+)/)
    if (lapMatch && lapMatch[1]) lap = lapMatch[1].trim()

    // Update the targeted field
    if (field === 'cover_url' || field === 'cover_image_url') cover = url
    else if (field === 'gallery_url' || field === 'gallery_drive_url') gallery = url
    else if (field === 'sk_url') sk = url
    else if (field === 'laporan_url') lap = url

    const cleanDesc = desc
      .replace(/(\r?\n)*---+(\r?\n)*\[COVER_URL\]:[\s\S]*$/, '')
      .replace(/(\r?\n)*---+(\r?\n)*\[SK_URL\]:[\s\S]*$/, '')

    const metaTags = `\n\n---\n[COVER_URL]: ${cover || ''}\n[GALLERY_URL]: ${gallery || ''}\n[SK_URL]: ${sk || ''}\n[LAPORAN_URL]: ${lap || ''}`
    const combinedDescription = cleanDesc + metaTags

    const updatePayload: Record<string, any> = {
      description: combinedDescription,
      cover_image_url: cover || null,
      gallery_drive_url: gallery || null,
      sk_url: sk || null,
      laporan_url: lap || null,
      ...additionalFields
    }

    const { error } = await supabase
      .from('programs')
      .update(updatePayload)
      .eq('id', id)

    if (error) throw new Error(`Gagal memperbarui berkas program: ${error.message}`)
  } else {
    // Tabel umum lainnya
    const updatePayload: Record<string, any> = {
      [field]: url,
      ...additionalFields
    }
    const { error } = await supabase
      .from(table)
      .update(updatePayload)
      .eq('id', id)

    if (error) throw new Error(`Gagal memperbarui file di ${table}: ${error.message}`)
  }

  revalidatePath('/dashboard', 'layout')
  return { success: true }
}
