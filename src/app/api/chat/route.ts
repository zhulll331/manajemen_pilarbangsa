import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { AD_ART_CONTEXT } from "@/utils/context/ad_art";

export async function POST(request: Request) {
  try {
    const { message, currentPath = "/" } = await request.json();

    if (!message) {
      return NextResponse.json({ error: "Pesan tidak boleh kosong" }, { status: 400 });
    }

    // 1. Inisialisasi Google Gemini SDK
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY belum dikonfigurasi di variabel lingkungan");
    }

    const genAI = new GoogleGenerativeAI(apiKey);

    // 2. Rakit System Prompt khusus Konten Website (Super Ringan & Cepat)
    const systemPrompt = `Kamu adalah Pilar Asisten, AI Co-Pilot resmi UKM Pilar Bangsa. Tugas utamamu adalah menjawab pertanyaan pengunjung hanya berdasarkan informasi, sejarah, visi misi, dan AD/ART UKM Pilar Bangsa berikut: ${AD_ART_CONTEXT}. Jawablah dengan bahasa yang ramah, profesional, dan ringkas. Jangan menjawab hal-hal di luar konteks organisasi UKM Pilar Bangsa.`;

    // 3. Minta respons Gemini 3.5 Flash (dengan mekanisme Retry Otomatis jika server sedang sibuk / 503 High Demand)
    const model = genAI.getGenerativeModel({ 
      model: "gemini-3.5-flash",
      systemInstruction: systemPrompt
    });

    try {
      const result = await model.generateContent(message);
      const textResponse = result.response.text();
      return NextResponse.json({ response: textResponse });
    } catch (primaryError: any) {
      console.warn("gemini-3.5-flash sedang sibuk (503), melakukan percobaan ulang (retry)...", primaryError.message);
      
      // Jeda 1 detik sebelum retry
      await new Promise((resolve) => setTimeout(resolve, 1000));

      const retryResult = await model.generateContent(message);
      const retryTextResponse = retryResult.response.text();
      return NextResponse.json({ response: retryTextResponse });
    }

  } catch (error: any) {
    console.error("Error in /api/chat:", error);
    return NextResponse.json({ error: error.message || "Terjadi kesalahan pada server AI" }, { status: 500 });
  }
}
