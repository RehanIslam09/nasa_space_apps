'use client';

import { useEffect, useRef } from 'react';
import Lenis from 'lenis';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useReducedMotion } from './use-reduced-motion';

export function useLenis(enabled = true) {
  const lenisRef = useRef<Lenis | null>(null);
  const prefersReducedMotion = useReducedMotion();

  // If reduced motion is requested, do not run smooth scrolling
  const isEnabled = enabled && !prefersReducedMotion;

  useEffect(() => {
    if (!isEnabled || typeof window === 'undefined') return;

    const lenis = new Lenis({
      duration: 1.0,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      orientation: 'vertical',
      smoothWheel: true,
      wheelMultiplier: 1.0,
      touchMultiplier: 1.5,
    });

    lenisRef.current = lenis;
    if (typeof window !== 'undefined') {
      (window as Window & { __lenis?: Lenis }).__lenis = lenis;
    }

    // Synchronize Lenis with GSAP ScrollTrigger
    lenis.on('scroll', ScrollTrigger.update);

    const tickerCallback = (time: number) => {
      lenis.raf(time * 1000);
    };

    gsap.ticker.add(tickerCallback);
    // lagSmoothing(0) prevents GSAP internal clock from drifting away from Lenis RAF
    gsap.ticker.lagSmoothing(0);

    return () => {
      gsap.ticker.remove(tickerCallback);
      lenis.destroy();
      lenisRef.current = null;
      if (typeof window !== 'undefined' && (window as Window & { __lenis?: Lenis }).__lenis === lenis) {
        delete (window as Window & { __lenis?: Lenis }).__lenis;
      }
    };
  }, [isEnabled]);

  return lenisRef;
}
