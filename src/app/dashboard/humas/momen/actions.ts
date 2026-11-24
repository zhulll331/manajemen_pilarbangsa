'use server';

import { revalidatePath } from 'next/cache';
import { getAuthenticatedDashboardContext, requireWritablePeriod } from '@/lib/periods/server';
import { formatPeriodErrorMessage, isSchemaMissingError } from '@/lib/periods/utils';
import { createClient } from '@/utils/supabase/server';

export interface SaveMomentPhotoInput {
  imageUrl: string;
  storagePath?: string | null;
  oldStoragePath?: string | null;
  altText: string;
  rotationDeg: number;
  objectPosition: string;
  isActive: boolean;
}

async function assertHumasOrKetua() {
  const ctx = await getAuthenticatedDashboardContext();
  if (ctx.role !== 'humas' && ctx.role !== 'ketua') {
    throw new Error('Akses ditolak. Hanya Humas atau Ketua yang dapat mengelola Momen Pilar Bangsa.');
  }
  return ctx;
}

function validateMomentInput(input: SaveMomentPhotoInput) {
  const url = input.imageUrl.trim();
  if (!url || (!url.startsWith('https://') && !url.startsWith('/'))) {
    throw new Error('URL foto tidak valid. Unggah gambar atau masukkan URL https:// yang sah.');
  }
  const alt = input.altText.trim().slice(0, 220) || 'Momen Kegiatan UKM Pilar Bangsa';
  const rotationNum = Number(input.rotationDeg);
  const rotation = Number.isFinite(rotationNum)
    ? Math.max(-15, Math.min(15, Number(rotationNum.toFixed(1))))
    : 0;
  const objectPosition = input.objectPosition.trim().slice(0, 50) || 'center 35%';

  return {
    image_url: url,
    storage_path: input.storagePath?.trim() || null,
    alt_text: alt,
    rotation_deg: rotation,
    object_position: objectPosition,
    is_active: Boolean(input.isActive),
  };
}

export async function createMomentPhotoAction(input: SaveMomentPhotoInput): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const ctx = await assertHumasOrKetua();
    const { periodId, schemaReady } = await requireWritablePeriod();
    if (!schemaReady || !periodId) {
      return {
        success: false,
        error:
          'Tabel moment_photos / multi-periode belum dijalankan di Supabase SQL Editor (tahap 20).',
      };
    }

    const sanitized = validateMomentInput(input);
    const supabase = await createClient();

    const { data: existingRows } = await supabase
      .from('moment_photos')
      .select('sort_order')
      .eq('period_id', periodId)
      .order('sort_order', { ascending: false })
      .limit(1);

    const nextOrder =
      existingRows && existingRows.length > 0 && typeof existingRows[0].sort_order === 'number'
        ? existingRows[0].sort_order + 1
        : 1;

    const { error } = await supabase.from('moment_photos').insert({
      ...sanitized,
      period_id: periodId,
      sort_order: nextOrder,
      created_by: ctx.user.id,
    });

    if (error) {
      return {
        success: false,
        error: formatPeriodErrorMessage(error, 'Gagal menyimpan foto momen baru.'),
      };
    }

    revalidatePath('/');
    revalidatePath('/dashboard/humas/momen');
    return { success: true };
  } catch (err) {
    return {
      success: false,
      error: formatPeriodErrorMessage(err, 'Gagal menambahkan foto momen.'),
    };
  }
}

export async function updateMomentPhotoAction(
  id: string,
  input: SaveMomentPhotoInput
): Promise<{ success: boolean; error?: string }> {
  try {
    await assertHumasOrKetua();
    const { periodId, schemaReady } = await requireWritablePeriod();
    if (!schemaReady || !periodId) {
      return { success: false, error: 'Tabel moment_photos belum tersedia.' };
    }

    const sanitized = validateMomentInput(input);
    const supabase = await createClient();

    const { error } = await supabase
      .from('moment_photos')
      .update({
        ...sanitized,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .eq('period_id', periodId);

    if (error) {
      return {
        success: false,
        error: formatPeriodErrorMessage(error, 'Gagal memperbarui foto momen.'),
      };
    }

    // Hapus file storage lama jika foto diganti dengan unggahan baru
    if (
      input.oldStoragePath &&
      sanitized.storage_path &&
      input.oldStoragePath !== sanitized.storage_path
    ) {
      await supabase.storage
        .from('dokumen')
        .remove([input.oldStoragePath])
        .catch(() => {});
    }

    revalidatePath('/');
    revalidatePath('/dashboard/humas/momen');
    return { success: true };
  } catch (err) {
    return {
      success: false,
      error: formatPeriodErrorMessage(err, 'Gagal memperbarui foto momen.'),
    };
  }
}

export async function toggleMomentPhotoActiveAction(
  id: string,
  isActive: boolean
): Promise<{ success: boolean; error?: string }> {
  try {
    await assertHumasOrKetua();
    const { periodId, schemaReady } = await requireWritablePeriod();
    if (!schemaReady || !periodId) {
      return { success: false, error: 'Tabel moment_photos belum tersedia.' };
    }

    const supabase = await createClient();
    const { error } = await supabase
      .from('moment_photos')
      .update({ is_active: isActive, updated_at: new Date().toISOString() })
      .eq('id', id)
      .eq('period_id', periodId);

    if (error) {
      return {
        success: false,
        error: formatPeriodErrorMessage(error, 'Gagal mengubah status tampil foto.'),
      };
    }

    revalidatePath('/');
    revalidatePath('/dashboard/humas/momen');
    return { success: true };
  } catch (err) {
    return {
      success: false,
      error: formatPeriodErrorMessage(err, 'Gagal mengubah status foto.'),
    };
  }
}

export async function swapMomentPhotoOrderAction(
  firstId: string,
  firstOrder: number,
  secondId: string,
  secondOrder: number
): Promise<{ success: boolean; error?: string }> {
  try {
    await assertHumasOrKetua();
    const { periodId, schemaReady } = await requireWritablePeriod();
    if (!schemaReady || !periodId) {
      return { success: false, error: 'Tabel moment_photos belum tersedia.' };
    }

    const supabase = await createClient();
    const now = new Date().toISOString();

    const [res1, res2] = await Promise.all([
      supabase
        .from('moment_photos')
        .update({ sort_order: secondOrder, updated_at: now })
        .eq('id', firstId)
        .eq('period_id', periodId),
      supabase
        .from('moment_photos')
        .update({ sort_order: firstOrder, updated_at: now })
        .eq('id', secondId)
        .eq('period_id', periodId),
    ]);

    const err = res1.error || res2.error;
    if (err) {
      return {
        success: false,
        error: formatPeriodErrorMessage(err, 'Gagal mengubah urutan foto.'),
      };
    }

    revalidatePath('/');
    revalidatePath('/dashboard/humas/momen');
    return { success: true };
  } catch (err) {
    return {
      success: false,
      error: formatPeriodErrorMessage(err, 'Gagal mengurutkan foto momen.'),
    };
  }
}

export async function deleteMomentPhotoAction(
  id: string,
  storagePath?: string | null
): Promise<{ success: boolean; error?: string }> {
  try {
    await assertHumasOrKetua();
    const { periodId, schemaReady } = await requireWritablePeriod();
    if (!schemaReady || !periodId) {
      return { success: false, error: 'Tabel moment_photos belum tersedia.' };
    }

    const supabase = await createClient();
    const { error } = await supabase
      .from('moment_photos')
      .delete()
      .eq('id', id)
      .eq('period_id', periodId);

    if (error) {
      if (isSchemaMissingError(error)) {
        return { success: false, error: 'Tabel moment_photos belum tersedia.' };
      }
      return {
        success: false,
        error: formatPeriodErrorMessage(error, 'Gagal menghapus foto momen.'),
      };
    }

    if (storagePath) {
      await supabase.storage
        .from('dokumen')
        .remove([storagePath])
        .catch(() => {});
    }

    revalidatePath('/');
    revalidatePath('/dashboard/humas/momen');
    return { success: true };
  } catch (err) {
    return {
      success: false,
      error: formatPeriodErrorMessage(err, 'Gagal menghapus foto momen.'),
    };
  }
}
