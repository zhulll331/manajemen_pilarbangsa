-- ====================================================================
-- TAHAP 11: Penambahan Kolom folder_id untuk Integrasi Google Drive API
-- ====================================================================
-- Jalankan skrip ini di SQL Editor Supabase Anda untuk menambahkan kolom
-- folder_id pada tabel-tabel terkait jika belum tersedia.

ALTER TABLE public.agendas ADD COLUMN IF NOT EXISTS folder_id TEXT;
ALTER TABLE public.finance_transactions ADD COLUMN IF NOT EXISTS folder_id TEXT;
ALTER TABLE public.archives ADD COLUMN IF NOT EXISTS folder_id TEXT;
ALTER TABLE public.programs ADD COLUMN IF NOT EXISTS folder_id TEXT;
