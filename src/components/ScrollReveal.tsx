'use client';

import React, { useEffect, useRef, type ReactNode } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

export function ScrollReveal({
  children,
  delay = 0,
  direction = 'up',
}: {
  children: ReactNode;
  delay?: number;
  direction?: 'up' | 'left' | 'right' | 'down' | 'none';
}) {
  const boxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = boxRef.current;
    if (!el) return;

    gsap.registerPlugin(ScrollTrigger);

    const mm = gsap.matchMedia();
    mm.add(
      '(prefers-reduced-motion: no-preference)',
      () => {
        const fromVars: gsap.TweenVars =
          direction === 'up'
            ? { opacity: 0, y: 40 }
            : direction === 'down'
              ? { opacity: 0, y: -40 }
              : direction === 'left'
                ? { opacity: 0, x: -40 }
                : direction === 'right'
                  ? { opacity: 0, x: 40 }
                  : { opacity: 0 };

        gsap.fromTo(el, fromVars, {
          opacity: 1,
          x: 0,
          y: 0,
          duration: 0.6,
          delay,
          ease: 'power2.out',
          clearProps: 'transform,opacity',
          scrollTrigger: {
            trigger: el,
            start: 'top 88%',
            once: true,
          },
        });
      },
      boxRef
    );

    return () => {
      mm.revert();
    };
  }, [delay, direction]);

  return <div ref={boxRef}>{children}</div>;
}
