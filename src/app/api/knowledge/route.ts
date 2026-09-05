import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { createClient } from "@/utils/supabase/server";
import { invalidateKnowledgeCache } from "@/lib/ai/knowledge";

export const runtime = "nodejs";

const KNOWLEDGE_DIR = path.join(process.cwd(), "src", "data", "knowledge_base");

function ensureKnowledgeDir() {
  if (!fs.existsSync(KNOWLEDGE_DIR)) {
    fs.mkdirSync(KNOWLEDGE_DIR, { recursive: true });
  }
}

function sanitizeSlug(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9_]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 60) || "dokumen";
}

// GET: Mengambil seluruh daftar dokumen knowledge base
export async function GET() {
  try {
    ensureKnowledgeDir();
    const supabase = await createClient();

    // 1. Ambil metadata dari database
    const { data: dbDocs, error } = await supabase
      .from("knowledge_docs")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.warn("[API Knowledge] Warning query DB:", error.message);
    }

    // 2. Baca file fisik dari filesystem
    const diskFiles = fs.readdirSync(KNOWLEDGE_DIR).filter((f) => f.endsWith(".md"));

    // Map untuk menggabungkan metadata DB dengan status fisik file
    const dbMap = new Map<string, any>();
    if (dbDocs) {
      for (const d of dbDocs) {
        dbMap.set(d.slug, d);
      }
    }

    const resultDocs: Array<{
      slug: string;
      title: string;
      original_filename: string;
      file_type: string;
      file_size: number;
      created_at: string;
      updated_at: string;
      exists_on_disk: boolean;
    }> = [];

    for (const file of diskFiles) {
      const slug = file.replace(/\.md$/, "");
      const filePath = path.join(KNOWLEDGE_DIR, file);
      const stat = fs.statSync(filePath);

      const dbItem = dbMap.get(slug);
      if (dbItem) {
        resultDocs.push({
          ...dbItem,
          file_size: stat.size,
          updated_at: stat.mtime.toISOString(),
          exists_on_disk: true,
        });
        dbMap.delete(slug);
      } else {
        // File ada di disk tapi belum ada di DB (misal manual paste atau file legacy)
        const prettyTitle = slug
          .split("_")
          .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
          .join(" ");

        resultDocs.push({
          slug,
          title: prettyTitle,
          original_filename: file,
          file_type: "md",
          file_size: stat.size,
          created_at: stat.birthtime.toISOString(),
          updated_at: stat.mtime.toISOString(),
          exists_on_disk: true,
        });
      }
    }

    return NextResponse.json({
      success: true,
      count: resultDocs.length,
      docs: resultDocs,
    });
  } catch (err: any) {
    console.error("[API Knowledge GET] Error:", err);
    return NextResponse.json(
      { error: err.message || "Gagal mengambil daftar dokumen" },
      { status: 500 }
    );
  }
}

// POST: Upload file (PDF, DOCX, TXT, MD) & konversi otomatis ke Markdown
export async function POST(request: Request) {
  try {
    ensureKnowledgeDir();
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const titleInput = (formData.get("title") as string | null)?.trim();
    const slugInput = (formData.get("slug") as string | null)?.trim();

    if (!file) {
      return NextResponse.json(
        { error: "File dokumen wajib diunggah" },
        { status: 400 }
      );
    }

    // Validasi ukuran (maksimal 10MB)
    const MAX_SIZE = 10 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { error: "Ukuran file terlalu besar (maksimal 10 MB)" },
        { status: 400 }
      );
    }

    const originalName = file.name;
    const ext = path.extname(originalName).toLowerCase().replace(/^\./, "");
    const allowedExts = ["pdf", "docx", "txt", "md"];

    if (!allowedExts.includes(ext)) {
      return NextResponse.json(
        { error: `Tipe file .${ext} tidak didukung. Harap unggah PDF, DOCX, TXT, atau Markdown.` },
        { status: 400 }
      );
    }

    const title = titleInput || originalName.replace(/\.[^/.]+$/, "");
    const baseSlug = slugInput ? sanitizeSlug(slugInput) : sanitizeSlug(title);
    const slug = baseSlug || "dokumen_" + Date.now();

    const buffer = Buffer.from(await file.arrayBuffer());
    let extractedText = "";

    // 1. Ekstraksi teks sesuai tipe file
    if (ext === "txt" || ext === "md") {
      extractedText = buffer.toString("utf-8");
    } else if (ext === "docx") {
      const mammoth = await import("mammoth");
      const result = await mammoth.extractRawText({ buffer });
      extractedText = result.value || "";
    } else if (ext === "pdf") {
      const { PDFParse } = await import("pdf-parse");
      const parser = new PDFParse({ data: buffer });
      const parseResult = await parser.getText();
      extractedText = parseResult.text || "";
      await parser.destroy();
    }

    // Bersihkan teks ekstraksi
    extractedText = extractedText.trim();
    if (!extractedText) {
      return NextResponse.json(
        { error: "Gagal mengekstrak teks dari dokumen. Pastikan file tidak kosong atau terenkripsi." },
        { status: 400 }
      );
    }

    // 2. Format isi menjadi dokumen Markdown yang rapi
    const formattedMarkdown = `# ${title.toUpperCase()}\n\n*Sumber File: ${originalName} (Diunggah pada ${new Date().toLocaleDateString("id-ID")})*\n\n---\n\n${extractedText}\n`;

    // 3. Simpan file fisik ke disk
    const targetFilePath = path.join(KNOWLEDGE_DIR, `${slug}.md`);
    fs.writeFileSync(targetFilePath, formattedMarkdown, "utf-8");

    // 4. Catat/Update metadata di Supabase
    try {
      const supabase = await createClient();
      const { data: { user } } = await supabase.auth.getUser();

      await supabase.from("knowledge_docs").upsert(
        {
          slug,
          title,
          original_filename: originalName,
          file_type: ext,
          file_size: file.size,
          uploaded_by: user?.id || null,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "slug" }
      );
    } catch (dbErr) {
      console.warn("[API Knowledge POST] DB upsert warning:", dbErr);
    }

    // 5. Reset cache AI seketika
    invalidateKnowledgeCache();

    return NextResponse.json({
      success: true,
      message: `Dokumen "${title}" berhasil dikonversi dan disimpan ke basis pengetahuan AI!`,
      doc: {
        slug,
        title,
        original_filename: originalName,
        file_type: ext,
        file_size: file.size,
      },
    });
  } catch (err: any) {
    console.error("[API Knowledge POST] Error:", err);
    return NextResponse.json(
      { error: err.message || "Terjadi kesalahan saat memproses file" },
      { status: 500 }
    );
  }
}
