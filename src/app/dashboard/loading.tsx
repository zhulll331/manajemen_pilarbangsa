import { Loader2 } from "lucide-react";

export default function Loading() {
  return (
    <div className="flex flex-col items-center justify-center w-full min-h-[60vh] gap-4">
      <div className="relative">
        <div className="absolute inset-0 bg-blue-500 rounded-full blur-xl opacity-20 animate-pulse"></div>
        <Loader2 size={48} className="text-blue-600 animate-spin relative z-10" />
      </div>
      <p className="text-sm font-medium text-gray-500 animate-pulse">Memuat data...</p>
    </div>
  );
}
