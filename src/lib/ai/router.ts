/**
 * Multi-Provider AI Failover Router
 * Menjamin ketersediaan chatbot dan parser JSON dengan mencoba provider secara berjenjang:
 * 1. Google Gemini (Pintar, kuota 15 RPM / 1500 RPD)
 * 2. Groq Cloud (Inferensi kilat)
 * 3. OpenRouter (Multi-model free tier)
 */

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export interface RouterOptions {
  systemPrompt: string;
  userMessage: string;
  history?: ChatMessage[];
  jsonMode?: boolean;
  maxTokens?: number;
  validateResponse?: (text: string) => boolean;
}

export interface ProviderResult {
  text: string;
  provider: string;
  model: string;
}

function toErrorMessage(err: unknown): string {
  return err instanceof Error ? err.message : String(err);
}

// 1. Google Gemini Provider
async function callGemini(
  systemPrompt: string,
  userMessage: string,
  history: ChatMessage[] = [],
  jsonMode = false,
  maxTokens?: number
): Promise<ProviderResult> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY tidak ditemukan");

  const contents: Array<{
    role: "user" | "model";
    parts: Array<{ text: string }>;
  }> = [];

  for (const h of history) {
    contents.push({
      role: h.role === "assistant" ? "model" : "user",
      parts: [{ text: h.content }],
    });
  }

  contents.push({
    role: "user",
    parts: [{ text: userMessage }],
  });

  const generationConfig: Record<string, unknown> = {
    temperature: jsonMode ? 0.1 : 0.2,
    maxOutputTokens: maxTokens ?? (jsonMode ? 4096 : 2048),
  };

  if (jsonMode) {
    generationConfig.responseMimeType = "application/json";
    generationConfig.thinkingConfig = { thinkingBudget: 0 };
  }

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      signal: AbortSignal.timeout(jsonMode ? 25000 : 12000),
      body: JSON.stringify({
        contents,
        systemInstruction: {
          parts: [{ text: systemPrompt }],
        },
        generationConfig,
      }),
    }
  );

  if (!response.ok) {
    const errJson = await response.json().catch(() => ({}));
    throw new Error(`Gemini HTTP ${response.status}: ${JSON.stringify(errJson)}`);
  }

  const data = (await response.json()) as {
    candidates?: Array<{
      content?: { parts?: Array<{ text?: string }> };
    }>;
  };
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text || text.trim() === "") {
    throw new Error("Gemini menghasilkan respons kosong");
  }

  return { text: text.trim(), provider: "Google Gemini", model: "gemini-2.5-flash" };
}

// 2. Groq Cloud Provider (Super Fast)
async function callGroq(
  systemPrompt: string,
  userMessage: string,
  history: ChatMessage[] = [],
  jsonMode = false,
  maxTokens?: number
): Promise<ProviderResult> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) throw new Error("GROQ_API_KEY tidak ditemukan");

  const signal = AbortSignal.timeout(jsonMode ? 18000 : 10000);
  const messages = [
    { role: "system", content: systemPrompt },
    ...history.map((h) => ({ role: h.role, content: h.content })),
    { role: "user", content: userMessage },
  ];

  const preferredModels = jsonMode
    ? ["llama-3.3-70b-versatile", "openai/gpt-oss-120b", "qwen/qwen3-32b"]
    : ["groq/compound-mini", "openai/gpt-oss-120b", "qwen/qwen3.8-27b"];
  let lastError: unknown = null;

  for (const modelName of preferredModels) {
    try {
      const payload: Record<string, unknown> = {
        model: modelName,
        messages,
        temperature: jsonMode ? 0.1 : 0.2,
        max_tokens: maxTokens ?? (jsonMode ? 4096 : 1500),
      };

      if (jsonMode) {
        payload.response_format = { type: "json_object" };
      }

      const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        signal,
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errJson = await response.json().catch(() => ({}));
        throw new Error(`Groq (${modelName}) HTTP ${response.status}: ${JSON.stringify(errJson)}`);
      }

      const data = (await response.json()) as {
        choices?: Array<{ message?: { content?: string } }>;
      };
      const text = data.choices?.[0]?.message?.content;
      if (!text || text.trim() === "") {
        throw new Error(`Groq (${modelName}) respons kosong`);
      }

      return { text: text.trim(), provider: "Groq Cloud", model: modelName };
    } catch (subErr: unknown) {
      lastError = subErr;
      console.warn(`[AI-Router] Groq model ${modelName} gagal:`, toErrorMessage(subErr));
      if (signal.aborted) break;
    }
  }

  throw lastError instanceof Error
    ? lastError
    : new Error("Semua model Groq gagal merespon");
}

// 3. OpenRouter Provider (Fallback Model Gratis)
async function callOpenRouter(
  systemPrompt: string,
  userMessage: string,
  history: ChatMessage[] = [],
  jsonMode = false,
  maxTokens?: number
): Promise<ProviderResult> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) throw new Error("OPENROUTER_API_KEY tidak ditemukan");

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
    signal: AbortSignal.timeout(jsonMode ? 22000 : 18000),
    body: JSON.stringify({
      models: [
        "google/gemini-2.0-flash-exp:free",
        "meta-llama/llama-3.3-70b-instruct:free",
        "nvidia/nemotron-3-ultra-550b-a55b:free",
      ],
      messages,
      temperature: jsonMode ? 0.1 : 0.2,
      max_tokens: maxTokens ?? (jsonMode ? 4096 : 1800),
    }),
  });

  if (!response.ok) {
    const errJson = await response.json().catch(() => ({}));
    throw new Error(`OpenRouter HTTP ${response.status}: ${JSON.stringify(errJson)}`);
  }

  const data = (await response.json()) as {
    model?: string;
    choices?: Array<{ message?: { content?: string } }>;
  };
  const text = data.choices?.[0]?.message?.content;
  if (!text || text.trim() === "") {
    throw new Error("OpenRouter menghasilkan respons kosong");
  }

  return {
    text: text.trim(),
    provider: "OpenRouter",
    model: data.model || "free-models",
  };
}

/**
 * Eksekusi chat dengan failover otomatis + validasi opsional agar JSON gagal otomatis failover
 */
export async function executeAiChatWithFailover({
  systemPrompt,
  userMessage,
  history = [],
  jsonMode = false,
  maxTokens,
  validateResponse,
}: RouterOptions): Promise<ProviderResult> {
  const errors: { provider: string; error: string }[] = [];

  const runProvider = async (
    label: string,
    fn: () => Promise<ProviderResult>
  ): Promise<ProviderResult | null> => {
    try {
      const res = await fn();
      if (validateResponse && !validateResponse(res.text)) {
        throw new Error(`${res.provider} mengembalikan format respons tidak valid`);
      }
      console.log(`[AI-Router] Dilayani oleh: ${res.provider} (${res.model})`);
      return res;
    } catch (err: unknown) {
      const msg = toErrorMessage(err);
      console.warn(`[AI-Router] ${label} gagal/limit:`, msg);
      errors.push({ provider: label, error: msg });
      return null;
    }
  };

  const geminiRes = await runProvider("Google Gemini", () =>
    callGemini(systemPrompt, userMessage, history, jsonMode, maxTokens)
  );
  if (geminiRes) return geminiRes;

  const groqRes = await runProvider("Groq Cloud", () =>
    callGroq(systemPrompt, userMessage, history, jsonMode, maxTokens)
  );
  if (groqRes) return groqRes;

  const openRouterRes = await runProvider("OpenRouter", () =>
    callOpenRouter(systemPrompt, userMessage, history, jsonMode, maxTokens)
  );
  if (openRouterRes) return openRouterRes;

  throw new Error(
    `Semua provider AI sedang mengalami limit/gangguan: ${JSON.stringify(errors)}`
  );
}
