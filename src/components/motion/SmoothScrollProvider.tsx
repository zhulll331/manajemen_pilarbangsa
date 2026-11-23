'use client';

import React, { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import Lenis from 'lenis';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import 'lenis/dist/lenis.css';

export function SmoothScrollProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const lenisRef = useRef<Lenis | null>(null);

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);

    const reducedMotionMq = window.matchMedia('(prefers-reduced-motion: reduce)');
    let activeTicker: ((time: number) => void) | null = null;

    const teardownLenis = () => {
      if (activeTicker) {
        gsap.ticker.remove(activeTicker);
        activeTicker = null;
      }
      if (lenisRef.current) {
        lenisRef.current.destroy();
        lenisRef.current = null;
      }
    };

    const setupLenis = () => {
      teardownLenis();

      if (reducedMotionMq.matches) {
        return;
      }

      const lenis = new Lenis({
        duration: 1.05,
        easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
        smoothWheel: true,
        autoRaf: false,
        anchors: true,
      });

      lenis.on('scroll', ScrollTrigger.update);

      const onTick = (time: number) => {
        lenis.raf(time * 1000);
      };

      gsap.ticker.add(onTick);
      gsap.ticker.lagSmoothing(0);

      activeTicker = onTick;
      lenisRef.current = lenis;
    };

    setupLenis();
    reducedMotionMq.addEventListener('change', setupLenis);

    return () => {
      reducedMotionMq.removeEventListener('change', setupLenis);
      teardownLenis();
    };
  }, []);

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);

    if (lenisRef.current && !window.location.hash) {
      lenisRef.current.scrollTo(0, { immediate: true });
    }

    const rafId = window.requestAnimationFrame(() => {
      ScrollTrigger.refresh();
    });
    const timerId = window.setTimeout(() => {
      ScrollTrigger.refresh();
    }, 160);

    return () => {
      window.cancelAnimationFrame(rafId);
      window.clearTimeout(timerId);
    };
  }, [pathname]);

  return <>{children}</>;
}
