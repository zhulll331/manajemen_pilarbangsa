'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, Pause, Play } from 'lucide-react';
import { createClient } from '@/utils/supabase/client';
import {
  FALLBACK_HERO_SLIDE,
  HeroSlideItem,
  isTableMissingError,
  mapHeroSlideRow,
  mapLegacyBannerToHeroSlide,
} from '@/lib/heroSlides';
import { HeroSlideContent } from './hero/HeroSlideContent';
import { HeroSlideMedia } from './hero/HeroSlideMedia';
import { HeroSliderSkeleton } from './hero/HeroSliderSkeleton';
import './hero/hero-banner.css';

const AUTOPLAY_INTERVAL_MS = 5500;
const SWIPE_THRESHOLD_PX = 45;

export function HeroSlider({ initialSlides }: { initialSlides?: HeroSlideItem[] }) {
  const hasInitialSlides = Boolean(initialSlides && initialSlides.length > 0);
  const [slides, setSlides] = useState<HeroSlideItem[]>(
    hasInitialSlides && initialSlides ? initialSlides : []
  );
  const [isLoading, setIsLoading] = useState(!hasInitialSlides);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [isFocusedWithin, setIsFocusedWithin] = useState(false);
  const [isTabHidden, setIsTabHidden] = useState(false);
  const [isManuallyPaused, setIsManuallyPaused] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const [hasUserInteracted, setHasUserInteracted] = useState(false);
  const [announcement, setAnnouncement] = useState('');

  const touchStartRef = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    if (hasInitialSlides) return;

    let cancelled = false;
    async function loadSlides() {
      try {
        const supabase = createClient();
        const { data, error } = await supabase
          .from('hero_slides')
          .select(
            'id, image_url, badge, title, description, cta_primary_label, cta_primary_href, cta_secondary_label, cta_secondary_href, sort_order, is_active, created_at'
          )
          .eq('is_active', true)
          .order('sort_order', { ascending: true })
          .order('created_at', { ascending: true });

        if (cancelled) return;

        if (!error && Array.isArray(data) && data.length > 0) {
          setSlides(data.map((row, idx) => mapHeroSlideRow(row as Record<string, unknown>, idx)));
        } else if (error && isTableMissingError(error)) {
          const { data: legacyData, error: legacyError } = await supabase
            .from('banners')
            .select('id, title, subtitle, description, image_url, badge, created_at')
            .order('id', { ascending: true });

          if (!cancelled && !legacyError && Array.isArray(legacyData) && legacyData.length > 0) {
            setSlides(
              legacyData.map((row, idx) =>
                mapLegacyBannerToHeroSlide(row as Record<string, unknown>, idx)
              )
            );
          } else if (!cancelled) {
            setSlides([FALLBACK_HERO_SLIDE]);
          }
        } else {
          setSlides([FALLBACK_HERO_SLIDE]);
        }
      } catch {
        if (!cancelled) {
          setSlides([FALLBACK_HERO_SLIDE]);
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    loadSlides();
    return () => {
      cancelled = true;
    };
  }, [hasInitialSlides]);

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;

    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const syncPreference = () => setPrefersReducedMotion(mediaQuery.matches);
    syncPreference();

    mediaQuery.addEventListener('change', syncPreference);
    return () => mediaQuery.removeEventListener('change', syncPreference);
  }, []);

  useEffect(() => {
    if (typeof document === 'undefined') return;

    const handleVisibilityChange = () => {
      setIsTabHidden(document.visibilityState !== 'visible');
    };
    handleVisibilityChange();

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  const safeIndex = slides.length > 0 ? currentIndex % slides.length : 0;
  const isAutoplayPaused =
    slides.length <= 1 ||
    isHovered ||
    isFocusedWithin ||
    isTabHidden ||
    isManuallyPaused ||
    prefersReducedMotion;

  const goToSlide = useCallback(
    (targetIndex: number, userTriggered = true) => {
      if (slides.length === 0) return;
      const normalized = ((targetIndex % slides.length) + slides.length) % slides.length;
      setCurrentIndex(normalized);
      if (userTriggered) {
        setHasUserInteracted(true);
        const targetSlide = slides[normalized];
        setAnnouncement(
          `Slide ${normalized + 1} dari ${slides.length}: ${targetSlide?.title ?? ''}`
        );
      }
    },
    [slides]
  );

  const nextSlide = useCallback(
    (userTriggered = true) => {
      goToSlide(safeIndex + 1, userTriggered);
    },
    [goToSlide, safeIndex]
  );

  const prevSlide = useCallback(
    (userTriggered = true) => {
      goToSlide(safeIndex - 1, userTriggered);
    },
    [goToSlide, safeIndex]
  );

  useEffect(() => {
    if (isAutoplayPaused) return;

    const timer = window.setTimeout(() => {
      nextSlide(false);
    }, AUTOPLAY_INTERVAL_MS);

    return () => window.clearTimeout(timer);
  }, [isAutoplayPaused, safeIndex, nextSlide]);

  const handleTouchStart = (e: React.TouchEvent<HTMLElement>) => {
    if (e.touches.length !== 1) return;
    touchStartRef.current = {
      x: e.touches[0].clientX,
      y: e.touches[0].clientY,
    };
  };

  const handleTouchEnd = (e: React.TouchEvent<HTMLElement>) => {
    if (!touchStartRef.current || e.changedTouches.length !== 1 || slides.length <= 1) {
      touchStartRef.current = null;
      return;
    }

    const dx = e.changedTouches[0].clientX - touchStartRef.current.x;
    const dy = e.changedTouches[0].clientY - touchStartRef.current.y;
    touchStartRef.current = null;

    if (Math.abs(dx) >= SWIPE_THRESHOLD_PX && Math.abs(dx) > Math.abs(dy) * 1.2) {
      if (dx < 0) {
        nextSlide(true);
      } else {
        prevSlide(true);
      }
    }
  };

  if (isLoading) {
    return <HeroSliderSkeleton />;
  }

  const activeSlides = slides.length > 0 ? slides : [FALLBACK_HERO_SLIDE];
  const activeSlide = activeSlides[safeIndex] ?? FALLBACK_HERO_SLIDE;

  return (
    <section
      aria-roledescription="carousel"
      aria-label="Sorotan Pilar Bangsa Digital Office"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onFocusCapture={() => setIsFocusedWithin(true)}
      onBlurCapture={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) {
          setIsFocusedWithin(false);
        }
      }}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      style={{ '--pb-hero-interval': `${AUTOPLAY_INTERVAL_MS}ms` } as React.CSSProperties}
      className={`pb-hero-shell ${
        isAutoplayPaused ? 'pb-hero-shell--paused' : ''
      } relative w-full overflow-hidden rounded-3xl border border-gray-100 shadow-xl my-2 md:min-h-[460px] lg:min-h-[530px] xl:min-h-[550px] flex flex-col md:flex-row`}
    >
      {/* Foto besar di kanan pada desktop/tablet (dan di atas pada mobile) tanpa bingkai keras */}
      <HeroSlideMedia slides={activeSlides} currentIndex={safeIndex} />

      {/* Kolom kiri: blok teks terang + CTA + kontrol slider */}
      <div className="relative z-20 w-full md:w-[58%] lg:w-[55%] flex flex-col justify-between px-5 pt-2 pb-6 sm:px-8 sm:pb-8 md:py-10 md:pl-10 md:pr-6 lg:py-12 lg:pl-14 lg:pr-8">
        <div
          key={activeSlide.id}
          role="group"
          aria-roledescription="slide"
          aria-label={`Slide ${safeIndex + 1} dari ${activeSlides.length}`}
          aria-live={isAutoplayPaused ? 'polite' : 'off'}
          className="my-auto py-1 sm:py-2"
        >
          <HeroSlideContent slide={activeSlide} />
        </div>

        {activeSlides.length > 1 && (
          <div className="mt-6 pt-4 flex items-center justify-between gap-4 border-t border-gray-100/80 max-w-md">
            {/* Indikator titik / progress */}
            <div className="flex items-center gap-1.5" role="group" aria-label="Pilih slide">
              {activeSlides.map((slideItem, index) => {
                const isActive = index === safeIndex;
                return (
                  <button
                    key={slideItem.id}
                    type="button"
                    onClick={() => goToSlide(index, true)}
                    aria-label={`Pilih slide ${index + 1}: ${slideItem.title}`}
                    aria-current={isActive ? 'true' : undefined}
                    className="pb-hero-control-btn group inline-flex items-center justify-center min-w-[24px] min-h-[24px] px-1 rounded-full cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#E31837]"
                  >
                    {isActive ? (
                      <span
                        aria-hidden="true"
                        className="relative block w-8 h-2 rounded-full bg-gray-200 overflow-hidden ring-1 ring-[#E31837]/25"
                      >
                        <span
                          key={`dot-progress-${safeIndex}`}
                          className="pb-hero-dot-fill block h-full w-full rounded-full bg-[#E31837]"
                        />
                      </span>
                    ) : (
                      <span
                        aria-hidden="true"
                        className="block w-2.5 h-2.5 rounded-full bg-gray-300 group-hover:bg-gray-400 transition-colors"
                      />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Kontrol Pause + Panah Kiri/Kanan */}
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setIsManuallyPaused((prev) => !prev)}
                aria-label={
                  isManuallyPaused ? 'Jalankan putar otomatis slide' : 'Jeda putar otomatis slide'
                }
                className="pb-hero-control-btn w-9 h-9 rounded-full border border-gray-200 bg-[var(--color-card)] text-[var(--color-text-dark)] hover:border-[#E31837] hover:text-[#E31837] inline-flex items-center justify-center transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#E31837]"
              >
                {isManuallyPaused ? (
                  <Play size={14} aria-hidden="true" />
                ) : (
                  <Pause size={14} aria-hidden="true" />
                )}
              </button>

              <button
                type="button"
                onClick={() => prevSlide(true)}
                aria-label="Slide sebelumnya"
                className="pb-hero-control-btn w-9 h-9 rounded-full border border-gray-200 bg-[var(--color-card)] text-[var(--color-text-dark)] hover:border-[#E31837] hover:text-[#E31837] inline-flex items-center justify-center transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#E31837]"
              >
                <ChevronLeft size={17} aria-hidden="true" />
              </button>

              <button
                type="button"
                onClick={() => nextSlide(true)}
                aria-label="Slide berikutnya"
                className="pb-hero-control-btn w-9 h-9 rounded-full border border-gray-200 bg-[var(--color-card)] text-[var(--color-text-dark)] hover:border-[#E31837] hover:text-[#E31837] inline-flex items-center justify-center transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#E31837]"
              >
                <ChevronRight size={17} aria-hidden="true" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Status live region untuk perubahan slide interaktif */}
      <p className="sr-only" role="status" aria-live="polite" aria-atomic="true">
        {hasUserInteracted ? announcement : ''}
      </p>
    </section>
  );
}
