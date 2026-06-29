'use client';

import { useEffect } from 'react';

export function ErudaLoader() {
  useEffect(() => {
    if (typeof window !== 'undefined' && !(window as any).eruda) {
      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/eruda';
      script.onload = () => {
        if ((window as any).eruda) {
          (window as any).eruda.init();
        }
      };
      document.head.appendChild(script);
    }
  }, []);

  return null;
}
