import { PilarLoader } from "@/components/PilarLoader";

export default function TwibbonLoading() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[55vh] py-12 gap-3">
      <PilarLoader size="md" label="Memuat katalog twibbon" />
      <p className="text-sm font-medium text-gray-500">Memuat kampanye Twibbon Pilar Bangsa...</p>
    </div>
  );
}
