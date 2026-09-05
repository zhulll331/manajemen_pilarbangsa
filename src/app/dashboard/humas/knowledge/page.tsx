import KnowledgeClient from "./KnowledgeClient";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Basis Pengetahuan AI | Humas Pilar Bangsa",
  description: "Kelola dokumen AD/ART, SOP, dan Pedoman Organisasi untuk Pilar Asisten AI",
};

export default function HumasKnowledgePage() {
  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <span>🧠</span> Basis Pengetahuan AI
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            Pusat kendali dokumen resmi (AD/ART, SOP, Pedoman) yang menjadi sumber pengetahuan dan aturan bagi Pilar Asisten AI.
          </p>
        </div>
      </div>

      <KnowledgeClient />
    </div>
  );
}
