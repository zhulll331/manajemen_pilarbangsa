import { PilarLoader } from "@/components/PilarLoader";

export default function KegiatanLoading() {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center gap-3 px-5 py-16">
      <PilarLoader size="md" label="Memuat daftar kegiatan" />
      <p className="text-sm font-medium text-gray-500">Memuat daftar kegiatan...</p>
    </div>
  );
}
