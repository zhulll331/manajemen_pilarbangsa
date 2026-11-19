import { PilarLoader } from "@/components/PilarLoader";

export default function SekretarisLoading() {
  return (
    <div className="flex flex-col items-center justify-center w-full min-h-[calc(100dvh-190px)] gap-3.5 text-center">
      <PilarLoader size="md" label="Memuat halaman Sekretaris" />
      <p className="text-xs font-medium text-[#686e68] tracking-wide">
        Sabarr yah...
      </p>
    </div>
  );
}
