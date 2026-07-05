-- Tabel pengaturan website (misal untuk Visi & Misi)
CREATE TABLE IF NOT EXISTS public.website_settings (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  setting_key text NOT NULL UNIQUE,
  setting_value jsonb NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Kebijakan RLS (Row Level Security) untuk website_settings
ALTER TABLE public.website_settings ENABLE ROW LEVEL SECURITY;

-- Semua orang (termasuk anon/publik) bisa membaca pengaturan
CREATE POLICY "Public profiles are viewable by everyone." 
  ON public.website_settings FOR SELECT 
  USING (true);

-- Hanya admin/pengguna terotentikasi yang bisa mengubah
CREATE POLICY "Authenticated users can update settings" 
  ON public.website_settings FOR UPDATE 
  USING (auth.role() = 'authenticated');
  
CREATE POLICY "Authenticated users can insert settings" 
  ON public.website_settings FOR INSERT 
  USING (auth.role() = 'authenticated');

-- Masukkan Visi Misi Default
INSERT INTO public.website_settings (setting_key, setting_value)
VALUES (
  'visi_misi',
  '{
    "visi": "Menjadikan UKM Pilar Bangsa sebagai wadah pengembangan intelektualitas, riset, dan pengabdian mahasiswa yang inklusif, adaptif terhadap perkembangan teknologi, serta berorientasi pada kolaborasi lintas disiplin demi terwujudnya kontribusi nyata bagi civitas akademika dan masyarakat.",
    "misi": [
      {
        "id": "1",
        "title": "Mewujudkan ekosistem organisasi yang inklusif, kekeluargaan, dan sinergis.",
        "desc": "UKM Pilar Bangsa harus menjadi ruang yang terbuka bagi mahasiswa dari berbagai fakultas untuk berkolaborasi, menyatukan gagasan, serta membangun budaya organisasi yang saling mendukung dan kekeluargaan.",
        "pasal": "Pasal 5",
        "color": "#E31837"
      },
      {
        "id": "2",
        "title": "Mengembangkan tata kelola organisasi yang modern, efektif, dan efisien.",
        "desc": "Pengelolaan administrasi, data anggota, presensi, arsip, agenda, dan evaluasi kegiatan perlu diarahkan menuju sistem yang lebih rapi dan digital agar kerja organisasi menjadi lebih tertata, transparan, dan berkelanjutan.",
        "pasal": "Pasal 6 ayat (2)",
        "color": "#008000"
      },
      {
        "id": "3",
        "title": "Meningkatkan kapasitas anggota melalui pembelajaran, riset, dan pengembangan keterampilan.",
        "desc": "UKM Pilar Bangsa tidak hanya menjadi tempat menjalankan program kerja, tetapi juga menjadi ruang belajar bagi anggota untuk mengembangkan soft skill, hard skill, kepemimpinan, literasi digital, kemampuan riset, dan kepedulian sosial.",
        "pasal": "Pasal 4, Pasal 5, dan Pasal 6 ayat (3)",
        "color": "#FFD700"
      },
      {
        "id": "4",
        "title": "Memperkuat kolaborasi internal dan eksternal organisasi.",
        "desc": "Membangun kemitraan strategis yang sinergis antardivisi di dalam internal organisasi serta mempererat relasi eksternal dengan universitas, alumni, media, dan pemangku kepentingan lainnya.",
        "pasal": "Pasal 10 ayat (2)",
        "color": "#E31837"
      },
      {
        "id": "5",
        "title": "Menghadirkan program pengabdian masyarakat yang inovatif, relevan, dan berdampak.",
        "desc": "Setiap program kerja perlu diarahkan agar tidak hanya bersifat seremonial, tetapi benar-benar menjawab kebutuhan masyarakat, mengembangkan potensi lokal, serta membawa manfaat nyata bagi lingkungan kampus dan masyarakat.",
        "pasal": "Pasal 5 dan Pasal 6 ayat (3)",
        "color": "#008000"
      }
    ]
  }'::jsonb
)
ON CONFLICT (setting_key) DO NOTHING;


-- Tabel link berita
CREATE TABLE IF NOT EXISTS public.news_links (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  title text NOT NULL,
  url text NOT NULL,
  image_url text NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Kebijakan RLS (Row Level Security) untuk news_links
ALTER TABLE public.news_links ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public profiles are viewable by everyone." 
  ON public.news_links FOR SELECT 
  USING (true);

CREATE POLICY "Authenticated users can manage news_links" 
  ON public.news_links FOR ALL 
  USING (auth.role() = 'authenticated');
