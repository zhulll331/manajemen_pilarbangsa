"use client";

import { useState, useMemo } from "react";
import {
  Archive,
  Search,
  ExternalLink,
  Download,
  FileText,
  FileImage,
  File,
  FolderOpen,
  ChevronRight,
} from "lucide-react";
import {
  arsipFiles,
  categories,
  suratSubCategories,
  skSubCategories,
  type ArsipFile,
  type Category,
} from "./data";

const typeIcons: Record<string, React.ReactNode> = {
  PDF: <FileText size={18} className="text-red-500" />,
  DOCX: <File size={18} className="text-blue-500" />,
  PNG: <FileImage size={18} className="text-green-500" />,
  JPG: <FileImage size={18} className="text-green-500" />,
};

const typeColors: Record<string, string> = {
  PDF: "bg-red-50 text-red-600 border-red-100",
  DOCX: "bg-blue-50 text-blue-600 border-blue-100",
  PNG: "bg-green-50 text-green-600 border-green-100",
  JPG: "bg-green-50 text-green-600 border-green-100",
};

const categoryColors: Record<string, string> = {
  Surat: "bg-blue-50 text-blue-700",
  SK: "bg-amber-50 text-amber-700",
  Proposal: "bg-pink-50 text-pink-700",
  LPJ: "bg-teal-50 text-teal-700",
  "Laporan Kegiatan": "bg-indigo-50 text-indigo-700",
  "Rekap Kehadiran": "bg-cyan-50 text-cyan-700",
  "AD-ART": "bg-rose-50 text-rose-700",
  Pedoman: "bg-emerald-50 text-emerald-700",
  "Program Kerja": "bg-orange-50 text-orange-700",
};

export default function ArsipLamaClient() {
  const [activeCategory, setActiveCategory] = useState<Category>("Semua");
  const [search, setSearch] = useState("");
  const [suratSub, setSuratSub] = useState("Semua Surat");
  const [skSub, setSkSub] = useState("Semua SK");

  const filtered = useMemo(() => {
    let result = arsipFiles;

    // Filter by main category
    if (activeCategory !== "Semua") {
      result = result.filter((f) => f.category === activeCategory);
    }

    // Filter by sub-category
    if (activeCategory === "Surat" && suratSub !== "Semua Surat") {
      result = result.filter((f) => f.subCategory === suratSub);
    }
    if (activeCategory === "SK" && skSub !== "Semua SK") {
      result = result.filter((f) => f.subCategory === skSub);
    }

    // Filter by search
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter((f) => f.name.toLowerCase().includes(q));
    }

    return result;
  }, [activeCategory, suratSub, skSub, search]);

  // Count per category for badges
  const counts = useMemo(() => {
    const map: Record<string, number> = {};
    for (const cat of categories) {
      if (cat === "Semua") {
        map[cat] = arsipFiles.length;
      } else {
        map[cat] = arsipFiles.filter((f) => f.category === cat).length;
      }
    }
    return map;
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-amber-100 text-amber-600">
            <Archive size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-800">
              Arsip Periode Sebelumnya
            </h1>
            <p className="text-sm text-gray-500">
              Dokumen administrasi periode 2025-2026 •{" "}
              <span className="font-medium text-gray-700">
                {arsipFiles.length} file
              </span>
            </p>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative max-w-md">
        <Search
          size={18}
          className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
        />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Cari nama dokumen..."
          className="w-full pl-11 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent outline-none transition bg-white"
        />
      </div>

      {/* Category Pills */}
      <div className="flex gap-2 flex-wrap">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => {
              setActiveCategory(cat);
              setSuratSub("Semua Surat");
              setSkSub("Semua SK");
            }}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
              activeCategory === cat
                ? "bg-[var(--color-primary)] text-white shadow-sm"
                : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"
            }`}
          >
            {cat}
            <span
              className={`ml-1.5 text-xs px-1.5 py-0.5 rounded-full ${
                activeCategory === cat
                  ? "bg-white/20 text-white"
                  : "bg-gray-100 text-gray-500"
              }`}
            >
              {counts[cat]}
            </span>
          </button>
        ))}
      </div>

      {/* Sub-category filter for Surat */}
      {activeCategory === "Surat" && (
        <div className="flex gap-2 flex-wrap pl-4 border-l-4 border-blue-200">
          {suratSubCategories.map((sub) => (
            <button
              key={sub}
              onClick={() => setSuratSub(sub)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                suratSub === sub
                  ? "bg-blue-100 text-blue-700 shadow-sm"
                  : "bg-white text-gray-500 border border-gray-200 hover:bg-gray-50"
              }`}
            >
              {sub}
            </button>
          ))}
        </div>
      )}

      {/* Sub-category filter for SK */}
      {activeCategory === "SK" && (
        <div className="flex gap-2 flex-wrap pl-4 border-l-4 border-amber-200">
          {skSubCategories.map((sub) => (
            <button
              key={sub}
              onClick={() => setSkSub(sub)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                skSub === sub
                  ? "bg-amber-100 text-amber-700 shadow-sm"
                  : "bg-white text-gray-500 border border-gray-200 hover:bg-gray-50"
              }`}
            >
              {sub}
            </button>
          ))}
        </div>
      )}

      {/* Results summary */}
      <div className="text-sm text-gray-500">
        Menampilkan{" "}
        <span className="font-semibold text-gray-700">{filtered.length}</span>{" "}
        dokumen
        {activeCategory !== "Semua" && (
          <>
            {" "}
            dalam kategori{" "}
            <span className="font-semibold text-gray-700">
              {activeCategory}
            </span>
          </>
        )}
        {search && (
          <>
            {" "}
            untuk pencarian &quot;
            <span className="font-semibold text-gray-700">{search}</span>&quot;
          </>
        )}
      </div>

      {/* File List */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-gray-400">
            <FolderOpen size={48} className="mb-4 opacity-50" />
            <p className="text-sm">Tidak ada dokumen yang ditemukan.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {filtered.map((file, i) => (
              <FileRow key={`${file.path}-${i}`} file={file} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function FileRow({ file }: { file: ArsipFile }) {
  return (
    <div className="flex items-center gap-4 px-6 py-4 hover:bg-gray-50/80 transition-colors group">
      {/* File Type Icon */}
      <div
        className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${
          typeColors[file.type] || "bg-gray-50 text-gray-500 border-gray-100"
        }`}
      >
        {typeIcons[file.type] || <File size={18} className="text-gray-400" />}
      </div>

      {/* File Info */}
      <div className="flex-1 min-w-0">
        <p className="font-medium text-gray-900 text-sm truncate">
          {file.name}
        </p>
        <div className="flex items-center gap-2 mt-1">
          <span
            className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
              categoryColors[file.category] || "bg-gray-100 text-gray-600"
            }`}
          >
            {file.category}
          </span>
          {file.subCategory && (
            <>
              <ChevronRight size={12} className="text-gray-300" />
              <span className="text-[10px] text-gray-500 font-medium">
                {file.subCategory}
              </span>
            </>
          )}
          <span className="text-[10px] text-gray-400">•</span>
          <span
            className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
              typeColors[file.type] || "bg-gray-100 text-gray-500"
            }`}
          >
            {file.type}
          </span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <a
          href={file.path}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium text-[var(--color-primary)] hover:bg-blue-50 transition-colors border border-blue-100"
          title="Buka di tab baru"
        >
          <ExternalLink size={14} />
          Buka
        </a>
        <a
          href={file.path}
          download
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium text-gray-600 hover:bg-gray-100 transition-colors border border-gray-200"
          title="Unduh file"
        >
          <Download size={14} />
          Unduh
        </a>
      </div>
    </div>
  );
}
