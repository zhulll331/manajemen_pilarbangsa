# PRD Fitur Twibbon Pilar Bangsa

Versi 1.0 • 27 Oktober 2026 • Zona waktu Asia/Jakarta

Pemilik produk: Firdausi Nuzula dan pengurus UKM Pilar Bangsa Untag Banyuwangi. Sasaran pembaca: pemilik website, pengembang, dan asisten AI coding. Status: spesifikasi usulan siap dipakai untuk implementasi setelah pemeriksaan repositori. Dokumen ini menyusun kebutuhan produk dan rancangan teknis, bukan hasil audit kode atau implementasi yang sudah diuji.

## 1 Ringkasan keputusan produk

Tambahkan modul **Twibbon Pilar Bangsa** di website https://www.pilarbangsa.my.id/. Peserta membuka tautan kegiatan, memilih foto dari perangkat, menggeser dan memperbesar foto di balik bingkai resmi, mengunduh gambar, lalu menyalin caption untuk diposting sendiri. Panitia mengelola kampanye, bingkai, caption, dan publikasi melalui panel admin yang mengikuti sistem akses website saat ini.

Rilis pertama melayani Diklat Kepemimpinan Periode 2026/2027 pada **Minggu, 1 November 2026**, dengan fondasi yang dapat digunakan kembali untuk acara UKM berikutnya. Tanggal acara ini terkonfirmasi pada halaman publik saat pemeriksaan. Jam acara dan batas akhir penggunaan twibbon belum ditetapkan dalam dokumen ini.

Keputusan utama:

- Peserta tidak perlu login, membayar, atau mengisi NIM dan nomor WhatsApp.
- Foto peserta dan gambar hasil diproses di browser; tidak dikirim ke backend, layanan AI, penyimpanan awan, atau galeri publik.
- Admin mengunggah PNG transparan hasil desain di luar website. Website menyediakan editor posisi foto, bukan aplikasi desain bingkai.
- Rilis pertama mendukung satu bingkai aktif per kampanye dan beberapa kampanye untuk kegiatan berbeda.
- Format keluaran wajib PNG 1080 × 1080 piksel. Format potret 1080 × 1350 dan Story masuk pengembangan berikutnya.
- Pendaftaran, unggahan bukti, dan grup WA tetap menjadi alur tersendiri. Mengunduh twibbon tidak otomatis mendaftarkan peserta atau membuktikan bahwa foto telah diposting.
- Gunakan stack, autentikasi, komponen, dan desain website yang sudah ada. Jangan mengganti aplikasi atau basis data hanya untuk menambahkan fitur ini.

## 2 Dasar analisis dan batas kepastian

Analisis dilakukan pada 27 Oktober 2026 melalui halaman publik Twibbonize, kampanye Diklat yang sedang digunakan, Pusat Bantuan resmi Twibbonize, serta tampilan langsung beranda dan halaman kegiatan Pilar Bangsa. Dokumentasi MDN dan Supabase dipakai untuk menegaskan batas teknis browser dan kontrol akses. Referensi lengkap ada pada bagian 25.

Tidak dilakukan login admin, pengunggahan foto pribadi, pengambilan kode sumber repositori, pemeriksaan skema basis data, atau pengujian unduh lintas perangkat. Fitur yang dijelaskan dokumentasi dibedakan dari kondisi yang benar-benar terlihat di halaman publik. Seluruh angka kinerja dan kapasitas di bawah adalah target usulan, bukan hasil pengukuran website.

### 2.1 Temuan Twibbonize

| Aspek | Temuan publik atau dokumentasi resmi | Keputusan untuk Pilar Bangsa |
| --- | --- | --- |
| Alur pendukung | Dokumentasi menjelaskan pemilihan foto, pengaturan posisi, zoom, rotasi, dan unduh ulang [R3] | Ambil alur dasar yang mudah dipahami; sediakan pemulihan unduh |
| Pengelolaan kampanye | Kreator mengatur desain, judul, deskripsi, tautan, caption, dan thumbnail [R4] | Admin UKM mengelola data yang sama sesuai kebutuhan organisasi |
| Caption personal | Caption dapat memiliki isian kustom [R5] | Dua token awal, nama dan prodi, diolah lokal |
| Bingkai | Panduan menyebut PNG transparan, maksimum 5 MB, rekomendasi 1080 × 1080 [R6] | Tetapkan batas internal secara eksplisit pada bagian 10 |
| Galeri | Publikasi hasil ke galeri memerlukan tindakan tersendiri; unggahan dapat dilihat publik [R7] | Galeri tidak masuk rilis pertama |
| Berbagi | Panduan mengarahkan pendukung memposting hasil melalui aplikasi sosial pilihannya [R8] | Unduh, salin caption, dan berbagi sistem jika tersedia |
| Kampanye Diklat aktif | Terlihat bingkai merah, logo, maskot, judul kampanye, galeri, dan area iklan [R2] | Pakai aset resmi milik UKM tanpa iklan pihak ketiga |

Inti yang relevan adalah mekanisme kampanye → foto peserta → hasil siap bagikan. Identitas Twibbonize, marketplace template, akun kreator umum, monetisasi, papan peringkat, dan jaringan sosial tidak diperlukan untuk tujuan Diklat. Logo, ikon, teks, dan aset pihak ketiga tidak disalin.

### 2.2 Temuan website Pilar Bangsa

Tampilan langsung memperlihatkan header dengan logo Universitas dan UKM, latar putih, tipografi gelap, aksen merah, garis warna pada bagian atas, kartu bersudut membulat, serta menu Beranda, Tentang Kami, Kegiatan, Program Kerja, dan Arsip UKM. Fitur baru harus mengikuti komponen dan token desain tersebut, dengan nilai warna dan ukuran pasti diambil dari kode saat implementasi.

Halaman kegiatan sudah memuat:

1. Tanggal 1 November 2026 dan lokasi Mondoluko Farm, Desa Taman Suruh.
2. Formulir pendaftaran Google Forms.
3. Tautan twibbon eksternal https://twb.nz/diklatukmpilarbangsa2026 yang beralih ke kampanye Twibbonize.
4. Tautan Drive untuk unggahan bukti dan tautan grup WhatsApp.
5. Keterangan penutupan pendaftaran 20 Oktober 2026 sementara status halaman masih menyebut pendaftaran dibuka.

Poin 5 perlu pemeriksaan isi oleh panitia. Pengembang tidak boleh menebak tanggal penutupan baru atau menutup pendaftaran otomatis berdasarkan teks lama. Hasil indeks pencarian sempat memperlihatkan tanggal acara 20 September; tampilan langsung sudah menunjukkan 1 November. Anggap tampilan langsung sebagai temuan utama dan periksa metadata SEO pada tahap peluncuran.

Teks publik website menyebut Supabase. Ini merupakan indikasi integrasi, **bukan verifikasi stack, skema, framework, maupun kebijakan akses**. Semua rancangan Supabase pada dokumen ini bersifat kondisional sampai repositori diperiksa.

## 3 Masalah pengguna dan tujuan

Peserta saat ini berpindah ke layanan eksternal untuk membuat twibbon. Panitia membutuhkan satu tujuan resmi untuk membagikan bingkai, caption, dan informasi acara, sambil mempertahankan identitas Pilar Bangsa. Pengelolaan di website sendiri juga memungkinkan kampanye berikutnya dibuat tanpa mengubah kode berulang kali.

Tujuan rilis pertama adalah peserta dapat menghasilkan twibbon dari ponsel dengan sedikit langkah, hasil foto konsisten dengan bingkai resmi, dan panitia dapat mempublikasikan kampanye tanpa meminta pengembang mengganti berkas secara manual. Foto tetap berada di perangkat peserta.

| Ukuran keberhasilan | Target usulan | Cara menilai |
| --- | --- | --- |
| Penyelesaian tugas | Sedikitnya 9 dari 10 orang pada uji kegunaan berhasil membuat dan menyimpan hasil tanpa bantuan | Uji teramati pada campuran ponsel dan laptop |
| Waktu penggunaan | Median ≤ 90 detik setelah foto dipilih | Uji kegunaan; waktu memilih foto dari galeri dikecualikan |
| Keandalan ekspor | ≥ 95 persen percobaan uji valid menghasilkan Blob PNG | Matriks perangkat dan berkas uji; bukan klaim produksi |
| Kesesuaian keluaran | Seluruh keluaran uji tepat 1080 × 1080 dengan bingkai utuh | Pemeriksaan dimensi dan pembandingan gambar |
| Kemudahan admin | Panitia dapat membuat dan menerbitkan kampanye dalam ≤ 10 menit dengan aset siap | Skenario uji admin |
| Privasi foto | Tidak ada byte foto, nama berkas, EXIF, nama peserta, atau caption personal pada permintaan jaringan aplikasi | Pemeriksaan jaringan selama seluruh alur |

Jumlah orang yang benar-benar memposting tidak dapat diukur dari tombol unduh. Bukti posting tetap mengikuti prosedur panitia.

## 4 Pengguna dan kewenangan

| Pengguna | Kebutuhan | Hak akses |
| --- | --- | --- |
| Peserta Diklat | Membuat foto dan caption dengan cepat dari HP | Membaca kampanye publik, mengolah foto lokal, mengunduh, berbagi |
| Pengunjung umum | Menemukan kampanye resmi dan informasi acara | Hak publik yang sama; tidak wajib terdaftar Diklat |
| Admin kampanye | Mengelola bingkai dan konten resmi | CRUD draft, pratinjau, publikasi, arsip, lihat statistik sesuai izin |
| Admin organisasi | Mengendalikan akses pengelola | Kewenangan admin kampanye dan pengaturan role melalui mekanisme lama |

Role di atas adalah kapabilitas konseptual, bukan perintah membuat sistem akun baru. Petakan ke role/permission yang sudah ada. Akun anggota biasa tidak otomatis menjadi admin. Pengecekan akses wajib terjadi di server atau kebijakan basis data, bukan hanya pada menu.

## 5 Ruang lingkup dan prioritas

### 5.1 Wajib sebelum peluncuran

| ID | Kemampuan | Prioritas |
| --- | --- | --- |
| P01 | Halaman kampanye dengan tautan langsung dan informasi acara | P0 |
| P02 | Pilih foto lokal JPEG, PNG, WebP yang dapat didekode browser | P0 |
| P03 | Geser, zoom, rotasi per 90 derajat, reset, dan ganti foto | P0 |
| P04 | Pratinjau identik dengan hasil PNG 1080 × 1080 | P0 |
| P05 | Unduh dan unduh ulang dengan fallback pratinjau gambar | P0 |
| P06 | Caption template, personalisasi lokal opsional, salin caption | P0 |
| P07 | Salin tautan dan berbagi berkas jika didukung perangkat | P0 |
| P08 | Daftar kampanye sederhana di /twibbon dan integrasi halaman kegiatan | P0 |
| A01 | CRUD draft, unggah dan validasi bingkai, pratinjau admin | P0 |
| A02 | Publikasi atomik, arsip, role admin, dan pencatatan perubahan | P0 |
| Q01 | Penanganan gagal, aksesibilitas dasar, privasi, dan uji lintas perangkat | P0 |

P0 adalah syarat rilis, bukan sekadar daftar keinginan. P1 dan P2 tidak boleh menghambat penyelesaian P0.

### 5.2 Pengembangan sesudah alur inti stabil

P1: statistik agregat admin, QR tautan kampanye, duplikasi kampanye, beberapa pilihan bingkai, format 1080 × 1350 dengan rasio **4:5**, dan pemilihan masa tayang otomatis. Rasio ini tidak sama dengan 3:4. Dukungan format baru harus menyesuaikan renderer dan pengujian, bukan hanya mengubah ukuran CSS.

P2: Story 1080 × 1920, nama pada gambar, preset posisi per bingkai, galeri dengan izin publikasi dan moderasi, bukti posting internal, serta dukungan HEIC melalui jalur pemrosesan lokal yang tervalidasi.

Di luar lingkup: penghapus latar AI, filter kecantikan, pengenalan wajah, edit desain seperti Canva, GIF/video, layanan twibbon untuk kreator umum, pembayaran, iklan, leaderboard, akun peserta, dan publikasi otomatis ke Instagram. Hal-hal tersebut belum dibutuhkan untuk menyelesaikan masalah rilis pertama.

## 6 Struktur halaman dan integrasi

Semua rute berikut adalah **rute usulan yang belum dibuat**. Sesuaikan nama rute admin dengan router yang sudah digunakan.

| Rute | Isi dan perilaku |
| --- | --- |
| /twibbon | Kampanye published yang aktif; arsip dapat tampil di bagian terpisah berlabel jelas |
| /twibbon/:slug | Detail, editor foto, hasil, caption, dan tautan kegiatan |
| /admin/twibbon | Daftar kampanye, status, waktu perubahan, tindakan sesuai hak |
| /admin/twibbon/new | Form draft baru |
| /admin/twibbon/:id/edit | Edit draft, preview, publish, archive |

Slug awal yang diusulkan: `diklat-kepemimpinan-2026`. Tautan publik nantinya berada di domain Pilar Bangsa; jangan menyebutnya sudah aktif sebelum diterbitkan.

Integrasi wajib:

1. Pada halaman kegiatan Diklat, kartu Twibbon Diklat diarahkan ke kampanye internal saat fitur dan kampanye sudah siap.
2. Jika sumber halaman kegiatan berasal dari tabel tautan/materi, ubah record terkait melalui mekanisme lama. Hindari hardcode URL yang hanya bekerja pada satu halaman.
3. Beranda menampilkan ajakan “Pasang Twibbon Diklat” di konteks sorotan acara. Menu Twibbon ditambahkan tanpa mengacaukan navigasi ponsel.
4. Halaman hasil menyediakan “Lihat Info dan Pendaftaran” menuju halaman kegiatan, bukan membuat formulir baru.
5. Halaman kegiatan tetap menjadi sumber tanggal dan lokasi jika data relasinya tersedia. Jika belum tersedia, isian kampanye harus diverifikasi panitia dan tidak diduplikasi otomatis dari teks yang belum benar.
6. Bukti unggahan dan grup WA tidak ditampilkan sebagai langkah otomatis “selesai daftar” setelah unduh. Tampilkan instruksi terpisah dari data resmi kegiatan.

## 7 Perjalanan pengguna

### 7.1 Peserta dari tautan WhatsApp

Peserta membuka /twibbon/diklat-kepemimpinan-2026. Halaman menampilkan judul, identitas resmi, tanggal, preview bingkai, petunjuk tiga langkah, dan tombol “Pilih Foto”. Setelah foto dipilih, editor muncul dengan wajah/foto di belakang bingkai. Peserta menggeser, zoom, atau memutar, lalu memilih “Buat Twibbon”. Sistem menghasilkan Blob PNG secara lokal dan membuka tampilan hasil. Peserta menekan “Unduh PNG”, menyalin caption, dan memposting melalui aplikasi pilihannya.

Nama dan prodi hanya ditawarkan untuk caption. Kedua isian opsional dan tidak boleh menghalangi unduh. Hasil bisa diunduh berkali-kali tanpa memilih foto ulang. “Edit Lagi” kembali ke editor dengan transformasi sebelumnya. Refresh menghapus foto dari sesi; halaman menjelaskan bahwa foto harus dipilih ulang.

### 7.2 Panitia membuat kampanye

Admin login melalui sistem lama, membuka modul Twibbon, mengisi judul dan slug, menghubungkan kegiatan, mengunggah bingkai transparan dan thumbnail, lalu menyusun caption. Sistem memvalidasi file dan menampilkan simulasi foto contoh yang tidak mengandung foto peserta. Admin menyimpan draft, memeriksa preview, dan menerbitkan kampanye. URL publik baru dapat dipakai setelah seluruh aset serta snapshot publik berhasil disimpan.

Mengubah judul, caption, atau bingkai pada kampanye aktif membuat perubahan draft. Konten yang terlihat peserta tetap versi terakhir terbit sampai admin menerbitkan perubahan. Admin dapat mengarsipkan kampanye tanpa menghapus tautan historis.

## 8 Spesifikasi layar dan interaksi

### 8.1 Halaman daftar

Judul “Twibbon Pilar Bangsa”, deskripsi satu kalimat, dan kartu kampanye berisi thumbnail, judul, tanggal kegiatan jika ada, serta status. Urutkan kampanye aktif terbaru di atas. Satu kampanye cukup ditampilkan tanpa kolom pencarian atau filter kompleks. Empty state: “Belum ada twibbon yang tersedia. Cek lagi nanti, ya.” Jangan menampilkan draft dalam HTML, JSON publik, atau hasil pencarian.

### 8.2 Halaman kampanye

Pada desktop gunakan dua kolom: preview/editor di kiri; judul, ringkasan, petunjuk, dan aksi di kanan. Pada ponsel gunakan satu kolom dengan judul pendek, editor, kontrol, aksi, dan informasi lanjutan. Preview harus muat pada lebar 320 piksel tanpa scroll horizontal.

Sediakan langkah “Pilih foto → Sesuaikan → Unduh dan bagikan”. Aksi utama hanya satu per tahap. Header/footer mengikuti website; editor tidak mengubah bentuk, logo, atau proporsi bingkai. Tombol unduh tidak boleh tertutup sticky navigation maupun keyboard virtual.

### 8.3 Kontrol editor

- Drag mouse atau satu jari untuk menggeser; pinch dua jari untuk zoom pada area editor.
- Slider zoom dengan label dan nilai; tombol perbesar/perkecil sebagai alternatif gesture.
- Tombol putar kiri dan kanan per 90 derajat.
- Tombol arah atas/bawah/kiri/kanan untuk penyesuaian tanpa drag; panah keyboard saat area editor fokus.
- “Atur Ulang” mengembalikan center cover, zoom 1×, rotasi 0; “Ganti Foto” membuka pemilih berkas tanpa langsung menghilangkan foto lama bila dibatalkan.
- Gesture editor tidak mematikan scroll seluruh halaman. Pembatasan touch-action hanya berlaku pada permukaan editor.
- Preview checkerboard hanya untuk panel validasi bingkai admin; checkerboard tidak boleh ikut terunduh.

### 8.4 Halaman hasil

Tampilkan gambar hasil, “Unduh PNG”, “Unduh Lagi” setelah percobaan pertama, “Edit Lagi”, dan “Bagikan Foto” jika didukung. Sediakan caption dalam textarea read-only yang dapat dipilih dan tombol “Salin Caption”. Tautan “Bagikan Link Twibbon” dibedakan dari berbagi file foto. Letakkan info acara dan bantuan simpan gambar di bawah aksi utama.

Jangan menulis “Sudah tersimpan di galeri” karena browser tidak selalu bisa memastikan lokasi penyimpanan. Gunakan “Unduhan dimulai. Jika belum terlihat, cek folder Unduhan atau buka pratinjau gambar.”

## 9 Kebutuhan fungsional terperinci

| ID | Aturan wajib | Kriteria penerimaan utama |
| --- | --- | --- |
| F01 | Kampanye publik memakai slug unik | Slug valid membuka kampanye terbit; slug tidak dikenal mengembalikan halaman 404 |
| F02 | Peserta tanpa login | Mode incognito bisa menyelesaikan alur sampai unduh |
| F03 | Pemilih foto lokal | Tidak ada request pengunggahan saat memilih atau mengganti foto |
| F04 | Validasi input berkas | Tipe, ukuran, dimensi, dan decode diperiksa; error memberi tindakan pemulihan |
| F05 | Orientasi foto dinormalisasi sekali | JPEG EXIF portrait tidak miring atau terputar dua kali |
| F06 | Transformasi stabil | Resize viewport tidak menggeser komposisi; frame tetap diam |
| F07 | Bingkai selalu di lapisan teratas | Foto tidak pernah menutupi logo/teks bingkai |
| F08 | Hasil sesuai preview | Geometri crop, rotasi, dan zoom sama pada preview dan PNG |
| F09 | Ekspor resolusi tetap | Hasil tepat 1080 × 1080, image/png, tanpa UI editor dan watermark tambahan |
| F10 | Blob hasil dipakai ulang | Unduh ulang tidak membutuhkan server atau pemilihan foto ulang |
| F11 | Caption token terbatas | Token dikenal diganti lokal; token asing ditolak saat publish |
| F12 | Salin memiliki fallback | Jika Clipboard API gagal, caption tetap dapat dipilih dan disalin manual |
| F13 | Berbagi menyesuaikan perangkat | File share hanya muncul bila didukung; batal share tidak menjadi kegagalan pembuatan |
| F14 | Arsip dapat dibaca | Kampanye arsip menampilkan informasi dan status, tanpa memulai editor baru |
| F15 | Draft tidak publik | Request anonim tidak dapat membaca data draft atau mengambil file draft |
| F16 | Admin memerlukan otorisasi | Non-admin gagal membaca endpoint admin maupun memodifikasi record langsung |
| F17 | Penggantian aset berversi | Sesi yang sudah terbuka memakai revisi sama hingga pengguna memuat ulang |
| F18 | Publikasi tidak setengah jadi | Frame hilang atau gagal validasi mencegah publish; versi publik lama tetap utuh |
| F19 | Hubungan kegiatan jelas | Halaman kegiatan menautkan kampanye internal; twibbon tidak menjadi bukti registrasi |
| F20 | Gangguan statistik tidak menghambat | Editor dan unduh tetap berfungsi ketika endpoint statistik gagal atau diblokir |

## 10 Kontrak gambar dan renderer

### 10.1 Aset admin

Rilis pertama hanya menerima PNG statis berukuran tepat 1080 × 1080, maksimum **5 MiB atau 5.242.880 byte**. Ini batas produk yang dipilih, bukan penyalinan persis satuan batas layanan pembanding. Tolak JPEG, SVG, GIF, APNG animasi, WebP frame, file rusak, serta ekstensi palsu. Validasi byte/magic number dan decode di server; atribut accept pada input saja tidak cukup.

Bingkai harus memiliki area transparan yang nyata dan elemen desain yang terlihat. Tolak PNG sepenuhnya opak dan PNG sepenuhnya transparan. PNG hanya dengan transparansi tepi yang sangat kecil diberi peringatan dan wajib lolos preview foto contoh; keberadaan satu piksel transparan bukan bukti desain siap pakai. Pemeriksaan visual admin terhadap ruang wajah tetap wajib.

Thumbnail dibedakan dari file bingkai mentah. Admin mengunggah thumbnail publik tanpa data peserta, idealnya contoh berisi ilustrasi netral milik UKM. Header/logo resmi dipertahankan di dalam aset desain. Sistem tidak membuat ulang bingkai dari screenshot Twibbonize; panitia menyediakan PNG sumber yang berhak digunakan.

### 10.2 Foto peserta

| Parameter | Aturan rilis pertama |
| --- | --- |
| Format | JPEG, PNG statis, WebP statis yang bisa didekode browser |
| Ukuran berkas | Maksimum 15 MiB atau 15.728.640 byte |
| Dimensi sumber | Kedua sisi ≥ 200 piksel; maksimum 48 megapiksel dan sisi terpanjang 12.000 piksel |
| Peringatan kualitas | Dimensi salah satu sisi < 1080 memunculkan pemberitahuan potensi buram, bukan penolakan otomatis |
| Normalisasi kerja | Turunkan sisi terpanjang menjadi maksimum 2560 piksel setelah orientasi dinormalisasi; jangan memperbesar sumber kecil |
| HEIC dan HEIF | Belum dijamin; minta peserta mengonversi lokal ke JPG/PNG jika browser tidak dapat membukanya |
| Animasi | Tidak didukung; tolak input animasi jika terdeteksi, jangan menjanjikan hasil animasi |

Batas dimensi perlu diperiksa sedini mungkin dengan pembaca header yang aman; ukuran terkompresi kecil tidak menjamin penggunaan memori kecil. Decode dapat tetap gagal karena kemampuan perangkat. Tangani exception, bebaskan alokasi, dan minta foto lebih kecil tanpa menurunkan resolusi ekspor wajib secara diam-diam.

### 10.3 Koordinat dan komposisi

Gunakan satu fungsi renderer untuk preview dan ekspor, dengan koordinat logis berdasarkan kanvas keluaran W=1080 dan H=1080. Simpan transformasi dalam ruang koordinat logis, bukan koordinat CSS. Konversikan delta pointer ke ruang logis menggunakan ukuran aktual area preview; perubahan layout tidak boleh mengubah hasil.

Urutan gambar: isi latar putih → gambar foto yang sudah dinormalisasi dan ditransformasi → gambar frame di koordinat (0,0,W,H). Jangan memutar frame, mengubah aspek rasionya, atau memasukkan tombol editor dalam ekspor. Transparansi sumber foto dipadukan di atas latar putih agar tidak menghasilkan area tak terduga.

Untuk rotasi θ dalam {0,90,180,270}, hitung dimensi foto efektif Iw' dan Ih' dengan menukar lebar/tinggi pada 90 dan 270. Skala minimum `s0=max(W/Iw', H/Ih')`; skala akhir `s=s0*z` dengan zoom z=1 sampai 4. Awali foto di pusat kanvas. Batasi perpindahan pusat dengan `abs(tx) ≤ (Iw'*s-W)/2` dan `abs(ty) ≤ (Ih'*s-H)/2`. Dengan rotasi per 90 derajat, aturan ini memastikan foto tetap menutup kanvas. Saat diputar, hitung ulang cover dan clamp offset; bentuk transformasi dan titik pusat harus sama pada preview serta ekspor.

Rilis pertama menggunakan cover seluruh kanvas sebagai kompromi kesederhanaan dan konsistensi. Tidak ada pengaturan lubang wajah otomatis atau deteksi wajah. Jika uji pada bingkai Diklat menunjukkan kebutuhan zoom-out yang lebih luas, tambahkan photo viewport terkonfigurasi sebagai P1 dengan aturan cover dan pengujian baru; jangan mengizinkan ruang kosong tanpa keputusan desain.

Pratinjau boleh dirender dengan resolusi lebih rendah untuk kelancaran. Ekspor menggunakan canvas mandiri tepat 1080 × 1080 dengan `toBlob('image/png')`, bukan screenshot DOM atau tangkapan canvas CSS. Pastikan frame dan foto selesai dimuat sebelum render. Gunakan Blob URL dan cabut URL saat tidak diperlukan, tanpa mencabutnya sebelum browser selesai memakai pratinjau atau unduhan.

### 10.4 Aset lintas origin

Utamakan aset frame yang dapat dipakai canvas dari origin website. Jika memakai storage/CDN berbeda origin, atur CORS yang benar dan `crossOrigin='anonymous'` sebelum memuat image. Jangan bergantung pada “gambar tampil” sebagai bukti file dapat diekspor: canvas yang tercemar dapat menggagalkan `toBlob` [R9]. Preview admin dan pemeriksaan publish harus menjalankan ekspor percobaan menggunakan delivery URL produksi.

## 11 Caption dan berbagi

Caption disimpan sebagai teks biasa, maksimum 2.000 karakter. Hanya token `{{nama}}` dan `{{prodi}}` yang didukung pada rilis pertama. Input nama maksimal 80 karakter dan prodi maksimal 100 karakter; keduanya dipangkas di tepi, tanpa HTML, dan tidak diteruskan ke URL, statistik, atau backend. Token tidak dikenal atau sintaks tidak lengkap ditolak ketika admin mempublikasikan.

Jika kedua isian lengkap, gunakan template personal. Jika salah satu kosong, gunakan caption umum utuh yang disediakan admin, sehingga tidak ada token tersisa atau kalimat janggal. Sediakan preview kedua varian di admin. Personalisasi memengaruhi caption saja, bukan tulisan dalam gambar.

Contoh isi awal yang harus ditinjau panitia:

```text
Caption umum
Siap belajar, bertumbuh, dan mengambil peran bersama UKM Pilar Bangsa!
Sampai bertemu di Diklat Kepemimpinan pada 1 November 2026.
@ukmpilarbangsa
#DiklatPilarBangsa2026 #UKMPilarBangsa #UntagBanyuwangi

Caption personal
Saya {{nama}} dari {{prodi}}, siap belajar dan mengambil peran bersama UKM Pilar Bangsa!
Sampai bertemu di Diklat Kepemimpinan pada 1 November 2026.
@ukmpilarbangsa
#DiklatPilarBangsa2026 #UKMPilarBangsa #UntagBanyuwangi
```

Perilaku berbagi:

1. “Salin Caption” menggunakan Clipboard API bila tersedia, dengan fallback teks terpilih.
2. “Salin Link Twibbon” menyalin URL kampanye, bukan foto lokal atau Blob URL.
3. “Bagikan Foto” memeriksa `navigator.canShare({files})` dan memanggil `navigator.share` dari klik pengguna [R10]. Persiapkan Blob terlebih dahulu agar pemrosesan panjang tidak menghabiskan aktivasi pengguna.
4. Perangkat yang tidak mendukung file share tetap menyediakan unduh dan salin caption.
5. Tombol WhatsApp khusus membagikan teks atau URL kampanye. Tautan WhatsApp tidak otomatis melampirkan berkas foto lokal.
6. Tidak menjanjikan auto-post ke Instagram atau caption selalu ikut tersalin ke setiap aplikasi. Berikan petunjuk posting manual.
7. Membatalkan share sheet adalah pembatalan normal. Hasil dan kontrol unduh tetap tersedia.

## 12 Panel admin dan siklus kampanye

Form admin memuat judul, slug, ringkasan, relasi kegiatan, frame, thumbnail, caption umum dan personal, status, serta informasi preview. Kolom tanggal/lokasi ditarik dari kegiatan bila relasi tersedia dan tidak dibuat editable di dua tempat. Untuk kampanye non-kegiatan, tanggal dan lokasi boleh kosong.

Validasi isian: judul 5–120 karakter; ringkasan maksimum 500 karakter; slug 3–80 karakter, huruf kecil/angka/tanda hubung dengan pola `^[a-z0-9]+(?:-[a-z0-9]+)*$`. Slug unik secara case-insensitive, tidak bertabrakan dengan rute reserved. Slug dikunci setelah publish pertama; perubahan URL memerlukan fitur alias/redirect yang belum masuk MVP.

Siklus utama:

- **Draft:** admin dapat mengedit dan melihat preview terautentikasi; publik menerima 404.
- **Published:** publik membaca snapshot terbit. Perubahan admin tetap draft sampai publish ulang.
- **Archived:** publik membaca ringkasan dan melihat status arsip; pengunjung baru tidak dapat memulai editor. Arsip tidak otomatis menghapus aset publik.

Panitia dapat memulihkan archived ke published melalui pemeriksaan aset dan otorisasi yang sama. Tidak ada hard delete campaign yang pernah diterbitkan pada rilis pertama. Draft yang belum pernah diterbitkan boleh dihapus melalui admin dengan konfirmasi biasa dan pembersihan aset yang tidak direferensikan.

Sesi peserta yang sudah memuat versi published boleh menyelesaikan ekspor lokal walaupun panitia kemudian mengarsipkan kampanye. Ini bukan pencabutan file yang sudah tersebar. Jika dibutuhkan penarikan konten sensitif, gunakan prosedur operasional terpisah; cache/unduhan sebelumnya tidak dapat ditarik kembali secara mutlak.

Publish harus memeriksa otorisasi, kelengkapan field, validasi aset, dan versi edit. Simpan snapshot baru dan pindahkan pointer versi publik secara atomik setelah aset tersedia. Dua admin yang mengedit versi sama tidak boleh menimpa diam-diam; kembalikan conflict dan minta muat ulang/perbandingan perubahan.

## 13 Arsitektur yang disarankan

Gunakan modul tambahan pada frontend existing, renderer browser yang terpisah dari halaman, layanan metadata kampanye, storage aset publik, storage draft privat, dan admin existing. Tidak ada endpoint render foto peserta pada MVP.

| Komponen | Tanggung jawab | Batas integrasi |
| --- | --- | --- |
| Halaman publik | Metadata, editor, hasil, caption, bantuan | Tidak mengirim foto atau isian personal |
| Modul renderer | Decode, normalisasi, transformasi, komposit, Blob | Dapat diuji tanpa router atau backend |
| Kampanye publik | Mengembalikan snapshot published/arsip yang diizinkan | Tidak menyertakan draft, identitas admin, atau file privat |
| Backend admin | Validasi, akses, publikasi, audit | Menggunakan auth lama dan verifikasi server |
| Storage | PNG frame dan thumbnail, terpisah draft/publik | Nama objek berversi; aset live tidak dioverwrite |
| Statistik opsional | Event teknis minimum dan agregasi | Kegagalan tidak menghambat foto atau unduh |

Pilihan framework, paket crop/gesture, dan library gambar diputuskan setelah memeriksa repo dan lockfile. Jika crop library dipakai, pastikan mampu menempatkan frame transparan tanpa perbedaan antara crop preview dan ekspor. Hindari menambahkan library canvas besar hanya untuk dua lapisan gambar. Dokumentasikan alasan dan lisensi dependency baru.

Jika website memang memakai Supabase, gunakan database dan storage existing dengan tabel/namespace baru serta RLS. Jangan menaruh service-role key atau secret di frontend. Publish dan validasi file dapat dilakukan lewat server/Edge Function terautentikasi. Jika backend lain sudah berjalan, penuhi kontrak yang sama tanpa migrasi teknologi.

## 14 Model data logis

Nama tabel dan tipe ID berikut adalah rancangan. Sesuaikan dengan konvensi repo setelah audit; foreign key kegiatan harus mengikuti primary key existing, bukan selalu dipaksakan UUID.

### 14.1 Tabel twibbon_campaigns

| Field | Tipe konseptual | Aturan |
| --- | --- | --- |
| id | UUID atau ID existing | Primary key |
| slug | text | Unik dan immutable setelah terbit |
| event_id | ID kegiatan nullable | FK jika model kegiatan tersedia; jangan menebak nama tabel |
| state | enum | draft, published, archived |
| published_revision_id | UUID nullable | FK versi resmi, tidak boleh menunjuk versi kampanye lain |
| draft_payload | JSON terstruktur | Judul, ringkasan, asset ID, caption; dibatasi schema server |
| edit_version | integer | Optimistic concurrency; naik setiap perubahan |
| created_by dan updated_by | ID auth existing | Diisi server; tidak dipercaya dari request |
| created_at dan updated_at | timestamp UTC | Tampilan lokal Asia/Jakarta |
| published_at dan archived_at | timestamp nullable | Diisi server sesuai transisi |

### 14.2 Tabel twibbon_revisions

Snapshot immutable yang dibuat ketika publish: id, campaign_id, revision_number, title, description, frame_asset_id, thumbnail_asset_id, output_width=1080, output_height=1080, caption_default, caption_template, event_display_snapshot bila diperlukan, published_by, published_at. Indeks unik pada (campaign_id, revision_number). Mutasi revisi yang sudah terbit dilarang; edit menghasilkan revisi berikutnya.

Jika tanggal kegiatan berubah, metadata tanggal publik dapat dibaca dari sumber kegiatan saat request. Snapshot hanya menjadi fallback/audit yang ditandai. Jangan membiarkan tanggal snapshot lama diam-diam mengalahkan data kegiatan terkini. Gunakan cache invalidation ketika acara diperbarui.

### 14.3 Tabel twibbon_assets

Field: id, campaign_id, kind (frame/thumbnail), visibility (private_draft/public), storage_path, mime_type, byte_size, width, height, checksum, validation_status, created_by, created_at. Storage path dibentuk server seperti `twibbon/{campaign_id}/{asset_id}/frame.png`; file versi baru memiliki path baru. Record merekam hasil validasi backend, bukan nilai dimensions kiriman browser.

Draft hanya tersedia lewat jalur privat/URL bertanda tangan berumur pendek bagi admin. Aset yang dipublikasikan disalin ke lokasi publik berversi setelah validasi; publikasi metadata terjadi sesudah salinan siap. Jika transaksi metadata gagal, file publik yatim dicatat untuk pembersihan, bukan menimpa pointer versi lama.

### 14.4 Audit log

Catat campaign_id, actor_id, action, revision_id, timestamp, dan ringkasan perubahan field. Jangan menyalin foto peserta atau caption personal. Gunakan audit existing jika tersedia. Retensi usulan 180 hari; pemilik sistem menetapkan kebijakan akhir.

### 14.5 Hak akses data

Anonim hanya membaca proyeksi field publik dari snapshot yang diizinkan. **RLS membatasi baris, bukan otomatis menyembunyikan kolom draft_payload**: jangan membuka SELECT row kampanye berisi draft kepada anon lalu mengandalkan frontend membuang kolom. Gunakan endpoint/proyeksi publik yang aman, column privilege, atau view dengan konfigurasi akses yang tepat dan diuji [R11].

Admin diperiksa dari role yang ditetapkan server. Role di profil yang bisa diedit sendiri tidak boleh menjadi sumber otorisasi. Publik tidak dapat insert/update/delete kampanye, revisi, aset, role, atau audit. Endpoint statistik bila dibuat menjadi satu-satunya jalur event publik yang tervalidasi, tanpa membuka tabel write mentah.

## 15 Kontrak layanan dan kesalahan

Path di bawah adalah kontrak konseptual. Pada framework berbasis RPC/server action, pertahankan maknanya tanpa harus menambahkan REST layer baru.

| Operasi | Akses | Respons inti |
| --- | --- | --- |
| GET /api/twibbon/campaigns | Publik | Kartu kampanye yang boleh ditampilkan; pagination default 12, maksimum 50 |
| GET /api/twibbon/campaigns/:slug | Publik | state, can_generate, revision_id, metadata, frame URL, dimensi, caption, info kegiatan |
| POST /api/admin/twibbon | Admin | Draft baru dan edit_version |
| PATCH /api/admin/twibbon/:id | Admin | Simpan draft dengan expected_version; 409 bila konflik |
| POST /api/admin/twibbon/:id/assets | Admin | Validasi file admin dan simpan aset draft privat |
| POST /api/admin/twibbon/:id/publish | Admin | Publikasi snapshot atomik; wajib expected_version |
| POST /api/admin/twibbon/:id/archive | Admin | Perubahan status dan audit |
| GET /api/admin/twibbon/:id/preview | Admin | Preview draft; private no-store |
| POST /api/twibbon/events | Publik opsional P1 | Event minimum; 202/204 bila diterima, 429 jika limit |

Contoh detail publik, bukan data yang sudah tersedia:

```json
{
  "id": "campaign-id",
  "slug": "diklat-kepemimpinan-2026",
  "state": "published",
  "can_generate": true,
  "revision_id": "revision-id",
  "title": "Twibbon Diklat Kepemimpinan 2026",
  "description": "Buat twibbon resmimu bersama UKM Pilar Bangsa.",
  "frame": {"url": "<validated-public-asset-url>", "width": 1080, "height": 1080},
  "thumbnail_url": "<public-thumbnail-url>",
  "caption_default": "<caption-umum>",
  "caption_template": "Saya {{nama}} dari {{prodi}} ...",
  "event": {
    "date": "2026-11-01",
    "timezone": "Asia/Jakarta",
    "url": "/kegiatan/pendaftaran-diklat-kepemimpinan-periode-20262027"
  }
}
```

Gunakan pola error konsisten, misalnya `{"error":{"code":"FRAME_INVALID","message":"Bingkai harus PNG transparan 1080 × 1080.","request_id":"..."}}`. Jangan mengembalikan stack trace atau secret. Kode minimum: CAMPAIGN_NOT_FOUND (404), AUTH_REQUIRED (401), FORBIDDEN (403), VERSION_CONFLICT (409), PAYLOAD_TOO_LARGE (413), VALIDATION_FAILED (422), RATE_LIMITED (429), ASSET_UNAVAILABLE (503).

Foto peserta tidak memiliki API upload dalam kontrak ini. Tidak adanya endpoint render adalah keputusan arsitektur, bukan pekerjaan yang tertinggal.

## 16 Keamanan dan privasi

Prinsip lokal berlaku untuk foto, nama/prodi caption, EXIF, dan hasil komposit. Data tersebut tidak disimpan ke localStorage, IndexedDB, service worker cache, log, error reporting, replay session, atau query string. Simpan di memori sesi. Bila analytics/session replay existing dapat menangkap input atau canvas, matikan untuk modul ini atau konfigurasi masking yang dapat diverifikasi.

Teks yang terlihat peserta: “Foto diproses di perangkatmu dan tidak diunggah oleh fitur ini. Setelah disimpan, kamu bisa membagikannya sendiri.” Klaim ini baru ditayangkan setelah pemeriksaan jaringan lulus. Hal ini tidak berarti server website sama sekali tidak menerima request metadata atau log akses biasa.

Kontrol minimum:

- Backend memvalidasi setiap operasi admin, termasuk publish dan akses aset draft.
- Gunakan perlindungan CSRF jika autentikasi berbasis cookie; ikuti pola auth aman yang sudah ada.
- Render judul, deskripsi, dan caption sebagai teks. Jika mendukung rich text existing, gunakan sanitasi yang sudah diaudit; input HTML bebas tidak diperlukan.
- Tautan kegiatan dibatasi ke rute internal yang sah; tautan bantuan eksternal bila dipakai hanya skema HTTPS dengan validasi. Tolak javascript/data URL untuk field navigasi.
- Validasi bingkai admin mencakup signature, ukuran, decode, dimensi, animasi, dan alpha channel. Storage draft tidak dapat diambil anonim.
- Bila backend mengambil URL aset untuk metadata/OG, URL hanya berasal dari storage allowlist; jangan membuat proxy URL bebas yang membuka SSRF.
- File hasil dire-encode dari canvas tanpa menyalin metadata sumber. Pastikan tidak memakai jalur download foto asli.
- Cache halaman admin/preview menggunakan no-store. Aset publik immutable dapat di-cache panjang; arsip tidak dianggap revokasi akses aset lama.
- Object URL, buffer foto lama, event listener, dan bitmap dilepas saat foto diganti atau editor ditutup.

Tidak dibuat klaim kepatuhan hukum menyeluruh dalam PRD ini. Bila nanti menyimpan atau mempublikasikan foto peserta, susun kebutuhan persetujuan, retensi, penghapusan, dan moderasi sebagai perubahan lingkup tersendiri sebelum implementasi galeri.

## 17 Statistik dan batas interpretasi

Statistik adalah P1. Jika waktu menuju Diklat terbatas, luncurkan tanpa dashboard statistik terlebih dahulu. Jangan memasang counter palsu atau mengimpor angka pendukung Twibbonize sebagai angka pengguna fitur internal.

| Event usulan | Makna yang boleh disimpulkan |
| --- | --- |
| campaign_view | Halaman kampanye dibuka, bukan satu orang unik |
| photo_selected | Foto valid dipilih lokal, tanpa mengirim file atau namanya |
| export_succeeded | Blob PNG berhasil dibuat, bukan berkas sudah tersimpan |
| download_clicked | Tombol unduh ditekan, bukan bukti unduhan selesai |
| caption_copied | API salin berhasil; salin manual tidak selalu terukur |
| share_opened | Pemanggilan berbagi dicoba |
| share_resolved | API berbagi selesai menurut platform, bukan bukti posting publik |
| export_failed | Ekspor gagal dengan kode error aman |

Payload maksimum berisi event_id acak, session_id acak di memori, campaign_id, revision_id, event_name enum, error_code enum jika relevan, serta source kategori allowlist. Waktu server menjadi dasar agregasi. Jangan menyertakan nama, prodi, caption, foto, base64, EXIF, koordinat wajah, full referrer, query bebas, atau fingerprint. session_id di-reset ketika tab dimuat ulang; metrik sesi bukan jumlah orang.

Idempotensi memakai event_id unik; ulang kirim event yang sama tidak menambah hitungan. Statistik anonim tetap dapat dipalsukan atau hilang, sehingga diperlakukan sebagai perkiraan operasional. Terapkan limit contoh 60 event/menit/sesi dan limit server agregat; jangan menjadikan IP kampus bersama sebagai satu-satunya limiter. Nilai akhir dituning melalui uji, dengan retensi event mentah usulan 30 hari dan agregat harian 180 hari. Dashboard hanya untuk admin.

## 18 Kebutuhan nonfungsional

| Area | Target dan metode verifikasi |
| --- | --- |
| Ponsel | Layout 320–430 piksel, tidak ada scroll horizontal, target sentuh ≥ 44 × 44 piksel |
| Aksesibilitas | Fokus terlihat, urutan keyboard logis, label slider/input, alternatif drag, status proses diumumkan melalui aria-live |
| Kontras | Target rasio 4,5:1 untuk teks biasa dan 3:1 untuk teks besar; status tidak ditunjukkan lewat warna saja |
| Kelancaran | Target ≥ 30 fps drag pada perangkat Android kelas menengah yang dipilih sebagai perangkat uji |
| Ekspor | Target p95 ≤ 5 detik setelah gambar/frame siap pada perangkat uji; ukur dan laporkan konfigurasi |
| Beban awal | Editor dimuat lazy, tambahan JS terkompresi target ≤ 150 KiB; frame target ≤ 2 MiB, batas keras tetap 5 MiB |
| Halaman | Target LCP ≤ 2,5 detik dan CLS ≤ 0,1 pada pengukuran terdefinisi; bukan janji semua jaringan |
| Kapasitas awal | Skenario usulan 100 pengguna aktif bersamaan membaca metadata/aset; render tetap lokal |
| Toleransi gangguan | Statistik gagal tidak memengaruhi unduh; aset gagal memberi retry tanpa kehilangan foto lokal |
| Kompatibilitas | Chrome Android, Safari iOS, Chrome/Edge desktop, Firefox desktop; dua versi stabil terakhir saat QA |
| Peramban aplikasi | Uji webview Instagram/WhatsApp bila tersedia; sediakan petunjuk buka di browser jika unduh dibatasi |
| SEO | Judul, deskripsi, canonical dan Open Graph tersedia pada HTML awal atau mekanisme prerender sesuai hosting |

Tetapkan satu atau dua perangkat uji konkret dan catat RAM, OS, browser, serta versi. Batas perangkat/jaringan yang belum diuji harus dilaporkan, bukan diberi label “didukung semua HP”.

## 19 SEO dan tautan yang dibagikan

Gunakan metadata kampanye yang sudah published: judul halaman, deskripsi singkat, canonical domain utama, og:title, og:description, og:image, og:url, dan twitter:card. OG image dibuat dari thumbnail publik tanpa foto peserta; ukuran usulan 1200 × 630 piksel dengan crop yang menjaga judul dan logo.

Metadata dinamis yang hanya diubah JavaScript sesudah load belum tentu dibaca crawler WhatsApp. Pengembang wajib memeriksa HTML yang diterima crawler dan memilih SSR, prerender, atau respons metadata server sesuai stack. Jangan membangun ulang seluruh website demi kebutuhan ini. Draft tidak masuk sitemap dan preview admin diberi noindex; noindex bukan pengganti autentikasi.

Cache metadata dan halaman publik dapat memakai TTL singkat, misalnya 60 detik, dengan invalidasi saat publish/arsip/perubahan kegiatan. Aset berversi boleh memakai cache immutable. Pratinjau aplikasi sosial dapat menyimpan cache sendiri; perubahan thumbnail tidak dijamin langsung terlihat pada tautan lama.

## 20 Kondisi gagal dan teks antarmuka

| Kondisi | Respons yang diharapkan | Teks usulan |
| --- | --- | --- |
| Kampanye tidak ada atau masih draft | 404 publik tanpa kebocoran judul draft | Twibbon ini belum tersedia. Kembali ke daftar twibbon. |
| Kampanye arsip | Detail tetap terbaca, editor baru nonaktif | Kampanye ini sudah diarsipkan. |
| Frame gagal dimuat | Retry dan nonaktifkan ekspor; pertahankan foto sesi | Bingkai belum berhasil dimuat. Coba lagi. |
| File terlalu besar | Tolak sebelum proses berat | Foto maksimal 15 MiB. Pilih foto yang lebih kecil. |
| HEIC atau format tidak terbaca | Instruksi format; tidak upload ke converter luar | Foto belum bisa dibuka. Gunakan JPG, PNG, atau WebP. |
| Decode atau memori gagal | Bersihkan buffer yang gagal, tawarkan foto lebih kecil | Foto ini terlalu berat untuk diproses di perangkatmu. Coba versi lebih kecil. |
| Kualitas rendah | Peringatan tanpa memblokir file valid | Foto bisa terlihat kurang tajam saat diunduh. |
| Pemilih foto dibatalkan | Pertahankan foto dan transformasi sebelumnya | Tidak perlu pesan error |
| Ekspor gagal atau Blob null | Kembalikan kontrol, izinkan ulang | Twibbon belum berhasil dibuat. Coba lagi. |
| Unduhan tidak muncul | Preview gambar + petunjuk simpan perangkat | Buka pratinjau gambar, lalu gunakan pilihan simpan di browsermu. |
| Clipboard ditolak | Caption tetap selectable | Salin otomatis belum tersedia. Tekan dan tahan teks untuk menyalin. |
| Share dibatalkan | Tetap di hasil, tanpa error merah | Tidak perlu pesan error |
| Statistik gagal | Tidak tampilkan error peserta | Tidak ada pesan yang mengganggu |
| Konflik admin | Jangan overwrite, tampilkan opsi muat versi baru | Ada perubahan dari admin lain. Muat versi terbaru sebelum menyimpan. |

Hindari pesan “berhasil” jika tahapan sebenarnya baru mulai. Saat proses ekspor tampilkan status “Menyiapkan twibbon…” dan cegah klik ekspor ganda sampai proses selesai.

## 21 Pengujian penerimaan

Daftar ini menjadi acuan bukti penyelesaian implementasi. Gunakan aset sintetis atau foto contoh yang berhak dipakai, bukan foto peserta tanpa kebutuhan.

| ID uji | Skenario | Hasil lulus |
| --- | --- | --- |
| T01 | Buka kampanye published tanpa akun | Editor dapat digunakan |
| T02 | Buka slug draft, acak, atau API draft sebagai anon | 404/403 sesuai kontrak; tidak ada data draft |
| T03 | Foto portrait, landscape, dan persegi | Semua dapat ditata, tanpa celah akibat pan berlebihan |
| T04 | JPEG EXIF orientasi 1–8 | Hasil tegak dan orientasi sama dengan preview |
| T05 | Zoom 1×/4× dan setiap rotasi 90 derajat | Foto cover, bingkai diam, clamp benar |
| T06 | Drag, pinch, tombol arah, slider, keyboard | Semua kontrol alternatif berfungsi |
| T07 | Ubah lebar layar/rotasi ponsel setelah crop | Komposisi tidak berubah |
| T08 | Ekspor dan inspeksi berkas | PNG tepat 1080 × 1080, logo utuh, tidak memuat UI/checkerboard |
| T09 | Bandingkan preview dan ekspor dengan foto pola | Transformasi sama dalam toleransi 1 piksel logis, terlepas dari resampling warna |
| T10 | Ganti foto lalu batalkan file picker | Foto lama tidak hilang |
| T11 | Unduh ulang dan edit lagi | Blob dan transformasi tetap benar |
| T12 | Input berukuran batas, berlebih, rusak, atau ekstensi palsu | Validasi konsisten, UI pulih |
| T13 | Foto dimensi ekstrem atau sumber transparan | Tidak crash; latar putih konsisten atau error aman |
| T14 | Frame JPEG, salah dimensi, opak, kosong, atau animasi | Publish diblokir sesuai aturan |
| T15 | Caption nama/prodi lengkap, kosong, satu kosong | Caption personal/umum dipilih benar; tidak ada token tersisa |
| T16 | Token tidak dikenal, teks HTML, input sangat panjang | Publish/input ditolak atau dirender aman tanpa eksekusi |
| T17 | Clipboard/file share tidak tersedia dan share dibatalkan | Fallback dapat dipakai; hasil tetap ada |
| T18 | Browser membatasi unduh | Preview simpan tersedia; tidak mengklaim tersimpan |
| T19 | Frame CORS salah atau jaringan frame putus | Error jelas; tidak mengunduh foto tanpa bingkai |
| T20 | Statistik diblokir/offline setelah semua aset siap | Ekspor lokal tetap berfungsi |
| T21 | Periksa semua request jaringan selama alur | Tidak ada foto/nama/prodi/EXIF/caption personal yang terkirim |
| T22 | Anggota biasa memanggil endpoint admin dan storage draft | Ditolak backend meski menu dimanipulasi |
| T23 | Admin simpan draft pada kampanye live | Publik tetap melihat revisi lama |
| T24 | Publish aset baru saat sesi peserta masih terbuka | Sesi lama konsisten; sesi baru mendapat versi baru |
| T25 | Dua admin mengedit edit_version sama | Perubahan kedua mendapat 409, bukan silent overwrite |
| T26 | Publish gagal di tengah pemindahan aset/metadata | Versi publik lama tetap dapat digunakan |
| T27 | Arsip kampanye | Detail berlabel arsip; pengunjung baru tidak memulai editor |
| T28 | Kembali ke halaman kegiatan | Tautan twibbon internal benar; pendaftaran, Drive, dan WA tetap berfungsi |
| T29 | Keyboard, screen reader dasar, dan layar 320 piksel | Fokus/label/status benar; semua aksi utama dapat diakses |
| T30 | Tautan dibagikan ke WhatsApp dan HTML crawler diperiksa | Judul dan OG image kampanye muncul, tanpa foto peserta |
| T31 | 100 sesi metadata/aset bersamaan pada staging | Tidak ada error otorisasi/kampanye; hasil latensi dicatat |
| T32 | Rangkaian pilih/ganti foto 10 kali | Buffer dibersihkan; tidak ada kenaikan memori tanpa batas |

Unit test difokuskan pada logika yang berisiko: normalisasi transformasi, cover/clamp rotasi, template caption, validasi file, dan akses/status. Integration test memeriksa publikasi atomik serta draft tidak bocor. E2E memeriksa satu alur peserta dan satu alur admin lengkap. Pengujian Safari iOS, gesture, lokasi hasil unduhan, dan pembatasan webview perlu perangkat/browser nyata; emulasi desktop saja tidak cukup.

## 22 Rencana implementasi dan peluncuran

Jadwal berikut adalah urutan usulan untuk waktu persiapan 27–31 Oktober. Durasi bukan janji selesai otomatis; sesuaikan setelah inspeksi repo. Jangan mengurangi kontrol akses atau validasi gambar demi mengejar tanggal.

| Tahap | Hasil yang harus bisa diperiksa | Syarat lanjut |
| --- | --- | --- |
| 0 Pemeriksaan repo | Peta framework, router, auth/role, kegiatan, storage, env, hosting, test, dan desain | Tidak ada asumsi kritis yang belum ditandai |
| 1 Editor lokal | Demo memakai frame uji, kontrol foto, renderer, ekspor PNG | T03–T13 dan privasi lokal inti lulus |
| 2 Integrasi kampanye | Data publik nyata, panel draft, aset privat, publish, arsip | T01–T02, T14, T22–T27 lulus |
| 3 Integrasi kegiatan | Kartu twibbon internal, caption, share, metadata, empty/error states | Alur lengkap P0 lulus |
| 4 QA dan kesiapan acara | Uji Android/iOS/desktop, konten panitia final, backup dan rollback | Seluruh P0 kritis lulus dan panitia menyetujui konten |
| 5 Rilis terbatas | Uji oleh 5–10 pengurus sebelum tautan dibagikan luas | Tidak ada kegagalan ekspor/akses yang menghalangi |
| 6 Sesudah acara | Statistik, beberapa bingkai, dan perbaikan dari feedback | Rilis P0 stabil dan kebutuhan terkonfirmasi |

Jika waktunya sempit, hilangkan P1/P2. Tetap wajib ada jalur admin yang aman; jangan menggantinya dengan endpoint publik upload. Selama alur baru belum lolos QA, tautan twibbon lama tetap menjadi rujukan yang dipublikasikan.

Strategi migrasi:

1. Simpan sumber PNG dan caption resmi dari panitia, serta catat tautan kegiatan lama.
2. Buat kampanye internal sebagai draft; tidak menyalin statistik atau foto pendukung dari Twibbonize.
3. Uji hasil internal dan verifikasi isi. Tautan short link twb.nz adalah milik layanan lain dan tidak dapat dipaksa menjadi redirect domain sendiri tanpa kemampuan akun layanan tersebut.
4. Publish kampanye, lalu arahkan kartu Twibbon Diklat di website ke rute baru melalui perubahan konten terkontrol.
5. Bagikan URL baru melalui kanal panitia sesuai keputusan pengguna; tidak ada pengiriman pesan otomatis sebagai bagian implementasi.
6. Catat bahwa tautan yang sudah tersebar sebelumnya tetap dapat membawa peserta ke kampanye lama.

Rollback: nonaktifkan feature flag modul atau CTA internal, pulihkan nilai tautan lama pada halaman kegiatan, dan pertahankan data kampanye untuk diagnosis. Migrasi schema harus bersifat additive sehingga rollback frontend tidak mematahkan modul lama. Jangan menghapus tabel/kolom existing atau memindahkan auth. Jika kampanye internal sudah dibagikan, tampilkan halaman bantuan atau status pemeliharaan pada rute itu agar tautan tidak buntu.

## 23 Ketergantungan dan keputusan yang masih perlu diverifikasi

| Hal yang belum diketahui | Default dalam PRD | Cara menyelesaikan saat implementasi |
| --- | --- | --- |
| Stack dan akses repositori | Pakai stack existing | Baca package manifest, struktur route, dan konfigurasi |
| Auth dan role admin | Pakai sistem lama | Telusuri guard, policy, serta sumber role server |
| Model kegiatan dan tautan | Relasi opsional, utamakan sumber kegiatan | Periksa schema dan komponen halaman kegiatan |
| Storage, CORS, dan hosting | Draft privat, publik berversi | Uji delivery URL dan ekspor canvas dari domain produksi |
| Aset frame asli | PNG transparan 1080 × 1080 wajib disediakan panitia | Gunakan file sumber resmi; screenshot bukan pengganti |
| Batas akhir penggunaan twibbon | Terbuka sampai diarsipkan manual | Panitia menetapkan jika membutuhkan deadline; jangan memakai teks pendaftaran lama |
| Tanggal penutupan pendaftaran | Belum ditentukan ulang | Panitia memeriksa 20 Oktober versus status dibuka |
| Jumlah peserta dan trafik | Uji kapasitas awal 100 sesi sebagai asumsi | Koreksi berdasarkan jangkauan panitia dan log yang sah |
| Jam acara dan caption final | Tidak diada-adakan | Ambil dari data acara resmi yang sudah dikonfirmasi |
| Dukungan perangkat | Perlu QA nyata | Catat perangkat dan hasil; sediakan fallback |

PRD dapat dipakai sebelum semua informasi tersebut tersedia. AI coding harus melaporkan ketidaksesuaian saat pemeriksaan, memilih integrasi yang paling kecil perubahannya, dan menandai perubahan lingkup material. Akses repo dan aset sumber adalah kebutuhan implementasi, bukan alasan untuk menghentikan penyusunan PRD ini.

## 24 Prompt siap pakai untuk vibe coding

Gunakan dokumen ini sebagai lampiran/konteks tetap. Berikan satu prompt tahap pada satu waktu agar hasil dapat diperiksa sebelum perubahan berikutnya.

### 24.1 Prompt utama

```text
Saya ingin menambahkan fitur Twibbon Pilar Bangsa ke website existing
https://www.pilarbangsa.my.id/ sesuai PRD_Twibbon_Pilar_Bangsa.md.

Tujuannya peserta Diklat Kepemimpinan UKM Pilar Bangsa pada 1 November 2026
bisa memilih foto, mengatur posisinya di belakang PNG transparan resmi,
mengunduh PNG 1080x1080, dan menyalin caption langsung dari domain kami.

Mulai dengan membaca AGENTS.md, struktur repositori, package manifest,
router, komponen desain, autentikasi/role, model kegiatan, storage,
konfigurasi deployment, dan pengujian existing. Verifikasi stack;
jangan menganggap framework atau Supabase hanya dari teks website.
Laporkan peta integrasi singkat dan asumsi yang belum terverifikasi.
Kemudian kerjakan P0 bertahap dengan perubahan yang dapat diperiksa.

Ketentuan wajib:
1. Tambahkan modul dalam aplikasi existing, ikuti desain dan auth lama.
2. Peserta tanpa login. Foto, hasil, EXIF, nama, dan prodi tetap lokal;
   jangan membuat endpoint upload foto, memakai AI, atau merekam canvas.
3. PNG frame admin tepat 1080x1080, transparan, maksimum 5 MiB;
   validasi frontend dan backend. Draft asset harus privat.
4. Preview dan ekspor memakai satu model koordinat/renderer.
   Dukung pan, zoom, rotasi 90 derajat, reset, ganti foto, EXIF,
   unduh ulang, serta fallback simpan pada browser yang terbatas.
5. Implementasikan daftar dan detail kampanye serta admin draft,
   preview privat, publish atomik, revisi immutable, arsip, dan audit.
   Otorisasi wajib di server/RLS; jangan membuka draft_payload ke anon.
6. Caption hanya plain text dengan token nama/prodi sesuai PRD.
   Berbagi file dideteksi kemampuannya; tidak menjanjikan auto-post.
7. Ganti kartu tautan Twibbon Diklat di halaman kegiatan setelah
   kampanye internal siap. Pendaftaran dan bukti posting tetap terpisah.
8. Ikuti tabel acceptance test dan laporkan bukti uji yang benar-benar
   dijalankan, kegagalan, serta bagian yang masih memerlukan perangkat nyata.
9. P1/P2 dikerjakan sesudah P0 stabil. Jangan membuat counter palsu,
   galeri, akun peserta, edit bingkai seperti Canva, atau fitur pembayaran.
10. Jangan hardcode secret, merombak aplikasi, menghapus data existing,
    atau melakukan deployment produksi tanpa instruksi yang mengizinkan.

Output tiap tahap: daftar perubahan, cara mencoba, hasil pemeriksaan,
dan masalah nyata yang perlu ditindaklanjuti. Jika pola teknis repo berbeda
dengan rancangan contoh PRD, sesuaikan implementasinya sambil menjaga
perilaku produk, privasi, dan kriteria penerimaan.
```

### 24.2 Prompt tahap editor

```text
Kerjakan editor foto lokal P0 terlebih dahulu dengan frame sintetis.
Pisahkan decode/normalisasi, matematika transformasi, renderer, dan UI.
Gunakan rotasi per 90 derajat, cover/clamp, ruang koordinat keluaran,
dan satu renderer preview/ekspor. Jangan membangun backend foto.
Verifikasi EXIF, portrait/landscape, resize, input rusak/besar,
hasil PNG 1080x1080, serta pembersihan object URL dan bitmap.
Tunjukkan cara mencoba dan hasil uji yang benar-benar dijalankan.
```

### 24.3 Prompt tahap kampanye dan admin

```text
Hubungkan editor ke model kampanye dan admin existing sesuai PRD.
Tambahkan schema secara additive, role guard server, draft asset privat,
validasi PNG backend, snapshot published immutable, publish atomik,
edit_version untuk konflik admin, archive, dan audit.
Pastikan anon tidak bisa membaca draft_payload atau file draft melalui
endpoint, query basis data, view, storage path, maupun URL preview.
Jangan membuat akun/auth baru jika sistem lama sudah mencukupi.
Uji request non-admin dan kegagalan publish di tengah proses.
```

### 24.4 Prompt tahap integrasi dan QA

```text
Selesaikan daftar/detail Twibbon, kartu pada halaman kegiatan, caption,
download/share fallback, metadata OG, dan tampilan mobile mengikuti
desain existing. Periksa isi tanggal dan instruksi pendaftaran tanpa
menebak deadline baru. Jalankan acceptance test PRD yang relevan.
Periksa jaringan untuk memastikan tidak ada byte foto atau isian personal
terkirim. Matikan/mask session replay pada editor. Laporkan hasil nyata,
bagian belum diuji pada iOS/webview, cara rollback, dan checklist rilis.
Jangan menganggap tombol unduh sebagai bukti tersimpan atau sudah posting.
```

### 24.5 Definisi selesai

Pekerjaan P0 selesai ketika peserta tanpa akun dapat membuat dan menyimpan hasil yang benar pada perangkat uji; admin dapat mengelola dan menerbitkan kampanye dengan akses aman; draft tidak bocor; integrasi kegiatan dan metadata berfungsi; seluruh tes kritis lulus; foto tetap lokal menurut pemeriksaan jaringan; dan instruksi operasi/rollback tercatat. Tampilan editor yang bagus dengan tombol dummy atau admin yang belum tersambung tidak memenuhi definisi ini.

## 25 Referensi dan jejak analisis

Semua URL diakses/diperiksa pada 27 Oktober 2026. Dokumentasi vendor dapat berubah; rujukan menjelaskan fungsi pembanding dan batas platform, sedangkan spesifikasi Pilar Bangsa di dokumen ini adalah keputusan desain yang diusulkan.

| Kode | Sumber | Digunakan untuk |
| --- | --- | --- |
| R1 | https://www.twibbonize.com/ | Alur kampanye visual publik dan navigasi pembanding |
| R2 | https://www.twibbonize.com/diklatukmpilarbangsa2026 | Kondisi kampanye Diklat yang terhubung dari website; diamati langsung |
| R3 | https://help.twibbonize.com/id/articles/9453726-bagaimana-cara-membuat-foto-twibbon | Alur memilih foto, mengatur, mengunduh, dan mengulang unduh |
| R4 | https://help.twibbonize.com/id/articles/9453559-bagaimana-cara-membuat-kampanye | Data kampanye dan proses kreator |
| R5 | https://help.twibbonize.com/id/articles/9453586-bagaimana-cara-membuat-isian-kustom-pada-caption-kampanye | Personalisasi caption |
| R6 | https://help.twibbonize.com/id/articles/9495312-kenapa-desain-twibbon-saya-ditolak | Transparansi dan ketentuan file pembanding |
| R7 | https://help.twibbonize.com/en/articles/9454519-how-do-i-post-my-twibbon-photo-to-twibbonize | Galeri merupakan publikasi hasil yang terpisah |
| R8 | https://help.twibbonize.com/id/articles/9453793-bagaimana-cara-membagikan-foto-twibbon-saya | Berbagi foto setelah unduh |
| R9 | https://developer.mozilla.org/en-US/docs/Web/API/HTMLCanvasElement/toBlob | Ekspor Blob dan risiko canvas tidak origin-clean |
| R10 | https://developer.mozilla.org/en-US/docs/Web/API/Navigator/share | Deteksi file share dan kebutuhan aktivasi pengguna |
| R11 | https://supabase.com/docs/guides/database/postgres/row-level-security | Kontrol akses baris jika backend existing memakai Supabase |
| R12 | https://www.pilarbangsa.my.id/ | Identitas visual, navigasi, sorotan acara; tampilan langsung lebih mutakhir dari indeks |
| R13 | https://www.pilarbangsa.my.id/kegiatan/pendaftaran-diklat-kepemimpinan-periode-20262027 | Tanggal, lokasi, tautan twibbon/pendaftaran/bukti/grup; diamati langsung |

## 26 Checklist keputusan sebelum dibagikan luas

- [ ] PNG bingkai sumber resmi tersedia, transparansinya benar, dan lolos uji foto contoh.
- [ ] Tanggal 1 November 2026, caption, serta lokasi ditinjau panitia.
- [ ] Keterangan penutupan 20 Oktober dan status pendaftaran diperiksa oleh panitia.
- [ ] Role admin dan akses draft diuji melalui backend serta storage.
- [ ] PNG hasil dapat disimpan di Android dan iOS yang diuji.
- [ ] Crop preview dan PNG sesuai, termasuk foto EXIF dan setelah resize layar.
- [ ] Pemeriksaan jaringan membuktikan foto dan personalisasi tetap lokal.
- [ ] Kartu twibbon di halaman kegiatan mengarah ke kampanye internal yang sudah published.
- [ ] OG preview tautan baru diuji tanpa memuat foto peserta.
- [ ] Jalur bantuan, rollback, dan PIC pengelola kampanye ditentukan.

