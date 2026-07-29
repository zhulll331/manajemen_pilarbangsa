import { NextResponse } from "next/server";
import { AD_ART_CONTEXT } from "@/utils/context/ad_art";

export async function POST(request: Request) {
  try {
    const { message, currentPath = "/" } = await request.json();

    if (!message || typeof message !== 'string') {
      return NextResponse.json({ error: "Pesan tidak boleh kosong" }, { status: 400 });
    }

    if (message.length > 500) {
      return NextResponse.json({ error: "Pesan terlalu panjang (maksimal 500 karakter)" }, { status: 400 });
    }

    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      throw new Error("OPENROUTER_API_KEY belum dikonfigurasi di variabel lingkungan");
    }

    const systemPrompt = `Kamu adalah Pilar Asisten, AI Co-Pilot resmi UKM Pilar Bangsa. Tugas utamamu adalah menjawab pertanyaan pengunjung HANYA berdasarkan informasi, sejarah, visi misi, dan AD/ART UKM Pilar Bangsa berikut: ${AD_ART_CONTEXT}. 
Jawablah dengan bahasa yang ramah, profesional, dan ringkas. JANGAN menjawab hal-hal di luar konteks organisasi UKM Pilar Bangsa yang diberikan. Jika informasi yang ditanyakan (seperti jadwal proker, detail acara, cara pendaftaran, dsb) TIDAK ADA di dalam teks konteks yang diberikan, kamu DILARANG MENGARANG JAWABAN (berhalusinasi). Sebaliknya, mohon maaf dan arahkan pengunjung dengan sopan untuk menghubungi Sekretaris UKM Pilar Bangsa melalui ikon/tombol kontak WhatsApp yang tertera di bagian bawah (Footer) website ini.`;

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://pilarbangsa-official.vercel.app",
        "X-Title": "Pilar Bangsa Management"
      },
      body: JSON.stringify({
        model: "nvidia/nemotron-3-ultra-550b-a55b:free",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: message }
        ]
      })
    });

    if (!response.ok) {
      throw new Error(`OpenRouter Error: ${response.statusText}`);
    }

    const data = await response.json();
    const textResponse = data.choices?.[0]?.message?.content;

    if (!textResponse) {
       throw new Error("Respons AI kosong.");
    }

    return NextResponse.json({ response: textResponse });

  } catch (error: any) {
    console.error("Error in /api/chat:", error);
    return NextResponse.json({ error: error.message || "Terjadi kesalahan pada server AI" }, { status: 500 });
  }
}
