import Image from "next/image";
import React from "react";
import logoUkm from "@/app/logo-ukm.png";

export function LoadingLogo({ fullScreen = true }: { fullScreen?: boolean }) {
  const content = (
    <div className="flex flex-col items-center justify-center space-y-4 p-6">
      {/* Logo container with combined pulse and bounce effect */}
      <div className="relative w-24 h-24 sm:w-28 sm:h-28 animate-pulse flex items-center justify-center bg-gradient-to-tr from-blue-50 to-indigo-50/50 p-3 rounded-3xl shadow-2xl shadow-blue-500/15 border border-blue-100/80 backdrop-blur-md transition-all">
        <div className="absolute inset-0 rounded-3xl bg-blue-400/10 animate-ping opacity-25"></div>
        <div className="relative w-full h-full animate-[bounce_2s_infinite]">
          <Image
            src={logoUkm}
            alt="Pilar Bangsa Logo"
            fill
            sizes="(max-width: 768px) 96px, 112px"
            className="object-contain p-2 filter drop-shadow-md"
            priority
          />
        </div>
      </div>

      {/* Elegant text indicator with animated dots */}
      <div className="flex items-center space-x-1.5 text-sm sm:text-base font-semibold bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-700 bg-clip-text text-transparent tracking-wide">
        <span>Merangkai ide dan inovasi</span>
        <span className="inline-flex space-x-1 items-center">
          <span className="animate-bounce inline-block h-1.5 w-1.5 bg-blue-600 rounded-full [animation-delay:-0.3s]"></span>
          <span className="animate-bounce inline-block h-1.5 w-1.5 bg-blue-600 rounded-full [animation-delay:-0.15s]"></span>
          <span className="animate-bounce inline-block h-1.5 w-1.5 bg-blue-600 rounded-full"></span>
        </span>
      </div>
    </div>
  );

  if (!fullScreen) {
    return (
      <div className="w-full py-12 flex items-center justify-center bg-white/50 backdrop-blur-sm rounded-2xl my-4">
        {content}
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[9999] min-h-screen w-full flex items-center justify-center bg-white/80 backdrop-blur-md transition-all duration-300">
      {content}
    </div>
  );
}
