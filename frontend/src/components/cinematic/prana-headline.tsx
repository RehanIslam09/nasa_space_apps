'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import gsap from 'gsap';
import { useReducedMotion } from '@/hooks/use-reduced-motion';
import { earthSongConfig } from '@/config/earth-song.config';

const WORD_A = earthSongConfig.copy.heroWord.split(''); // ['E', 'A', 'R', 'T', 'H']
const WORD_B = earthSongConfig.copy.alternateWord.split(''); // ['P', 'R', 'A', 'N', 'A']

export function PranaHeadline() {
  const [isPrana, setIsPrana] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const timelinesRef = useRef<gsap.core.Timeline[]>([]);
  const prefersReducedMotion = useReducedMotion();

  const { duration, stagger, ease } = earthSongConfig.animation.pranaFlip;

  // Flip individual letter from A to B or B to A
  const flipLetters = useCallback(
    (toPrana: boolean) => {
      if (!containerRef.current) return;

      // Kill active letter timelines to prevent rapid-hover glitching
      timelinesRef.current.forEach((tl) => tl.kill());
      timelinesRef.current = [];

      const letterElements = containerRef.current.querySelectorAll('.flip-char');

      letterElements.forEach((el, index) => {
        const charSpan = el.querySelector('.char-face') as HTMLElement;
        if (!charSpan) return;

        const targetChar = toPrana ? WORD_B[index]! : WORD_A[index]!;

        if (prefersReducedMotion) {
          charSpan.textContent = targetChar;
          return;
        }

        const tl = gsap.timeline({ delay: index * stagger });

        // Phase 1: Rotate out 0 to -90 deg
        tl.to(charSpan, {
          rotateX: -90,
          duration: duration * 0.5,
          ease,
          onComplete: () => {
            charSpan.textContent = targetChar;
            gsap.set(charSpan, { rotateX: 90 });
          },
        });

        // Phase 2: Rotate in 90 to 0 deg
        tl.to(charSpan, {
          rotateX: 0,
          duration: duration * 0.5,
          ease,
        });

        timelinesRef.current.push(tl);
      });

      setIsPrana(toPrana);
    },
    [duration, stagger, ease, prefersReducedMotion]
  );

  const handleMouseEnter = () => {
    setIsHovered(true);
    if (!isPrana) {
      flipLetters(true);
    }
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    if (isPrana) {
      flipLetters(false);
    }
  };

  const handleClick = () => {
    flipLetters(!isPrana);
    setIsHovered(!isPrana);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleClick();
    }
  };

  useEffect(() => {
    return () => {
      timelinesRef.current.forEach((tl) => tl.kill());
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="group relative inline-block cursor-pointer select-none rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400/50"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      role="button"
      aria-label="Earth, interactive headline. Translates to Prana, the breath of life."
    >
      {/* 3D Perspective Word Container */}
      <h1
        className="special-font hero-heading flex items-center text-7xl text-white drop-shadow-2xl sm:text-8xl md:text-9xl lg:text-[11.5rem]"
        style={{ perspective: '1000px' }}
      >
        {WORD_A.map((char, index) => (
          <span
            key={index}
            className="flip-char inline-block"
            style={{ transformStyle: 'preserve-3d' }}
          >
            <span
              className="char-face inline-block will-change-transform"
              style={{ transformOrigin: '50% 50% -20px' }}
            >
              {char}
            </span>
          </span>
        ))}
      </h1>

      {/* Caption Revealed on Hover / Focus */}
      <div
        className={`pointer-events-none mt-2 flex items-center gap-2 transition-all duration-500 ease-out ${
          isHovered ? 'translate-y-0 opacity-100' : '-translate-y-2 opacity-0'
        }`}
        aria-hidden="true"
      >
        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-sky-400" />
        <span className="font-general text-xs font-medium uppercase tracking-[0.2em] text-sky-300/90">
          {earthSongConfig.copy.pranaCaption}
        </span>
      </div>
    </div>
  );
}
