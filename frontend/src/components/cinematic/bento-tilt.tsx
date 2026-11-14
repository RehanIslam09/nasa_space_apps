'use client';

import { useState, useRef, useCallback, type ReactNode, type MouseEvent } from 'react';
import { useReducedMotion } from '@/hooks/use-reduced-motion';

interface BentoTiltProps {
  children: ReactNode;
  className?: string;
  maxTilt?: number;
}

export function BentoTilt({ children, className = '', maxTilt = 6 }: BentoTiltProps) {
  const [transformStyle, setTransformStyle] = useState('');
  const itemRef = useRef<HTMLDivElement>(null);
  const rectRef = useRef<DOMRect | null>(null);
  const rafIdRef = useRef<number | null>(null);
  const prefersReducedMotion = useReducedMotion();

  const handleMouseEnter = () => {
    if (!itemRef.current || prefersReducedMotion) return;
    rectRef.current = itemRef.current.getBoundingClientRect();
  };

  const handleMouseMove = useCallback(
    (event: MouseEvent<HTMLDivElement>) => {
      if (!rectRef.current || prefersReducedMotion) return;

      if (rafIdRef.current) {
        cancelAnimationFrame(rafIdRef.current);
      }

      const clientX = event.clientX;
      const clientY = event.clientY;

      rafIdRef.current = requestAnimationFrame(() => {
        const rect = rectRef.current;
        if (!rect) return;

        const relativeX = (clientX - rect.left) / rect.width;
        const relativeY = (clientY - rect.top) / rect.height;

        const tiltX = (relativeY - 0.5) * maxTilt;
        const tiltY = (relativeX - 0.5) * -maxTilt;

        setTransformStyle(
          `perspective(800px) rotateX(${tiltX.toFixed(2)}deg) rotateY(${tiltY.toFixed(2)}deg) scale3d(0.985, 0.985, 0.985)`
        );
      });
    },
    [maxTilt, prefersReducedMotion]
  );

  const handleMouseLeave = () => {
    if (rafIdRef.current) {
      cancelAnimationFrame(rafIdRef.current);
    }
    rectRef.current = null;
    setTransformStyle('');
  };

  return (
    <div
      ref={itemRef}
      className={`transform-gpu transition-transform duration-300 ease-out will-change-transform ${className}`}
      onMouseEnter={handleMouseEnter}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{ transform: prefersReducedMotion ? undefined : transformStyle }}
    >
      {children}
    </div>
  );
}
