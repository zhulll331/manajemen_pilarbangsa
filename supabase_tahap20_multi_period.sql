-- =========================================================================
-- TAHAP 20: SISTEM MULTI-PERIODE DINAMIS, LOCK PERMANEN & GALERI MOMEN HUMAS
-- Jalankan script ini di Supabase SQL Editor secara berurutan (idempoten).
-- =========================================================================

-- 1. Pastikan bucket 'dokumen' mendukung WebP & kebijakan akses Humas/Pengurus
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'dokumen',
  'dokumen',
  true,
  52428800,
  ARRAY[
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'image/png',
    'image/jpeg',
    'image/webp'
  ]
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- 2. Tambah kolom catatan pemberhentian pada anggota
ALTER TABLE public.members
  ADD COLUMN IF NOT EXISTS status_note TEXT,
  ADD COLUMN IF NOT EXISTS status_updated_at TIMESTAMPTZ;

-- 3. Tabel utama periode kepengurusan
CREATE TABLE IF NOT EXISTS public.periods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  cabinet_name TEXT,
  theme TEXT,
  start_year INTEGER NOT NULL,
  end_year INTEGER NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'locked')),
  visi_misi JSONB,
  struktur_pimpinan JSONB,
  locked_at TIMESTAMPTZ,
  locked_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  lock_notes TEXT,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  CONSTRAINT periods_year_range CHECK (end_year = start_year + 1 AND end_date > start_date)
);

CREATE UNIQUE INDEX IF NOT EXISTS uniq_single_active_period
  ON public.periods (status) WHERE status = 'active';

-- 4. Log audit pergantian & penguncian periode
CREATE TABLE IF NOT EXISTS public.period_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  period_id UUID REFERENCES public.periods(id) ON DELETE CASCADE,
  actor_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  actor_email TEXT,
  actor_name TEXT,
  actor_role TEXT,
  action TEXT NOT NULL,
  summary JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

-- 5. Tabel dinamis foto Momen Pilar Bangsa (dikelola Humas per periode)
CREATE TABLE IF NOT EXISTS public.moment_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  period_id UUID REFERENCES public.periods(id) ON DELETE RESTRICT,
  image_url TEXT NOT NULL,
  alt_text TEXT NOT NULL DEFAULT 'Momen Kegiatan UKM Pilar Bangsa',
  rotation_deg NUMERIC(5,2) NOT NULL DEFAULT 0,
  object_position TEXT NOT NULL DEFAULT 'center 35%',
  sort_order INTEGER NOT NULL DEFAULT 1,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  storage_path TEXT,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

-- 6. Helper fungsi otorisasi & status periode
CREATE OR REPLACE FUNCTION public.is_period_manager()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    auth.uid() IS NOT NULL
    AND EXISTS (
      SELECT 1
      FROM public.profiles p
      WHERE p.id = auth.uid()
        AND lower(coalesce(p.role::text, '')) IN ('ketua', 'sekretaris')
        AND lower(coalesce(p.email, auth.jwt()->>'email', '')) NOT LIKE '%humas%'
        AND lower(coalesce(p.email, auth.jwt()->>'email', '')) NOT LIKE '%divisi%'
    );
$$;

CREATE OR REPLACE FUNCTION public.is_humas_or_ketua()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    auth.uid() IS NOT NULL
    AND EXISTS (
      SELECT 1
      FROM public.profiles p
      WHERE p.id = auth.uid()
        AND (
          lower(coalesce(p.role::text, '')) IN ('ketua', 'humas')
          OR lower(coalesce(p.email, auth.jwt()->>'email', '')) LIKE '%humas%'
        )
    );
$$;

CREATE OR REPLACE FUNCTION public.fn_get_active_period_id()
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id FROM public.periods WHERE status = 'active' LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.fn_is_period_locked(p_period_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.periods
    WHERE id = p_period_id
      AND status = 'locked'
  );
$$;

-- 7. Seed periode aktif awal & backfill semua tabel operasional
DO $$
DECLARE
  v_start_year INT := CASE
    WHEN EXTRACT(MONTH FROM CURRENT_DATE) >= 7 THEN EXTRACT(YEAR FROM CURRENT_DATE)::INT
    ELSE EXTRACT(YEAR FROM CURRENT_DATE)::INT - 1
  END;
  v_end_year INT;
  v_code TEXT;
  v_active_id UUID;
  v_visi JSONB;
  v_struktur JSONB;
  v_tbl TEXT;
  v_tables TEXT[] := ARRAY[
    'members',
    'programs',
    'agendas',
    'letters',
    'minutes',
    'attendance',
    'evaluations',
    'finance_transactions',
    'dues',
    'public_events',
    'twibbon_campaigns',
    'news_links',
    'hero_slides',
    'banners',
    'archives',
    'moment_photos'
  ];
BEGIN
  IF v_start_year < 2025 THEN
    v_start_year := 2025;
  END IF;
  v_end_year := v_start_year + 1;
  v_code := v_start_year::TEXT || '/' || v_end_year::TEXT;

  SELECT id INTO v_active_id FROM public.periods WHERE status = 'active' LIMIT 1;

  IF v_active_id IS NULL THEN
    IF to_regclass('public.website_settings') IS NOT NULL THEN
      SELECT setting_value INTO v_visi FROM public.website_settings WHERE setting_key = 'visi_misi' LIMIT 1;
      SELECT setting_value INTO v_struktur FROM public.website_settings WHERE setting_key = 'struktur_pimpinan' LIMIT 1;
    END IF;

    INSERT INTO public.periods (
      code, name, cabinet_name, theme, start_year, end_year,
      start_date, end_date, status, visi_misi, struktur_pimpinan
    )
    VALUES (
      v_code,
      'Periode ' || v_code,
      'Kepengurusan UKM Pilar Bangsa',
      'Bergerak Berdampak & Terukur',
      v_start_year,
      v_end_year,
      make_date(v_start_year, 7, 1),
      make_date(v_end_year, 6, 30),
      'active',
      v_visi,
      v_struktur
    )
    ON CONFLICT (code) DO UPDATE SET status = 'active'
    RETURNING id INTO v_active_id;
  END IF;

  FOREACH v_tbl IN ARRAY v_tables LOOP
    IF to_regclass('public.' || v_tbl) IS NOT NULL THEN
      EXECUTE format(
        'ALTER TABLE public.%I ADD COLUMN IF NOT EXISTS period_id UUID REFERENCES public.periods(id) ON DELETE RESTRICT;',
        v_tbl
      );
      EXECUTE format(
        'UPDATE public.%I SET period_id = %L WHERE period_id IS NULL;',
        v_tbl,
        v_active_id
      );
      EXECUTE format(
        'ALTER TABLE public.%I ALTER COLUMN period_id SET DEFAULT public.fn_get_active_period_id();',
        v_tbl
      );
      EXECUTE format(
        'ALTER TABLE public.%I ALTER COLUMN period_id SET NOT NULL;',
        v_tbl
      );
      EXECUTE format(
        'CREATE INDEX IF NOT EXISTS %I ON public.%I(period_id);',
        'idx_' || v_tbl || '_period_id',
        v_tbl
      );
    END IF;
  END LOOP;
END $$;

-- 8. RLS untuk tabel baru
ALTER TABLE public.periods ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.period_audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.moment_photos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can read periods" ON public.periods;
CREATE POLICY "Public can read periods"
  ON public.periods FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Managers can insert periods" ON public.periods;
CREATE POLICY "Managers can insert periods"
  ON public.periods FOR INSERT
  WITH CHECK (public.is_period_manager());

DROP POLICY IF EXISTS "Managers can update periods" ON public.periods;
CREATE POLICY "Managers can update periods"
  ON public.periods FOR UPDATE
  USING (public.is_period_manager())
  WITH CHECK (public.is_period_manager());

DROP POLICY IF EXISTS "Authenticated can read period audit logs" ON public.period_audit_logs;
CREATE POLICY "Authenticated can read period audit logs"
  ON public.period_audit_logs FOR SELECT
  USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Managers can insert period audit logs" ON public.period_audit_logs;
CREATE POLICY "Managers can insert period audit logs"
  ON public.period_audit_logs FOR INSERT
  WITH CHECK (public.is_period_manager());

DROP POLICY IF EXISTS "Public can read moment photos" ON public.moment_photos;
CREATE POLICY "Public can read moment photos"
  ON public.moment_photos FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Humas or Ketua can insert moment photos" ON public.moment_photos;
CREATE POLICY "Humas or Ketua can insert moment photos"
  ON public.moment_photos FOR INSERT
  WITH CHECK (public.is_humas_or_ketua());

DROP POLICY IF EXISTS "Humas or Ketua can update moment photos" ON public.moment_photos;
CREATE POLICY "Humas or Ketua can update moment photos"
  ON public.moment_photos FOR UPDATE
  USING (public.is_humas_or_ketua())
  WITH CHECK (public.is_humas_or_ketua());

DROP POLICY IF EXISTS "Humas or Ketua can delete moment photos" ON public.moment_photos;
CREATE POLICY "Humas or Ketua can delete moment photos"
  ON public.moment_photos FOR DELETE
  USING (public.is_humas_or_ketua());

-- 9. Trigger proteksi kunci permanen pada periods & seluruh tabel operasional
CREATE OR REPLACE FUNCTION public.fn_protect_locked_period()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    IF OLD.status IN ('active', 'locked') THEN
      RAISE EXCEPTION 'PERIOD_DELETE_FORBIDDEN: Periode aktif atau periode yang sudah dikunci tidak dapat dihapus.'
        USING ERRCODE = '42501';
    END IF;
    RETURN OLD;
  END IF;

  IF TG_OP = 'UPDATE' AND OLD.status = 'locked' THEN
    RAISE EXCEPTION 'PERIOD_LOCKED: Periode % sudah dikunci permanen dan tidak dapat diubah kembali.', OLD.code
      USING ERRCODE = '42501';
  END IF;

  NEW.updated_at := timezone('utc', now());
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_periods_protect_locked ON public.periods;
CREATE TRIGGER trg_periods_protect_locked
  BEFORE UPDATE OR DELETE ON public.periods
  FOR EACH ROW
  EXECUTE FUNCTION public.fn_protect_locked_period();

CREATE OR REPLACE FUNCTION public.fn_block_mutation_on_locked_period()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  v_target_period_id UUID;
BEGIN
  IF current_setting('app.period_transition_bypass', true) = '1' THEN
    RETURN COALESCE(NEW, OLD);
  END IF;

  IF TG_OP IN ('UPDATE', 'DELETE') THEN
    IF OLD.period_id IS NOT NULL AND public.fn_is_period_locked(OLD.period_id) THEN
      RAISE EXCEPTION 'PERIOD_LOCKED: Data pada periode yang sudah dikunci tidak dapat diubah atau dihapus.'
        USING ERRCODE = '42501';
    END IF;
  END IF;

  IF TG_OP IN ('INSERT', 'UPDATE') THEN
    v_target_period_id := COALESCE(NEW.period_id, public.fn_get_active_period_id());
    IF v_target_period_id IS NOT NULL AND public.fn_is_period_locked(v_target_period_id) THEN
      RAISE EXCEPTION 'PERIOD_LOCKED: Tidak dapat menambah atau memindahkan data ke periode yang sudah dikunci.'
        USING ERRCODE = '42501';
    END IF;
    IF NEW.period_id IS NULL THEN
      NEW.period_id := v_target_period_id;
    END IF;
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$;

DO $$
DECLARE
  v_tbl TEXT;
  v_tables TEXT[] := ARRAY[
    'members',
    'programs',
    'agendas',
    'letters',
    'minutes',
    'attendance',
    'evaluations',
    'finance_transactions',
    'dues',
    'public_events',
    'twibbon_campaigns',
    'news_links',
    'hero_slides',
    'banners',
    'archives',
    'moment_photos'
  ];
BEGIN
  FOREACH v_tbl IN ARRAY v_tables LOOP
    IF to_regclass('public.' || v_tbl) IS NOT NULL THEN
      EXECUTE format('DROP TRIGGER IF EXISTS %I ON public.%I;', 'trg_' || v_tbl || '_lock_period', v_tbl);
      EXECUTE format(
        'CREATE TRIGGER %I BEFORE INSERT OR UPDATE OR DELETE ON public.%I FOR EACH ROW EXECUTE FUNCTION public.fn_block_mutation_on_locked_period();',
        'trg_' || v_tbl || '_lock_period',
        v_tbl
      );
    END IF;
  END LOOP;
END $$;

-- Trigger lock untuk tabel anak (resources & twibbon assets/revisions)
CREATE OR REPLACE FUNCTION public.fn_block_event_child_on_locked_period()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  v_event_id UUID := COALESCE(NEW.event_id, OLD.event_id);
  v_period_id UUID;
BEGIN
  SELECT period_id INTO v_period_id FROM public.public_events WHERE id = v_event_id;
  IF v_period_id IS NOT NULL AND public.fn_is_period_locked(v_period_id) THEN
    RAISE EXCEPTION 'PERIOD_LOCKED: Lampiran kegiatan periode terkunci tidak dapat diubah.'
      USING ERRCODE = '42501';
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$;

DO $$
BEGIN
  IF to_regclass('public.public_event_resources') IS NOT NULL THEN
    DROP TRIGGER IF EXISTS trg_public_event_resources_lock_period ON public.public_event_resources;
    CREATE TRIGGER trg_public_event_resources_lock_period
      BEFORE INSERT OR UPDATE OR DELETE ON public.public_event_resources
      FOR EACH ROW
      EXECUTE FUNCTION public.fn_block_event_child_on_locked_period();
  END IF;
END $$;

CREATE OR REPLACE FUNCTION public.fn_block_twibbon_child_on_locked_period()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  v_campaign_id UUID := COALESCE(NEW.campaign_id, OLD.campaign_id);
  v_period_id UUID;
BEGIN
  SELECT period_id INTO v_period_id FROM public.twibbon_campaigns WHERE id = v_campaign_id;
  IF v_period_id IS NOT NULL AND public.fn_is_period_locked(v_period_id) THEN
    RAISE EXCEPTION 'PERIOD_LOCKED: Aset/revisi twibbon periode terkunci tidak dapat diubah.'
      USING ERRCODE = '42501';
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$;

DO $$
BEGIN
  IF to_regclass('public.twibbon_assets') IS NOT NULL THEN
    DROP TRIGGER IF EXISTS trg_twibbon_assets_lock_period ON public.twibbon_assets;
    CREATE TRIGGER trg_twibbon_assets_lock_period
      BEFORE INSERT OR UPDATE OR DELETE ON public.twibbon_assets
      FOR EACH ROW
      EXECUTE FUNCTION public.fn_block_twibbon_child_on_locked_period();
  END IF;

  IF to_regclass('public.twibbon_revisions') IS NOT NULL THEN
    DROP TRIGGER IF EXISTS trg_twibbon_revisions_lock_period ON public.twibbon_revisions;
    CREATE TRIGGER trg_twibbon_revisions_lock_period
      BEFORE INSERT OR UPDATE OR DELETE ON public.twibbon_revisions
      FOR EACH ROW
      EXECUTE FUNCTION public.fn_block_twibbon_child_on_locked_period();
  END IF;
END $$;

-- 10. RPC Atomik Pergantian & Penguncian Periode (Ketua atau Sekretaris)
CREATE OR REPLACE FUNCTION public.fn_transition_active_period(
  p_new_code TEXT,
  p_new_name TEXT,
  p_start_year INTEGER,
  p_end_year INTEGER,
  p_start_date DATE,
  p_end_date DATE,
  p_cabinet_name TEXT DEFAULT NULL,
  p_theme TEXT DEFAULT NULL,
  p_lock_notes TEXT DEFAULT NULL,
  p_carry_over_members BOOLEAN DEFAULT TRUE,
  p_carry_over_hero BOOLEAN DEFAULT TRUE,
  p_carry_over_moments BOOLEAN DEFAULT TRUE,
  p_carry_over_visi_misi BOOLEAN DEFAULT TRUE,
  p_carry_over_struktur BOOLEAN DEFAULT FALSE
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid UUID := auth.uid();
  v_actor RECORD;
  v_old_period public.periods%ROWTYPE;
  v_new_period public.periods%ROWTYPE;
  v_visi JSONB;
  v_struktur JSONB;
  v_members_copied INTEGER := 0;
  v_hero_copied INTEGER := 0;
  v_moments_copied INTEGER := 0;
  v_summary JSONB;
BEGIN
  IF v_uid IS NULL OR NOT public.is_period_manager() THEN
    RAISE EXCEPTION 'FORBIDDEN: Hanya Ketua atau Sekretaris yang dapat melakukan pergantian periode.'
      USING ERRCODE = '42501';
  END IF;

  IF trim(coalesce(p_new_code, '')) = '' OR trim(coalesce(p_new_name, '')) = '' THEN
    RAISE EXCEPTION 'Kode dan nama periode baru wajib diisi.';
  END IF;

  IF p_end_year <> p_start_year + 1 OR p_end_date <= p_start_date THEN
    RAISE EXCEPTION 'Rentang tahun atau tanggal periode baru tidak valid.';
  END IF;

  IF EXISTS (SELECT 1 FROM public.periods WHERE code = trim(p_new_code)) THEN
    RAISE EXCEPTION 'Kode periode % sudah pernah digunakan.', trim(p_new_code);
  END IF;

  SELECT full_name, email, role::text AS role_text
  INTO v_actor
  FROM public.profiles
  WHERE id = v_uid;

  SELECT *
  INTO v_old_period
  FROM public.periods
  WHERE status = 'active'
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Tidak ditemukan periode aktif untuk ditutup.';
  END IF;

  IF to_regclass('public.website_settings') IS NOT NULL THEN
    SELECT setting_value INTO v_visi FROM public.website_settings WHERE setting_key = 'visi_misi' LIMIT 1;
    SELECT setting_value INTO v_struktur FROM public.website_settings WHERE setting_key = 'struktur_pimpinan' LIMIT 1;
  END IF;

  -- Kunci periode lama secara permanen + simpan snapshot visi_misi & struktur
  UPDATE public.periods
  SET
    status = 'locked',
    locked_at = timezone('utc', now()),
    locked_by = v_uid,
    lock_notes = nullif(trim(coalesce(p_lock_notes, '')), ''),
    visi_misi = coalesce(visi_misi, v_visi),
    struktur_pimpinan = coalesce(struktur_pimpinan, v_struktur),
    updated_at = timezone('utc', now())
  WHERE id = v_old_period.id;

  -- Buat periode aktif baru
  INSERT INTO public.periods (
    code,
    name,
    cabinet_name,
    theme,
    start_year,
    end_year,
    start_date,
    end_date,
    status,
    visi_misi,
    struktur_pimpinan,
    created_by
  )
  VALUES (
    trim(p_new_code),
    trim(p_new_name),
    nullif(trim(coalesce(p_cabinet_name, '')), ''),
    nullif(trim(coalesce(p_theme, '')), ''),
    p_start_year,
    p_end_year,
    p_start_date,
    p_end_date,
    'active',
    CASE WHEN p_carry_over_visi_misi THEN coalesce(v_old_period.visi_misi, v_visi) ELSE NULL END,
    CASE WHEN p_carry_over_struktur THEN coalesce(v_old_period.struktur_pimpinan, v_struktur) ELSE NULL END,
    v_uid
  )
  RETURNING * INTO v_new_period;

  -- Sinkronisasi website_settings jika struktur pimpinan tidak dibawa (kosongkan ketuaList secara aman)
  IF NOT p_carry_over_struktur AND to_regclass('public.website_settings') IS NOT NULL THEN
    IF v_struktur IS NOT NULL AND jsonb_typeof(v_struktur) = 'object' THEN
      UPDATE public.website_settings
      SET
        setting_value = jsonb_set(v_struktur, '{ketuaList}', '[]'::jsonb, true),
        updated_at = timezone('utc', now())
      WHERE setting_key = 'struktur_pimpinan';
    END IF;
  END IF;

  -- Carry-over data pilihan ke periode baru tanpa mengubah data periode lama
  IF p_carry_over_members AND to_regclass('public.members') IS NOT NULL THEN
    INSERT INTO public.members (
      name, nim, faculty, study_program, generation, phone, division, status, status_note, status_updated_at, period_id
    )
    SELECT
      m.name,
      m.nim,
      m.faculty,
      m.study_program,
      m.generation,
      m.phone,
      m.division,
      m.status,
      NULL,
      NULL,
      v_new_period.id
    FROM public.members m
    WHERE m.period_id = v_old_period.id
      AND coalesce(m.status, 'Aktif') IN ('Aktif', 'Pengurus Aktif', 'Cuti');

    GET DIAGNOSTICS v_members_copied = ROW_COUNT;
  END IF;

  IF p_carry_over_hero AND to_regclass('public.hero_slides') IS NOT NULL THEN
    INSERT INTO public.hero_slides (
      badge, title, description, image_url,
      cta_primary_label, cta_primary_href,
      cta_secondary_label, cta_secondary_href,
      sort_order, is_active, period_id
    )
    SELECT
      h.badge,
      h.title,
      h.description,
      h.image_url,
      h.cta_primary_label,
      h.cta_primary_href,
      h.cta_secondary_label,
      h.cta_secondary_href,
      h.sort_order,
      h.is_active,
      v_new_period.id
    FROM public.hero_slides h
    WHERE h.period_id = v_old_period.id
      AND h.is_active = TRUE;

    GET DIAGNOSTICS v_hero_copied = ROW_COUNT;
  END IF;

  IF p_carry_over_moments THEN
    INSERT INTO public.moment_photos (
      period_id, image_url, alt_text, rotation_deg,
      object_position, sort_order, is_active, storage_path, created_by
    )
    SELECT
      v_new_period.id,
      mp.image_url,
      mp.alt_text,
      mp.rotation_deg,
      mp.object_position,
      mp.sort_order,
      mp.is_active,
      mp.storage_path,
      v_uid
    FROM public.moment_photos mp
    WHERE mp.period_id = v_old_period.id
      AND mp.is_active = TRUE;

    GET DIAGNOSTICS v_moments_copied = ROW_COUNT;
  END IF;

  v_summary := jsonb_build_object(
    'locked_period_id', v_old_period.id,
    'locked_period_code', v_old_period.code,
    'new_period_id', v_new_period.id,
    'new_period_code', v_new_period.code,
    'members_copied', v_members_copied,
    'hero_slides_copied', v_hero_copied,
    'moment_photos_copied', v_moments_copied,
    'carry_over_visi_misi', p_carry_over_visi_misi,
    'carry_over_struktur', p_carry_over_struktur
  );

  INSERT INTO public.period_audit_logs (
    period_id,
    actor_id,
    actor_email,
    actor_name,
    actor_role,
    action,
    summary
  )
  VALUES (
    v_new_period.id,
    v_uid,
    coalesce(v_actor.email, auth.jwt()->>'email'),
    coalesce(v_actor.full_name, v_actor.email, 'Pengurus'),
    coalesce(v_actor.role_text, 'ketua'),
    'transition',
    v_summary
  );

  RETURN jsonb_build_object(
    'ok', true,
    'locked_period_id', v_old_period.id,
    'new_period_id', v_new_period.id,
    'new_period_code', v_new_period.code,
    'summary', v_summary
  );
END;
$$;

REVOKE ALL ON FUNCTION public.fn_transition_active_period(
  TEXT, TEXT, INTEGER, INTEGER, DATE, DATE, TEXT, TEXT, TEXT, BOOLEAN, BOOLEAN, BOOLEAN, BOOLEAN, BOOLEAN
) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.fn_transition_active_period(
  TEXT, TEXT, INTEGER, INTEGER, DATE, DATE, TEXT, TEXT, TEXT, BOOLEAN, BOOLEAN, BOOLEAN, BOOLEAN, BOOLEAN
) TO authenticated;

GRANT EXECUTE ON FUNCTION public.fn_get_active_period_id() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.fn_is_period_locked(UUID) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.is_period_manager() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_humas_or_ketua() TO authenticated;
