'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import {
  FALLBACK_HERO_SLIDE,
  HeroSlideItem,
  shouldUnoptimizeHeroImage,
} from '@/lib/heroSlides';

interface HeroSlideMediaProps {
  slides: HeroSlideItem[];
  currentIndex: number;
}

export function HeroSlideMedia({ slides, currentIndex }: HeroSlideMediaProps) {
  const [failedIds, setFailedIds] = useState<Record<string, boolean>>({});

  return (
    <div className="pb-hero-media-stage relative w-full h-[240px] sm:h-[300px] md:absolute md:inset-y-0 md:right-0 md:w-[58%] lg:w-[57%] md:h-full overflow-hidden shrink-0 bg-[var(--color-background)]">
      {slides.map((slide, index) => {
        const isActive = index === currentIndex;
        const src = failedIds[slide.id] ? FALLBACK_HERO_SLIDE.image_url : slide.image_url;
        const altText = slide.badge ? `${slide.badge} — ${slide.title}` : slide.title;

        return (
          <div
            key={slide.id}
            aria-hidden={!isActive}
            className={`pb-hero-photo-layer absolute inset-0 ${
              isActive ? 'pb-hero-photo-layer--active z-10' : 'z-0'
            }`}
          >
            <Image
              src={src}
              alt={isActive ? altText : ''}
              fill
              loading={index === 0 ? 'eager' : 'lazy'}
              fetchPriority={index === 0 ? 'high' : 'low'}
              unoptimized={shouldUnoptimizeHeroImage(src)}
              sizes="(max-width: 767px) 100vw, (max-width: 1280px) 58vw, 740px"
              className="pb-hero-photo-img object-cover object-[center_22%]"
              onError={() => {
                if (!failedIds[slide.id]) {
                  setFailedIds((prev) => ({ ...prev, [slide.id]: true }));
                }
              }}
            />
          </div>
        );
      })}

      <div
        className="pb-hero-media-fade absolute inset-0 pointer-events-none z-20"
        aria-hidden="true"
      />
    </div>
  );
}
