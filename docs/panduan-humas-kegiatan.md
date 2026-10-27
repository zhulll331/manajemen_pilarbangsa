# Panduan Pengelolaan Pusat Kegiatan — Humas UKM Pilar Bangsa

Pusat Kegiatan adalah fasilitas resmi di website UKM Pilar Bangsa untuk membuat satu halaman khusus bagi setiap kegiatan organisasi (seperti Diklat, Seminar, Lomba, Pelatihan, dan Open Recruitment). Halaman ini menjadi wadah terpadu bagi peserta untuk mengakses formulir pendaftaran, tautan twibbon, caption media sosial, buku panduan, dan pengumuman terkait.

---

## 1. Mengakses Panel Pengelolaan Kegiatan

1. Login ke panel pengurus melalui halaman `/login`.
2. Pada bilah navigasi kiri (Sidebar), klik menu **"Kelola Kegiatan"** (ikon kalender).
3. Anda akan diarahkan ke halaman `/dashboard/humas/kegiatan`.

---

## 2. Membuat Kegiatan Baru

1. Klik tombol merah **"+ Buat Kegiatan"** di kanan atas.
2. Anda akan masuk ke halaman editor kegiatan.

### A. Mengisi Informasi Utama Acara (Section A)
- **Judul Kegiatan (Wajib):** Tuliskan nama resmi acara (maksimal 120 karakter). Contoh: `Diklat Kepemimpinan & Manajemen Organisasi 2026`.
- **Slug Tautan Publik (Wajib):** 
  - Terisi otomatis dari judul kegiatan saat pertama kali diketik.
  - Anda dapat mengubahnya saat masih berstatus **Draft**.
  - **Penting:** Setelah kegiatan diterbitkan (**Terbit**), slug akan dikunci otomatis demi menjaga kevalidan tautan yang telah disebarkan ke publik.
- **Ringkasan Singkat (Subtitle):** Teks 1–2 kalimat (maksimal 300 karakter) yang menggambarkan acara untuk pratinjau kartu dan media sosial.
- **Deskripsi Lengkap Acara:** Penjelasan detail acara, syarat peserta, latar belakang, atau hal penting lainnya.
- **URL Banner (HTTPS):** Masukkan tautan gambar banner/pamflet acara yang diawali dengan `https://`. Pratinjau gambar akan otomatis tampil.
- **Jadwal Pelaksanaan:** Pilih tanggal & jam mulai serta selesai (opsional).
- **Lokasi Pelaksanaan:** Cantumkan tempat kegiatan (misal: `Aula KH. Ahmad Dahlan / Online via Zoom`).

---

## 3. Menambahkan Item & Materi Kegiatan (Section C)

Anda bebas menambahkan item dalam jumlah berapa pun sesuai kebutuhan acara:

### A. Tautan (Tombol Eksternal)
- Klik tombol **"+ Tautan"**.
- Isi **Judul / Label Tombol** (contoh: `Formulir Pendaftaran Peserta Diklat`).
- Masukkan **URL Tautan** (wajib diawali `https://`, contoh Google Form, Twibbonize, Drive).
- Atur **Peran Tautan**:
  - **Tautan Biasa:** Selalu aktif dan dapat diklik.
  - **Tautan Pendaftaran:** Akan otomatis dinonaktifkan jika status pendaftaran ditutup atau segera dibuka.

### B. Teks / Caption Media Sosial
- Klik tombol **"+ Teks / Caption"**.
- Isi judul (contoh: `Caption Twibbon Instagram Resmi`).
- Tuliskan isi teks lengkap pada kolom konten (mendukung emoji, paragraf baru, dan hashtag).
- Centang opsi **"Sediakan tombol Salin Teks untuk pengunjung"** agar peserta dapat menyalin seluruh caption hanya dengan 1 kali klik.

### C. Judul Bagian (Pemisah / Section Header)
- Klik tombol **"+ Judul Bagian"**.
- Gunakan sebagai pemisah visual antar kategori materi (contoh: `Berkas & Panduan Kegiatan`, `Twibbon & Publikasi`).

### Mengatur Urutan dan Visibilitas Item
- Gunakan tombol panah **↑ (Naik)** dan **↓ (Turun)** pada sudut kanan kartu item untuk mengubah susunan tampilan.
- Hilangkan centang **"Tampilkan di halaman publik"** jika ingin menyembunyikan sementara materi tertentu tanpa menghapusnya.

---

## 4. Pengaturan Publikasi & Status (Section B)

Pada panel sebelah kanan:
1. **Status Halaman:**
   - **Draft:** Hanya dapat dilihat oleh pengurus di panel admin. Gunakan saat masih mempersiapkan materi.
   - **Terbit:** Halaman aktif dan dapat diakses langsung oleh masyarakat/peserta melalui alamat `/kegiatan/[slug]`.
   - **Arsip:** Digunakan ketika rangkaian acara telah berakhir. Halaman tetap dapat dibuka melalui tautan lama agar riwayat dan kenangan acara tidak hilang.
2. **Status Pendaftaran:**
   - **Tidak Berlaku / Tidak Ada:** Untuk kegiatan tanpa pendaftaran.
   - **Segera Dibuka:** Menampilkan badge biru dan menonaktifkan tombol formulir pendaftaran.
   - **Pendaftaran Dibuka:** Menampilkan badge hijau dan mengaktifkan tombol pendaftaran.
   - **Pendaftaran Ditutup:** Menampilkan badge merah dan mengunci tombol pendaftaran.
3. **Sorotan Utama di Beranda:**
   - Centang opsi ini jika ingin menampilkan acara di kartu sorotan halaman utama (Beranda) website.
   - Sistem secara otomatis memastikan **hanya ada 1 kegiatan sorotan** yang aktif dalam satu waktu.

---

## 5. Menyimpan Data

- Klik **"Simpan Draft"** untuk menyimpan progres tanpa membuka akses ke publik.
- Klik **"Publikasikan"** ketika seluruh data siap ditampilkan.
- **Pencegahan Konflik:** Jika rekan pengurus lain memperbarui kegiatan yang sama pada saat yang bersamaan, sistem akan mendeteksi perbedaan versi dan meminta Anda memuat ulang form agar data tidak saling tertimpa.


---

## 6. Mengelola Kampanye Twibbon Resmi (`/dashboard/humas/twibbon`)

Selain menautkan halaman kegiatan, Humas (dan Ketua sebagai cadangan) dapat mengelola modul **Twibbon Pilar Bangsa** internal agar peserta tidak perlu berpindah ke layanan pihak ketiga yang penuh iklan:

1. Buka menu **"Kelola Twibbon"** di sidebar kiri (`/dashboard/humas/twibbon`).
2. Untuk kegiatan **Diklat Kepemimpinan 2026**, klik tombol **"Siapkan Draft Diklat 2026"** untuk membuat draft kampanye `/twibbon/diklat-kepemimpinan-2026` secara otomatis beserta template caption umum & personal.
3. **Unggah Bingkai PNG Transparan (1080×1080 px):**
   - File wajib berformat PNG statis, dimensi tepat `1080 × 1080` piksel, ukuran maksimal `5 MiB`, dan memiliki area transparan untuk foto peserta.
   - Panel admin menyediakan **Pratinjau Area Transparan (Checkerboard)** dan **Simulasi Foto Peserta** untuk memastikan area wajah tidak tertutup elemen bingkai.
4. **Template Caption Resmi:**
   - **Template Caption Umum (`caption_default`):** Digunakan saat peserta tidak mengisi Nama atau Program Studi (tidak boleh menyisakan token `{{...}}`).
   - **Template Caption Personal (`caption_template`):** Digunakan otomatis saat peserta mengisi Nama Lengkap (`{{nama}}`) dan Program Studi (`{{prodi}}`).
5. **Pratinjau Privat & Publikasi Atomik:**
   - Gunakan tombol **"Pratinjau Privat Draft"** untuk menguji editor twibbon sebelum dibuka ke publik.
   - Klik **"Publikasikan Kampanye"** untuk menerbitkan revisi immutable ke `/twibbon/[slug]`.
6. **Mengalihkan Kartu "Twibbon Diklat" di Halaman Kegiatan:**
   - Setelah kampanye berstatus `Published`, gunakan tombol **"Arahkan Kartu Kegiatan ke /twibbon/[slug]"** di dalam editor Twibbon untuk mengganti tautan kartu Twibbon di halaman Kegiatan ke URL internal. Tersedia pula tombol **Rollback ke Cadangan (twb.nz)** bila diperlukan.
