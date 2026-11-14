'use client';

import { useRef, useEffect } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useReducedMotion } from '@/hooks/use-reduced-motion';

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

interface AnimatedTitleProps {
  title: string;
  containerClass?: string;
}

export function AnimatedTitle({ title, containerClass = '' }: AnimatedTitleProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const prefersReducedMotion = useReducedMotion();

  useEffect(() => {
    if (!containerRef.current) return;

    if (prefersReducedMotion) {
      // In reduced motion mode, show words immediately without 3D transforms
      gsap.set(containerRef.current.querySelectorAll('.animated-word'), {
        opacity: 1,
        transform: 'none',
      });
      return;
    }

    const ctx = gsap.context(() => {
      const titleAnimation = gsap.timeline({
        scrollTrigger: {
          trigger: containerRef.current,
          start: 'top 85%',
          end: 'center 60%',
          toggleActions: 'play none none reverse',
        },
      });

      titleAnimation.to(
        '.animated-word',
        {
          opacity: 1,
          transform: 'translate3d(0, 0, 0) rotateY(0deg) rotateX(0deg)',
          ease: 'power2.out',
          stagger: 0.025,
          duration: 0.8,
        },
        0
      );
    }, containerRef);

    return () => ctx.revert();
  }, [prefersReducedMotion]);

  return (
    <div
      ref={containerRef}
      className={`animated-title flex flex-col items-center justify-center text-center ${containerClass}`}
    >
      {title.split('<br />').map((line, lineIndex) => (
        <div
          key={lineIndex}
          className="flex flex-wrap items-center justify-center gap-2 px-4 md:gap-3.5"
        >
          {line.split(' ').map((word, wordIndex) => (
            <span
              key={wordIndex}
              className="animated-word inline-block"
              dangerouslySetInnerHTML={{ __html: word }}
            />
          ))}
        </div>
      ))}
    </div>
  );
}
