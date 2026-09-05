import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { createClient } from "@/utils/supabase/server";
import { invalidateKnowledgeCache } from "@/lib/ai/knowledge";

export const runtime = "nodejs";

const KNOWLEDGE_DIR = path.join(process.cwd(), "src", "data", "knowledge_base");

// GET: Mengambil isi dokumen markdown untuk editor/preview
export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const cleanSlug = slug.replace(/[^a-z0-9_]/gi, "");
    const filePath = path.join(KNOWLEDGE_DIR, `${cleanSlug}.md`);

    if (!fs.existsSync(filePath)) {
      return NextResponse.json(
        { error: "Dokumen tidak ditemukan di penyimpanan server" },
        { status: 404 }
      );
    }

    const content = fs.readFileSync(filePath, "utf-8");
    const stat = fs.statSync(filePath);

    return NextResponse.json({
      success: true,
      slug: cleanSlug,
      content,
      file_size: stat.size,
      updated_at: stat.mtime.toISOString(),
    });
  } catch (err: any) {
    console.error("[API Knowledge slug GET] Error:", err);
    return NextResponse.json(
      { error: err.message || "Gagal membaca isi dokumen" },
      { status: 500 }
    );
  }
}

// PUT: Menyimpan editan teks markdown dari UI
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const cleanSlug = slug.replace(/[^a-z0-9_]/gi, "");
    const filePath = path.join(KNOWLEDGE_DIR, `${cleanSlug}.md`);

    const { content, title } = await request.json();

    if (typeof content !== "string") {
      return NextResponse.json(
        { error: "Konten dokumen tidak valid" },
        { status: 400 }
      );
    }

    // Tulis update isi ke file markdown
    fs.writeFileSync(filePath, content, "utf-8");

    // Update metadata di Supabase jika ada
    try {
      const supabase = await createClient();
      const updateData: any = {
        updated_at: new Date().toISOString(),
        file_size: Buffer.byteLength(content, "utf-8"),
      };
      if (title && typeof title === "string") {
        updateData.title = title.trim();
      }

      await supabase
        .from("knowledge_docs")
        .update(updateData)
        .eq("slug", cleanSlug);
    } catch (dbErr) {
      console.warn("[API Knowledge slug PUT] DB update warning:", dbErr);
    }

    // Invalidate AI cache seketika
    invalidateKnowledgeCache();

    return NextResponse.json({
      success: true,
      message: "Isi dokumen berhasil diperbarui dan otak AI langsung tersinkron!",
    });
  } catch (err: any) {
    console.error("[API Knowledge slug PUT] Error:", err);
    return NextResponse.json(
      { error: err.message || "Gagal memperbarui isi dokumen" },
      { status: 500 }
    );
  }
}

// DELETE: Menghapus dokumen dari disk dan database
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const cleanSlug = slug.replace(/[^a-z0-9_]/gi, "");
    const filePath = path.join(KNOWLEDGE_DIR, `${cleanSlug}.md`);

    // 1. Hapus file fisik dari disk jika ada
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    // 2. Hapus catatan dari database Supabase
    try {
      const supabase = await createClient();
      await supabase.from("knowledge_docs").delete().eq("slug", cleanSlug);
    } catch (dbErr) {
      console.warn("[API Knowledge slug DELETE] DB delete warning:", dbErr);
    }

    // 3. Invalidate cache AI seketika
    invalidateKnowledgeCache();

    return NextResponse.json({
      success: true,
      message: `Dokumen "${cleanSlug}" berhasil dihapus dari sistem!`,
    });
  } catch (err: any) {
    console.error("[API Knowledge slug DELETE] Error:", err);
    return NextResponse.json(
      { error: err.message || "Gagal menghapus dokumen" },
      { status: 500 }
    );
  }
}
