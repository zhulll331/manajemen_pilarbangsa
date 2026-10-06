# Momen Pilar Bangsa

Section berada di Beranda (`src/app/(publik)/page.tsx`), tepat setelah `HeroSlider` dan sebelum `TimelineRoadmap`. Tautan **Lihat Arsip UKM** memakai rute existing `/arsip`. Komponen tidak bergantung pada Drive saat website ditayangkan dan tidak menambahkan dependensi npm.

## Foto dan penggantian aset

Delapan foto dari folder **Keperluan website pilar** telah diperiksa dalam ukuran penuh, dikoreksi orientasinya, dan dikonversi menjadi WebP maksimal 1280 px:

1. `20260822_103154.jpg`
2. `IMG_20260131_073634.jpg`
3. `20251213_091652.jpg`
4. `IMG_1228.HEIC.heif`
5. `IMG_20260502_093255.jpg`
6. `IMG_1339.HEIC.heif`
7. `20260110_102303.jpg`
8. `IMG20260418073938.jpg`

Salinan web ada di `src/assets/moments/`. File asli tetap utuh dan tersedia dalam paket `foto-asli-pilarbangsa.zip`. Ketiga HEIF dikonversi; `IMG_3453.webp` disimpan sebagai kandidat tambahan dan tidak ditampilkan.

Untuk mengganti foto, tambahkan WebP/JPG teroptimasi di folder aset, kemudian ubah import dan objek data di `src/data/pilarPhotos.ts`. Setiap entri mempunyai `id` unik, `src`, `alt`, `rotation`, dan `objectPosition`. Deskripsikan isi foto yang terlihat, tanpa menebak nama acara atau identitas orang. Nilai crop `objectPosition`, misalnya `50% 90%`, memakai koordinat CSS; periksa hasil persegi sesudah menggantinya. Static import menyediakan dimensi asli gambar untuk Next.js.

## Kecepatan dan interaksi

Default `speed` adalah **28 px/detik**. Untuk mengubahnya, gunakan `<PilarPhotoMarquee speed={26} />` pada Beranda. Komponen juga menerima prop `photos` untuk penggunaan ulang. Kecepatan dihitung dari lebar kelompok termasuk gap; durasi bukan angka tetap. `ResizeObserver` memperbarui ukuran dan jumlah salinan sesuai kebutuhan layar, dengan kemiringan identik pada setiap salinan.

Hover strip menjeda gerakan dan hover kartu memperbesar frame 1,04 kali. Gerakan dilanjutkan saat kursor meninggalkan strip. Sesuai revisi, tombol jeda/putar dihapus. Pada `prefers-reduced-motion`, animasi dimatikan dan hanya satu kelompok ditampilkan; strip dapat digeser dengan sentuhan, trackpad, atau tombol panah setelah mendapat fokus keyboard. Kelompok duplikat memakai `aria-hidden` dan alt kosong.

Foto memakai `next/image`, `object-fit: cover`, ukuran CSS 230 px pada desktop dan 170 px pada ponsel. `sizes` juga memperhitungkan rasio foto landscape supaya crop persegi tetap tajam. Permintaan gambar duplikat memakai cache browser yang sama. Frame, hover, dan gerakan strip memakai elemen terpisah.

## Pemeriksaan dan batasan

Pemeriksaan integrasi awal mencakup lebar 360, 768, 1440, dan 2560 px; pemuatan delapan aset; posisi hero → carousel → timeline; gerakan ke kiri; sambungan loop; kecukupan salinan dengan 1, 3, dan 8 foto; reduced motion; kontrol hero; menu ponsel; dan navigasi `/arsip`. Setelah revisi, diperiksa kembali bahwa tombol jeda/putar tidak ada, hover menjeda gerakan, gerakan berlanjut setelah kursor keluar, dan reduced motion tetap bekerja.

Overflow tablet yang berasal dari alamat email footer existing diperbaiki dengan satu kelas `break-all` pada tautan email. Konten dan tujuan tautannya tetap sama.

Preview menggunakan data publik existing melalui konfigurasi anon website, disimpan hanya di `.env.local` yang diabaikan Git. Paket perubahan tidak berisi konfigurasi atau kunci. Portal berita eksternal sempat timeout saat pengujian; fallback berita existing tetap tampil. Pemeriksaan fitur internal pengurus tidak dilakukan karena memerlukan sesi login.

Untuk menerbitkan perubahan ke `pilarbangsa.my.id`, gunakan alur deployment website existing setelah `npm run build` berhasil.
