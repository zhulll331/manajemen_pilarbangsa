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
        <div className="bg-white border border-gray-300 rounded-lg p-3 flex items-center gap-3">
          <div className="flex-1 h-8 bg-gray-100 rounded animate-pulse" />
        </div>
      </div>
    ),
  }
);

export function GeminiPromptBoxWrapper() {
  return <GeminiPromptBoxLazy />;
}
