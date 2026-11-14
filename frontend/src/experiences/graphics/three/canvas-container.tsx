'use client';

import { Canvas } from '@react-three/fiber';
import { Suspense, type ReactNode } from 'react';

interface CanvasContainerProps {
  children?: ReactNode;
  className?: string;
  cameraFov?: number;
  cameraPosition?: [number, number, number];
}

/**
 * Foundation Canvas container for React Three Fiber 3D experiences.
 * Isolated to client rendering with Suspense and performance settings.
 */
export function CanvasContainer({
  children,
  className = 'w-full h-full',
  cameraFov = 45,
  cameraPosition = [0, 0, 5],
}: CanvasContainerProps) {
  return (
    <div className={className}>
      <Canvas
        camera={{ position: cameraPosition, fov: cameraFov }}
        dpr={[1, 2]}
        gl={{
          antialias: true,
          powerPreference: 'high-performance',
          alpha: true,
        }}
      >
        <Suspense fallback={null}>{children}</Suspense>
      </Canvas>
    </div>
  );
}

export default CanvasContainer;
