import crypto from 'node:crypto';
import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import type {
  TwibbonErrorEnvelope,
  TwibbonPublicCampaignCard,
  TwibbonPublicCampaignDetail,
} from '@/types/twibbon';
import {
  DEFAULT_DIKLAT_CAPTION_PERSONAL,
  DEFAULT_DIKLAT_CAPTION_UMUM,
} from './caption';
import { normalizeEventTimestamps } from '@/utils/eventDate';

export class TwibbonHttpError extends Error {
  status: number;
  code: TwibbonErrorEnvelope['error']['code'];
  details?: Record<string, unknown>;

  constructor(
    status: number,
    code: TwibbonErrorEnvelope['error']['code'],
    message: string,
    details?: Record<string, unknown>
  ) {
    super(message);
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

export function createTwibbonErrorResponse(err: unknown): NextResponse<TwibbonErrorEnvelope> {
  const requestId = crypto.randomUUID();

  if (err instanceof TwibbonHttpError) {
    return NextResponse.json(
      {
        error: {
          code: err.code,
          message: err.message,
          request_id: requestId,
          ...(err.details ? { details: err.details } : {}),
        },
      },
      {
        status: err.status,
        headers: { 'Cache-Control': 'no-store' },
      }
    );
  }

  const rawMsg = err instanceof Error ? err.message : '';
  if (rawMsg.includes('VERSION_CONFLICT') || rawMsg.includes('40001')) {
    return NextResponse.json(
      {
        error: {
          code: 'VERSION_CONFLICT',
          message: 'Ada perubahan dari admin lain. Muat versi terbaru sebelum menyimpan.',
          request_id: requestId,
        },
      },
      { status: 409, headers: { 'Cache-Control': 'no-store' } }
    );
  }

  if (rawMsg.includes('FORBIDDEN') || rawMsg.includes('42501')) {
    return NextResponse.json(
      {
        error: {
          code: 'FORBIDDEN',
          message: 'Akses ditolak. Hanya pengelola Humas atau Ketua yang memiliki izin.',
          request_id: requestId,
        },
      },
      { status: 403, headers: { 'Cache-Control': 'no-store' } }
    );
  }

  if (rawMsg.includes('FRAME_INVALID')) {
    return NextResponse.json(
      {
        error: {
          code: 'FRAME_INVALID',
          message: 'Bingkai harus PNG transparan 1080 × 1080 yang lolos validasi.',
          request_id: requestId,
        },
      },
      { status: 422, headers: { 'Cache-Control': 'no-store' } }
    );
  }

  return NextResponse.json(
    {
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Terjadi kesalahan pada layanan Twibbon. Silakan coba lagi.',
        request_id: requestId,
      },
    },
    { status: 500, headers: { 'Cache-Control': 'no-store' } }
  );
}

/**
 * Memverifikasi sesi pengguna di server dan memastikan role adalah Humas (pengelola utama)
 * atau Ketua (backup admin organisasi).
 * Sesuai PRD Bagian 4, 14.5 & 16: Otorisasi wajib di server dan tidak percaya input klien.
 */
export async function requireTwibbonAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new TwibbonHttpError(
      401,
      'AUTH_REQUIRED',
      'Sesi login diperlukan untuk mengakses layanan pengelola Twibbon.'
    );
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, email, division_name, full_name')
    .eq('id', user.id)
    .maybeSingle();

  const email = (user.email || profile?.email || '').toLowerCase();
  const role = (profile?.role || '').toLowerCase();
  const division = (profile?.division_name || '').toLowerCase();

  const isHumas =
    email.includes('humas') || role === 'humas' || division.includes('humas');
  const isKetua = role === 'ketua';

  if (!isHumas && !isKetua) {
    throw new TwibbonHttpError(
      403,
      'FORBIDDEN',
      'Akses ditolak. Hanya akun Humas atau Ketua yang diizinkan mengelola kampanye Twibbon.'
    );
  }

  return {
    supabase,
    user,
    role: isHumas ? ('humas' as const) : ('ketua' as const),
    displayName: profile?.full_name || user.email || 'Pengelola Humas',
  };
}

/**
 * Menyusun kampanye contoh Diklat Kepemimpinan 2026 berbasis data resmi public_events
 * ketika tabel kampanye belum diinisialisasi di database.
 */
async function buildDefaultDiklatSampleCampaign(): Promise<TwibbonPublicCampaignDetail> {
  const supabase = await createClient();
  const { data: rawDiklatEvent } = await supabase
    .from('public_events')
    .select('id, title, slug, starts_at, ends_at, location, registration_status, publish_status')
    .eq('slug', 'pendaftaran-diklat-kepemimpinan-periode-20262027')
    .in('publish_status', ['published', 'archived'])
    .maybeSingle();

  const diklatEvent = rawDiklatEvent ? normalizeEventTimestamps(rawDiklatEvent) : null;
  const startsAt = diklatEvent?.starts_at || '2026-11-01T02:00:00.000Z';
  const location = diklatEvent?.location || 'Mondoluko Farm, Desa Taman Suruh';
  const eventSlug = diklatEvent?.slug || 'pendaftaran-diklat-kepemimpinan-periode-20262027';

  return {
    id: 'sample-diklat-kepemimpinan-2026',
    slug: 'diklat-kepemimpinan-2026',
    state: 'published',
    can_generate: true,
    revision_id: 'rev-sample-diklat-2026-v1',
    revision_number: 1,
    title: 'Twibbon Diklat Kepemimpinan 2026',
    description:
      'Pasang foto terbaikmu pada bingkai resmi Diklat Kepemimpinan UKM Pilar Bangsa Periode 2026/2027 dan bagikan semangatmu.',
    frame: {
      url: 'builtin:diklat-kepemimpinan-2026',
      width: 1080,
      height: 1080,
    },
    thumbnail_url: null,
    caption_default: DEFAULT_DIKLAT_CAPTION_UMUM,
    caption_template: DEFAULT_DIKLAT_CAPTION_PERSONAL,
    published_at: '2026-10-27T00:00:00.000Z',
    archived_at: null,
    event: {
      id: diklatEvent?.id || 'b7585b4e-c8f9-4a4a-aaac-d1e30de4e48c',
      title: diklatEvent?.title || 'Pendaftaran Diklat Kepemimpinan Periode 2026/2027',
      slug: eventSlug,
      date: startsAt ? startsAt.slice(0, 10) : '2026-11-01',
      starts_at: startsAt,
      ends_at: diklatEvent?.ends_at || null,
      location,
      timezone: 'Asia/Jakarta',
      url: `/kegiatan/${eventSlug}`,
      registration_status: diklatEvent?.registration_status || 'open',
    },
    is_demo_fallback: true,
  };
}

/**
 * Mengambil daftar kampanye publik (published & archived).
 * Tidak pernah mengembalikan draft_payload atau kampanye berstatus draft.
 */
export async function fetchPublicTwibbonCampaignList(
  limit: number = 12,
  offset: number = 0
): Promise<TwibbonPublicCampaignCard[]> {
  const supabase = await createClient();

  const { data, error } = await supabase.rpc('get_public_twibbon_campaigns', {
    p_limit: Math.min(Math.max(1, limit), 50),
    p_offset: Math.max(0, offset),
  });

  if (!error && Array.isArray(data) && data.length > 0) {
    return data.map((row: Record<string, unknown>) => ({
      id: String(row.id),
      slug: String(row.slug),
      state: row.state === 'archived' ? 'archived' : 'published',
      revision_id: String(row.revision_id),
      revision_number: Number(row.revision_number || 1),
      title: String(row.title),
      description: row.description ? String(row.description) : null,
      frame_url: String(row.frame_url),
      thumbnail_url: row.thumbnail_url ? String(row.thumbnail_url) : null,
      published_at: String(row.published_at),
      archived_at: row.archived_at ? String(row.archived_at) : null,
      event: row.event_id
        ? (() => {
            const norm = normalizeEventTimestamps({
              id: String(row.event_id),
              slug: String(row.event_slug || ''),
              starts_at: row.event_starts_at ? String(row.event_starts_at) : null,
              ends_at: row.event_ends_at ? String(row.event_ends_at) : null,
            });
            return {
              id: norm.id,
              title: String(row.event_title || ''),
              slug: norm.slug,
              starts_at: norm.starts_at,
              ends_at: norm.ends_at,
              location: row.event_location ? String(row.event_location) : null,
              url: `/kegiatan/${String(row.event_slug)}`,
            };
          })()
        : null,
    }));
  }

  // Periksa apakah tabel twibbon_campaigns sudah memiliki baris (mis. hanya ada draft)
  const { data: isInitialized, error: initErr } = await supabase.rpc(
    'is_twibbon_catalog_initialized'
  );

  // Jika sudah diinisialisasi dan tidak ada yang published/archived (misal baru ada draft), kembalikan array kosong (empty state)
  if (!initErr && isInitialized === true) {
    return [];
  }

  // Jika tabel belum diinisialisasi / belum ada data sama sekali, tampilkan kampanye contoh Diklat
  const sample = await buildDefaultDiklatSampleCampaign();
  return [
    {
      id: sample.id,
      slug: sample.slug,
      state: sample.state,
      revision_id: sample.revision_id,
      revision_number: sample.revision_number,
      title: sample.title,
      description: sample.description,
      frame_url: sample.frame.url,
      thumbnail_url: sample.thumbnail_url,
      published_at: sample.published_at,
      archived_at: sample.archived_at,
      event: sample.event
        ? {
            id: sample.event.id,
            title: sample.event.title,
            slug: sample.event.slug,
            starts_at: sample.event.starts_at,
            ends_at: sample.event.ends_at,
            location: sample.event.location,
            url: sample.event.url,
          }
        : null,
      is_demo_fallback: true,
    },
  ];
}

/**
 * Mengambil detail satu kampanye publik berdasarkan slug.
 * Jika slug tidak dikenal atau masih berstatus draft -> mengembalikan null (404).
 */
export async function fetchPublicTwibbonCampaignBySlug(
  slug: string
): Promise<TwibbonPublicCampaignDetail | null> {
  const cleanSlug = (slug || '').trim().toLowerCase();
  if (!cleanSlug) return null;

  const supabase = await createClient();

  const { data, error } = await supabase.rpc('get_public_twibbon_campaign_by_slug', {
    p_slug: cleanSlug,
  });

  if (!error && Array.isArray(data) && data.length > 0) {
    const row = data[0] as Record<string, unknown>;
    const normEvent = row.event_id
      ? normalizeEventTimestamps({
          id: String(row.event_id),
          slug: String(row.event_slug || ''),
          starts_at: row.event_starts_at ? String(row.event_starts_at) : null,
          ends_at: row.event_ends_at ? String(row.event_ends_at) : null,
        })
      : null;
    const startsAt = normEvent?.starts_at ?? null;
    return {
      id: String(row.id),
      slug: String(row.slug),
      state: row.state === 'archived' ? 'archived' : 'published',
      can_generate: Boolean(row.can_generate),
      revision_id: String(row.revision_id),
      revision_number: Number(row.revision_number || 1),
      title: String(row.title),
      description: row.description ? String(row.description) : null,
      frame: {
        url: String(row.frame_url),
        width: 1080,
        height: 1080,
      },
      thumbnail_url: row.thumbnail_url ? String(row.thumbnail_url) : null,
      caption_default: String(row.caption_default || DEFAULT_DIKLAT_CAPTION_UMUM),
      caption_template: String(row.caption_template || DEFAULT_DIKLAT_CAPTION_PERSONAL),
      published_at: String(row.published_at),
      archived_at: row.archived_at ? String(row.archived_at) : null,
      event: normEvent
        ? {
            id: normEvent.id,
            title: String(row.event_title || ''),
            slug: normEvent.slug,
            date: startsAt ? startsAt.slice(0, 10) : null,
            starts_at: startsAt,
            ends_at: normEvent.ends_at,
            location: row.event_location ? String(row.event_location) : null,
            timezone: 'Asia/Jakarta',
            url: `/kegiatan/${String(row.event_slug)}`,
            registration_status: row.event_registration_status
              ? String(row.event_registration_status)
              : null,
          }
        : null,
    };
  }

  // Fallback contoh hanya untuk slug 'diklat-kepemimpinan-2026' ketika katalog database belum memiliki kampanye
  if (cleanSlug === 'diklat-kepemimpinan-2026') {
    const { data: isInitialized, error: initErr } = await supabase.rpc(
      'is_twibbon_catalog_initialized'
    );
    if (initErr || isInitialized === false) {
      return buildDefaultDiklatSampleCampaign();
    }
  }

  return null;
}

