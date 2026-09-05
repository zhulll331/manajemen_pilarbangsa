-- ==============================================================================
-- TAHAP 14: TABEL METADATA KNOWLEDGE BASE DOKUMEN AI
-- ==============================================================================

CREATE TABLE IF NOT EXISTS knowledge_docs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,       -- contoh: 'ad_art', 'buku_panduan', 'sop_kegiatan'
  original_filename TEXT NOT NULL,
  file_type TEXT NOT NULL,         -- 'pdf', 'docx', 'md', 'txt'
  file_size INTEGER DEFAULT 0,
  uploaded_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexing
CREATE INDEX IF NOT EXISTS idx_knowledge_docs_slug ON knowledge_docs (slug);
CREATE INDEX IF NOT EXISTS idx_knowledge_docs_created_at ON knowledge_docs (created_at DESC);

-- Enable RLS
ALTER TABLE knowledge_docs ENABLE ROW LEVEL SECURITY;

-- Policies: Pengguna terautentikasi (Humas, Sekretaris, dll) dapat membaca dan mengelola dokumen
DROP POLICY IF EXISTS "Public can view knowledge docs metadata" ON knowledge_docs;
CREATE POLICY "Public can view knowledge docs metadata"
  ON knowledge_docs FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Authenticated users can insert knowledge docs" ON knowledge_docs;
CREATE POLICY "Authenticated users can insert knowledge docs"
  ON knowledge_docs FOR INSERT
  TO authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated users can update knowledge docs" ON knowledge_docs;
CREATE POLICY "Authenticated users can update knowledge docs"
  ON knowledge_docs FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated users can delete knowledge docs" ON knowledge_docs;
CREATE POLICY "Authenticated users can delete knowledge docs"
  ON knowledge_docs FOR DELETE
  TO authenticated
  USING (true);

-- Seed awal metadata untuk file bawaan agar langsung terdaftar dan dapat dihapus/diedit oleh Humas
INSERT INTO knowledge_docs (title, slug, original_filename, file_type, file_size)
VALUES 
  ('AD/ART Organisasi (Bawaan)', 'ad_art', 'ad_art.md', 'md', 4454),
  ('Buku Panduan Organisasi (Bawaan)', 'buku_panduan', 'buku_panduan.md', 'md', 1514)
ON CONFLICT (slug) DO NOTHING;
