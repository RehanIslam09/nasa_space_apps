'use client';

import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

export function ScrollProgress() {
  const barRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const bar = barRef.current;
    if (!bar) return;

    // Use GSAP ScrollTrigger to bind document scroll progress directly to the 1px scaleY
    const st = ScrollTrigger.create({
      start: 'top top',
      end: 'bottom bottom',
      onUpdate: (self) => {
        gsap.set(bar, {
          scaleY: self.progress,
          transformOrigin: 'top center',
        });
      },
    });

    return () => {
      st.kill();
    };
  }, []);

  return (
    <div
      className="pointer-events-none fixed bottom-0 right-0 top-0 z-50 w-[1.5px] bg-white/[0.08]"
      aria-hidden="true"
    >
      <div
        ref={barRef}
        className="h-full w-full bg-gradient-to-b from-sky-400 via-teal-300 to-sky-400 shadow-[0_0_8px_rgba(56,189,248,0.7)]"
        style={{ transform: 'scaleY(0)', transformOrigin: 'top center' }}
      />
    </div>
  );
}
