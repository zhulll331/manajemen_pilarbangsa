# Desain ruang pengurus

Tema admin menggunakan putih hangat, merah Pilar Bangsa, hijau, dan aksen kuning dari website publik. `src/app/dashboard/dashboard.css` membatasi semua aturan dengan `.admin-shell`, sehingga halaman publik tidak ikut berubah. Sidebar menampilkan ikon pada desktop, dapat diperluas, dan menjadi drawer berlabel pada mobile. Daftar menu mengikuti peran yang sudah ada; pencarian header hanya mencari menu yang tersedia bagi peran tersebut.

## Ringkasan kehadiran

- Dashboard ketua dan sekretaris menampilkan ringkasan anggota berstatus `Aktif` dan pengurus berstatus `Pengurus Aktif`.
- Persentase = jumlah catatan `Hadir` / jumlah catatan `Hadir`, `Izin`, `Sakit`, dan `Alpa` × 100, dibulatkan ke satu desimal.
- Periode mencakup seluruh catatan dengan tanggal agenda hingga hari ini menurut Asia/Jakarta. Agenda mendatang, tanggal kosong, referensi anggota/agenda yang sudah dihapus, serta status kosong/tidak dikenal tidak dihitung.
- Angka ini adalah proporsi **catatan presensi**, bukan persentase orang yang aktif atau ukuran kelengkapan pengisian. Kelompok mengikuti status anggota saat ini.
- Data kosong ditampilkan sebagai tanda pisah. Kegagalan query menampilkan status tidak tersedia, bukan 0%.
- Query menggunakan client Supabase pengguna dan RLS yang sama, dengan exact HEAD count sehingga tidak terpotong batas jumlah baris.
- Pada halaman presensi, ringkasan mengikuti agenda, filter anggota, dan pilihan status saat ini. Perubahan harus disimpan melalui tombol yang sudah ada untuk memperbarui dashboard.

Penambahan ini bersifat baca saja. Skema database, autentikasi, pembatasan peran, fungsi penyimpanan, ekspor, AI, serta unggahan tetap menggunakan implementasi sebelumnya.

## Validasi

`npm run build`, `npx tsc --noEmit`, dan `node --test tests/attendance.test.mjs` (Node 24 yang tersedia pada lingkungan ini). Pengujian unit meliputi pembagi nol, error query, ketidakkonsistenan jumlah, filter anggota, dan status belum diisi.

Pemeriksaan browser terisolasi menggunakan komponen asli dan data contoh untuk empat peran, sidebar, pencarian menu, dialog anggota, kedua halaman presensi, mobile, dan reduced motion. Tidak ada data contoh yang dimasukkan ke aplikasi atau database. Pemeriksaan HTTP aplikasi sebenarnya memverifikasi login 200 serta pengalihan pengguna tanpa sesi dari dashboard ke login. Operasi end-to-end dengan sesi pengurus dan query presensi terhadap data privat belum diuji.

Koneksi Supabase juga diuji langsung dengan binding URL dan public key yang tersedia di lingkungan. Empat exact HEAD query untuk total/hadir anggota dan pengurus berhasil merespons HTTP 200, termasuk relasi `attendance → members/agendas`. Pengujian tanpa sesi menghasilkan nol catatan sesuai RLS; hasil tersebut tidak membuktikan isi presensi privat kosong. Komponen produksi menggunakan sesi pengguna dari cookie melalui client server yang sudah ada. Penyimpanan presensi tetap melakukan revalidasi layout dashboard, sehingga ringkasan dibaca ulang setelah perubahan disimpan.
