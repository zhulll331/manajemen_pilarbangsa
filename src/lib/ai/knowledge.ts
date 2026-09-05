import fs from "fs";
import path from "path";
import { createClient } from "@supabase/supabase-js";
import { AD_ART_CONTEXT } from "@/utils/context/ad_art";

// In-memory cache untuk data Supabase agar tidak query berulang kali di setiap ketikan chat
let cachedMembersContext: string | null = null;
let cachedProgramsContext: string | null = null;
let lastDbFetchTime = 0;
const DB_CACHE_MS = 5 * 60 * 1000; // 5 menit

export function invalidateKnowledgeCache(): void {
  cachedMembersContext = null;
  cachedProgramsContext = null;
  lastDbFetchTime = 0;
  console.log("[Knowledge] In-memory cache berhasil di-reset seketika.");
}

function cleanDocText(text: string): string {
  return text
    .replace(/\r\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n") // Hapus baris kosong berlebih
    .trim();
}

/**
 * Membaca dokumen dari knowledge_base secara selektif & hemat token
 */
function getSelectedKnowledgeDocs(fullQuery: string): string {
  try {
    const dirPath = path.join(process.cwd(), "src", "data", "knowledge_base");
    if (!fs.existsSync(dirPath)) return "";

    const files = fs.readdirSync(dirPath).filter((f) => f.endsWith(".md"));
    if (files.length === 0) return "";

    // Deteksi intensi pertanyaan berdasarkan kata kunci
    const q = fullQuery.toLowerCase();
    const isAdArtQuery =
      /(ad[\s/_-]?art|bab\s*\d+|pasal\s*\d+|asas|landasan|visi|misi|rua|mubes|musyawarah|rapat|hak|kewajiban)/i.test(
        q
      );
    const isPedomanQuery =
      /(pedoman|buku|sop|panitia|proposal|laporan|administrasi|atribut|seragam|pdh|lambang|bendera|sanksi|keorganisasian)/i.test(
        q
      );

    let selectedFiles = files;

    // Jika user secara spesifik bertanya tentang AD/ART, hemat token dengan TIDAK memuat Buku Pedoman
    if (isAdArtQuery && !isPedomanQuery) {
      const adArtFiles = files.filter((f) => /ad[\s/_-]?art/i.test(f));
      if (adArtFiles.length > 0) {
        selectedFiles = adArtFiles;
      }
    }
    // Jika user secara spesifik bertanya tentang Buku Pedoman / SOP, hemat token dengan TIDAK memuat AD/ART
    else if (isPedomanQuery && !isAdArtQuery) {
      const pedomanFiles = files.filter((f) => /pedoman|panduan|sop/i.test(f));
      if (pedomanFiles.length > 0) {
        selectedFiles = pedomanFiles;
      }
    }

    let combined = "";
    for (const file of selectedFiles) {
      const raw = fs.readFileSync(path.join(dirPath, file), "utf-8");
      const clean = cleanDocText(raw);
      combined += `\n\n=== DOKUMEN RESMI: ${file.toUpperCase()} ===\n` + clean;
    }

    return combined;
  } catch (err) {
    console.error("Gagal membaca folder knowledge_base:", err);
    return "";
  }
}

export interface KnowledgeOptions {
  userMessage?: string;
  history?: Array<{ role: string; content: string }>;
}

export async function getDynamicKnowledge(
  optionsOrQuery?: KnowledgeOptions | string
): Promise<string> {
  const now = Date.now();

  let userMessage = "";
  let historyText = "";

  if (typeof optionsOrQuery === "string") {
    userMessage = optionsOrQuery;
  } else if (optionsOrQuery) {
    userMessage = optionsOrQuery.userMessage || "";
    historyText = (optionsOrQuery.history || []).map((h) => h.content).join(" ");
  }

  const fullQuery = (userMessage + " " + historyText).toLowerCase().trim();

  // Ambil data dari Supabase jika cache kedaluwarsa
  if (!cachedMembersContext || now - lastDbFetchTime > DB_CACHE_MS) {
    try {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const supabaseKey =
        process.env.SUPABASE_SERVICE_ROLE_KEY ||
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

      if (supabaseUrl && supabaseKey) {
        const supabase = createClient(supabaseUrl, supabaseKey);

        // 1. Data Pengurus Aktif (Format Ringkas & Hemat Token)
        const { data: members, error: membersError } = await supabase
          .from("members")
          .select("name, division, status, faculty, study_program")
          .order("created_at", { ascending: true });

        if (!membersError && members && members.length > 0) {
          const activeOfficers = members.filter(
            (m) =>
              m.status === "Pengurus Aktif" ||
              (m.division && m.division.trim() !== "" && m.status !== "Alumni")
          );

          if (activeOfficers.length > 0) {
            let structText = `## STRUKTUR DAN DAFTAR PENGURUS AKTIF (SUMBER: SEKRETARIAT):\n`;
            activeOfficers.forEach((m) => {
              const div = m.division?.trim() || "Pengurus";
              const extra = [m.faculty, m.study_program].filter(Boolean).join(" - ");
              structText += `- **${m.name}**: ${div}${extra ? ` (${extra})` : ""}\n`;
            });
            cachedMembersContext = structText.trim();
          }
        }

        // 2. Data Program Kerja
        const { data: programs, error: programsError } = await supabase
          .from("programs")
          .select("title, description, division, status")
          .limit(10);

        if (!programsError && programs && programs.length > 0) {
          let progText = `## DAFTAR PROGRAM KERJA UTAMA:\n`;
          programs.forEach((p) => {
            progText += `- **${p.title}** (${p.division || "-"}, ${p.status || "Aktif"})${
              p.description ? `: ${p.description.slice(0, 100)}` : ""
            }\n`;
          });
          cachedProgramsContext = progText.trim();
        }

        lastDbFetchTime = now;
      }
    } catch (err) {
      console.warn("[Knowledge] Gagal fetch Supabase:", err);
    }
  }

  // 3. Seleksi cerdas dokumen knowledge base lokal
  const localDocs = getSelectedKnowledgeDocs(fullQuery);

  // 4. Seleksi apakah perlu menyertakan daftar pengurus & proker (hemat token jika hanya tanya pasal)
  const isSpecificArticleQuery =
    /(bab\s*\d+|pasal\s*\d+|ayat\s*\d+)/i.test(fullQuery) &&
    !/(siapa|nama|ketua|sekretaris|bendahara|pengurus|anggota|struktur)/i.test(fullQuery);

  let structuralSection = "";
  if (!isSpecificArticleQuery && cachedMembersContext) {
    structuralSection = `\n\n${cachedMembersContext}`;
  }

  const isProgramQuery = /(proker|program\s*kerja|kegiatan|acara|agenda)/i.test(fullQuery);
  let programSection = "";
  if (isProgramQuery && cachedProgramsContext) {
    programSection = `\n\n${cachedProgramsContext}`;
  }

  const result = `
${localDocs || AD_ART_CONTEXT}
${structuralSection}
${programSection}
`.trim();

  return result;
}
