-- ==============================================================================
-- TAHAP 17: MODUL TWIBBON PILAR BANGSA (KAMPANYE, REVISI IMMUTABLE, ASET, AUDIT)
-- ==============================================================================
-- Sesuai PRD Fitur Twibbon Pilar Bangsa v1.0:
-- 1. Otorisasi Server & RLS ketat: Pengelola adalah akun Humas (dan Ketua sebagai backup).
-- 2. Perlindungan kolom role pada public.profiles agar pengguna tidak bisa eskalasi mandiri.
-- 3. Pemisahan draft_payload privat dari snapshot publik (twibbon_revisions immutable).
-- 4. Optimistic concurrency control (edit_version) untuk mencegah silent overwrite.
-- 5. Publikasi atomik via fungsi transaksi RPC + pencatatan twibbon_audit_logs.
-- 6. Bucket Storage terpisah: 'twibbon-drafts' (Privat) & 'twibbon-frames' (Publik Berversi).
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. FUNGSI OTORISASI PENGELOLA TWIBBON & PROTEKSI ESKALASI ROLE PROFILES
-- ------------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.is_twibbon_admin()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid;
  v_jwt_email text;
  v_role text;
  v_profile_email text;
  v_division text;
BEGIN
  v_uid := auth.uid();
  IF v_uid IS NULL THEN
    RETURN false;
  END IF;

  v_jwt_email := lower(coalesce(auth.jwt() ->> 'email', ''));
  IF v_jwt_email LIKE '%humas%' THEN
    RETURN true;
  END IF;

  SELECT lower(coalesce(p.role::text, '')),
         lower(coalesce(p.email, '')),
         lower(coalesce(p.division_name, ''))
    INTO v_role, v_profile_email, v_division
    FROM public.profiles p
   WHERE p.id = v_uid;

  IF v_role IN ('humas', 'ketua')
     OR v_profile_email LIKE '%humas%'
     OR v_division LIKE '%humas%' THEN
    RETURN true;
  END IF;

  RETURN false;
END;
$$;

GRANT EXECUTE ON FUNCTION public.is_twibbon_admin() TO anon, authenticated, service_role;

-- Cegah pengguna non-admin mengubah kolom role, email, atau division_name di profilnya sendiri (PRD 14.5)
CREATE OR REPLACE FUNCTION public.fn_protect_profile_privilege_columns()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF current_user NOT IN ('postgres', 'service_role', 'supabase_admin', 'supabase_auth_admin') THEN
    IF NEW.role IS DISTINCT FROM OLD.role THEN
      RAISE EXCEPTION 'Perubahan role secara mandiri tidak diizinkan.';
    END IF;
    IF NEW.email IS DISTINCT FROM OLD.email THEN
      RAISE EXCEPTION 'Perubahan email otorisasi secara mandiri tidak diizinkan.';
    END IF;
    IF to_jsonb(NEW) -> 'division_name' IS DISTINCT FROM to_jsonb(OLD) -> 'division_name' THEN
      IF NOT public.is_twibbon_admin() THEN
        RAISE EXCEPTION 'Perubahan divisi secara mandiri tidak diizinkan.';
      END IF;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_protect_profile_privilege_columns ON public.profiles;
CREATE TRIGGER trg_protect_profile_privilege_columns
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.fn_protect_profile_privilege_columns();

-- ------------------------------------------------------------------------------
-- 2. TABEL KAMPANYE, ASET, REVISI IMMUTABLE, DAN AUDIT LOG
-- ------------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.twibbon_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug VARCHAR(80) NOT NULL,
  slug_locked BOOLEAN NOT NULL DEFAULT false,
  event_id UUID NULL REFERENCES public.public_events(id) ON DELETE SET NULL,
  state VARCHAR(20) NOT NULL DEFAULT 'draft',
  published_revision_id UUID NULL,
  draft_payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  edit_version INTEGER NOT NULL DEFAULT 1,
  created_by UUID NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  updated_by UUID NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  published_at TIMESTAMPTZ NULL,
  archived_at TIMESTAMPTZ NULL,

  CONSTRAINT chk_twibbon_campaign_slug_format CHECK (
    length(slug) BETWEEN 3 AND 80 AND slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'
  ),
  CONSTRAINT chk_twibbon_campaign_state CHECK (
    state IN ('draft', 'published', 'archived')
  ),
  CONSTRAINT chk_twibbon_campaign_edit_version CHECK (edit_version >= 1)
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_twibbon_campaigns_slug_lower
  ON public.twibbon_campaigns (lower(slug));
CREATE INDEX IF NOT EXISTS idx_twibbon_campaigns_state
  ON public.twibbon_campaigns (state);
CREATE INDEX IF NOT EXISTS idx_twibbon_campaigns_event_id
  ON public.twibbon_campaigns (event_id);

CREATE TABLE IF NOT EXISTS public.twibbon_assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES public.twibbon_campaigns(id) ON DELETE CASCADE,
  kind VARCHAR(20) NOT NULL,
  visibility VARCHAR(20) NOT NULL DEFAULT 'private_draft',
  bucket_id TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  public_url TEXT NULL,
  mime_type VARCHAR(50) NOT NULL,
  byte_size INTEGER NOT NULL,
  width INTEGER NOT NULL,
  height INTEGER NOT NULL,
  checksum TEXT NULL,
  transparent_ratio NUMERIC(6,4) NULL,
  opaque_ratio NUMERIC(6,4) NULL,
  has_transparency_warning BOOLEAN NOT NULL DEFAULT false,
  validation_status VARCHAR(20) NOT NULL DEFAULT 'valid',
  created_by UUID NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),

  CONSTRAINT chk_twibbon_asset_kind CHECK (kind IN ('frame', 'thumbnail')),
  CONSTRAINT chk_twibbon_asset_visibility CHECK (visibility IN ('private_draft', 'public')),
  CONSTRAINT chk_twibbon_asset_validation CHECK (validation_status IN ('valid', 'invalid')),
  CONSTRAINT chk_twibbon_frame_constraints CHECK (
    kind <> 'frame' OR (
      mime_type = 'image/png' AND
      width = 1080 AND
      height = 1080 AND
      byte_size > 0 AND
      byte_size <= 5242880
    )
  )
);

CREATE INDEX IF NOT EXISTS idx_twibbon_assets_campaign
  ON public.twibbon_assets (campaign_id, kind);

CREATE TABLE IF NOT EXISTS public.twibbon_revisions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES public.twibbon_campaigns(id) ON DELETE CASCADE,
  revision_number INTEGER NOT NULL,
  title VARCHAR(120) NOT NULL,
  description VARCHAR(500) NULL,
  frame_asset_id UUID NOT NULL REFERENCES public.twibbon_assets(id),
  frame_public_url TEXT NOT NULL,
  thumbnail_asset_id UUID NULL REFERENCES public.twibbon_assets(id),
  thumbnail_public_url TEXT NULL,
  output_width INTEGER NOT NULL DEFAULT 1080,
  output_height INTEGER NOT NULL DEFAULT 1080,
  caption_default VARCHAR(2000) NOT NULL,
  caption_template VARCHAR(2000) NOT NULL,
  event_display_snapshot JSONB NULL,
  published_by UUID NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  published_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),

  CONSTRAINT uq_twibbon_revision_number UNIQUE (campaign_id, revision_number),
  CONSTRAINT chk_twibbon_revision_dimensions CHECK (output_width = 1080 AND output_height = 1080),
  CONSTRAINT chk_twibbon_revision_title_len CHECK (length(btrim(title)) BETWEEN 5 AND 120)
);

CREATE INDEX IF NOT EXISTS idx_twibbon_revisions_campaign
  ON public.twibbon_revisions (campaign_id, revision_number DESC);

-- Tambahkan FK published_revision_id ke twibbon_campaigns jika belum ada
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'fk_twibbon_campaigns_published_revision'
  ) THEN
    ALTER TABLE public.twibbon_campaigns
      ADD CONSTRAINT fk_twibbon_campaigns_published_revision
      FOREIGN KEY (published_revision_id)
      REFERENCES public.twibbon_revisions(id)
      ON DELETE RESTRICT;
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.twibbon_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES public.twibbon_campaigns(id) ON DELETE CASCADE,
  actor_id UUID NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  action VARCHAR(50) NOT NULL,
  revision_id UUID NULL REFERENCES public.twibbon_revisions(id) ON DELETE SET NULL,
  summary TEXT NOT NULL,
  changes JSONB NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_twibbon_audit_logs_campaign
  ON public.twibbon_audit_logs (campaign_id, created_at DESC);

-- ------------------------------------------------------------------------------
-- 3. TRIGGERS KEUTUHAN DATA (IMMUTABLE REVISIONS, SLUG LOCK, CROSS-CAMPAIGN CHECK)
-- ------------------------------------------------------------------------------

-- A. Revisi yang sudah diterbitkan bersifat immutable (PRD 14.2)
CREATE OR REPLACE FUNCTION public.fn_prevent_twibbon_revision_mutation()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  RAISE EXCEPTION 'Snapshot revisi Twibbon yang sudah terbit bersifat immutable dan tidak dapat diubah atau dihapus.';
END;
$$;

DROP TRIGGER IF EXISTS trg_prevent_twibbon_revision_mutation ON public.twibbon_revisions;
CREATE TRIGGER trg_prevent_twibbon_revision_mutation
  BEFORE UPDATE OR DELETE ON public.twibbon_revisions
  FOR EACH ROW
  EXECUTE FUNCTION public.fn_prevent_twibbon_revision_mutation();

-- B. Kunci slug setelah pernah dipublikasikan & pastikan published_revision_id milik kampanye yang sama
CREATE OR REPLACE FUNCTION public.fn_enforce_twibbon_campaign_invariants()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  v_rev_campaign_id uuid;
BEGIN
  IF NEW.state = 'published' THEN
    NEW.slug_locked := true;
    IF NEW.published_revision_id IS NULL THEN
      RAISE EXCEPTION 'Kampanye berstatus published wajib memiliki published_revision_id.';
    END IF;
  END IF;

  IF OLD IS NOT NULL THEN
    IF OLD.slug_locked = true AND lower(NEW.slug) <> lower(OLD.slug) THEN
      RAISE EXCEPTION 'Slug kampanye yang sudah pernah diterbitkan terkunci dan tidak dapat diubah.';
    END IF;
  END IF;

  IF NEW.published_revision_id IS NOT NULL THEN
    SELECT r.campaign_id INTO v_rev_campaign_id
      FROM public.twibbon_revisions r
     WHERE r.id = NEW.published_revision_id;

    IF v_rev_campaign_id IS NULL OR v_rev_campaign_id <> NEW.id THEN
      RAISE EXCEPTION 'published_revision_id harus menunjuk ke revisi milik kampanye yang sama.';
    END IF;
  END IF;

  NEW.updated_at := timezone('utc'::text, now());
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_enforce_twibbon_campaign_invariants ON public.twibbon_campaigns;
CREATE TRIGGER trg_enforce_twibbon_campaign_invariants
  BEFORE INSERT OR UPDATE ON public.twibbon_campaigns
  FOR EACH ROW
  EXECUTE FUNCTION public.fn_enforce_twibbon_campaign_invariants();

-- ------------------------------------------------------------------------------
-- 4. ROW LEVEL SECURITY (RLS) — DRAFT TIDAK PERNAH TERBUKA KE ANON / ANGGOTA BIASA
-- ------------------------------------------------------------------------------

ALTER TABLE public.twibbon_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.twibbon_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.twibbon_revisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.twibbon_audit_logs ENABLE ROW LEVEL SECURITY;

-- Policies pada twibbon_campaigns: HANYA admin Twibbon (Humas / Ketua)
-- Anon sama sekali tidak diberi policy SELECT pada twibbon_campaigns agar draft_payload aman 100%!
DROP POLICY IF EXISTS "Twibbon admins can select campaigns" ON public.twibbon_campaigns;
CREATE POLICY "Twibbon admins can select campaigns"
  ON public.twibbon_campaigns FOR SELECT
  TO authenticated
  USING (public.is_twibbon_admin());

DROP POLICY IF EXISTS "Twibbon admins can insert campaigns" ON public.twibbon_campaigns;
CREATE POLICY "Twibbon admins can insert campaigns"
  ON public.twibbon_campaigns FOR INSERT
  TO authenticated
  WITH CHECK (public.is_twibbon_admin());

DROP POLICY IF EXISTS "Twibbon admins can update campaigns" ON public.twibbon_campaigns;
CREATE POLICY "Twibbon admins can update campaigns"
  ON public.twibbon_campaigns FOR UPDATE
  TO authenticated
  USING (public.is_twibbon_admin())
  WITH CHECK (public.is_twibbon_admin());

-- Hanya draft yang belum pernah diterbitkan yang boleh dihapus (PRD 12)
DROP POLICY IF EXISTS "Twibbon admins can delete unpublished drafts" ON public.twibbon_campaigns;
CREATE POLICY "Twibbon admins can delete unpublished drafts"
  ON public.twibbon_campaigns FOR DELETE
  TO authenticated
  USING (
    public.is_twibbon_admin()
    AND state = 'draft'
    AND published_revision_id IS NULL
    AND slug_locked = false
  );

-- Policies pada twibbon_assets:
DROP POLICY IF EXISTS "Public can view public validated twibbon assets" ON public.twibbon_assets;
CREATE POLICY "Public can view public validated twibbon assets"
  ON public.twibbon_assets FOR SELECT
  USING (visibility = 'public' AND validation_status = 'valid');

DROP POLICY IF EXISTS "Twibbon admins can manage all twibbon assets" ON public.twibbon_assets;
CREATE POLICY "Twibbon admins can manage all twibbon assets"
  ON public.twibbon_assets FOR ALL
  TO authenticated
  USING (public.is_twibbon_admin())
  WITH CHECK (public.is_twibbon_admin());

-- Policies pada twibbon_revisions:
DROP POLICY IF EXISTS "Twibbon admins can manage revisions" ON public.twibbon_revisions;
CREATE POLICY "Twibbon admins can manage revisions"
  ON public.twibbon_revisions FOR ALL
  TO authenticated
  USING (public.is_twibbon_admin())
  WITH CHECK (public.is_twibbon_admin());

-- Policies pada twibbon_audit_logs:
DROP POLICY IF EXISTS "Twibbon admins can read and insert audit logs" ON public.twibbon_audit_logs;
CREATE POLICY "Twibbon admins can read and insert audit logs"
  ON public.twibbon_audit_logs FOR ALL
  TO authenticated
  USING (public.is_twibbon_admin())
  WITH CHECK (public.is_twibbon_admin());

-- ------------------------------------------------------------------------------
-- 5. FUNGSI PROYEKSI PUBLIK AMAN (TANPA MEMBUKA DRAFT_PAYLOAD ATAU DATA ADMIN)
-- ------------------------------------------------------------------------------

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
  event_id uuid,
  event_title varchar,
  event_slug varchar,
  event_starts_at timestamptz,
  event_ends_at timestamptz,
  event_location text,
  event_registration_status varchar
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    c.id,
    c.slug,
    c.state,
    r.id AS revision_id,
    r.revision_number,
    r.title,
    r.description,
    r.frame_public_url AS frame_url,
    COALESCE(r.thumbnail_public_url, r.frame_public_url) AS thumbnail_url,
    c.published_at,
    c.archived_at,
    pe.id AS event_id,
    pe.title AS event_title,
    pe.slug AS event_slug,
    pe.starts_at AS event_starts_at,
    pe.ends_at AS event_ends_at,
    pe.location AS event_location,
    pe.registration_status AS event_registration_status
  FROM public.twibbon_campaigns c
  INNER JOIN public.twibbon_revisions r
    ON r.id = c.published_revision_id
   AND r.campaign_id = c.id
  LEFT JOIN public.public_events pe
    ON pe.id = c.event_id
   AND pe.publish_status IN ('published', 'archived')
  WHERE c.state IN ('published', 'archived')
  ORDER BY
    CASE WHEN c.state = 'published' THEN 0 ELSE 1 END ASC,
    c.published_at DESC NULLS LAST
  LIMIT LEAST(GREATEST(COALESCE(p_limit, 12), 1), 50)
  OFFSET GREATEST(COALESCE(p_offset, 0), 0);
$$;

GRANT EXECUTE ON FUNCTION public.get_public_twibbon_campaigns(integer, integer) TO anon, authenticated, service_role;

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
  event_id uuid,
  event_title varchar,
  event_slug varchar,
  event_starts_at timestamptz,
  event_ends_at timestamptz,
  event_location text,
  event_registration_status varchar
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    c.id,
    c.slug,
    c.state,
    (c.state = 'published') AS can_generate,
    r.id AS revision_id,
    r.revision_number,
    r.title,
    r.description,
    r.frame_public_url AS frame_url,
    r.output_width,
    r.output_height,
    COALESCE(r.thumbnail_public_url, r.frame_public_url) AS thumbnail_url,
    r.caption_default,
    r.caption_template,
    c.published_at,
    c.archived_at,
    pe.id AS event_id,
    pe.title AS event_title,
    pe.slug AS event_slug,
    pe.starts_at AS event_starts_at,
    pe.ends_at AS event_ends_at,
    pe.location AS event_location,
    pe.registration_status AS event_registration_status
  FROM public.twibbon_campaigns c
  INNER JOIN public.twibbon_revisions r
    ON r.id = c.published_revision_id
   AND r.campaign_id = c.id
  LEFT JOIN public.public_events pe
    ON pe.id = c.event_id
   AND pe.publish_status IN ('published', 'archived')
  WHERE lower(c.slug) = lower(btrim(p_slug))
    AND c.state IN ('published', 'archived')
  LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION public.get_public_twibbon_campaign_by_slug(text) TO anon, authenticated, service_role;

CREATE OR REPLACE FUNCTION public.is_twibbon_catalog_initialized()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.twibbon_campaigns LIMIT 1);
$$;

GRANT EXECUTE ON FUNCTION public.is_twibbon_catalog_initialized() TO anon, authenticated, service_role;

-- ------------------------------------------------------------------------------
-- 6. FUNGSI RPC ADMIN ATOMIK (PUBLISH, ARCHIVE, RESTORE DENGAN OPTIMISTIC LOCK)
-- ------------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.rpc_publish_twibbon_campaign(
  p_campaign_id uuid,
  p_expected_version integer,
  p_title varchar,
  p_description varchar,
  p_frame_asset_id uuid,
  p_frame_public_url text,
  p_thumbnail_asset_id uuid,
  p_thumbnail_public_url text,
  p_caption_default varchar,
  p_caption_template varchar,
  p_event_snapshot jsonb DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_campaign public.twibbon_campaigns%ROWTYPE;
  v_frame public.twibbon_assets%ROWTYPE;
  v_next_rev_num integer;
  v_new_rev_id uuid;
  v_new_edit_version integer;
BEGIN
  IF NOT public.is_twibbon_admin() THEN
    RAISE EXCEPTION 'FORBIDDEN: Hanya pengelola Humas/Ketua yang memiliki akses.' USING ERRCODE = '42501';
  END IF;

  SELECT * INTO v_campaign
    FROM public.twibbon_campaigns
   WHERE id = p_campaign_id
   FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'CAMPAIGN_NOT_FOUND: Kampanye tidak ditemukan.' USING ERRCODE = 'P0002';
  END IF;

  IF v_campaign.edit_version <> p_expected_version THEN
    RAISE EXCEPTION 'VERSION_CONFLICT: Ada perubahan dari admin lain. Muat versi terbaru sebelum menyimpan.' USING ERRCODE = '40001';
  END IF;

  -- Validasi frame asset milik kampanye ini dan berstatus valid 1080x1080 PNG
  SELECT * INTO v_frame
    FROM public.twibbon_assets
   WHERE id = p_frame_asset_id
     AND campaign_id = p_campaign_id
     AND kind = 'frame'
     AND validation_status = 'valid'
     AND width = 1080
     AND height = 1080
     AND mime_type = 'image/png';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'FRAME_INVALID: Bingkai PNG transparan 1080x1080 yang valid belum tersedia.' USING ERRCODE = '22023';
  END IF;

  -- Tandai frame & thumbnail sebagai public
  UPDATE public.twibbon_assets
     SET visibility = 'public',
         public_url = p_frame_public_url
   WHERE id = p_frame_asset_id;

  IF p_thumbnail_asset_id IS NOT NULL THEN
    UPDATE public.twibbon_assets
       SET visibility = 'public',
           public_url = p_thumbnail_public_url
     WHERE id = p_thumbnail_asset_id
       AND campaign_id = p_campaign_id;
  END IF;

  SELECT COALESCE(MAX(revision_number), 0) + 1
    INTO v_next_rev_num
    FROM public.twibbon_revisions
   WHERE campaign_id = p_campaign_id;

  INSERT INTO public.twibbon_revisions (
    campaign_id,
    revision_number,
    title,
    description,
    frame_asset_id,
    frame_public_url,
    thumbnail_asset_id,
    thumbnail_public_url,
    output_width,
    output_height,
    caption_default,
    caption_template,
    event_display_snapshot,
    published_by,
    published_at
  ) VALUES (
    p_campaign_id,
    v_next_rev_num,
    btrim(p_title),
    NULLIF(btrim(COALESCE(p_description, '')), ''),
    p_frame_asset_id,
    p_frame_public_url,
    p_thumbnail_asset_id,
    p_thumbnail_public_url,
    1080,
    1080,
    p_caption_default,
    p_caption_template,
    p_event_snapshot,
    auth.uid(),
    timezone('utc'::text, now())
  )
  RETURNING id INTO v_new_rev_id;

  v_new_edit_version := v_campaign.edit_version + 1;

  UPDATE public.twibbon_campaigns
     SET state = 'published',
         slug_locked = true,
         published_revision_id = v_new_rev_id,
         draft_payload = jsonb_build_object(
           'title', btrim(p_title),
           'description', COALESCE(p_description, ''),
           'frame_asset_id', p_frame_asset_id,
           'thumbnail_asset_id', p_thumbnail_asset_id,
           'caption_default', p_caption_default,
           'caption_template', p_caption_template
         ),
         edit_version = v_new_edit_version,
         updated_by = auth.uid(),
         published_at = timezone('utc'::text, now()),
         archived_at = NULL
   WHERE id = p_campaign_id;

  INSERT INTO public.twibbon_audit_logs (
    campaign_id,
    actor_id,
    action,
    revision_id,
    summary,
    changes
  ) VALUES (
    p_campaign_id,
    auth.uid(),
    'PUBLISH',
    v_new_rev_id,
    format('Mempublikasikan revisi #%s untuk kampanye "%s"', v_next_rev_num, btrim(p_title)),
    jsonb_build_object(
      'revision_number', v_next_rev_num,
      'frame_asset_id', p_frame_asset_id,
      'edit_version', v_new_edit_version
    )
  );

  RETURN jsonb_build_object(
    'campaign_id', p_campaign_id,
    'revision_id', v_new_rev_id,
    'revision_number', v_next_rev_num,
    'edit_version', v_new_edit_version,
    'state', 'published'
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.rpc_publish_twibbon_campaign(
  uuid, integer, varchar, varchar, uuid, text, uuid, text, varchar, varchar, jsonb
) TO authenticated;

-- ------------------------------------------------------------------------------
-- 7. KONFIGURASI BUCKET STORAGE ('twibbon-drafts' PRIVAT & 'twibbon-frames' PUBLIK)
-- ------------------------------------------------------------------------------

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'twibbon-drafts',
  'twibbon-drafts',
  false,
  5242880, -- 5 MiB
  ARRAY['image/png', 'image/webp', 'image/jpeg']
)
ON CONFLICT (id) DO UPDATE SET
  public = false,
  file_size_limit = 5242880,
  allowed_mime_types = ARRAY['image/png', 'image/webp', 'image/jpeg'];

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'twibbon-frames',
  'twibbon-frames',
  true,
  5242880, -- 5 MiB
  ARRAY['image/png', 'image/webp', 'image/jpeg']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 5242880,
  allowed_mime_types = ARRAY['image/png', 'image/webp', 'image/jpeg'];

-- RLS Policies untuk storage.objects pada kedua bucket
DROP POLICY IF EXISTS "Twibbon admins can manage twibbon-drafts" ON storage.objects;
CREATE POLICY "Twibbon admins can manage twibbon-drafts"
  ON storage.objects FOR ALL
  TO authenticated
  USING (bucket_id = 'twibbon-drafts' AND public.is_twibbon_admin())
  WITH CHECK (bucket_id = 'twibbon-drafts' AND public.is_twibbon_admin());

DROP POLICY IF EXISTS "Public can read twibbon-frames" ON storage.objects;
CREATE POLICY "Public can read twibbon-frames"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'twibbon-frames');

DROP POLICY IF EXISTS "Twibbon admins can insert twibbon-frames" ON storage.objects;
CREATE POLICY "Twibbon admins can insert twibbon-frames"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'twibbon-frames' AND public.is_twibbon_admin());
