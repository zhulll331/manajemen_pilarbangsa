# **Product Requirement Document (PRD)**

## **Pilar Digital Office v1.1 — Integrasi Portal Publik & Manajemen Divisi**

### **1\. Informasi Dokumen**

* **Nama Produk:** Pilar Digital Office & Portal Publik  
* **Versi:** 1.1 (Revisi Integrasi AD/ART dan Transparansi Publik)  
* **Status:** Disetujui / Implementasi  
* **Target Pengguna:** Pengurus Inti, Wakil Ketua Bidang (Divisi), dan Mahasiswa/Publik.  
* **Teknologi Utama:** Next.js (App Router), Tailwind CSS, Supabase (Auth, Database, Storage), Framer Motion (untuk animasi Slider), Recharts.

### **2\. Deskripsi Produk**

Sistem ini merupakan pengembangan terintegrasi antara **Portal Publik** (sebagai etalase informasi dan transparansi organisasi) dengan **Pilar Digital Office** (dashboard internal tata kelola).

Melalui pembaruan ini, masyarakat dan mahasiswa dapat melihat langsung profil UKM Pilar Bangsa dan status pelaksanaan Program Kerja (Proker) secara *real-time*. Sementara itu, di sistem internal (dashboard), hak akses diperluas untuk mengakomodasi 4 (empat) Wakil Ketua Bidang sesuai AD/ART Pasal 10, agar mereka dapat memperbarui status proker dan menautkan dokumentasi Google Drive secara mandiri.

### **3\. Target Pengguna & Role Persona (Diperbarui)**

Aplikasi ini menggunakan *Role-Based Access Control* (RBAC) dengan 4 level akses pengurus, dan 1 level akses publik:

| Role | Deskripsi Persona | Fokus Utama di Aplikasi |
| :---- | :---- | :---- |
| **Publik (Tamu)** | Mahasiswa atau pihak luar kampus. | Membaca profil UKM, sejarah, dan melihat transparansi status eksekusi program kerja berikut dokumentasinya. |
| **Ketua** | Pimpinan tertinggi organisasi. | Monitoring seluruh program kerja divisi, grafik keuangan, agenda, evaluasi, dan rekapitulasi. |
| **Sekretaris** | Pengelola administrasi. | Pengelolaan database anggota, persuratan, notulensi rapat, presensi, dan arsip dokumen. |
| **Bendahara** | Pengelola keuangan. | Pencatatan arus kas, pelacakan iuran anggota, dan validasi bukti transaksi. |
| **Admin Divisi (Wakil Ketua)** | Kepala dari 4 bidang divisi (Humas, Penalaran, Riset, Pengabdian). | Mengelola program kerja divisinya, memperbarui status (Berjalan/Selesai), dan menginput tautan dokumentasi (Google Drive). |

### **4\. Struktur Halaman (Routing Architecture) \- Diperbarui**

Struktur aplikasi Next.js App Router dibagi menjadi zona Publik dan zona Dashboard.

#### **4.1 Zona Publik (Front-End)**

* / : Beranda (Hero Slider 3 detik, Ringkasan Visi Misi, Statistik, Highlight Proker).  
* /tentang : Detail sejarah (berdiri 20 April 2021), makna lambang, Trisakti, dan Tri Dharma Perguruan Tinggi.  
* /program-kerja : Katalog lengkap proker dengan sistem filter berdasarkan Divisi dan Status.

#### **4.2 Zona Autentikasi**

* /login : Form masuk satu pintu untuk seluruh pengurus (terotomatisasi pengecekan role).

#### **4.3 Zona Dashboard (Back-End Internal)**

* /dashboard/ketua/... : (Sesuai v1.0)  
* /dashboard/sekretaris/... : (Sesuai v1.0)  
* /dashboard/bendahara/... : (Sesuai v1.0)  
* **/dashboard/divisi** : Ringkasan proker khusus untuk divisi yang bersangkutan.  
* **/dashboard/divisi/proker** : Form CRUD proker, tombol "Centang Selesai", dan input *link* pratinjau & folder Google Drive.

### **5\. Arsitektur Database (Revisi Supabase DDL)**

Penyesuaian tipe data dan penambahan tabel/kolom untuk mengakomodasi integrasi publik.

#### **5.1 Tabel profiles (Update Role)**

\-- Penambahan role 'divisi'  
CREATE TYPE public.user\_role AS ENUM ('ketua', 'sekretaris', 'bendahara', 'divisi');

CREATE TABLE public.profiles (  
  id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL PRIMARY KEY,  
  full\_name TEXT,  
  email TEXT,  
  role public.user\_role NOT NULL DEFAULT 'divisi',  
  division\_name TEXT, \-- Khusus role 'divisi': 'Humas', 'Penalaran', 'Riset', 'Pengabdian'  
  created\_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL  
);

#### **5.2 Tabel programs (Pembaruan untuk Transparansi Publik)**

CREATE TABLE public.programs (  
  id UUID DEFAULT gen\_random\_uuid() PRIMARY KEY,  
  title TEXT NOT NULL,  
  description TEXT,  
  division\_name TEXT NOT NULL, \-- Harus cocok dengan nama di AD/ART  
  status TEXT DEFAULT 'Direncanakan', \-- 'Direncanakan', 'Berjalan', 'Selesai'  
  start\_date DATE,  
  end\_date DATE,  
  cover\_image\_url TEXT, \-- Link gambar pratinjau dari Google Drive (yang diubah URL-nya)  
  gallery\_drive\_url TEXT, \-- Link folder utama Google Drive untuk publik  
  created\_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now()) NOT NULL  
);

### **6\. Logika Integrasi Google Drive (Optimalisasi Penyimpanan)**

Untuk menekan biaya operasional penyimpanan *database* (Supabase/Vercel):

1. **Input Admin Divisi:** Saat menyelesaikan proker, admin mengunggah foto ke folder Google Drive milik UKM.  
2. **Format URL Sampul:** Admin menyalin *link view* satu foto terbaik. Sistem (melalui kode Next.js) akan mengubah URL https://drive.google.com/file/d/\[ID\]/view menjadi format direct render https://drive.google.com/uc?export=view\&id=\[ID\] sebelum disimpan ke *database* (cover\_image\_url).  
3. **Format URL Folder:** Link folder keseluruhan disimpan utuh di kolom gallery\_drive\_url.  
4. **Tampilan Publik:** Halaman website publik merender cover\_image\_url menggunakan elemen \<img/\>. Tombol CTA diarahkan ke gallery\_drive\_url pada tab baru (target="\_blank").

### **7\. Tahapan Pengembangan Lanjutan (Roadmap Terkini)**

Menggantikan *roadmap* v1.0, alur kerja diubah untuk memprioritaskan etalase publik:

* **Tahap 1 \- Setup Proyek & UI Publik:** Inisialisasi Next.js, implementasi Tailwind CSS berdasarkan desain.md, pembuatan *Hero Slider Component* (dengan logika pergeseran 3 detik dan tombol sentuh), serta pembuatan tata letak Beranda statis.  
* **Tahap 2 \- Skema Database Baru:** Eksekusi script SQL terbaru di Supabase, memasukkan *dummy data* untuk proker divisi agar bisa dites di tampilan publik.  
* **Tahap 3 \- Integrasi Publik & Database:** Melakukan *data fetching* dari Supabase ke halaman /program-kerja agar kartu-kartu proker muncul secara dinamis sesuai isi *database*.  
* **Tahap 4 \- Dashboard & Login Multirole:** Membangun halaman /login, middleware pengecekan *role*, dan kerangka *sidebar* khusus untuk 4 jenis akses (Ketua, Sekretaris, Bendahara, Divisi).  
* **Tahap 5 \- CRUD Divisi (Fokus Fitur Inti):** Pembuatan form input proker untuk role divisi, termasuk logika modifikasi URL Google Drive dan fitur "Centang Selesai".  
* **Tahap 6 \- CRUD Administrasi & Keuangan:** Mengerjakan fitur input anggota, surat, dan kas sesuai dengan rancangan v1.0 sebelumnya.  
* **Tahap 7 \- Dashboard Ketua & Export:** Pembuatan halaman rekapitulasi untuk Ketua, integrasi Recharts untuk keuangan, dan fitur *download* CSV.  
* **Tahap 8 \- Deployment & Uji Coba:** Pengunggahan seluruh kesatuan proyek ke Vercel, pengujian kecepatan gambar *direct link* Google Drive, dan rilis resmi.