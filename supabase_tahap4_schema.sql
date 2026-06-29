-- =============================================
-- TAHAP 4: Database Dasar - Pilar Digital Office
-- =============================================
-- Jalankan seluruh skrip ini di SQL Editor Supabase Anda.
-- Pastikan skrip dari supabase_schema.sql (Tahap 3) sudah dijalankan sebelumnya.

-- ============ 1. MEMBERS ============
CREATE TABLE IF NOT EXISTS public.members (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  nim TEXT,
  faculty TEXT,
  study_program TEXT,
  generation TEXT,
  phone TEXT,
  division TEXT,
  status TEXT DEFAULT 'Aktif',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now()) NOT NULL
);
ALTER TABLE public.members ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Members viewable by authenticated" ON public.members FOR SELECT TO authenticated USING (true);
CREATE POLICY "Members insertable by authenticated" ON public.members FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Members updatable by authenticated" ON public.members FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Members deletable by authenticated" ON public.members FOR DELETE TO authenticated USING (true);

-- ============ 2. PROGRAMS ============
CREATE TABLE IF NOT EXISTS public.programs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  division TEXT,
  person_in_charge TEXT,
  status TEXT DEFAULT 'Berjalan',
  start_date DATE,
  end_date DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now()) NOT NULL
);
ALTER TABLE public.programs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Programs viewable by everyone" ON public.programs FOR SELECT USING (true);
CREATE POLICY "Programs insertable by authenticated" ON public.programs FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Programs updatable by authenticated" ON public.programs FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Programs deletable by authenticated" ON public.programs FOR DELETE TO authenticated USING (true);

-- ============ 3. AGENDAS ============
CREATE TABLE IF NOT EXISTS public.agendas (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  date DATE,
  time TIME,
  location TEXT,
  category TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now()) NOT NULL
);
ALTER TABLE public.agendas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Agendas viewable by authenticated" ON public.agendas FOR SELECT TO authenticated USING (true);
CREATE POLICY "Agendas insertable by authenticated" ON public.agendas FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Agendas updatable by authenticated" ON public.agendas FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Agendas deletable by authenticated" ON public.agendas FOR DELETE TO authenticated USING (true);

-- ============ 4. LETTERS ============
CREATE TABLE IF NOT EXISTS public.letters (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  letter_number TEXT,
  letter_type TEXT NOT NULL, -- 'Masuk' atau 'Keluar'
  date DATE,
  sender TEXT,
  recipient TEXT,
  subject TEXT,
  file_url TEXT,
  status TEXT DEFAULT 'Diterima',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now()) NOT NULL
);
ALTER TABLE public.letters ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Letters viewable by authenticated" ON public.letters FOR SELECT TO authenticated USING (true);
CREATE POLICY "Letters insertable by authenticated" ON public.letters FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Letters updatable by authenticated" ON public.letters FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Letters deletable by authenticated" ON public.letters FOR DELETE TO authenticated USING (true);

-- ============ 5. MINUTES ============
CREATE TABLE IF NOT EXISTS public.minutes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  meeting_date DATE,
  participants TEXT,
  discussion TEXT,
  decisions TEXT,
  follow_up TEXT,
  file_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now()) NOT NULL
);
ALTER TABLE public.minutes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Minutes viewable by authenticated" ON public.minutes FOR SELECT TO authenticated USING (true);
CREATE POLICY "Minutes insertable by authenticated" ON public.minutes FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Minutes updatable by authenticated" ON public.minutes FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Minutes deletable by authenticated" ON public.minutes FOR DELETE TO authenticated USING (true);

-- ============ 6. ATTENDANCE ============
CREATE TABLE IF NOT EXISTS public.attendance (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  agenda_id UUID REFERENCES public.agendas(id) ON DELETE SET NULL,
  member_id UUID REFERENCES public.members(id) ON DELETE SET NULL,
  status TEXT DEFAULT 'Hadir',
  note TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now()) NOT NULL
);
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Attendance viewable by authenticated" ON public.attendance FOR SELECT TO authenticated USING (true);
CREATE POLICY "Attendance insertable by authenticated" ON public.attendance FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Attendance updatable by authenticated" ON public.attendance FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Attendance deletable by authenticated" ON public.attendance FOR DELETE TO authenticated USING (true);

-- ============ 7. FINANCE TRANSACTIONS ============
CREATE TABLE IF NOT EXISTS public.finance_transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  transaction_date DATE NOT NULL,
  type TEXT NOT NULL, -- 'Pemasukan' atau 'Pengeluaran'
  category TEXT,
  amount BIGINT NOT NULL DEFAULT 0,
  description TEXT,
  responsible_person TEXT,
  proof_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now()) NOT NULL
);
ALTER TABLE public.finance_transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Finance viewable by authenticated" ON public.finance_transactions FOR SELECT TO authenticated USING (true);
CREATE POLICY "Finance insertable by authenticated" ON public.finance_transactions FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Finance updatable by authenticated" ON public.finance_transactions FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Finance deletable by authenticated" ON public.finance_transactions FOR DELETE TO authenticated USING (true);

-- ============ 8. DUES ============
CREATE TABLE IF NOT EXISTS public.dues (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  member_id UUID REFERENCES public.members(id) ON DELETE SET NULL,
  month INTEGER,
  year INTEGER,
  amount BIGINT NOT NULL DEFAULT 0,
  status TEXT DEFAULT 'Belum Lunas',
  payment_date DATE,
  proof_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now()) NOT NULL
);
ALTER TABLE public.dues ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Dues viewable by authenticated" ON public.dues FOR SELECT TO authenticated USING (true);
CREATE POLICY "Dues insertable by authenticated" ON public.dues FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Dues updatable by authenticated" ON public.dues FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Dues deletable by authenticated" ON public.dues FOR DELETE TO authenticated USING (true);

-- ============ 9. ARCHIVES ============
CREATE TABLE IF NOT EXISTS public.archives (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  category TEXT,
  description TEXT,
  file_url TEXT,
  uploaded_by TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now()) NOT NULL
);
ALTER TABLE public.archives ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Archives viewable by authenticated" ON public.archives FOR SELECT TO authenticated USING (true);
CREATE POLICY "Archives insertable by authenticated" ON public.archives FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Archives updatable by authenticated" ON public.archives FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Archives deletable by authenticated" ON public.archives FOR DELETE TO authenticated USING (true);

-- ============ 10. EVALUATIONS ============
CREATE TABLE IF NOT EXISTS public.evaluations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  program_id UUID REFERENCES public.programs(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  strengths TEXT,
  weaknesses TEXT,
  recommendations TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now()) NOT NULL
);
ALTER TABLE public.evaluations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Evaluations viewable by authenticated" ON public.evaluations FOR SELECT TO authenticated USING (true);
CREATE POLICY "Evaluations insertable by authenticated" ON public.evaluations FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Evaluations updatable by authenticated" ON public.evaluations FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Evaluations deletable by authenticated" ON public.evaluations FOR DELETE TO authenticated USING (true);

-- ============ 11. BANNERS (Hero Slider Beranda) ============
CREATE TABLE IF NOT EXISTS public.banners (
  id INTEGER PRIMARY KEY,
  title TEXT,
  subtitle TEXT,
  description TEXT,
  image_url TEXT,
  badge TEXT,
  accent_color TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now()) NOT NULL
);
ALTER TABLE public.banners ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Banners viewable by everyone" ON public.banners FOR SELECT USING (true);
CREATE POLICY "Banners insertable by authenticated" ON public.banners FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Banners updatable by authenticated" ON public.banners FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Banners deletable by authenticated" ON public.banners FOR DELETE TO authenticated USING (true);

INSERT INTO public.banners (id, title, subtitle, description, image_url, badge, accent_color) VALUES
(1, 'Pilar Bangsa Digital Office', 'Wadah Transformasi & Kolaborasi Mahasiswa Universitas', 'Mewujudkan tata kelola organisasi yang modern, transparan, dan akuntabel berbasis sistem digital terpadu sesuai Misi ke-2 Kepengurusan 2026/2027.', 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=1200&q=80', 'Transformasi Digital', '#E31837'),
(2, 'Tri Dharma Perguruan Tinggi', 'Pilar Pembelajaran, Penelitian, dan Pengabdian', 'Bersama membangun bangsa melalui riset inovatif dan pengabdian masyarakat yang berkelanjutan dan tepat sasaran.', 'https://images.unsplash.com/photo-1531482615713-2afd69097998?auto=format&fit=crop&w=1200&q=80', 'Inovasi & Riset', '#008000'),
(3, 'Berlandaskan Trisakti Sukarno', 'Berdaulat, Berdikari, dan Berkepribadian', 'Membentuk karakter kepemimpinan mahasiswa yang berakar pada budaya bangsa dan berdaya saing global.', 'https://images.unsplash.com/photo-1517486808906-697b691ed59b?auto=format&fit=crop&w=1200&q=80', 'Kepemimpinan', '#FFD700')
ON CONFLICT (id) DO UPDATE SET 
  title = EXCLUDED.title, 
  subtitle = EXCLUDED.subtitle, 
  description = EXCLUDED.description;


-- =============================================
-- SEED DATA (Data Dummy)
-- =============================================

-- Members
INSERT INTO public.members (name, nim, faculty, study_program, generation, phone, division, status) VALUES
('Budi Santoso', '2024001', 'Teknik', 'Informatika', '2024', '08123456701', 'Pendidikan', 'Aktif'),
('Siti Aminah', '2024002', 'Ekonomi', 'Akuntansi', '2024', '08123456702', 'Sosial', 'Aktif'),
('Andi Saputra', '2024003', 'Hukum', 'Ilmu Hukum', '2024', '08123456703', 'Kewirausahaan', 'Cuti'),
('Dewi Lestari', '2024004', 'Seni', 'Desain Grafis', '2024', '08123456704', 'Seni Budaya', 'Aktif'),
('Rizky Pratama', '2023005', 'Teknik', 'Sipil', '2023', '08123456705', 'Pendidikan', 'Aktif'),
('Nurul Hidayah', '2023006', 'FKIP', 'Pendidikan Bahasa', '2023', '08123456706', 'Sosial', 'Aktif'),
('Fajar Setiawan', '2023007', 'Teknik', 'Informatika', '2023', '08123456707', 'Kewirausahaan', 'Aktif'),
('Maya Puspita', '2023008', 'Ekonomi', 'Manajemen', '2023', '08123456708', 'Seni Budaya', 'Aktif'),
('Agus Hermawan', '2022009', 'Teknik', 'Elektro', '2022', '08123456709', 'Pendidikan', 'Aktif'),
('Lina Marlina', '2022010', 'FKIP', 'PGSD', '2022', '08123456710', 'Sosial', 'Aktif'),
('Dimas Kurniawan', '2024011', 'Teknik', 'Informatika', '2024', '08123456711', 'Pendidikan', 'Aktif'),
('Putri Rahayu', '2024012', 'Ekonomi', 'Akuntansi', '2024', '08123456712', 'Sosial', 'Aktif');

-- Programs
INSERT INTO public.programs (title, description, division, person_in_charge, status, start_date, end_date) VALUES
('Pilar Mengajar', 'Program mengajar ke sekolah-sekolah di daerah terpencil', 'Pendidikan', 'Budi Santoso', 'Berjalan', '2026-03-01', '2026-07-31'),
('Bakti Sosial Ramadhan', 'Kegiatan sosial selama bulan Ramadhan', 'Sosial', 'Siti Aminah', 'Selesai', '2026-03-01', '2026-04-30'),
('Bazar Kewirausahaan', 'Bazar dan pelatihan kewirausahaan bagi mahasiswa', 'Kewirausahaan', 'Andi Saputra', 'Berjalan', '2026-05-01', '2026-08-31'),
('Festival Seni Budaya', 'Pentas seni dan pameran budaya nusantara', 'Seni Budaya', 'Dewi Lestari', 'Berjalan', '2026-06-01', '2026-09-30'),
('Seminar Teknologi', 'Seminar tentang perkembangan teknologi terkini', 'Pendidikan', 'Rizky Pratama', 'Direncanakan', '2026-08-01', '2026-08-15');

-- Agendas
INSERT INTO public.agendas (title, description, date, time, location, category) VALUES
('Rapat Koordinasi Pengurus', 'Rapat rutin bulanan pengurus inti', '2026-06-15', '14:00', 'Ruang Rapat Lt. 3', 'Rapat'),
('Workshop Desain Grafis', 'Pelatihan desain untuk anggota divisi Seni', '2026-06-18', '09:00', 'Lab Komputer A', 'Pelatihan'),
('Kunjungan Sekolah Pilar Mengajar', 'Kunjungan mengajar ke SD Negeri 3', '2026-06-20', '08:00', 'SD Negeri 3 Banyuwangi', 'Kegiatan'),
('Rapat Evaluasi Tengah Semester', 'Evaluasi program kerja semester genap', '2026-06-25', '15:00', 'Aula Utama', 'Rapat'),
('Latihan Pentas Seni', 'Latihan untuk festival seni budaya', '2026-06-28', '16:00', 'Gedung Kesenian', 'Kegiatan'),
('Rapat Persiapan Seminar', 'Rapat persiapan seminar teknologi', '2026-07-01', '13:00', 'Ruang Rapat Lt. 3', 'Rapat'),
('Bazar Kewirausahaan Minggu 1', 'Pelaksanaan bazar minggu pertama', '2026-07-05', '08:00', 'Halaman Kampus', 'Kegiatan'),
('Rapat Anggaran Bulanan', 'Rapat pembahasan anggaran bulan Juli', '2026-07-10', '14:00', 'Ruang Rapat Lt. 3', 'Rapat');

-- Letters
INSERT INTO public.letters (letter_number, letter_type, date, sender, recipient, subject, status) VALUES
('001/SM/VI/2026', 'Masuk', '2026-06-01', 'BEM Universitas', 'Ketua UKM Pilar Bangsa', 'Undangan Seminar Nasional', 'Diterima'),
('002/SM/VI/2026', 'Masuk', '2026-06-05', 'Dekan Fakultas Teknik', 'Ketua UKM Pilar Bangsa', 'Permohonan Kerjasama', 'Diterima'),
('003/SM/VI/2026', 'Masuk', '2026-06-10', 'Himpunan Mahasiswa Informatika', 'Ketua UKM Pilar Bangsa', 'Undangan Workshop Bersama', 'Diproses'),
('001/SK/VI/2026', 'Keluar', '2026-06-02', 'Ketua UKM Pilar Bangsa', 'Rektor', 'Proposal Kegiatan Bakti Sosial', 'Terkirim'),
('002/SK/VI/2026', 'Keluar', '2026-06-08', 'Ketua UKM Pilar Bangsa', 'Kepala SD Negeri 3', 'Surat Permohonan Izin Mengajar', 'Terkirim'),
('003/SK/VI/2026', 'Keluar', '2026-06-12', 'Ketua UKM Pilar Bangsa', 'Bank BRI Cabang Banyuwangi', 'Permohonan Sponsorship', 'Terkirim');

-- Minutes
INSERT INTO public.minutes (title, meeting_date, participants, discussion, decisions, follow_up) VALUES
('Notulensi Rapat Koordinasi Mei', '2026-05-15', 'Ketua, Sekretaris, Bendahara, Kadiv Pendidikan', 'Pembahasan program kerja bulan Juni dan evaluasi kegiatan Mei', 'Menyetujui pelaksanaan Pilar Mengajar, Menetapkan jadwal bazar', 'Kadiv Pendidikan menyiapkan materi, Bendahara menyiapkan anggaran'),
('Notulensi Rapat Evaluasi April', '2026-04-20', 'Seluruh Pengurus Inti', 'Evaluasi Bakti Sosial Ramadhan dan persiapan kegiatan semester depan', 'Bakti Sosial dinyatakan berhasil, Perlu perbaikan koordinasi', 'Sekretaris membuat laporan evaluasi lengkap'),
('Notulensi Rapat Keuangan', '2026-05-28', 'Ketua, Bendahara, Kadiv Kewirausahaan', 'Review pengeluaran bulan Mei dan rencana anggaran Juni', 'Anggaran Juni disetujui Rp 5.000.000', 'Bendahara membuat RAB detail');

-- Finance Transactions
INSERT INTO public.finance_transactions (transaction_date, type, category, amount, description, responsible_person) VALUES
('2026-01-15', 'Pemasukan', 'Iuran', 1500000, 'Iuran anggota bulan Januari', 'Bendahara'),
('2026-01-20', 'Pengeluaran', 'Operasional', 350000, 'Beli ATK dan perlengkapan rapat', 'Bendahara'),
('2026-02-10', 'Pemasukan', 'Iuran', 1400000, 'Iuran anggota bulan Februari', 'Bendahara'),
('2026-02-18', 'Pengeluaran', 'Kegiatan', 800000, 'Konsumsi rapat kerja', 'Bendahara'),
('2026-03-05', 'Pemasukan', 'Sponsorship', 5000000, 'Sponsorship Bank BRI untuk Bakti Sosial', 'Bendahara'),
('2026-03-15', 'Pengeluaran', 'Kegiatan', 3200000, 'Biaya Bakti Sosial Ramadhan', 'Siti Aminah'),
('2026-04-01', 'Pemasukan', 'Iuran', 1500000, 'Iuran anggota bulan April', 'Bendahara'),
('2026-04-20', 'Pengeluaran', 'Operasional', 500000, 'Cetak spanduk dan brosur', 'Andi Saputra'),
('2026-05-10', 'Pemasukan', 'Iuran', 1400000, 'Iuran anggota bulan Mei', 'Bendahara'),
('2026-05-22', 'Pengeluaran', 'Kegiatan', 1200000, 'Transport Pilar Mengajar', 'Budi Santoso'),
('2026-06-05', 'Pemasukan', 'Sponsorship', 3000000, 'Sponsorship Event Festival Seni', 'Dewi Lestari'),
('2026-06-10', 'Pemasukan', 'Iuran', 1500000, 'Iuran anggota bulan Juni', 'Bendahara'),
('2026-06-12', 'Pengeluaran', 'Kegiatan', 2500000, 'Uang muka sewa gedung seminar', 'Rizky Pratama');

-- Dues
INSERT INTO public.dues (member_id, month, year, amount, status, payment_date)
SELECT m.id, d.month, d.year, d.amount, d.status, d.payment_date::DATE
FROM public.members m
CROSS JOIN (VALUES
  (1, 2026, 50000, 'Lunas', '2026-01-15'),
  (2, 2026, 50000, 'Lunas', '2026-02-10'),
  (3, 2026, 50000, 'Lunas', '2026-03-05'),
  (4, 2026, 50000, 'Lunas', '2026-04-01'),
  (5, 2026, 50000, 'Lunas', '2026-05-10'),
  (6, 2026, 50000, 'Belum Lunas', NULL)
) AS d(month, year, amount, status, payment_date)
WHERE m.name = 'Budi Santoso'
LIMIT 6;

-- Tambahkan beberapa iuran belum lunas
INSERT INTO public.dues (member_id, month, year, amount, status)
SELECT m.id, 6, 2026, 50000, 'Belum Lunas'
FROM public.members m
WHERE m.name IN ('Andi Saputra', 'Dewi Lestari', 'Maya Puspita', 'Lina Marlina', 'Dimas Kurniawan');

-- Archives
INSERT INTO public.archives (title, category, description, file_url, uploaded_by) VALUES
('Proposal Bakti Sosial Ramadhan 2026', 'Proposal', 'Proposal kegiatan bakti sosial bulan Ramadhan', 'https://drive.google.com/file/example1', 'Sekretaris'),
('LPJ Seminar Nasional 2025', 'LPJ', 'Laporan pertanggungjawaban seminar nasional tahun lalu', 'https://drive.google.com/file/example2', 'Sekretaris'),
('SK Pengurus 2026', 'SK', 'Surat keputusan pengurus UKM Pilar Bangsa periode 2026', 'https://drive.google.com/file/example3', 'Sekretaris'),
('RAB Festival Seni Budaya', 'RAB', 'Rencana anggaran biaya festival seni budaya', 'https://drive.google.com/file/example4', 'Bendahara'),
('Dokumentasi Pilar Mengajar', 'Dokumentasi', 'Kumpulan foto dan video kegiatan Pilar Mengajar', 'https://drive.google.com/file/example5', 'Pendidikan');

-- Evaluations
INSERT INTO public.evaluations (program_id, title, strengths, weaknesses, recommendations)
SELECT p.id, e.title, e.strengths, e.weaknesses, e.recommendations
FROM public.programs p
CROSS JOIN (VALUES
  ('Evaluasi Bakti Sosial Ramadhan', 'Partisipasi anggota tinggi, Koordinasi antar divisi baik, Dana sponsor tercukupi', 'Waktu pelaksanaan terlalu singkat, Kurang dokumentasi', 'Perpanjang masa kegiatan, Bentuk tim dokumentasi khusus')
) AS e(title, strengths, weaknesses, recommendations)
WHERE p.title = 'Bakti Sosial Ramadhan'
LIMIT 1;
