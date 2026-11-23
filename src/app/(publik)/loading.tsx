import { PilarLoader } from "@/components/PilarLoader";

export default function PublikLoading() {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center gap-3 px-5 py-16">
      <PilarLoader size="md" label="Memuat halaman" />
      <p className="text-sm font-medium text-gray-500">Memuat halaman...</p>
    </div>
  );
}
