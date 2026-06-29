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