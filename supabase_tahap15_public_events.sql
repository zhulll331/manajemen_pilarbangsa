-- ==============================================================================
-- TAHAP 15: PUSAT KEGIATAN PILAR BANGSA (PUBLIC EVENTS & RESOURCES)
-- ==============================================================================
-- Fitur pengelolaan halaman kegiatan publik resmi UKM Pilar Bangsa
-- Termasuk tautan, twibbon, caption, formulir pendaftaran, dan sorotan beranda.

-- 1. TABEL UTAMA: public_events
CREATE TABLE IF NOT EXISTS public.public_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(120) NOT NULL,
  slug VARCHAR(100) UNIQUE NOT NULL,
  summary VARCHAR(300),
  description TEXT,
  banner_url TEXT,
  starts_at TIMESTAMPTZ,
  ends_at TIMESTAMPTZ,
  location TEXT,
  publish_status VARCHAR(20) NOT NULL DEFAULT 'draft',
  registration_status VARCHAR(20) NOT NULL DEFAULT 'na',
  is_featured BOOLEAN NOT NULL DEFAULT false,
  slug_locked BOOLEAN NOT NULL DEFAULT false,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  version INTEGER NOT NULL DEFAULT 1,

  -- Constraints
  CONSTRAINT chk_event_slug_format CHECK (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  CONSTRAINT chk_event_dates CHECK (ends_at IS NULL OR starts_at IS NULL OR ends_at >= starts_at),
  CONSTRAINT chk_event_publish_status CHECK (publish_status IN ('draft', 'published', 'archived')),
  CONSTRAINT chk_event_registration_status CHECK (registration_status IN ('na', 'soon', 'open', 'closed')),
  CONSTRAINT chk_event_banner_url CHECK (banner_url IS NULL OR banner_url ~* '^https://.*')
);

-- Indexing public_events
CREATE INDEX IF NOT EXISTS idx_public_events_slug ON public.public_events (slug);
CREATE INDEX IF NOT EXISTS idx_public_events_publish_status ON public.public_events (publish_status);
CREATE INDEX IF NOT EXISTS idx_public_events_featured ON public.public_events (is_featured) WHERE is_featured = true;
CREATE INDEX IF NOT EXISTS idx_public_events_starts_at ON public.public_events (starts_at ASC NULLS LAST);

-- 2. TABEL ITEM: public_event_resources
CREATE TABLE IF NOT EXISTS public.public_event_resources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES public.public_events(id) ON DELETE CASCADE,
  item_type VARCHAR(20) NOT NULL,
  title VARCHAR(200) NOT NULL,
  description VARCHAR(500),
  url TEXT,
  link_role VARCHAR(20) NOT NULL DEFAULT 'general',
  content TEXT,
  copyable BOOLEAN NOT NULL DEFAULT false,
  is_required BOOLEAN NOT NULL DEFAULT false,
  is_visible BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),

  -- Constraints
  CONSTRAINT chk_resource_item_type CHECK (item_type IN ('link', 'text', 'section_header')),
  CONSTRAINT chk_resource_link_role CHECK (link_role IN ('general', 'registration')),
  CONSTRAINT chk_resource_content_length CHECK (content IS NULL OR length(content) <= 10000),
  CONSTRAINT chk_resource_url_security CHECK (
    url IS NULL OR (
      url ~* '^https://.*' AND 
      url !~* '^(javascript|data|vbscript):'
    )
  ),
  CONSTRAINT chk_resource_item_payload CHECK (
    (item_type = 'link' AND url IS NOT NULL) OR
    (item_type = 'text' AND content IS NOT NULL) OR
    (item_type = 'section_header')
  )
);

-- Indexing public_event_resources
CREATE INDEX IF NOT EXISTS idx_public_event_resources_event ON public.public_event_resources (event_id);
CREATE INDEX IF NOT EXISTS idx_public_event_resources_order ON public.public_event_resources (event_id, sort_order ASC);

-- ==============================================================================
-- 3. TRIGGERS & FUNCTIONS
-- ==============================================================================

-- A. Trigger: Kunci Slug dan validasi perubahan slug
CREATE OR REPLACE FUNCTION public.fn_lock_public_event_slug()
RETURNS trigger AS $$
BEGIN
  -- Jika bertransisi dari draft ke published, tandai slug_locked = true
  IF OLD.publish_status = 'draft' AND NEW.publish_status = 'published' THEN
    NEW.slug_locked := true;
  END IF;

  -- Jika slug sudah pernah dikunci, tolak perubahan slug
  IF OLD.slug_locked = true AND NEW.slug <> OLD.slug THEN
    RAISE EXCEPTION 'Slug kegiatan yang sudah diterbitkan terkunci dan tidak dapat diubah.';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_lock_public_event_slug ON public.public_events;
CREATE TRIGGER trg_lock_public_event_slug
  BEFORE UPDATE ON public.public_events
  FOR EACH ROW
  EXECUTE FUNCTION public.fn_lock_public_event_slug();

-- B. Trigger: Atomik Single Featured Event
CREATE OR REPLACE FUNCTION public.fn_single_featured_event()
RETURNS trigger AS $$
BEGIN
  IF NEW.is_featured = true THEN
    UPDATE public.public_events
    SET is_featured = false
    WHERE id <> NEW.id AND is_featured = true;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_single_featured_event ON public.public_events;
CREATE TRIGGER trg_single_featured_event
  BEFORE INSERT OR UPDATE OF is_featured ON public.public_events
  FOR EACH ROW
  WHEN (NEW.is_featured = true)
  EXECUTE FUNCTION public.fn_single_featured_event();

-- C. Trigger: Bump Version & Updated At pada public_events
CREATE OR REPLACE FUNCTION public.fn_bump_event_version()
RETURNS trigger AS $$
BEGIN
  NEW.version := OLD.version + 1;
  NEW.updated_at := timezone('utc'::text, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_bump_event_version ON public.public_events;
CREATE TRIGGER trg_bump_event_version
  BEFORE UPDATE ON public.public_events
  FOR EACH ROW
  EXECUTE FUNCTION public.fn_bump_event_version();

-- ==============================================================================
-- 4. ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================

ALTER TABLE public.public_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.public_event_resources ENABLE ROW LEVEL SECURITY;

-- POLICIES UNTUK: public_events
-- 1. Publik bisa membaca hanya yang status 'published' atau 'archived'
DROP POLICY IF EXISTS "Public can view published or archived events" ON public.public_events;
CREATE POLICY "Public can view published or archived events"
  ON public.public_events FOR SELECT
  USING (publish_status IN ('published', 'archived'));

-- 2. Pengguna terautentikasi (pengurus/humas) bisa melihat SEMUA data (termasuk draft)
DROP POLICY IF EXISTS "Authenticated users can view all events" ON public.public_events;
CREATE POLICY "Authenticated users can view all events"
  ON public.public_events FOR SELECT
  TO authenticated
  USING (true);

-- 3. Pengguna terautentikasi bisa menambah kegiatan baru
DROP POLICY IF EXISTS "Authenticated users can insert events" ON public.public_events;
CREATE POLICY "Authenticated users can insert events"
  ON public.public_events FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- 4. Pengguna terautentikasi bisa memperbarui kegiatan
DROP POLICY IF EXISTS "Authenticated users can update events" ON public.public_events;
CREATE POLICY "Authenticated users can update events"
  ON public.public_events FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- 5. Pengguna terautentikasi HANYA boleh menghapus draft (kegiatan terbit/arsip dilindungi)
DROP POLICY IF EXISTS "Authenticated users can delete draft events" ON public.public_events;
CREATE POLICY "Authenticated users can delete draft events"
  ON public.public_events FOR DELETE
  TO authenticated
  USING (publish_status = 'draft');


-- POLICIES UNTUK: public_event_resources
-- 1. Publik hanya bisa melihat item yang visible dan milik event yang terbit/arsip
DROP POLICY IF EXISTS "Public can view visible event resources" ON public.public_event_resources;
CREATE POLICY "Public can view visible event resources"
  ON public.public_event_resources FOR SELECT
  USING (
    is_visible = true AND
    EXISTS (
      SELECT 1 FROM public.public_events pe
      WHERE pe.id = public_event_resources.event_id
        AND pe.publish_status IN ('published', 'archived')
    )
  );

-- 2. Pengguna terautentikasi bisa melihat seluruh resources
DROP POLICY IF EXISTS "Authenticated users can view all resources" ON public.public_event_resources;
CREATE POLICY "Authenticated users can view all resources"
  ON public.public_event_resources FOR SELECT
  TO authenticated
  USING (true);

-- 3. Pengguna terautentikasi bisa menambah resources
DROP POLICY IF EXISTS "Authenticated users can insert resources" ON public.public_event_resources;
CREATE POLICY "Authenticated users can insert resources"
  ON public.public_event_resources FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- 4. Pengguna terautentikasi bisa memperbarui resources
DROP POLICY IF EXISTS "Authenticated users can update resources" ON public.public_event_resources;
CREATE POLICY "Authenticated users can update resources"
  ON public.public_event_resources FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- 5. Pengguna terautentikasi bisa menghapus resources
DROP POLICY IF EXISTS "Authenticated users can delete resources" ON public.public_event_resources;
CREATE POLICY "Authenticated users can delete resources"
  ON public.public_event_resources FOR DELETE
  TO authenticated
  USING (true);
