'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { RotateCcw, Compass } from 'lucide-react';
import { OrbitControls } from '@react-three/drei';
import type { CompareResponse } from '@nasa-experience/contracts';
import { CanvasContainer } from './canvas-container';
import { NasaEarthModel } from './nasa-earth-model';
import { EarthLighting } from './earth-lighting';
import { EarthEnvironment } from './earth-environment';

type OrbitControlsHandle = React.ElementRef<typeof OrbitControls>;

interface GlobeViewerProps {
  selectedPhase: 'a' | 'b' | 'diff';
  comparisonData: CompareResponse | null;
  className?: string;
}

/**
 * Interactive 3D Earth Viewer powered by the Official NASA 3D Earth Model.
 *
 * Integrates:
 * - Downloaded official NASA 3D Earth model (VTAD EarthClouds_1_12756)
 * - NASA Black Marble 2012 / 2023 nighttime observations
 * - Directional solar lighting and atmospheric Rayleigh scattering
 * - Smooth OrbitControls with interaction pause and camera reset
 * - Touch-friendly non-blocking page scrolling
 * - Accessible 2D fallback for devices without WebGL
 */
export function GlobeViewer({
  selectedPhase,
  comparisonData,
  className = 'relative mt-8 h-[380px] sm:h-[460px] md:h-[520px] lg:h-[560px] w-full overflow-hidden rounded-2xl border border-white/10 bg-black/85 shadow-2xl',
}: GlobeViewerProps) {
  const [hasWebGL, setHasWebGL] = useState<boolean>(false);
  const [diffActiveYear, setDiffActiveYear] = useState<'2012' | '2023'>('2023');
  const [isInteracting, setIsInteracting] = useState(false);
  const controlsRef = useRef<OrbitControlsHandle>(null);
  const resetEarthRotationRef = useRef<(() => void) | null>(null);

  // Synchronize observation year with selected phase
  const currentObservationYear: '2012' | '2023' =
    selectedPhase === 'a' ? '2012' : selectedPhase === 'b' ? '2023' : diffActiveYear;

  const isDiffMode = selectedPhase === 'diff';

  // Check WebGL availability safely on mount
  useEffect(() => {
    try {
      if (typeof window === 'undefined' || !('ResizeObserver' in window)) {
        setHasWebGL(false);
        return;
      }
      const canvas = document.createElement('canvas');
      const gl =
        Boolean(window.WebGLRenderingContext) &&
        (canvas.getContext('webgl2') ||
          canvas.getContext('webgl') ||
          canvas.getContext('experimental-webgl'));
      setHasWebGL(Boolean(gl));
    } catch {
      setHasWebGL(false);
    }
  }, []);

  const handleResetCamera = useCallback(() => {
    if (controlsRef.current) {
      controlsRef.current.reset();
    }
    if (resetEarthRotationRef.current) {
      resetEarthRotationRef.current();
    }
  }, []);

  const handleResetReady = useCallback((resetFn: () => void) => {
    resetEarthRotationRef.current = resetFn;
  }, []);

  const dateA =
    comparisonData?.observation_date_a || '2012 Annual Composite (Suomi NPP VIIRS DNB)';
  const dateB =
    comparisonData?.observation_date_b ||
    '2023 Annual Composite (Suomi NPP & NOAA-20 VIIRS DNB)';

  return (
    <div
      id="observation-visualizer-panel"
      role="tabpanel"
      aria-labelledby={
        selectedPhase === 'a'
          ? 'tab-period-2012'
          : selectedPhase === 'b'
          ? 'tab-period-2023'
          : 'tab-period-diff'
      }
      className={className}
      aria-label={`Official NASA 3D Earth displaying Black Marble ${currentObservationYear} Observation`}
    >
      {/* 1. Main 3D Canvas or Accessible Fallback */}
      {hasWebGL === false ? (
        // Accessible Fallback for devices without WebGL or test environments
        selectedPhase === 'diff' ? (
          <div className="grid h-full w-full grid-cols-2 gap-1 overflow-hidden">
            <div className="relative h-full w-full overflow-hidden border-r border-white/10">
              <img
                src={
                  comparisonData?.image_a_url ||
                  '/api/datasets/night-lights/image?period=2012'
                }
                alt="NASA 2012 Night Lights Observation Baseline"
                loading="lazy"
                decoding="async"
                className="h-full w-full object-cover"
              />
              <div className="absolute bottom-3 left-3 rounded-full border border-sky-400/40 bg-black/75 px-3 py-1 backdrop-blur-md">
                <span className="font-mono text-[10px] font-bold text-sky-200">
                  {dateA}
                </span>
              </div>
            </div>
            <div className="relative h-full w-full overflow-hidden">
              <img
                src={
                  comparisonData?.image_b_url ||
                  '/api/datasets/night-lights/image?period=2023'
                }
                alt="NASA 2023 Night Lights Observation Modern State"
                loading="lazy"
                decoding="async"
                className="h-full w-full object-cover"
              />
              <div className="absolute bottom-3 right-3 rounded-full border border-amber-400/40 bg-black/75 px-3 py-1 backdrop-blur-md">
                <span className="font-mono text-[10px] font-bold text-amber-200">
                  {dateB}
                </span>
              </div>
            </div>
          </div>
        ) : (
          <div className="relative h-full w-full overflow-hidden">
            <img
              src={
                selectedPhase === 'a'
                  ? comparisonData?.image_a_url ||
                    '/api/datasets/night-lights/image?period=2012'
                  : comparisonData?.image_b_url ||
                    '/api/datasets/night-lights/image?period=2023'
              }
              alt={
                selectedPhase === 'a'
                  ? 'NASA 2012 Night Lights Observation Baseline'
                  : 'NASA 2023 Night Lights Observation Modern State'
              }
              loading="lazy"
              decoding="async"
              className="h-full w-full object-cover transition-transform duration-700"
            />
            <div className="absolute bottom-3 left-3 rounded-full border border-white/20 bg-black/75 px-3.5 py-1.5 backdrop-blur-md flex items-center gap-2">
              <span className="size-2 rounded-full bg-emerald-400 animate-ping" />
              <span className="font-mono text-xs font-semibold text-white">
                {selectedPhase === 'a' ? dateA : dateB}
              </span>
            </div>
          </div>
        )
      ) : (
        // Official NASA 3D Earth Model inside React Three Fiber
        <div className="h-full w-full cursor-grab active:cursor-grabbing touch-pan-y">
          <CanvasContainer
            className="h-full w-full"
            cameraFov={45}
            cameraPosition={[0, 0.2, 2.5]}
          >
            {/* Cinematic Multi-point Lighting */}
            <EarthLighting sunPosition={[4.5, 1.8, 2.5]} />

            {/* Background Stars & Atmospheric Outer Glow */}
            <EarthEnvironment />

            {/* Official NASA 3D Earth Model with Black Marble Radiance */}
            <NasaEarthModel
              observationYear={currentObservationYear}
              isDiffMode={isDiffMode}
              autoRotate={true}
              autoRotateSpeed={0.3}
              isInteracting={isInteracting}
              sunPosition={[4.5, 1.8, 2.5]}
              onResetReady={handleResetReady}
            />

            {/* Smooth Camera Interaction Controls */}
            <OrbitControls
              ref={controlsRef}
              makeDefault
              enablePan={false}
              enableZoom={true}
              minDistance={1.35}
              maxDistance={3.8}
              enableDamping={true}
              dampingFactor={0.06}
              rotateSpeed={0.55}
              zoomSpeed={0.65}
              onStart={() => setIsInteracting(true)}
              onEnd={() => setIsInteracting(false)}
            />
          </CanvasContainer>

          {/* Accessible off-screen metadata preserving screen-reader structure */}
          <div className="sr-only" aria-hidden="false">
            <span>{dateA}</span>
            <span>{dateB}</span>
          </div>
        </div>
      )}

      {/* 2. Top-Left: NASA Provenance & Telemetry Badge */}
      <div className="pointer-events-none absolute top-3.5 left-3.5 flex items-center gap-2 rounded-full border border-white/10 bg-black/75 px-3.5 py-1.5 backdrop-blur-md">
        <span className="size-2 rounded-full bg-cyan-400 animate-ping" />
        <span className="font-mono text-[10px] font-semibold uppercase tracking-wider text-cyan-200">
          NASA VTAD 3D MODEL • {isDiffMode ? '11-YEAR PLANETARY DELTA' : `${currentObservationYear} BLACK MARBLE`}
        </span>
      </div>

      {/* 3. Top-Right: Camera Reset Controller & Year Toggle */}
      <div className="absolute top-3.5 right-3.5 flex items-center gap-2">
        {selectedPhase === 'diff' && hasWebGL && (
          <div className="flex items-center rounded-full border border-white/15 bg-black/75 p-0.5 backdrop-blur-md">
            <button
              type="button"
              onClick={() => setDiffActiveYear('2012')}
              aria-label="View 2012 Observation in Dual Phase"
              className={`rounded-full px-2.5 py-1 font-mono text-[10px] uppercase transition-all ${
                diffActiveYear === '2012'
                  ? 'bg-sky-500/30 text-sky-200 border border-sky-400/50 shadow-[0_0_8px_rgba(56,189,248,0.3)]'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              2012
            </button>
            <button
              type="button"
              onClick={() => setDiffActiveYear('2023')}
              aria-label="View 2023 Observation in Dual Phase"
              className={`rounded-full px-2.5 py-1 font-mono text-[10px] uppercase transition-all ${
                diffActiveYear === '2023'
                  ? 'bg-amber-500/30 text-amber-200 border border-amber-400/50 shadow-[0_0_8px_rgba(251,191,36,0.3)]'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              2023
            </button>
          </div>
        )}

        <button
          type="button"
          onClick={handleResetCamera}
          aria-label="Reset 3D Earth camera to default perspective"
          className="flex items-center gap-1.5 rounded-full border border-white/15 bg-black/60 px-3 py-1.5 font-mono text-[11px] text-slate-200 backdrop-blur-md transition-all hover:border-cyan-400 hover:bg-black/80 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 active:scale-95"
        >
          <RotateCcw className="size-3.5 text-cyan-300" />
          <span className="hidden sm:inline">Reset View</span>
        </button>
      </div>

      {/* 4. Bottom-Center: Subtle User Navigation Hint */}
      <div className="pointer-events-none absolute bottom-3.5 left-1/2 -translate-x-1/2 flex items-center gap-2 rounded-full border border-white/10 bg-black/65 px-3.5 py-1 backdrop-blur-md">
        <Compass className="size-3 text-cyan-400" />
        <span className="font-mono text-[10px] uppercase tracking-wider text-slate-300">
          Drag to Orbit • Scroll to Zoom
        </span>
      </div>

      {/* 5. Authentic NASA Attribution Watermark */}
      <div className="pointer-events-none absolute bottom-3.5 right-3.5 hidden sm:block rounded-full border border-white/10 bg-black/75 px-3 py-1 backdrop-blur-md">
        <span className="font-mono text-[9px] uppercase tracking-wider text-slate-400">
          NASA SVS #5313 • VTAD GLTF
        </span>
      </div>
    </div>
  );
}

export default GlobeViewer;
