import { NextResponse } from "next/server";
import { getDynamicKnowledge } from "@/lib/ai/knowledge";
import { executeAiChatWithFailover } from "@/lib/ai/router";

export async function POST(request: Request) {
  try {
    const { message, history = [], currentPath = "/" } = await request.json();

    if (!message || typeof message !== "string") {
      return NextResponse.json(
        { error: "Pesan tidak boleh kosong" },
        { status: 400 }
      );
    }

    if (message.length > 500) {
      return NextResponse.json(
        { error: "Pesan terlalu panjang (maksimal 500 karakter)" },
        { status: 400 }
      );
    }

    // 1. Ambil knowledge base dinamis terseleksi & hemat token
    const knowledgeBase = await getDynamicKnowledge({
      userMessage: message.trim(),
      history: Array.isArray(history) ? history : [],
    });

    const systemPrompt = `Kamu adalah Pilar Asisten, AI Co-Pilot resmi UKM Pilar Bangsa Universitas 17 Agustus 1945 Banyuwangi. 
Tugas utamamu adalah menjawab pertanyaan pengunjung HANYA berdasarkan basis pengetahuan resmi organisasi berikut:

${knowledgeBase}

ATURAN ANTI-HALUSINASI & KELENGKAPAN JAWABAN:
1. Jawablah dengan bahasa Indonesia yang ramah, sopan, jelas, tuntas, dan berwibawa.
2. JELASKAN SECARA TUNTAS: Jika pengguna meminta penjelasan lebih dalam atau rincian pasal, berikan poin-poin penjelasan yang lengkap dan terstruktur. Jangan memotong penjelasan di tengah kalimat!
3. INGAT KONTEKS PERCAKAPAN: Perhatikan riwayat percakapan sebelumnya. Jika pengguna bertanya lanjutan seperti "boleh kamu jelaskan lebih dalam?", hubungkan langsung dengan topik/bab/pasal yang baru saja dibahas sebelumnya.
4. Jika ditanya mengenai AD/ART, Buku Panduan, SOP, atau Peraturan Organisasi:
   - Kutip atau sebutkan secara tepat nama BAB, Pasal, atau Poin yang bersangkutan sesuai dokumen resmi di atas.
   - Jika nomor bab, pasal, atau topik yang ditanyakan TIDAK TERTULIS atau BELUM ADA di dalam dokumen resmi di atas, KAMU DILARANG KERAS MENEBAK ATAU MENGARANG ATURAN. Katakan dengan jujur dan sopan: "Mohon maaf, ketentuan mengenai hal tersebut belum tercantum dalam naskah resmi AD/ART atau Buku Panduan yang tersedia. Silakan hubungi Sekretariat UKM Pilar Bangsa melalui WhatsApp di bagian bawah website untuk informasi lebih lanjut."
5. Jika ditanya mengenai struktur kepengurusan, nama ketua, sekretaris, bendahara, atau biro/divisi, gunakan data resmi di bagian "STRUKTUR DAN DAFTAR PENGURUS AKTIF".
6. Dilarang menyertakan nomor HP pribadi atau NIM anggota ke publik.`;

    // 2. Jalankan AI Router dengan failover otomatis (Gemini -> Groq -> OpenRouter)
    try {
      const result = await executeAiChatWithFailover({
        systemPrompt,
        userMessage: message.trim(),
        history: Array.isArray(history) ? history.slice(-6) : [],
      });

      return NextResponse.json({
        response: result.text,
        provider: result.provider,
      });
    } catch (routerError: any) {
      console.error("[/api/chat] Seluruh provider gagal:", routerError);
      return NextResponse.json({
        response:
          "⚠️ Mohon maaf, seluruh server AI kami saat ini sedang mengalami kepadatan antrean tinggi (rate limit). Silakan coba ajukan pertanyaan kembali dalam beberapa saat, atau hubungi langsung Sekretaris UKM Pilar Bangsa melalui tombol WhatsApp di bagian bawah (Footer) website ini. Terima kasih atas pengertiannya!",
        fallback: true,
      });
    }
  } catch (error: any) {
    console.error("Error in /api/chat:", error);
    return NextResponse.json(
      { error: error.message || "Terjadi kesalahan pada server AI" },
      { status: 500 }
    );
  }
}
