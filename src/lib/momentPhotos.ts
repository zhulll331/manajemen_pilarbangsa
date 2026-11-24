import { createClient as createPublicSupabaseClient } from '@supabase/supabase-js';
import type { StaticImageData } from 'next/image';
import { pilarPhotos } from '@/data/pilarPhotos';
import { isSchemaMissingError } from '@/lib/periods/utils';
import { createClient } from '@/utils/supabase/server';

export interface MomentPhotoItem {
  id: string;
  period_id?: string | null;
  src: string | StaticImageData;
  alt: string;
  rotation: number;
  objectPosition: string;
  sortOrder: number;
  isActive: boolean;
  storagePath?: string | null;
}

interface RawMomentPhotoRow {
  id: string;
  period_id?: string | null;
  image_url: string;
  alt_text?: string | null;
  rotation_deg?: number | string | null;
  object_position?: string | null;
  sort_order?: number | null;
  is_active?: boolean | null;
  storage_path?: string | null;
}

export function buildFallbackMomentPhotos(): MomentPhotoItem[] {
  return pilarPhotos.map((p, index) => ({
    id: p.id,
    period_id: null,
    src: p.src,
    alt: p.alt,
    rotation: p.rotation,
    objectPosition: p.objectPosition,
    sortOrder: index + 1,
    isActive: true,
    storagePath: null,
  }));
}

function mapRowToMomentPhoto(row: RawMomentPhotoRow, idx: number): MomentPhotoItem {
  const rotationNum = Number(row.rotation_deg);
  return {
    id: String(row.id),
    period_id: row.period_id ?? null,
    src: row.image_url,
    alt: row.alt_text?.trim() || 'Momen Kegiatan UKM Pilar Bangsa',
    rotation: Number.isFinite(rotationNum) ? rotationNum : 0,
    objectPosition: row.object_position?.trim() || 'center 35%',
    sortOrder: typeof row.sort_order === 'number' ? row.sort_order : idx + 1,
    isActive: row.is_active !== false,
    storagePath: row.storage_path ?? null,
  };
}

/**
 * Mengambil foto Momen Pilar Bangsa untuk halaman beranda publik.
 * Mengutamakan periode aktif (atau periodId yang diberikan), fallback ke pilarPhotos bawaan.
 */
export async function getMomentPhotos(periodId?: string | null): Promise<{
  photos: MomentPhotoItem[];
  fromDatabase: boolean;
  schemaReady: boolean;
}> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseKey) {
    return { photos: buildFallbackMomentPhotos(), fromDatabase: false, schemaReady: false };
  }

  try {
    const supabase = createPublicSupabaseClient(supabaseUrl, supabaseKey);
    let targetPeriodId = periodId || null;

    if (!targetPeriodId) {
      const { data: activePeriod, error: periodError } = await supabase
        .from('periods')
        .select('id')
        .eq('status', 'active')
        .maybeSingle();

      if (!periodError && activePeriod?.id) {
        targetPeriodId = String(activePeriod.id);
      }
    }

    let query = supabase
      .from('moment_photos')
      .select(
        'id, period_id, image_url, alt_text, rotation_deg, object_position, sort_order, is_active, storage_path'
      )
      .eq('is_active', true)
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: true });

    if (targetPeriodId) {
      query = query.eq('period_id', targetPeriodId);
    }

    const { data, error } = await query;

    if (error) {
      if (isSchemaMissingError(error)) {
        return { photos: buildFallbackMomentPhotos(), fromDatabase: false, schemaReady: false };
      }
      return { photos: buildFallbackMomentPhotos(), fromDatabase: false, schemaReady: true };
    }

    const rows = ((data || []) as RawMomentPhotoRow[]).filter((r) => Boolean(r.image_url));
    if (rows.length === 0) {
      return { photos: buildFallbackMomentPhotos(), fromDatabase: false, schemaReady: true };
    }

    return {
      photos: rows.map(mapRowToMomentPhoto),
      fromDatabase: true,
      schemaReady: true,
    };
  } catch {
    return { photos: buildFallbackMomentPhotos(), fromDatabase: false, schemaReady: false };
  }
}

export async function getDashboardMomentPhotos(periodId: string | null): Promise<{
  photos: MomentPhotoItem[];
  tableReady: boolean;
}> {
  const supabase = await createClient();
  let query = supabase
    .from('moment_photos')
    .select(
      'id, period_id, image_url, alt_text, rotation_deg, object_position, sort_order, is_active, storage_path'
    )
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: true });

  if (periodId) {
    query = query.eq('period_id', periodId);
  }

  const { data, error } = await query;
  if (error) {
    if (isSchemaMissingError(error)) {
      return { photos: [], tableReady: false };
    }
    throw new Error(`Gagal memuat galeri momen: ${error.message}`);
  }

  const rows = (data || []) as RawMomentPhotoRow[];
  return {
    photos: rows.map(mapRowToMomentPhoto),
    tableReady: true,
  };
}
