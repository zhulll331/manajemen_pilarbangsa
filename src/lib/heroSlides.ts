import { createClient } from '@supabase/supabase-js';

export interface HeroSlideItem {
  id: string;
  image_url: string;
  badge: string;
  title: string;
  description: string;
  cta_primary_label: string;
  cta_primary_href: string;
  cta_secondary_label: string | null;
  cta_secondary_href: string | null;
  sort_order: number;
  is_active: boolean;
  created_at: string;
}

export const FALLBACK_HERO_SLIDE: HeroSlideItem = {
  id: 'fallback-pilar-bangsa-hero',
  image_url:
    'https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=1400&q=80',
  badge: 'Transformasi Digital',
  title: 'Pilar Bangsa Digital Office',
  description:
    'Wadah Transformasi & Kolaborasi Mahasiswa Universitas 17 Agustus 1945 Banyuwangi. Mewujudkan tata kelola organisasi yang modern, transparan, dan akuntabel berbasis sistem digital terpadu.',
  cta_primary_label: 'Lihat Program Kerja',
  cta_primary_href: '/program-kerja',
  cta_secondary_label: 'Pelajari Lebih Lanjut',
  cta_secondary_href: '/tentang-kami',
  sort_order: 1,
  is_active: true,
  created_at: '',
};

export function normalizeHeroImageUrl(url?: string | null): string {
  const cleaned = (url ?? '').trim();
  if (!cleaned) return FALLBACK_HERO_SLIDE.image_url;

  if (cleaned.includes('drive.google.com')) {
    const match = cleaned.match(/id=([^&]+)/) || cleaned.match(/d\/([a-zA-Z0-9_-]+)/);
    if (match?.[1]) {
      return `/api/drive/image?id=${match[1]}`;
    }
  }

  return cleaned;
}

export function shouldUnoptimizeHeroImage(url: string): boolean {
  if (!url) return true;
  if (url.startsWith('/api/')) return true;
  if (url.startsWith('/')) return false;

  try {
    const parsed = new URL(url);
    if (parsed.hostname === 'images.unsplash.com' || parsed.hostname.endsWith('.supabase.co')) {
      return false;
    }
    return true;
  } catch {
    return true;
  }
}

export function splitHeroTitle(title: string): {
  primaryLine: string;
  accentLine: string | null;
} {
  const trimmed = title.trim();
  if (!trimmed) {
    return { primaryLine: FALLBACK_HERO_SLIDE.title, accentLine: null };
  }

  const explicitSeparator = trimmed.includes('\n') ? '\n' : trimmed.includes('|') ? '|' : null;
  if (explicitSeparator) {
    const parts = trimmed
      .split(explicitSeparator)
      .map((part) => part.trim())
      .filter(Boolean);
    if (parts.length >= 2) {
      return {
        primaryLine: parts[0],
        accentLine: parts.slice(1).join(' '),
      };
    }
    return { primaryLine: parts[0] ?? trimmed, accentLine: null };
  }

  const words = trimmed.split(/\s+/).filter(Boolean);
  if (words.length <= 1) {
    return { primaryLine: trimmed, accentLine: null };
  }

  const targetMid = trimmed.length / 2;
  let bestSplitIndex = 1;
  let bestDiff = Number.POSITIVE_INFINITY;

  for (let i = 1; i < words.length; i += 1) {
    const firstPartLength = words.slice(0, i).join(' ').length;
    const diff = Math.abs(firstPartLength - targetMid);
    if (diff < bestDiff) {
      bestDiff = diff;
      bestSplitIndex = i;
    }
  }

  return {
    primaryLine: words.slice(0, bestSplitIndex).join(' '),
    accentLine: words.slice(bestSplitIndex).join(' '),
  };
}

export function isTableMissingError(error: { code?: string; message?: string } | null): boolean {
  if (!error) return false;
  return (
    error.code === 'PGRST205' ||
    error.code === '42P01' ||
    Boolean(error.message?.toLowerCase().includes('hero_slides'))
  );
}

function readString(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value.trim() : fallback;
}

function readOptionalString(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

export function mapHeroSlideRow(row: Record<string, unknown>, index: number): HeroSlideItem {
  const rawId = row.id;
  const id =
    typeof rawId === 'string' && rawId.trim()
      ? rawId.trim()
      : typeof rawId === 'number'
        ? String(rawId)
        : `hero-slide-${index}`;

  const title = readString(row.title) || FALLBACK_HERO_SLIDE.title;
  const description = readString(row.description) || FALLBACK_HERO_SLIDE.description;
  const primaryLabel = readString(row.cta_primary_label) || FALLBACK_HERO_SLIDE.cta_primary_label;
  const primaryHref = readString(row.cta_primary_href) || FALLBACK_HERO_SLIDE.cta_primary_href;
  const secondaryLabel = readOptionalString(row.cta_secondary_label);
  const secondaryHref = readOptionalString(row.cta_secondary_href);

  return {
    id,
    image_url: normalizeHeroImageUrl(readOptionalString(row.image_url)),
    badge: readString(row.badge) || FALLBACK_HERO_SLIDE.badge,
    title,
    description,
    cta_primary_label: primaryLabel,
    cta_primary_href: primaryHref,
    cta_secondary_label: secondaryLabel && secondaryHref ? secondaryLabel : null,
    cta_secondary_href: secondaryLabel && secondaryHref ? secondaryHref : null,
    sort_order: typeof row.sort_order === 'number' ? row.sort_order : index + 1,
    is_active: typeof row.is_active === 'boolean' ? row.is_active : true,
    created_at: readString(row.created_at),
  };
}

export function mapLegacyBannerToHeroSlide(
  row: Record<string, unknown>,
  index: number
): HeroSlideItem {
  const rawId = row.id;
  const id =
    typeof rawId === 'string' || typeof rawId === 'number'
      ? `legacy-banner-${String(rawId)}`
      : `legacy-banner-${index}`;

  const title = readString(row.title) || FALLBACK_HERO_SLIDE.title;
  const description =
    readString(row.description) || readString(row.subtitle) || FALLBACK_HERO_SLIDE.description;

  return {
    id,
    image_url: normalizeHeroImageUrl(readOptionalString(row.image_url)),
    badge: readString(row.badge) || FALLBACK_HERO_SLIDE.badge,
    title,
    description,
    cta_primary_label: FALLBACK_HERO_SLIDE.cta_primary_label,
    cta_primary_href: FALLBACK_HERO_SLIDE.cta_primary_href,
    cta_secondary_label: FALLBACK_HERO_SLIDE.cta_secondary_label,
    cta_secondary_href: FALLBACK_HERO_SLIDE.cta_secondary_href,
    sort_order: index + 1,
    is_active: true,
    created_at: readString(row.created_at),
  };
}

export async function getHeroSlides(): Promise<HeroSlideItem[]> {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!supabaseUrl || !supabaseKey) {
      return [FALLBACK_HERO_SLIDE];
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data: activePeriod } = await supabase
      .from('periods')
      .select('id')
      .eq('status', 'active')
      .maybeSingle();

    let heroQuery = supabase
      .from('hero_slides')
      .select(
        'id, image_url, badge, title, description, cta_primary_label, cta_primary_href, cta_secondary_label, cta_secondary_href, sort_order, is_active, created_at'
      )
      .eq('is_active', true)
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: true });

    if (activePeriod?.id) {
      heroQuery = heroQuery.eq('period_id', activePeriod.id);
    }

    const { data, error } = await heroQuery;

    if (!error && Array.isArray(data) && data.length > 0) {
      return data.map((row, index) => mapHeroSlideRow(row as Record<string, unknown>, index));
    }

    if (error && isTableMissingError(error)) {
      const { data: legacyData, error: legacyError } = await supabase
        .from('banners')
        .select('id, title, subtitle, description, image_url, badge, created_at')
        .order('id', { ascending: true });

      if (!legacyError && Array.isArray(legacyData) && legacyData.length > 0) {
        return legacyData.map((row, index) =>
          mapLegacyBannerToHeroSlide(row as Record<string, unknown>, index)
        );
      }
    }

    return [FALLBACK_HERO_SLIDE];
  } catch (err) {
    console.warn('Gagal mengambil hero_slides, menggunakan slide cadangan:', err);
    return [FALLBACK_HERO_SLIDE];
  }
}
