import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "File tidak ditemukan" }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "GEMINI_API_KEY tidak dikonfigurasi di server" }, { status: 500 });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    
    // Gunakan gemini-1.5-flash (versi 3.5 belum ada/tidak valid)
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    // Mengonversi File menjadi Buffer, lalu menjadi Base64
    const buffer = Buffer.from(await file.arrayBuffer());
    const base64Data = buffer.toString("base64");

    const prompt = `Anda adalah asisten administrasi profesional Sekretaris UKM Pilar Bangsa.
Tugas Anda adalah membaca dokumen surat (masuk/keluar) yang diunggah dan mengekstrak informasi penting ke dalam format JSON yang kaku dan valid.

Ekstrak bidang-bidang berikut berdasarkan isi surat yang terlihat:
1. "letter_number": Cari Nomor Surat/Nomor Dokumen (contoh: 001/A/UKM/2026). Jika tidak ada, kosongkan string ("").
2. "date": Cari Tanggal pembuatan surat atau tanggal dokumen ditandatangani. Walaupun format di surat mungkin "Surabaya, 12 Juli 2026", Anda WAJIB MENGUBAHNYA menjadi format standar YYYY-MM-DD (contoh: "2026-07-12") agar bisa dibaca oleh kalender sistem kami. Jika tidak ada tanggal, kosongkan ("").
3. "sender": Siapa pengirim, pembuat, atau pihak yang mengeluarkan surat ini (contoh: "BEM Universitas", "Ketua Panitia", "Rektor"). Jika tidak jelas, tebak entitas pengirimnya. Jika benar-benar tidak ada, kosongkan ("").
4. "recipient": Siapa yang dituju atau penerima surat ini (contoh: "UKM Pilar Bangsa", "Seluruh Mahasiswa"). Kosongkan jika tidak ada.
5. "subject": Apa perihal, judul kegiatan, atau inti dari surat tersebut. Jika ada baris "Perihal: ...", ambil dari sana. Jika tidak, buatkan 1 kalimat sangat pendek yang merangkum tujuan dokumen ini (contoh: "Undangan Rapat Kerja", "Pemberitahuan Lomba").
6. "letter_type": Deteksi jenis dokumen ini. Anda HARUS MEMILIH SATU dari opsi berikut secara persis (perhatikan huruf besar/kecil): "Surat Masuk", "Surat Keluar", "Proposal", "LPJ", "SK", "Dokumentasi", "Lainnya". Jika surat ditujukan KEPADA UKM Pilar Bangsa, pilih "Surat Masuk". Jika surat DIBUAT OLEH UKM Pilar Bangsa, pilih "Surat Keluar". Jika laporan pertanggungjawaban, pilih "LPJ", dsb.

PENTING: Output HARUS berupa JSON murni tanpa hiasan backtick (markdown) dan tanpa teks tambahan apapun.
Contoh Output yang diinginkan:
{
  "letter_type": "Surat Masuk",
  "letter_number": "123/UKM/2026",
  "date": "2026-07-12",
  "sender": "Ketua BEM",
  "recipient": "Ketua UKM Pilar Bangsa",
  "subject": "Undangan Rapat Kerja"
}`;

    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          data: base64Data,
          mimeType: file.type || "application/pdf"
        }
      }
    ]);

    const responseText = result.response.text();
    
    // Membersihkan JSON jika dibungkus oleh markdown backticks ```json ... ```
    let cleanJson = responseText.trim();
    if (cleanJson.startsWith('```json')) {
      cleanJson = cleanJson.substring(7);
    } else if (cleanJson.startsWith('```')) {
      cleanJson = cleanJson.substring(3);
    }
    if (cleanJson.endsWith('```')) {
      cleanJson = cleanJson.substring(0, cleanJson.length - 3);
    }

    const parsedData = JSON.parse(cleanJson);

    return NextResponse.json(parsedData);
  } catch (error: any) {
    console.error("Gagal mengekstrak surat dengan Gemini:", error);
    return NextResponse.json({ error: error.message || "Terjadi kesalahan internal" }, { status: 500 });
  }
}
