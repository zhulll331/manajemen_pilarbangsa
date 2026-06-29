"use client";

import { Share2 } from "lucide-react";

export function ShareButton() {
  const handleShare = () => {
    if (typeof window !== "undefined") {
      if (navigator.share) {
        navigator.share({
          title: "UKM Pilar Bangsa",
          text: "Kunjungi portal resmi UKM Pilar Bangsa",
          url: window.location.href,
        }).catch((err) => console.error("Share failed:", err));
      } else {
        navigator.clipboard.writeText(window.location.href);
        alert("Tautan website berhasil disalin ke clipboard!");
      }
    }
  };

  return (
    <button
      onClick={handleShare}
      title="Bagikan Website"
      className="p-2 bg-gray-900 rounded-xl hover:text-white hover:bg-gray-800 transition-colors flex items-center gap-2 px-3 text-sm font-medium cursor-pointer border border-gray-800 text-gray-400 shadow-sm"
    >
      <Share2 className="w-4 h-4 text-[#E31837]" />
      <span>Bagikan Web</span>
    </button>
  );
}
