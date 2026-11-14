'use client';

import { useMemo } from 'react';
import * as THREE from 'three';
import { Stars } from '@react-three/drei';

interface EarthEnvironmentProps {
  atmosphereRadius?: number;
}

// Atmospheric Glow Vertex Shader
const atmosphereVertexShader = /* glsl */ `
  varying vec3 vNormal;
  varying vec3 vWorldPosition;

  void main() {
    vNormal = normalize(normalMatrix * normal);
    vec4 worldPos = modelMatrix * vec4(position, 1.0);
    vWorldPosition = worldPos.xyz;
    gl_Position = projectionMatrix * viewMatrix * worldPos;
  }
`;

// Atmospheric Glow Fragment Shader (Rayleigh scattering edge glow)
const atmosphereFragmentShader = /* glsl */ `
  uniform vec3 uAtmosphereColor;
  varying vec3 vNormal;
  varying vec3 vWorldPosition;

  void main() {
    vec3 viewDir = normalize(-vWorldPosition);
    // Fresnel power for subtle edge falloff
    float intensity = pow(0.65 - dot(vNormal, viewDir), 2.2);
    intensity = clamp(intensity, 0.0, 1.0);
    
    // Soft outer atmosphere fade
    gl_FragColor = vec4(uAtmosphereColor, intensity * 0.45);
  }
`;

/**
 * Atmospheric halo and deep-space environment for the NASA 3D Earth experience.
 *
 * Uses:
 * - Subtle Rayleigh atmospheric scattering halo around the planet
 * - Deep-space starfield aligned with PRANA's dark cinematic visual identity
 */
export function EarthEnvironment({
  atmosphereRadius = 1.022,
}: EarthEnvironmentProps) {
  // Atmosphere Halo Shader Material
  const atmosphereMaterial = useMemo(() => {
    return new THREE.ShaderMaterial({
      vertexShader: atmosphereVertexShader,
      fragmentShader: atmosphereFragmentShader,
      uniforms: {
        uAtmosphereColor: { value: new THREE.Color('#38bdf8') }, // Azure cyan
      },
      blending: THREE.AdditiveBlending,
      side: THREE.BackSide,
      transparent: true,
      depthWrite: false,
    });
  }, []);

  return (
    <group>
      {/* 1. Deep Space Starfield (Subtle, non-distracting) */}
      <Stars
        radius={120}
        depth={60}
        count={1200}
        factor={3}
        saturation={0}
        fade={true}
        speed={0.3}
      />

      {/* 2. Atmospheric Rayleigh Scattering Outer Shell */}
      <mesh material={atmosphereMaterial}>
        <sphereGeometry args={[atmosphereRadius, 48, 48]} />
      </mesh>
    </group>
  );
}

export default EarthEnvironment;
