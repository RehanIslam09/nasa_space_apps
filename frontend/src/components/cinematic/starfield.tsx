'use client';

import { useEffect, useRef } from 'react';
import { useReducedMotion } from '@/hooks/use-reduced-motion';
import { earthSongConfig } from '@/config/earth-song.config';

interface Star {
  x: number;
  y: number;
  size: number;
  baseAlpha: number;
  alpha: number;
  twinkleSpeed: number;
  phase: number;
  layer: number; // 0: distant, 1: mid, 2: near
}

interface ShootingStar {
  x: number;
  y: number;
  length: number;
  speed: number;
  angle: number;
  alpha: number;
  active: boolean;
}

export function Starfield({ className = '' }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const mouseRef = useRef({ x: 0, y: 0, targetX: 0, targetY: 0 });
  const isVisibleRef = useRef(true);
  const prefersReducedMotion = useReducedMotion();

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    let animationFrameId: number;
    let width = 0;
    let height = 0;

    const { nearStarCount, midStarCount, distantStarCount, maxDpr } =
      earthSongConfig.animation.starfield;

    // Responsive Canvas Resize
    const handleResize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, maxDpr);
      const rect = container.getBoundingClientRect();
      width = rect.width;
      height = rect.height;

      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx.scale(dpr, dpr);
    };

    handleResize();
    window.addEventListener('resize', handleResize);

    // Track mouse for subtle parallax
    const handleMouseMove = (e: MouseEvent) => {
      const { innerWidth, innerHeight } = window;
      mouseRef.current.targetX = (e.clientX / innerWidth - 0.5) * 2;
      mouseRef.current.targetY = (e.clientY / innerHeight - 0.5) * 2;
    };
    window.addEventListener('mousemove', handleMouseMove, { passive: true });

    // Initialize 3 depth layers of stars
    const stars: Star[] = [];

    // Distant stars
    for (let i = 0; i < distantStarCount; i++) {
      stars.push({
        x: Math.random(),
        y: Math.random(),
        size: Math.random() * 0.9 + 0.5,
        baseAlpha: Math.random() * 0.4 + 0.2,
        alpha: Math.random() * 0.4 + 0.2,
        twinkleSpeed: Math.random() * 0.015 + 0.005,
        phase: Math.random() * Math.PI * 2,
        layer: 0,
      });
    }

    // Mid-distance stars
    for (let i = 0; i < midStarCount; i++) {
      stars.push({
        x: Math.random(),
        y: Math.random(),
        size: Math.random() * 1.2 + 0.9,
        baseAlpha: Math.random() * 0.5 + 0.35,
        alpha: Math.random() * 0.5 + 0.35,
        twinkleSpeed: Math.random() * 0.02 + 0.01,
        phase: Math.random() * Math.PI * 2,
        layer: 1,
      });
    }

    // Near stars
    for (let i = 0; i < nearStarCount; i++) {
      stars.push({
        x: Math.random(),
        y: Math.random(),
        size: Math.random() * 1.8 + 1.2,
        baseAlpha: Math.random() * 0.4 + 0.6,
        alpha: Math.random() * 0.4 + 0.6,
        twinkleSpeed: Math.random() * 0.03 + 0.015,
        phase: Math.random() * Math.PI * 2,
        layer: 2,
      });
    }

    // Shooting star state
    let shootingStar: ShootingStar = {
      x: 0,
      y: 0,
      length: 0,
      speed: 0,
      angle: 0,
      alpha: 0,
      active: false,
    };

    let lastShootingStarTime = Date.now();

    const spawnShootingStar = () => {
      shootingStar = {
        x: Math.random() * (width * 0.7),
        y: Math.random() * (height * 0.35),
        length: Math.random() * 80 + 60,
        speed: Math.random() * 7 + 10,
        angle: Math.PI / 4 + (Math.random() - 0.5) * 0.2,
        alpha: 1,
        active: true,
      };
    };

    // Observer to pause rendering when offscreen
    const observer = new IntersectionObserver(
      ([entry]) => {
        isVisibleRef.current = entry?.isIntersecting ?? false;
      },
      { threshold: 0.05 }
    );
    observer.observe(container);

    // Animation Render Loop
    const render = () => {
      if (!isVisibleRef.current) {
        animationFrameId = requestAnimationFrame(render);
        return;
      }

      ctx.clearRect(0, 0, width, height);

      // Smooth mouse easing
      mouseRef.current.x += (mouseRef.current.targetX - mouseRef.current.x) * 0.05;
      mouseRef.current.y += (mouseRef.current.targetY - mouseRef.current.y) * 0.05;

      const now = Date.now();
      if (
        !prefersReducedMotion &&
        now - lastShootingStarTime > earthSongConfig.animation.starfield.shootingStarInterval
      ) {
        if (Math.random() < 0.4) {
          spawnShootingStar();
        }
        lastShootingStarTime = now;
      }

      // Draw Starfield
      for (let i = 0; i < stars.length; i++) {
        const star = stars[i]!;

        // Update twinkle
        if (!prefersReducedMotion) {
          star.phase += star.twinkleSpeed;
          star.alpha = star.baseAlpha + Math.sin(star.phase) * 0.25;
        }

        // Parallax offset per layer
        const layerMultiplier = (star.layer + 1) * 6;
        const offsetX = mouseRef.current.x * layerMultiplier;
        const offsetY = mouseRef.current.y * layerMultiplier;

        const posX = (star.x * width + offsetX + width) % width;
        const posY = (star.y * height + offsetY + height) % height;

        ctx.fillStyle = `rgba(255, 255, 255, ${Math.max(0, Math.min(1, star.alpha))})`;
        ctx.beginPath();
        ctx.arc(posX, posY, star.size, 0, Math.PI * 2);
        ctx.fill();

        // Extra soft glow for near stars
        if (star.layer === 2) {
          ctx.fillStyle = `rgba(125, 211, 252, ${star.alpha * 0.25})`;
          ctx.beginPath();
          ctx.arc(posX, posY, star.size * 2.2, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // Draw Shooting Star
      if (shootingStar.active && !prefersReducedMotion) {
        shootingStar.x += Math.cos(shootingStar.angle) * shootingStar.speed;
        shootingStar.y += Math.sin(shootingStar.angle) * shootingStar.speed;
        shootingStar.alpha -= 0.015;

        if (shootingStar.alpha <= 0) {
          shootingStar.active = false;
        } else {
          const tailX = shootingStar.x - Math.cos(shootingStar.angle) * shootingStar.length;
          const tailY = shootingStar.y - Math.sin(shootingStar.angle) * shootingStar.length;

          const gradient = ctx.createLinearGradient(tailX, tailY, shootingStar.x, shootingStar.y);
          gradient.addColorStop(0, 'rgba(255, 255, 255, 0)');
          gradient.addColorStop(0.7, 'rgba(56, 189, 248, 0.4)');
          gradient.addColorStop(1, `rgba(255, 255, 255, ${shootingStar.alpha})`);

          ctx.strokeStyle = gradient;
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.moveTo(tailX, tailY);
          ctx.lineTo(shootingStar.x, shootingStar.y);
          ctx.stroke();
        }
      }

      animationFrameId = requestAnimationFrame(render);
    };

    animationFrameId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animationFrameId);
      observer.disconnect();
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, [prefersReducedMotion]);

  return (
    <div
      ref={containerRef}
      className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`}
      aria-hidden="true"
    >
      {/* Deep Blue-Teal Cosmic Nebula Glow */}
      <div className="bg-radial-[circle_at_30%_35%] absolute inset-0 from-sky-950/25 via-transparent to-transparent opacity-80" />
      <div className="bg-radial-[circle_at_75%_65%] absolute inset-0 from-emerald-950/20 via-transparent to-transparent opacity-60" />
      <canvas ref={canvasRef} className="h-full w-full" />
    </div>
  );
}
