-- ==============================================================================
-- TAHAP 18: PERPANJANGAN BATAS TWIBBON (extended_until)
-- Twibbon otomatis ditutup setelah batas kegiatan (dihitung di aplikasi).
-- Kolom ini memungkinkan Humas memperpanjang masa aktif kampanye.
-- Aman dijalankan berulang (idempotent). Tidak menghapus data.
-- ==============================================================================

ALTER TABLE public.twibbon_campaigns
  ADD COLUMN IF NOT EXISTS extended_until TIMESTAMPTZ NULL;

DROP FUNCTION IF EXISTS public.get_public_twibbon_campaigns(integer, integer);
CREATE OR REPLACE FUNCTION public.get_public_twibbon_campaigns(
  p_limit integer DEFAULT 12,
  p_offset integer DEFAULT 0
)
RETURNS TABLE (
  id uuid,
  slug varchar,
  state varchar,
  revision_id uuid,
  revision_number integer,
  title varchar,
  description varchar,
  frame_url text,
  thumbnail_url text,
  published_at timestamptz,
  archived_at timestamptz,
  extended_until timestamptz,
  event_id uuid,
  event_title varchar,
  event_slug varchar,
  event_starts_at timestamptz,
  event_ends_at timestamptz,
  event_location text,
  event_registration_status varchar,
  event_publish_status varchar
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    c.id, c.slug, c.state, r.id, r.revision_number, r.title, r.description,
    r.frame_public_url,
    COALESCE(r.thumbnail_public_url, r.frame_public_url),
    c.published_at, c.archived_at, c.extended_until,
    pe.id, pe.title, pe.slug, pe.starts_at, pe.ends_at, pe.location, pe.registration_status,
    pe.publish_status AS event_publish_status
  FROM public.twibbon_campaigns c
  INNER JOIN public.twibbon_revisions r
    ON r.id = c.published_revision_id AND r.campaign_id = c.id
  LEFT JOIN public.public_events pe
    ON pe.id = c.event_id AND pe.publish_status IN ('published', 'archived')
  WHERE c.state IN ('published', 'archived')
  ORDER BY
    CASE WHEN c.state = 'published' THEN 0 ELSE 1 END ASC,
    c.published_at DESC NULLS LAST
  LIMIT LEAST(GREATEST(COALESCE(p_limit, 12), 1), 50)
  OFFSET GREATEST(COALESCE(p_offset, 0), 0);
$$;

GRANT EXECUTE ON FUNCTION public.get_public_twibbon_campaigns(integer, integer) TO anon, authenticated, service_role;

DROP FUNCTION IF EXISTS public.get_public_twibbon_campaign_by_slug(text);
CREATE OR REPLACE FUNCTION public.get_public_twibbon_campaign_by_slug(
  p_slug text
)
RETURNS TABLE (
  id uuid,
  slug varchar,
  state varchar,
  can_generate boolean,
  revision_id uuid,
  revision_number integer,
  title varchar,
  description varchar,
  frame_url text,
  output_width integer,
  output_height integer,
  thumbnail_url text,
  caption_default varchar,
  caption_template varchar,
  published_at timestamptz,
  archived_at timestamptz,
  extended_until timestamptz,
  event_id uuid,
  event_title varchar,
  event_slug varchar,
  event_starts_at timestamptz,
  event_ends_at timestamptz,
  event_location text,
  event_registration_status varchar,
  event_publish_status varchar
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    c.id, c.slug, c.state, (c.state = 'published') AS can_generate,
    r.id, r.revision_number, r.title, r.description, r.frame_public_url,
    r.output_width, r.output_height,
    COALESCE(r.thumbnail_public_url, r.frame_public_url),
    r.caption_default, r.caption_template,
    c.published_at, c.archived_at, c.extended_until,
    pe.id, pe.title, pe.slug, pe.starts_at, pe.ends_at, pe.location, pe.registration_status,
    pe.publish_status AS event_publish_status
  FROM public.twibbon_campaigns c
  INNER JOIN public.twibbon_revisions r
    ON r.id = c.published_revision_id AND r.campaign_id = c.id
  LEFT JOIN public.public_events pe
    ON pe.id = c.event_id AND pe.publish_status IN ('published', 'archived')
  WHERE lower(c.slug) = lower(btrim(p_slug))
    AND c.state IN ('published', 'archived')
  LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION public.get_public_twibbon_campaign_by_slug(text) TO anon, authenticated, service_role;

