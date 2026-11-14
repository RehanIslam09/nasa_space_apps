'use client';

import { useRef } from 'react';
import * as THREE from 'three';

interface EarthLightingProps {
  sunPosition?: [number, number, number];
}

/**
 * Cinematic multi-point lighting configuration designed specifically
 * for NASA planetary visualization in PRANA's dark-space aesthetic.
 *
 * Provides:
 * - Primary Key Light (Directional Solar Ray) creating the day/night terminator
 * - Secondary Fill Light (Cosmic Background Radiance) preserving dark-side depth
 * - Backlight Rim (Atmospheric Limb Separator) defining the planetary silhouette
 */
export function EarthLighting({
  sunPosition = [4.5, 1.8, 2.5],
}: EarthLightingProps) {
  const sunLightRef = useRef<THREE.DirectionalLight>(null);

  return (
    <group>
      {/* 1. Primary Solar Key Light */}
      <directionalLight
        ref={sunLightRef}
        position={sunPosition}
        intensity={2.4}
        color="#fff9f0"
      />

      {/* 2. Deep Cosmic Galactic Fill Light */}
      <directionalLight
        position={[-3.5, -1.5, -2.0]}
        intensity={0.25}
        color="#182848"
      />

      {/* 3. Subtle Ambient Light for Space Shadow Visibility */}
      <ambientLight intensity={0.12} color="#0d1b2a" />

      {/* 4. Limb Backlight / Rim Accent */}
      <directionalLight
        position={[-sunPosition[0], sunPosition[1] * 0.8, -sunPosition[2]]}
        intensity={0.6}
        color="#38bdf8"
      />
    </group>
  );
}

export default EarthLighting;
