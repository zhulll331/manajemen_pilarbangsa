# **Addendum PRD v1.3 — Manajemen Lanjutan Google Drive API**

## **1\. Latar Belakang & Tujuan**

Untuk menghindari pembengkakan kapasitas penyimpanan pada Supabase Storage (yang memiliki limit gratis 1GB) dan menjaga biaya operasional UKM Pilar Bangsa tetap Rp0, seluruh fitur unggah (*upload*) file fisik pada aplikasi **Pilar Digital Office** dialihkan sepenuhnya ke ekosistem Google Drive menggunakan **Google Drive API (Service Account)**.

Pada versi 1.3 ini, sistem tidak hanya melakukan *upload*, tetapi juga otomatisasi manajemen folder untuk meminimalisir kerja manual admin, meliputi:

* **Pembuatan Folder Otomatis (Dynamic Creation)**  
* **Penggantian Nama Folder Otomatis (Dynamic Renaming)**  
* **Pengunggahan File ke Sub-Folder Spesifik (Targeted Upload)**

## **2\. Ruang Lingkup & Pemetaan Folder**

Website menggunakan **SATU Folder Induk** di Google Drive yaitu: **UKM PILAR BANGSA 2026-2027**. Di dalam folder induk ini, sistem akan membuat sub-folder secara otomatis berdasarkan modul:

| Modul (Role) | Format Nama Folder Otomatis | Data yang Disimpan di Supabase |
| :---- | :---- | :---- |
| **Agenda (Sekretaris)** | Agenda \- \[Tanggal\] \- \[Nama Agenda\] | folder\_id (ID Folder Drive) |
| **Proker (Divisi)** | Proker \- \[Nama Proker\] | folder\_id dan cover\_image\_url |
| **Kas (Bendahara)** | Kas \- \[Bulan/Tahun\] | folder\_id dan proof\_url |
| **Arsip (Sekretaris)** | Arsip \- \[Kategori\] | folder\_id dan file\_url |

## **3\. Alur Sistem (System Flow)**

### **A. Alur Buat Data Baru (Create)**

1. Pengurus mengisi form (misal: Tambah Program Kerja).  
2. Sistem API memanggil Google Drive untuk **membuat folder baru** di dalam Folder Induk (UKM PILAR BANGSA 2026-2027).  
3. Google Drive mengembalikan folderId.  
4. Sistem menyimpan data form beserta folderId ke Supabase.

### **B. Alur Ganti Nama (Update/Rename)**

1. Pengurus mengedit data di form website (misal: merevisi nama proker karena *typo*).  
2. Sistem API membaca folderId dari database, lalu memanggil perintah *Update* ke Google Drive untuk mengganti nama foldernya agar sesuai dengan nama proker yang baru.  
3. Nama folder di Google Drive dan nama proker di database berhasil sinkron.

### **C. Alur Upload File**

1. Pengurus menekan tombol "Upload Dokumentasi".  
2. Sistem melihat folderId dari proker tersebut.  
3. Sistem mengirim file ke Google Drive tepat ke dalam folder tersebut.  
4. Sistem mendapatkan URL foto, mengubahnya jadi format *direct view*, dan menyimpannya ke Supabase.

## **4\. Panduan Persiapan (Status: Selesai)**

Admin telah melakukan langkah persiapan berikut:

1. Buat **Kunci Akses (Service Account JSON)** di Google Cloud Console.  
2. Buat **1 Folder Induk** di Google Drive dengan nama UKM PILAR BANGSA 2026-2027.  
3. **Bagikan (Share)** folder induk tersebut ke email Service Account sebagai **Editor**.  
4. **ID Folder Induk** yang akan digunakan sistem adalah: 1nhcrDFJEw0MLMQ-uxsu05eCAF8MEOcRb.

## **5\. Instruksi Khusus untuk AI (Prompt Antigravity)**

*Salin semua teks di bawah ini (termasuk blok kutipannya) dan berikan kepada AI di Antigravity untuk mulai mengerjakannya.*

**PROMPT UNTUK ANTIGRAVITY \- INTEGRASI DRIVE MULTI-FITUR:**

"Halo AI, saya ingin mengimplementasikan integrasi Google Drive API secara menyeluruh sesuai dengan dokumen PRD v1.3. Sistem ini harus bisa melakukan Upload, Create Folder, dan Rename Folder.

Saya sudah memiliki file kredensial service-account.json. Saya juga sudah menyiapkan Folder Induk di Google Drive dengan nama UKM PILAR BANGSA 2026-2027.

**ID Folder Induk saya adalah: 1nhcrDFJEw0MLMQ-uxsu05eCAF8MEOcRb**

**Tolong buatkan 3 API Routes di Next.js berikut:**

1. **API Create Folder (app/api/drive/create-folder/route.ts):**  
   Menggunakan drive.files.create. Menerima folderName dari frontend, dan menjadikan ID Folder Induk (1nhcrDFJEw0MLMQ-uxsu05eCAF8MEOcRb) yang disimpan di .env.local (sebagai NEXT\_PUBLIC\_DRIVE\_PARENT\_FOLDER\_ID) sebagai parents. Kembalikan folderId yang baru terbuat.  
2. **API Rename Folder (app/api/drive/rename-folder/route.ts):**  
   Menggunakan drive.files.update. Menerima folderId (dari database Supabase) dan newName (nama baru dari form edit). Eksekusi perubahan nama folder tersebut di Drive.  
3. **API Upload File (app/api/drive/upload/route.ts):**  
   Menggunakan library multer atau form-data parser (sesuaikan dengan Next.js App Router). Menerima file dan folderId tujuan. Upload file menggunakan drive.files.create dengan media body. Kembalikan URL dengan format direct download (export=view\&id=...).

**Integrasi Frontend:**

Setelah API di atas selesai, tolong berikan contoh modifikasi pada komponen Form Program Kerja (CRUD), di mana saat form disubmit (Create), sistem memanggil API Create Folder lalu menyimpan folder\_id-nya ke Supabase. Saat form diedit (Update nama), sistem memanggil API Rename Folder. Dan saat ada foto yang diinput, panggil API Upload File.

Pandu saya langkah demi langkah, mulai dari meletakkan ID Folder di .env.local dan setup API route yang pertama."