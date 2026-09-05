/**
 * Multi-Provider AI Failover Router
 * Menjamin ketersediaan chatbot dengan mencoba provider secara berjenjang:
 * 1. Google Gemini (Pintar, kuota 15 RPM / 1500 RPD)
 * 2. Groq Cloud (Inferensi kilat ~7ms, model Qwen 27B / GPT-OSS)
 * 3. OpenRouter (Multi-model free tier)
 * 4. Fallback ramah jika seluruh layanan sedang limit
 */

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

interface RouterOptions {
  systemPrompt: string;
  userMessage: string;
  history?: ChatMessage[];
}

interface ProviderResult {
  text: string;
  provider: string;
  model: string;
}

// 1. Google Gemini Provider
async function callGemini(
  systemPrompt: string,
  userMessage: string,
  history: ChatMessage[] = []
): Promise<ProviderResult> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY tidak ditemukan");

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 12000); // 12s timeout

  try {
    // Format pesan percakapan untuk Gemini
    const contents: any[] = [];

    // Tambahkan riwayat percakapan sebelumnya jika ada
    for (const h of history) {
      contents.push({
        role: h.role === "assistant" ? "model" : "user",
        parts: [{ text: h.content }],
      });
    }

    // Tambahkan pesan terbaru user
    contents.push({
      role: "user",
      parts: [{ text: userMessage }],
    });

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify({
          contents,
          systemInstruction: {
            parts: [{ text: systemPrompt }],
          },
          generationConfig: {
            temperature: 0.2,
            maxOutputTokens: 2048,
          },
        }),
      }
    );

    if (!response.ok) {
      const errJson = await response.json().catch(() => ({}));
      throw new Error(`Gemini HTTP ${response.status}: ${JSON.stringify(errJson)}`);
    }

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text || text.trim() === "") {
      throw new Error("Gemini menghasilkan respons kosong");
    }

    return { text: text.trim(), provider: "Google Gemini", model: "gemini-2.5-flash" };
  } finally {
    clearTimeout(timeoutId);
  }
}

// 2. Groq Cloud Provider (Super Fast)
async function callGroq(
  systemPrompt: string,
  userMessage: string,
  history: ChatMessage[] = []
): Promise<ProviderResult> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) throw new Error("GROQ_API_KEY tidak ditemukan");

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout

  try {
    const messages = [
      { role: "system", content: systemPrompt },
      ...history.map((h) => ({ role: h.role, content: h.content })),
      { role: "user", content: userMessage },
    ];

    // Coba model dengan batas token tinggi di Groq
    const preferredModels = ["groq/compound-mini", "openai/gpt-oss-120b", "qwen/qwen3.8-27b"];
    let lastError: any = null;

    for (const modelName of preferredModels) {
      try {
        const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
          },
          signal: controller.signal,
          body: JSON.stringify({
            model: modelName,
            messages,
            temperature: 0.2,
            max_tokens: 1500,
          }),
        });

        if (!response.ok) {
          const errJson = await response.json().catch(() => ({}));
          throw new Error(`Groq (${modelName}) HTTP ${response.status}: ${JSON.stringify(errJson)}`);
        }

        const data = await response.json();
        const text = data.choices?.[0]?.message?.content;
        if (!text || text.trim() === "") {
          throw new Error(`Groq (${modelName}) respons kosong`);
        }

        return { text: text.trim(), provider: "Groq Cloud", model: modelName };
      } catch (subErr: any) {
        lastError = subErr;
        console.warn(`[AI-Router] Groq model ${modelName} gagal:`, subErr.message);
      }
    }

    throw lastError || new Error("Semua model Groq gagal merespon");
  } finally {
    clearTimeout(timeoutId);
  }
}

// 3. OpenRouter Provider (Fallback Model Gratis)
async function callOpenRouter(
  systemPrompt: string,
  userMessage: string,
  history: ChatMessage[] = []
): Promise<ProviderResult> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) throw new Error("OPENROUTER_API_KEY tidak ditemukan");

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 18000); // 18s timeout untuk antrean free tier

  try {
    const messages = [
      { role: "system", content: systemPrompt },
      ...history.map((h) => ({ role: h.role, content: h.content })),
      { role: "user", content: userMessage },
    ];

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://pilarbangsa.my.id",
        "X-Title": "Pilar Bangsa Management",
      },
      signal: controller.signal,
      body: JSON.stringify({
        models: [
          "google/gemini-2.0-flash-exp:free",
          "meta-llama/llama-3.3-70b-instruct:free",
          "nvidia/nemotron-3-ultra-550b-a55b:free",
        ],
        messages,
        temperature: 0.2,
        max_tokens: 1800,
      }),
    });

    if (!response.ok) {
      const errJson = await response.json().catch(() => ({}));
      throw new Error(`OpenRouter HTTP ${response.status}: ${JSON.stringify(errJson)}`);
    }

    const data = await response.json();
    const text = data.choices?.[0]?.message?.content;
    if (!text || text.trim() === "") {
      throw new Error("OpenRouter menghasilkan respons kosong");
    }

    return {
      text: text.trim(),
      provider: "OpenRouter",
      model: data.model || "free-models",
    };
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * Eksekusi chat dengan failover otomatis
 */
export async function executeAiChatWithFailover({
  systemPrompt,
  userMessage,
  history = [],
}: RouterOptions): Promise<ProviderResult> {
  const errors: { provider: string; error: string }[] = [];

  // 1. Coba Google Gemini
  try {
    const res = await callGemini(systemPrompt, userMessage, history);
    console.log(`[AI-Router] Dilayani oleh: ${res.provider} (${res.model})`);
    return res;
  } catch (err: any) {
    console.warn("[AI-Router] Gemini gagal/limit:", err.message);
    errors.push({ provider: "Google Gemini", error: err.message });
  }

  // 2. Coba Groq Cloud
  try {
    const res = await callGroq(systemPrompt, userMessage, history);
    console.log(`[AI-Router] Dilayani oleh: ${res.provider} (${res.model})`);
    return res;
  } catch (err: any) {
    console.warn("[AI-Router] Groq gagal/limit:", err.message);
    errors.push({ provider: "Groq Cloud", error: err.message });
  }

  // 3. Coba OpenRouter
  try {
    const res = await callOpenRouter(systemPrompt, userMessage, history);
    console.log(`[AI-Router] Dilayani oleh: ${res.provider} (${res.model})`);
    return res;
  } catch (err: any) {
    console.warn("[AI-Router] OpenRouter gagal/limit:", err.message);
    errors.push({ provider: "OpenRouter", error: err.message });
  }

  // 4. Semua provider gagal -> Lempar error yang nanti ditangkap oleh route handler
  throw new Error(
    `Semua provider AI sedang mengalami limit/gangguan: ${JSON.stringify(errors)}`
  );
}
