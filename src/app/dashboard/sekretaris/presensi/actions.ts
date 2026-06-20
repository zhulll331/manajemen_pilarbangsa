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
