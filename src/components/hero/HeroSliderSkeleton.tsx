import React from 'react';

export function HeroSliderSkeleton() {
  return (
    <div
      role="status"
      aria-label="Memuat sorotan beranda"
      className="relative w-full overflow-hidden rounded-3xl border border-gray-100 shadow-xl bg-[var(--color-card)] my-2 min-h-[520px] md:min-h-[470px] lg:h-[540px] xl:h-[560px] flex flex-col md:flex-row"
    >
      <div className="w-full h-[240px] sm:h-[300px] md:order-2 md:w-[46%] md:h-full bg-[var(--color-background)]" />
      <div className="w-full md:order-1 md:w-[54%] p-6 sm:p-8 md:p-10 lg:p-14 flex flex-col justify-center space-y-5">
        <div className="h-7 w-44 rounded-full bg-red-50 border border-red-100" />
        <div className="space-y-3">
          <div className="h-10 sm:h-12 w-4/5 rounded-2xl bg-[var(--color-background)]" />
          <div className="h-10 sm:h-12 w-3/5 rounded-2xl bg-red-50" />
        </div>
        <div className="space-y-2 pt-1 max-w-lg">
          <div className="h-4 w-full rounded-lg bg-[var(--color-background)]" />
          <div className="h-4 w-5/6 rounded-lg bg-[var(--color-background)]" />
        </div>
        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <div className="h-12 w-full sm:w-48 rounded-full bg-red-100" />
          <div className="h-12 w-full sm:w-44 rounded-full bg-[var(--color-background)]" />
        </div>
      </div>
    </div>
  );
}
