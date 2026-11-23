import { PilarLoader } from "@/components/PilarLoader";

export default function KegiatanDetailLoading() {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center gap-3 px-5 py-16">
      <PilarLoader size="md" label="Memuat detail kegiatan" />
      <p className="text-sm font-medium text-gray-500">Memuat detail kegiatan...</p>
    </div>
  );
}
