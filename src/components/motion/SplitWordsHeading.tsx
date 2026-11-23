'use client';

import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

export interface SplitWordsHeadingProps {
  text: string;
  as?: 'h1' | 'h2' | 'h3';
  id?: string;
  className?: string;
  immediate?: boolean;
  delay?: number;
}

export function SplitWordsHeading({
  text,
  as = 'h2',
  id,
  className = '',
  immediate = false,
  delay = 0,
}: SplitWordsHeadingProps) {
  const headingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    const el = headingRef.current;
    if (!el) return;

    gsap.registerPlugin(ScrollTrigger);

    const mm = gsap.matchMedia();
    mm.add(
      '(prefers-reduced-motion: no-preference)',
      () => {
        const wordEls = el.querySelectorAll('[data-split-word]');
        if (wordEls.length === 0) return;

        gsap.fromTo(
          wordEls,
          { yPercent: 105, opacity: 0 },
          {
            yPercent: 0,
            opacity: 1,
            duration: 0.65,
            ease: 'power3.out',
            stagger: 0.045,
            delay,
            clearProps: 'transform,opacity',
            ...(immediate
              ? {}
              : {
                  scrollTrigger: {
                    trigger: el,
                    start: 'top 88%',
                    once: true,
                  },
                }),
          }
        );
      },
      headingRef
    );

    return () => {
      mm.revert();
    };
  }, [text, immediate, delay]);

  const words = text.trim().split(/\s+/).filter(Boolean);

  const content = words.map((word, idx) => (
    <React.Fragment key={`${word}-${idx}`}>
      <span
        aria-hidden="true"
        className="inline-block overflow-hidden align-top pb-[0.08em] -mb-[0.08em]"
      >
        <span data-split-word className="inline-block">
          {word}
        </span>
      </span>
      {idx < words.length - 1 ? ' ' : null}
    </React.Fragment>
  ));

  if (as === 'h1') {
    return (
      <h1 ref={headingRef} id={id} aria-label={text} className={className}>
        {content}
      </h1>
    );
  }

  if (as === 'h3') {
    return (
      <h3 ref={headingRef} id={id} aria-label={text} className={className}>
        {content}
      </h3>
    );
  }

  return (
    <h2 ref={headingRef} id={id} aria-label={text} className={className}>
      {content}
    </h2>
  );
}
