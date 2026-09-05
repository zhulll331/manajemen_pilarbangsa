"use client";

import dynamic from "next/dynamic";

// Wrapper client component untuk lazy load GeminiPromptBox
// Ini mengisolasi chunk Turbopack agar terpisah dari server component tree
const GeminiPromptBoxLazy = dynamic(
  () => import("./GeminiPromptBox").then((mod) => mod.GeminiPromptBox),
  {
    ssr: false,
    loading: () => (
      <div className="w-full max-w-4xl mx-auto">
        <div className="bg-white border border-gray-200/90 rounded-full py-3 sm:py-4 px-6 sm:px-8 shadow-2xl shadow-gray-200/60 flex items-center gap-4">
          <div className="flex-1 h-6 bg-gray-100 rounded-full animate-pulse" />
        </div>
      </div>
    ),
  }
);

export function GeminiPromptBoxWrapper() {
  return <GeminiPromptBoxLazy />;
}
