-- =============================================
-- MIGRASI & SEED DATA: HERO SLIDES BERANDA
-- Tahap 19 - Pilar Bangsa Digital Office
-- =============================================

CREATE TABLE IF NOT EXISTS public.hero_slides (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  image_url text NOT NULL,
  badge text NOT NULL DEFAULT '',
  title text NOT NULL,
  description text NOT NULL DEFAULT '',
  cta_primary_label text NOT NULL DEFAULT 'Lihat Program Kerja',
  cta_primary_href text NOT NULL DEFAULT '/program-kerja',
  cta_secondary_label text,
  cta_secondary_href text,
  sort_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc', now())
);

CREATE INDEX IF NOT EXISTS idx_hero_slides_active_sort
  ON public.hero_slides (is_active, sort_order ASC, created_at ASC);

ALTER TABLE public.hero_slides ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Hero slides viewable publicly when active" ON public.hero_slides;
CREATE POLICY "Hero slides viewable publicly when active"
  ON public.hero_slides FOR SELECT
  TO anon
  USING (is_active = true);

DROP POLICY IF EXISTS "Hero slides viewable by authenticated" ON public.hero_slides;
CREATE POLICY "Hero slides viewable by authenticated"
  ON public.hero_slides FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Hero slides insertable by authenticated" ON public.hero_slides;
CREATE POLICY "Hero slides insertable by authenticated"
  ON public.hero_slides FOR INSERT
  TO authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "Hero slides updatable by authenticated" ON public.hero_slides;
CREATE POLICY "Hero slides updatable by authenticated"
  ON public.hero_slides FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Hero slides deletable by authenticated" ON public.hero_slides;
CREATE POLICY "Hero slides deletable by authenticated"
  ON public.hero_slides FOR DELETE
  TO authenticated
  USING (true);

-- Salin data lama dari public.banners (jika ada) agar gambar unggahan Humas tetap terbawa
DO $$
BEGIN
  IF to_regclass('public.banners') IS NOT NULL
     AND NOT EXISTS (SELECT 1 FROM public.hero_slides) THEN
    INSERT INTO public.hero_slides (
      image_url,
      badge,
      title,
      description,
      cta_primary_label,
      cta_primary_href,
      cta_secondary_label,
      cta_secondary_href,
      sort_order,
      is_active,
      created_at
    )
    SELECT
      COALESCE(NULLIF(trim(image_url), ''), 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=1400&q=80'),
      COALESCE(NULLIF(trim(badge), ''), 'Transformasi Digital'),
      COALESCE(NULLIF(trim(title), ''), 'Pilar Bangsa Digital Office'),
      COALESCE(NULLIF(trim(description), ''), NULLIF(trim(subtitle), ''), ''),
      'Lihat Program Kerja',
      '/program-kerja',
      'Pelajari Lebih Lanjut',
      '/tentang-kami',
      ROW_NUMBER() OVER (ORDER BY id ASC),
      true,
      COALESCE(created_at, timezone('utc', now()))
    FROM public.banners;
  END IF;
END $$;

-- Seed 3 data contoh bertema kegiatan UKM/organisasi mahasiswa (hanya jika hero_slides masih kosong)
INSERT INTO public.hero_slides (
  image_url,
  badge,
  title,
  description,
  cta_primary_label,
  cta_primary_href,
  cta_secondary_label,
  cta_secondary_href,
  sort_order,
  is_active
)
SELECT *
FROM (
  VALUES
    (
      'https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=1400&q=80',
      'Transformasi Digital',
      'Pilar Bangsa Digital Office',
      'Wadah transformasi dan kolaborasi mahasiswa Universitas 17 Agustus 1945 Banyuwangi untuk mewujudkan tata kelola organisasi yang modern, transparan, dan akuntabel.',
      'Lihat Program Kerja',
      '/program-kerja',
      'Pelajari Lebih Lanjut',
      '/tentang-kami',
      1,
      true
    ),
    (
      'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=1400&q=80',
      'Kegiatan & Kaderisasi',
      'Bergerak Bersama, Berdampak Nyata',
      'Ikuti agenda diklat kepemimpinan, diskusi intelektual, dan kolaborasi lintas fakultas yang membentuk karakter mahasiswa kritis dan berintegritas.',
      'Jelajahi Kegiatan',
      '/kegiatan',
      'Lihat Arsip UKM',
      '/arsip',
      2,
      true
    ),
    (
      'https://images.unsplash.com/photo-1531482615713-2afd69097998?auto=format&fit=crop&w=1400&q=80',
      'Pengabdian & Riset',
      'Tri Dharma Perguruan Tinggi',
      'Mendorong karya tulis ilmiah, riset sosial, dan pengabdian masyarakat berkelanjutan yang menghadirkan solusi konkret bagi lingkungan sekitar.',
      'Lihat Program Kerja',
      '/program-kerja',
      'Tentang Kami',
      '/tentang-kami',
      3,
      true
    )
) AS seed_data (
  image_url,
  badge,
  title,
  description,
  cta_primary_label,
  cta_primary_href,
  cta_secondary_label,
  cta_secondary_href,
  sort_order,
  is_active
)
WHERE NOT EXISTS (SELECT 1 FROM public.hero_slides);
