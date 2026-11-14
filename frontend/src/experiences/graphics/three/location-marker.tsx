'use client';

import { useRef, useMemo } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { geodesicToLocalVector } from './geographic-picking';

export interface LocationMarkerProps {
  lat: number;
  lon: number;
  isDiffMode?: boolean;
}

/**
 * 3D Holographic Reticle Marker
 *
 * Renders directly on the 3D NASA Earth surface at the exact geodesic coordinates.
 * Sits flat against the planetary curvature using normal vector quaternion alignment.
 * Features an animated radar pulse ring and central pinpoint beacon.
 */
export function LocationMarker({
  lat,
  lon,
  isDiffMode = false,
}: LocationMarkerProps) {
  const outerRingRef = useRef<THREE.Mesh>(null);
  const midRingRef = useRef<THREE.Mesh>(null);

  // 1. Calculate local position and normal vector
  const { position, quaternion } = useMemo(() => {
    // Altitude 1.008 places it just above Earth's radius (1.0) to eliminate Z-fighting
    const pos = geodesicToLocalVector(lat, lon, 1.008);
    const normal = pos.clone().normalize();

    // Orient marker tangential to the surface
    // By default, Three.js RingGeometry lies in the XY plane facing +Z
    const defaultNormal = new THREE.Vector3(0, 0, 1);
    const quat = new THREE.Quaternion().setFromUnitVectors(defaultNormal, normal);

    return { position: pos, quaternion: quat };
  }, [lat, lon]);

  // Accent color adapts based on mode
  const markerColor = isDiffMode ? '#fbbf24' : '#38bdf8'; // Amber for diff, cyan for baseline
  const ringColor = isDiffMode ? '#f59e0b' : '#0ea5e9';

  // 2. Animate pulsating holographic rings
  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();

    if (outerRingRef.current) {
      // Periodic pulse 0.0 to 1.0 every 1.5 seconds
      const phase = (t * 0.8) % 1.0;
      const scale = 1.0 + phase * 1.6;
      outerRingRef.current.scale.set(scale, scale, 1);

      const mat = outerRingRef.current.material as THREE.MeshBasicMaterial;
      if (mat) {
        mat.opacity = (1.0 - phase) * 0.85;
      }
    }

    if (midRingRef.current) {
      // Subtle rotation of targeting reticle
      midRingRef.current.rotation.z = t * 0.5;
    }
  });

  return (
    <group position={position} quaternion={quaternion}>
      {/* Central Solid Pinpoint Core */}
      <mesh>
        <circleGeometry args={[0.014, 24]} />
        <meshBasicMaterial
          color={markerColor}
          side={THREE.DoubleSide}
          depthTest={true}
          transparent={true}
          opacity={0.95}
        />
      </mesh>

      {/* Static Inner Reticle Ring */}
      <mesh ref={midRingRef}>
        <ringGeometry args={[0.024, 0.032, 32]} />
        <meshBasicMaterial
          color={markerColor}
          side={THREE.DoubleSide}
          depthTest={true}
          transparent={true}
          opacity={0.75}
        />
      </mesh>

      {/* Dynamic Pulsing Radar Ring */}
      <mesh ref={outerRingRef}>
        <ringGeometry args={[0.034, 0.042, 32]} />
        <meshBasicMaterial
          color={ringColor}
          side={THREE.DoubleSide}
          depthTest={true}
          transparent={true}
          opacity={0.8}
        />
      </mesh>

      {/* Vertical Optical Elevation Stem pointing outward from Earth */}
      <mesh position={[0, 0, 0.025]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.0015, 0.0015, 0.05, 8]} />
        <meshBasicMaterial
          color={markerColor}
          transparent={true}
          opacity={0.65}
        />
      </mesh>

      {/* Floating Terminal Tip Beacon */}
      <mesh position={[0, 0, 0.052]}>
        <sphereGeometry args={[0.006, 12, 12]} />
        <meshBasicMaterial color="#ffffff" />
      </mesh>
    </group>
  );
}

export default LocationMarker;
