'use client';

import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

export interface GsapCardGroupProps {
  children: React.ReactNode;
  className?: string;
  as?: 'div' | 'ol' | 'ul';
  stagger?: number;
  yOffset?: number;
  triggerKey?: string | number;
}

export function GsapCardGroup({
  children,
  className = '',
  as = 'div',
  stagger = 0.07,
  yOffset = 24,
  triggerKey,
}: GsapCardGroupProps) {
  const containerRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    gsap.registerPlugin(ScrollTrigger);

    const mm = gsap.matchMedia();
    mm.add(
      '(prefers-reduced-motion: no-preference)',
      () => {
        const items = Array.from(el.children);
        if (items.length === 0) return;

        const alreadyInView = el.getBoundingClientRect().top < window.innerHeight * 0.92;

        gsap.fromTo(
          items,
          { y: yOffset, opacity: 0 },
          {
            y: 0,
            opacity: 1,
            duration: 0.55,
            ease: 'power2.out',
            stagger,
            clearProps: 'transform,opacity',
            ...(alreadyInView
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
      el
    );

    return () => {
      mm.revert();
    };
  }, [stagger, yOffset, triggerKey]);

  const setRef = (node: HTMLElement | null) => {
    containerRef.current = node;
  };

  if (as === 'ol') {
    return (
      <ol ref={setRef} className={className}>
        {children}
      </ol>
    );
  }

  if (as === 'ul') {
    return (
      <ul ref={setRef} className={className}>
        {children}
      </ul>
    );
  }

  return (
    <div ref={setRef} className={className}>
      {children}
    </div>
  );
}
