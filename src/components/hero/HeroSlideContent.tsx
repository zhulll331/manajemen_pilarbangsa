import React from 'react';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { HeroSlideItem, splitHeroTitle } from '@/lib/heroSlides';

interface HeroCtaLinkProps {
  href: string;
  className: string;
  children: React.ReactNode;
}

function HeroCtaLink({ href, className, children }: HeroCtaLinkProps) {
  const isExternal = /^https?:\/\//i.test(href);
  if (isExternal) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className={className}>
        {children}
      </a>
    );
  }

  return (
    <Link href={href} className={className}>
      {children}
    </Link>
  );
}

export function HeroSlideContent({ slide }: { slide: HeroSlideItem }) {
  const { primaryLine, accentLine } = splitHeroTitle(slide.title);

  return (
    <div className="space-y-4 sm:space-y-5">
      {slide.badge && (
        <div className="pb-hero-stagger pb-hero-stagger-1 inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-red-50 text-[#E31837] border border-red-100 text-xs font-bold uppercase tracking-wider">
          <span className="w-1.5 h-1.5 rounded-full bg-[#E31837]" aria-hidden="true" />
          <span>{slide.badge}</span>
        </div>
      )}

      <h1 className="pb-hero-stagger pb-hero-stagger-2 text-3xl sm:text-4xl lg:text-[2.75rem] xl:text-[3.125rem] font-extrabold tracking-tight leading-[1.12] text-[var(--color-text-dark)]">
        <span className="block">{primaryLine}</span>
        {accentLine && <span className="block text-[#E31837] mt-0.5">{accentLine}</span>}
      </h1>

      {slide.description && (
        <p className="pb-hero-stagger pb-hero-stagger-3 text-sm sm:text-base lg:text-[1.05rem] text-[var(--color-text-muted)] leading-relaxed max-w-xl line-clamp-3">
          {slide.description}
        </p>
      )}

      <div className="pb-hero-stagger pb-hero-stagger-4 flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-1">
        <HeroCtaLink
          href={slide.cta_primary_href}
          className="inline-flex items-center justify-center gap-2 min-h-[44px] px-6 py-3 rounded-lg bg-[#E31837] hover:bg-red-700 text-white font-semibold text-sm sm:text-base transition-colors w-full sm:w-auto focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#E31837]"
        >
          <span>{slide.cta_primary_label}</span>
          <ArrowRight size={17} aria-hidden="true" />
        </HeroCtaLink>

        {slide.cta_secondary_label && slide.cta_secondary_href && (
          <HeroCtaLink
            href={slide.cta_secondary_href}
            className="inline-flex items-center justify-center min-h-[44px] px-6 py-3 rounded-lg bg-[var(--color-card)] hover:bg-[var(--color-background)] text-[var(--color-text-dark)] border border-gray-300 hover:border-gray-400 font-semibold text-sm sm:text-base transition-colors w-full sm:w-auto focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#E31837]"
          >
            <span>{slide.cta_secondary_label}</span>
          </HeroCtaLink>
        )}
      </div>
    </div>
  );
}
