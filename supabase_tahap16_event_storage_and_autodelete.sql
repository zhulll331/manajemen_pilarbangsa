-- ==============================================================================
-- TAHAP 16: SUPABASE STORAGE BUCKET 'event-banners' & AUTO-DELETE H+14 ARSIP
-- ==============================================================================
-- 1. Konfigurasi Bucket Storage: 'event-banners' (Publik, Read-only Anon)
-- 2. Kebijakan Keamanan (RLS) Storage
-- 3. Fungsi Pembersih Otomatis H+14 Kegiatan Berstatus Arsip Beserta Berkas Storage
-- 4. Penjadwalan Otomatis menggunakan Supabase pg_cron
-- ==============================================================================

-- 1. BUAT / UPDATE BUCKET PENYIMPANAN 'event-banners'
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'event-banners', 
  'event-banners', 
  true, 
  10485760, -- 10MB limit (WebP umumnya hanya 50KB - 400KB)
  ARRAY['image/webp', 'image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/svg+xml']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 10485760,
  allowed_mime_types = ARRAY['image/webp', 'image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/svg+xml'];

-- 2. STORAGE RLS POLICIES UNTUK 'event-banners'

-- A. Akses Publik: Siapapun (termasuk anonim) bisa melihat banner kegiatan
DROP POLICY IF EXISTS "Publik dapat melihat banner kegiatan" ON storage.objects;
CREATE POLICY "Publik dapat melihat banner kegiatan" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'event-banners');

-- B. Akses Pengurus: Pengguna terautentikasi bisa mengunggah banner
DROP POLICY IF EXISTS "Pengguna terautentikasi dapat mengunggah banner kegiatan" ON storage.objects;
CREATE POLICY "Pengguna terautentikasi dapat mengunggah banner kegiatan" 
ON storage.objects FOR INSERT 
TO authenticated
WITH CHECK (bucket_id = 'event-banners');

-- C. Akses Pengurus: Pengguna terautentikasi bisa memperbarui banner
DROP POLICY IF EXISTS "Pengguna terautentikasi dapat memperbarui banner kegiatan" ON storage.objects;
CREATE POLICY "Pengguna terautentikasi dapat memperbarui banner kegiatan" 
ON storage.objects FOR UPDATE 
TO authenticated
USING (bucket_id = 'event-banners');

-- D. Akses Pengurus: Pengguna terautentikasi bisa menghapus banner
DROP POLICY IF EXISTS "Pengguna terautentikasi dapat menghapus banner kegiatan" ON storage.objects;
CREATE POLICY "Pengguna terautentikasi dapat menghapus banner kegiatan" 
ON storage.objects FOR DELETE 
TO authenticated
USING (bucket_id = 'event-banners');


-- ==============================================================================
-- 3. FUNGSI PEMBERSIH H+14 KEGIATAN BERSTATUS ARSIP (AUTO-PURGE)
-- ==============================================================================
-- Alur:
-- Kegiatan berstatus 'archived' yang telah melewati H+14 sejak 'ends_at'
-- (atau sejak 'updated_at' jika 'ends_at' tidak diisi) akan dihapus permanen,
-- beserta berkas banner yang tersimpan di Supabase Storage 'event-banners'.
-- Relasi item di public_event_resources otomatis terhapus via CASCADE.

CREATE OR REPLACE FUNCTION public.fn_purge_expired_archived_events()
RETURNS integer AS $$
DECLARE
  v_count integer := 0;
  r RECORD;
  v_storage_path text;
BEGIN
  -- Iterasi kegiatan berstatus 'archived' yang memenuhi syarat H+14
  FOR r IN
    SELECT id, title, banner_url, ends_at, updated_at
    FROM public.public_events
    WHERE publish_status = 'archived'
      AND (
        (ends_at IS NOT NULL AND ends_at <= (NOW() - INTERVAL '14 days'))
        OR
        (ends_at IS NULL AND updated_at <= (NOW() - INTERVAL '14 days'))
      )
  LOOP
    -- A. Bersihkan berkas banner dari storage.objects jika berada di bucket 'event-banners'
    IF r.banner_url IS NOT NULL AND r.banner_url LIKE '%/storage/v1/object/public/event-banners/%' THEN
      v_storage_path := substring(r.banner_url from '/storage/v1/object/public/event-banners/(.*)');
      
      -- Bersihkan parameter query (misal: ?v=123) jika ada
      IF position('?' in v_storage_path) > 0 THEN
        v_storage_path := split_part(v_storage_path, '?', 1);
      END IF;

      IF v_storage_path IS NOT NULL AND length(v_storage_path) > 0 THEN
        BEGIN
          DELETE FROM storage.objects
          WHERE bucket_id = 'event-banners'
            AND name = v_storage_path;
        EXCEPTION WHEN OTHERS THEN
          -- Log error jika gagal hapus storage, namun lanjutkan hapus baris kegiatan
          RAISE NOTICE 'Gagal menghapus file banner storage %: %', v_storage_path, SQLERRM;
        END;
      END IF;
    END IF;

    -- B. Hapus baris kegiatan dari tabel public_events
    DELETE FROM public.public_events WHERE id = r.id;
    v_count := v_count + 1;
  END LOOP;

  RETURN v_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Berikan izin eksekusi kepada pengguna terautentikasi dan service_role
GRANT EXECUTE ON FUNCTION public.fn_purge_expired_archived_events() TO authenticated, service_role;


-- ==============================================================================
-- 4. PENJADWALAN OTOMATIS DENGAN SUPABASE pg_cron
-- ==============================================================================
-- Menjalankan fungsi pembersihan setiap hari pada pukul 03:00 WIB (20:00 UTC)

DO $$
BEGIN
  -- Cek apakah ekstensi pg_cron tersedia
  IF EXISTS (
    SELECT 1 FROM pg_available_extensions WHERE name = 'pg_cron'
  ) THEN
    CREATE EXTENSION IF NOT EXISTS pg_cron;

    -- Unschedule job jika sudah pernah dibuat sebelumnya agar tidak duplikasi
    IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'purge-expired-archived-events-daily') THEN
      PERFORM cron.unschedule('purge-expired-archived-events-daily');
    END IF;

    -- Jadwalkan job harian setiap jam 20:00 UTC (03:00 WIB)
    PERFORM cron.schedule(
      'purge-expired-archived-events-daily',
      '0 20 * * *',
      'SELECT public.fn_purge_expired_archived_events();'
    );
  END IF;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'pg_cron belum aktif atau membutuhkan izin superuser: %. Fungsi fn_purge_expired_archived_events tetap dapat dipanggil secara otomatis via aplikasi/RPC.', SQLERRM;
END $$;
