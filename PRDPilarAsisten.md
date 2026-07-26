# **Addendum PRD v1.4 — Integrasi AI "Pilar Asisten" (RAG System)**

## **1\. Latar Belakang & Tujuan**

Menambahkan fitur kecerdasan buatan terintegrasi (*chatbot*) bernama **"Pilar Asisten"** di Portal Publik. Tujuannya untuk memberikan layanan informasi 24/7 kepada mahasiswa atau publik terkait:

* Aturan dasar organisasi (AD/ART).  
* Informasi detail dan status terkini seluruh Program Kerja (Proker).  
* Sejarah dan profil UKM Pilar Bangsa.

## **2\. Arsitektur Kecerdasan Buatan (AI)**

Karena aplikasi ini memiliki keterbatasan biaya (Rp0), Pilar Asisten akan ditenagai oleh **Google Gemini API (@google/generative-ai)** yang memiliki paket gratis (*free tier*).

**Alur Kerja (RAG System):**

1. **User Input:** Pengguna mengetik pertanyaan di *chatbox* frontend.  
2. **Data Fetching (Backend):** Next.js API Route menangkap pertanyaan tersebut, lalu secara *real-time*:  
   * Mengambil data Proker terbaru dari Supabase (termasuk status selesai, berjalan, atau gagal beserta alasannya).  
   * Membaca file statis AD/ART (format .md atau .txt) dari direktori lokal proyek.  
3. **Prompt Injecting:** Sistem menggabungkan pertanyaan pengguna dengan data dari Supabase & file AD/ART ke dalam satu *System Prompt* rahasia.  
4. **AI Processing:** Mengirim gabungan prompt tersebut ke Google Gemini.  
5. **Output:** Menampilkan jawaban AI ke layar pengunjung dengan gaya bahasa asisten organisasi yang ramah dan profesional.

## **3\. Kebutuhan Database (Pembaruan)**

Tabel programs (Program Kerja) di Supabase perlu ditambahkan 1 kolom baru agar AI tahu alasan jika ada proker yang gagal/tertunda:

* Tambah kolom: evaluation\_notes (Tipe: Text, Nullable). Berisi alasan kenapa proker gagal, tertunda, atau catatan evaluasi lainnya
Rekomendasi Penempatan UI/UX "Pilar Asisten"

Menyeimbangkan Kemudahan Akses dan Kenyamanan Tampilan

Berikut adalah analisis dan rekomendasi tata letak terbaik untuk meletakkan tombol widget Pilar Asisten agar tampak profesional dan tidak mengganggu elemen website lainnya:

1. Rekomendasi Utama: Floating Action Button (FAB) di Pojok Kanan Bawah

Ini adalah standar industri yang digunakan oleh platform besar seperti Intercom, Zendesk, atau HubSpot. Pengunjung secara psikologis sudah terlatih untuk mencari bantuan atau chat di area ini.

Posisi Presisi (Tailwind CSS):
fixed bottom-6 right-6 z-50

Kenapa di Sini?

Mudah Dijangkau: Sangat natural untuk jempol pengguna HP (mobile-friendly).

Konsisten: Posisinya tetap diam di tempat (fixed) meskipun halaman di-scroll ke atas atau ke bawah.

Tidak Mengganggu Konten: Mayoritas konten penting website (teks, gambar, form) dibaca dari kiri ke kanan, sehingga pojok kanan bawah adalah area paling aman yang jarang menghalangi bacaan.

2. Penyesuaian Khusus (Penting untuk Diperhatikan)

Agar widget asisten ini tidak bertabrakan dengan elemen lain di website Anda, berikut beberapa hal yang harus disesuaikan:

A. Di Halaman Publik (Landing Page)

Hindari Tombol "Back to Top": Jika website Anda memiliki tombol panah ke atas ("Kembali ke Atas") yang juga melayang di pojok kanan bawah, geser tombol "Back to Top" tersebut sedikit ke kiri atau ke atas tombol chat, agar tidak tumpang tindih.

Ukuran Bulatan Chat: Gunakan ukuran yang pas (sekitar w-14 h-14 atau w-16 h-16 di laptop, dan otomatis mengecil ke w-12 h-12 di HP).

B. Di Halaman Dashboard Pengurus

Awas Terhalang Form Submit: Di dashboard, tombol "Simpan" atau "Submit" form sering kali berada di pojok kanan bawah halaman.

Solusi: Berikan jarak bawah (bottom padding/margin) yang aman pada widget asisten (misal dinaikkan ke bottom-8 atau bottom-20 khusus di halaman dashboard) agar admin tidak salah klik asisten saat ingin menyimpan data proker atau kas.

Z-Index Tinggi: Pastikan asisten memiliki z-index yang sangat tinggi (misal z-50) agar jendelanya tidak tenggelam di bawah tabel-tabel Supabase atau grafik keuangan yang ada di dashboard.

3. Desain Tombol & Jendela Chat yang Menarik

Tampilan Tombol (Default):
Gunakan lingkaran berwarna Gelap/Hitam (sesuai tema publik Anda) atau Hijau Untag dengan ikon robot putih di dalamnya. Berikan efek bayangan (shadow-lg) dan animasi denyut lembut (animate-pulse) di awal agar menarik perhatian tanpa mengganggu.

Jendela Chat (Saat Diklik):
Saat tombol ditekan, munculkan kotak chat dengan tinggi sekitar h-[500px] dan lebar w-[360px] (di desktop). Di layar HP, buat jendela chat ini otomatis melebar penuh (full screen) agar mengetik pertanyaan menjadi jauh lebih nyaman.