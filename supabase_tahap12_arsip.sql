-- =============================================
-- TAHAP 12: Fitur Arsip Publik UKM
-- =============================================
-- Jalankan skrip ini di SQL Editor Supabase Anda.

CREATE TABLE IF NOT EXISTS public.archives (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  period TEXT NOT NULL,
  category TEXT NOT NULL,
  program_id UUID,
  drive_url TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now()) NOT NULL
);

-- Pastikan semua kolom ada (jika tabel sudah pernah dibuat sebelumnya)
ALTER TABLE public.archives ADD COLUMN IF NOT EXISTS title TEXT;
ALTER TABLE public.archives ADD COLUMN IF NOT EXISTS period TEXT;
ALTER TABLE public.archives ADD COLUMN IF NOT EXISTS category TEXT;
ALTER TABLE public.archives ADD COLUMN IF NOT EXISTS program_id UUID;
ALTER TABLE public.archives ADD COLUMN IF NOT EXISTS drive_url TEXT;

-- Tambahkan foreign key jika belum ada
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'archives_program_id_fkey'
    AND table_name = 'archives'
  ) THEN
    ALTER TABLE public.archives
      ADD CONSTRAINT archives_program_id_fkey
      FOREIGN KEY (program_id) REFERENCES public.programs(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Mengaktifkan Row Level Security (RLS)
ALTER TABLE public.archives ENABLE ROW LEVEL SECURITY;

-- Paksa PostgREST reload schema cache
NOTIFY pgrst, 'reload schema';

-- Policy untuk tabel archives
-- 1. Publik bisa melihat semua arsip
DROP POLICY IF EXISTS "Archives viewable by everyone" ON public.archives;
CREATE POLICY "Archives viewable by everyone" ON public.archives FOR SELECT USING (true);

-- 2. Hanya user yang login (Humas/Ketua) yang bisa menambah, mengubah, dan menghapus
DROP POLICY IF EXISTS "Archives insertable by authenticated" ON public.archives;
CREATE POLICY "Archives insertable by authenticated" ON public.archives FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "Archives updatable by authenticated" ON public.archives;
CREATE POLICY "Archives updatable by authenticated" ON public.archives FOR UPDATE TO authenticated USING (true);

DROP POLICY IF EXISTS "Archives deletable by authenticated" ON public.archives;
CREATE POLICY "Archives deletable by authenticated" ON public.archives FOR DELETE TO authenticated USING (true);
