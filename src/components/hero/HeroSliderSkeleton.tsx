import React from 'react';

export function HeroSliderSkeleton() {
  return (
    <div
      role="status"
      aria-label="Memuat sorotan beranda"
      className="relative w-full overflow-hidden border-b border-gray-200 bg-[var(--color-card)] md:min-h-[480px] lg:min-h-[540px] flex flex-col md:flex-row"
    >
      <div className="w-full h-[240px] sm:h-[300px] md:absolute md:inset-y-0 md:right-0 md:w-[54%] md:h-full bg-[var(--color-background)]" />
      <div className="relative z-10 w-full max-w-6xl mx-auto px-5 sm:px-8 flex items-center">
        <div className="w-full md:w-[54%] py-8 md:py-14 space-y-5">
          <div className="h-7 w-44 rounded-full bg-red-50 border border-red-100" />
          <div className="space-y-3">
            <div className="h-10 sm:h-12 w-4/5 rounded-lg bg-[var(--color-background)]" />
            <div className="h-10 sm:h-12 w-3/5 rounded-lg bg-red-50" />
          </div>
          <div className="space-y-2 pt-1 max-w-lg">
            <div className="h-4 w-full rounded-lg bg-[var(--color-background)]" />
            <div className="h-4 w-5/6 rounded-lg bg-[var(--color-background)]" />
          </div>
          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <div className="h-11 w-full sm:w-48 rounded-lg bg-red-100" />
            <div className="h-11 w-full sm:w-44 rounded-lg bg-[var(--color-background)]" />
          </div>
        </div>
      </div>
    </div>
  );
}
