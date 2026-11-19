import { PilarLoader } from "@/components/PilarLoader";

export default function Loading() {
  return (
    <div className="flex flex-col items-center justify-center w-full min-h-[60vh] gap-4">
      <PilarLoader size="md" label="Memuat data dashboard" />
      <p className="text-sm font-medium text-gray-500">Memuat data...</p>
    </div>
  );
}
