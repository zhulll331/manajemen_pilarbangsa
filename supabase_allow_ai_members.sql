-- =========================================================================
-- IZINKAN AI / PUBLIK MEMBACA DAFTAR PENGURUS AKTIF DARI TABEL MEMBERS
-- Jalankan query ini di menu: Supabase Dashboard -> SQL Editor -> Run
-- =========================================================================

-- Tambahkan policy agar data anggota berstatus 'Pengurus Aktif' dapat dibaca oleh AI
CREATE POLICY "Pengurus aktif viewable by everyone" 
ON public.members 
FOR SELECT 
USING (status = 'Pengurus Aktif');
