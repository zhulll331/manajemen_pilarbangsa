import { PilarLoader } from "@/components/PilarLoader";

export default function ArsipLoading() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[55vh] py-12 gap-3">
      <PilarLoader size="md" label="Memuat arsip UKM" />
      <p className="text-sm font-medium text-gray-500">Memuat arsip resmi UKM Pilar Bangsa...</p>
    </div>
  );
}
