'use client';

import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import {
  Play,
  Pause,
  Activity,
  ShieldCheck,
  Volume2,
  VolumeX,
  Layers,
  Info,
  Sparkles,
  RefreshCw,
  X,
  Download,
  ExternalLink,
  ArrowLeft,
  ArrowRight,
  Radio,
  Sliders,
  Cpu,
} from 'lucide-react';
import type { SonicTrackConfig } from '@/config/earth-song.config';
import type { DatasetMetadata, AccessibilityResponse } from '@nasa-experience/contracts';
import { sonificationService, insightsService } from '@/services/api';
import { Starfield } from './starfield';

interface DatasetSonificationViewProps {
  track: SonicTrackConfig;
  datasetMeta?: DatasetMetadata | null;
  prevTrack?: SonicTrackConfig | null;
  nextTrack?: SonicTrackConfig | null;
}

export function DatasetSonificationView({
  track,
  datasetMeta,
  prevTrack,
  nextTrack,
}: DatasetSonificationViewProps) {
  // Audio playback state
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(12);
  const [activeAudioSource, setActiveAudioSource] = useState<string>(
    track.audioSrc || `/api/sonification/${track.id}/download`
  );

  // EQ sliders (0 to 100)
  const [eqBass, setEqBass] = useState(65);
  const [eqMid, setEqMid] = useState(75);
  const [eqHigh, setEqHigh] = useState(60);

  // Active drawer toggles
  const [showMixer, setShowMixer] = useState(true);
  const [showScience, setShowScience] = useState(true);
  const [visualizerMode, setVisualizerMode] = useState<'radar' | 'spectrum' | 'scanline'>('radar');

  // Dynamically compute constituent layers from NASA sonification rules or variables for all 11 datasets
  const computedLayers = useMemo(() => {
    const rules = track.sonificationRules || datasetMeta?.sonification_rules || [];
    if (rules.length > 0) {
      return rules.map((r, idx) => ({
        key: r.layer_name,
        name: r.layer_name,
        variable: r.variable_mapped,
        mapping: r.mapping_range,
        mode: r.synthesis_mode,
        defaultVol: [80, 70, 65, 50][idx % 4] || 60,
      }));
    }
    const vars = datasetMeta?.scientific_variables || [];
    if (vars.length > 0) {
      return vars.map((v, idx) => ({
        key: v.name,
        name: v.name,
        variable: v.unit,
        mapping: `${v.typical_range[0]} - ${v.typical_range[1]} ${v.unit}`,
        mode: 'Proportional PCM frequency synthesis',
        defaultVol: [80, 70, 65, 50][idx % 4] || 60,
      }));
    }
    return [
      { key: 'primary_resonance', name: 'Primary Harmonic Drone', variable: 'Core Environmental Telemetry', mapping: track.frequency, mode: 'Sub-bass fundamental', defaultVol: 80 },
      { key: 'spatial_flutter', name: 'Spatial Kinetic Flutter', variable: 'Dynamic Circulation Flow', mapping: '330-880 Hz', mode: 'Stereo pan modulation', defaultVol: 70 },
      { key: 'ambient_shimmer', name: 'Atmospheric Albedo Shimmer', variable: 'Radiative Solar Flux', mapping: '1200-4000 Hz', mode: 'Airy high-pass wash', defaultVol: 60 },
    ];
  }, [track.sonificationRules, datasetMeta?.sonification_rules, datasetMeta?.scientific_variables, track.frequency]);

  // DSP Layer Customization State
  const [isSynthesizing, setIsSynthesizing] = useState(false);
  const [customCadenceActive, setCustomCadenceActive] = useState(false);
  const [layerVolumes, setLayerVolumes] = useState<Record<string, number>>(() => {
    const init: Record<string, number> = {};
    computedLayers.forEach((l) => {
      init[l.key] = l.defaultVol;
    });
    return init;
  });

  useEffect(() => {
    setLayerVolumes((prev) => {
      const next = { ...prev };
      computedLayers.forEach((l) => {
        if (next[l.key] === undefined) {
          next[l.key] = l.defaultVol;
        }
      });
      return next;
    });
  }, [computedLayers]);

  // Science / Accessibility data
  const [accessibilityData, setAccessibilityData] = useState<AccessibilityResponse | null>(null);

  // Web Audio refs
  const audioRef = useRef<HTMLAudioElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const radarCanvasRef = useRef<HTMLCanvasElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<MediaElementAudioSourceNode | null>(null);
  const bassFilterRef = useRef<BiquadFilterNode | null>(null);
  const midFilterRef = useRef<BiquadFilterNode | null>(null);
  const highFilterRef = useRef<BiquadFilterNode | null>(null);
  const animFrameRef = useRef<number | null>(null);

  // Visual scanline progress state (0 to 100%)
  const [scanProgress, setScanProgress] = useState(0);

  // Load accessibility / science legend
  useEffect(() => {
    let isMounted = true;
    async function loadScience() {
      try {
        const res = await insightsService.getAccessibility(track.id);
        if (res.success && res.data && isMounted) {
          setAccessibilityData(res.data);
        }
      } catch {
        // Fallback safely
      }
    }
    loadScience();
    return () => {
      isMounted = false;
    };
  }, [track.id]);

  // Setup Web Audio API and Connect Audio Graph
  const setupWebAudio = useCallback(() => {
    if (audioContextRef.current || !audioRef.current) return;

    try {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const ctx = new AudioCtx();
      audioContextRef.current = ctx;

      const analyser = ctx.createAnalyser();
      analyser.fftSize = 256;
      analyser.smoothingTimeConstant = 0.85;
      analyserRef.current = analyser;

      const bass = ctx.createBiquadFilter();
      bass.type = 'lowshelf';
      bass.frequency.value = 250;
      bass.gain.value = (eqBass - 50) * 0.4;
      bassFilterRef.current = bass;

      const mid = ctx.createBiquadFilter();
      mid.type = 'peaking';
      mid.frequency.value = 1000;
      mid.Q.value = 1.0;
      mid.gain.value = (eqMid - 50) * 0.4;
      midFilterRef.current = mid;

      const high = ctx.createBiquadFilter();
      high.type = 'highshelf';
      high.frequency.value = 4000;
      high.gain.value = (eqHigh - 50) * 0.4;
      highFilterRef.current = high;

      const source = ctx.createMediaElementSource(audioRef.current);
      sourceRef.current = source;

      // Audio Graph: Source -> Bass -> Mid -> High -> Analyser -> Destination
      source.connect(bass);
      bass.connect(mid);
      mid.connect(high);
      high.connect(analyser);
      analyser.connect(ctx.destination);
    } catch {
      // AudioContext fallback handled
    }
  }, [eqBass, eqMid, eqHigh]);

  // Sync EQ Sliders with BiquadFilterNodes
  useEffect(() => {
    if (bassFilterRef.current) {
      bassFilterRef.current.gain.value = (eqBass - 50) * 0.4;
    }
  }, [eqBass]);

  useEffect(() => {
    if (midFilterRef.current) {
      midFilterRef.current.gain.value = (eqMid - 50) * 0.4;
    }
  }, [eqMid]);

  useEffect(() => {
    if (highFilterRef.current) {
      highFilterRef.current.gain.value = (eqHigh - 50) * 0.4;
    }
  }, [eqHigh]);

  // Audio Play / Pause handler
  const handleTogglePlay = async () => {
    if (!audioRef.current) return;

    if (audioContextRef.current?.state === 'suspended') {
      await audioContextRef.current.resume();
    } else if (!audioContextRef.current) {
      setupWebAudio();
    }

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      try {
        await audioRef.current.play();
        setIsPlaying(true);
      } catch {
        // Autoplay policy or format handling
      }
    }
  };

  // Time & Scanline update
  const handleTimeUpdate = () => {
    if (!audioRef.current) return;
    const cur = audioRef.current.currentTime;
    const dur = audioRef.current.duration || 12;
    setCurrentTime(cur);
    setDuration(dur);
    setScanProgress((cur / dur) * 100);
  };

  // Canvas Studio Analyser / Radar render loop
  useEffect(() => {
    const canvas = radarCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let localFrame: number;

    const renderVisualizer = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;
      const baseRadius = Math.min(centerX, centerY) * 0.55;

      let freqData: Uint8Array = new Uint8Array(64);
      if (analyserRef.current && isPlaying) {
        analyserRef.current.getByteFrequencyData(freqData);
      } else {
        // Idle ambient breathing animation
        const time = Date.now() * 0.002;
        for (let i = 0; i < 64; i++) {
          freqData[i] = Math.sin(time + i * 0.1) * 20 + 25;
        }
      }

      // 1. Draw outer dashed radar ring
      ctx.beginPath();
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
      ctx.lineWidth = 1;
      ctx.setLineDash([3, 5]);
      ctx.arc(centerX, centerY, baseRadius + 14, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);

      // 2. Draw reactive circular spectrum spikes
      ctx.beginPath();
      const points = 48;
      for (let i = 0; i < points; i++) {
        const angle = (i / points) * Math.PI * 2 - Math.PI / 2;
        const val = (freqData[i % freqData.length] || 10) / 255;
        const r = baseRadius + val * 24;
        const x = centerX + Math.cos(angle) * r;
        const y = centerY + Math.sin(angle) * r;

        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      }
      ctx.closePath();
      ctx.strokeStyle = track.color.accent;
      ctx.lineWidth = 2;
      ctx.stroke();

      // Glow fill inside the radar
      ctx.fillStyle = isPlaying ? track.color.glow : 'rgba(255, 255, 255, 0.03)';
      ctx.fill();

      // 3. Central core pulse
      ctx.beginPath();
      ctx.arc(centerX, centerY, 4, 0, Math.PI * 2);
      ctx.fillStyle = track.color.accent;
      ctx.fill();

      // 4. Horizontal frequency line on the right of radar
      ctx.beginPath();
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
      ctx.lineWidth = 1;
      ctx.moveTo(centerX + baseRadius + 24, centerY);
      ctx.lineTo(canvas.width - 12, centerY);
      ctx.stroke();

      localFrame = requestAnimationFrame(renderVisualizer);
    };

    renderVisualizer();

    return () => {
      if (localFrame) cancelAnimationFrame(localFrame);
    };
  }, [isPlaying, track.color.accent, track.color.glow]);

  // Linear spectrum bars canvas render loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;

    const drawBars = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      let dataArray = new Uint8Array(64);
      if (analyserRef.current && isPlaying) {
        analyserRef.current.getByteFrequencyData(dataArray);
      } else {
        const time = Date.now() * 0.003;
        for (let i = 0; i < 64; i++) {
          dataArray[i] = Math.sin(time + i * 0.15) * 15 + 20;
        }
      }

      const barWidth = (canvas.width / 48) - 2;
      let x = 0;

      for (let i = 0; i < 48; i++) {
        const barHeight = ((dataArray[i] || 5) / 255) * canvas.height;
        const gradient = ctx.createLinearGradient(0, canvas.height, 0, 0);
        gradient.addColorStop(0, track.color.accent);
        gradient.addColorStop(1, '#ffffff');

        ctx.fillStyle = gradient;
        ctx.fillRect(x, canvas.height - barHeight, barWidth, barHeight);
        x += barWidth + 2;
      }

      animId = requestAnimationFrame(drawBars);
    };

    drawBars();

    return () => {
      if (animId) cancelAnimationFrame(animId);
    };
  }, [isPlaying, track.color.accent]);

  // Synthesize customized DSP mix from Python backend
  const handleSynthesizeCustomMix = async () => {
    setIsSynthesizing(true);
    try {
      const layers = Object.entries(layerVolumes).map(([name, vol], idx) => ({
        name,
        enabled: vol > 0,
        volume: vol / 100,
        pan: idx % 2 === 0 ? -0.2 : 0.2,
      }));

      const res = await sonificationService.generateSonification({
        dataset_id: track.id,
        duration_seconds: 12.0,
        sample_rate: 44100,
        preset: 'custom_interactive',
        layers,
        loop_seamless: true,
      });

      if (res.success && res.data) {
        setActiveAudioSource(res.data.download_url);
        setCustomCadenceActive(true);
        if (audioRef.current) {
          audioRef.current.src = res.data.download_url;
          audioRef.current.load();
          if (!isPlaying) {
            handleTogglePlay();
          }
        }
      }
    } catch {
      // Fallback
    } finally {
      setIsSynthesizing(false);
    }
  };

  // Format seconds to M:SS
  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="relative min-h-screen w-full bg-[#020512] text-white selection:bg-sky-400 selection:text-black">
      {/* Background Starfield */}
      <Starfield />

      {/* Dynamic Ambient Nebula Glow shifting hue to match dataset accent */}
      <div
        className="pointer-events-none fixed inset-0 transition-colors duration-1000 ease-out"
        style={{
          background: `radial-gradient(circle at 50% 30%, ${track.color.nebula} 0%, rgba(2,5,18,0.85) 60%, #020512 100%)`,
        }}
      />

      {/* Hidden HTML5 Audio Element connected to Web Audio */}
      <audio
        ref={audioRef}
        src={activeAudioSource}
        preload="auto"
        loop
        muted={isMuted}
        onTimeUpdate={handleTimeUpdate}
        onError={() => {
          if (audioRef.current && !audioRef.current.src.endsWith('/audio/loop.mp3')) {
            audioRef.current.src = '/audio/loop.mp3';
            setActiveAudioSource('/audio/loop.mp3');
            audioRef.current.load();
          }
        }}
      />

      <div className="relative z-10 mx-auto max-w-7xl px-4 pt-24 pb-20 sm:px-6 lg:px-8">
        {/* Top Header Navigation & Breadcrumbs */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <Link
            href="/#jukebox"
            className="group flex items-center gap-2 rounded-full border border-white/10 bg-black/40 px-4 py-2 text-xs font-medium text-slate-300 backdrop-blur-md transition-all hover:border-sky-400/50 hover:bg-black/60 hover:text-white"
          >
            <ArrowLeft className="size-4 transition-transform group-hover:-translate-x-1" />
            <span>Return to Earth Song Gallery</span>
          </Link>

          <div className="flex flex-wrap items-center gap-2">
            <span className="font-mono text-xs font-semibold uppercase tracking-wider text-sky-400">
              {track.category}
            </span>
            <span className="text-white/20">•</span>
            <div className="rounded-full border border-white/15 bg-black/60 px-3 py-1 font-mono text-xs text-sky-300 backdrop-blur-md">
              {track.frequency}
            </div>
            {track.svsId && (
              <a
                href={track.nasaUrl || `https://svs.gsfc.nasa.gov/${track.svsId}/`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 rounded-full border border-sky-400/40 bg-sky-950/70 px-3 py-1 font-mono text-[10px] font-bold uppercase tracking-wider text-sky-200 transition-colors hover:border-sky-300"
              >
                <span>NASA SVS #{track.svsId}</span>
                <ExternalLink className="size-3" />
              </a>
            )}
          </div>
        </div>

        {/* Dataset Headline */}
        <div className="mb-8">
          <h1 className="special-font font-zentry text-3xl font-black uppercase tracking-tight text-white sm:text-5xl lg:text-6xl">
            {track.title}
          </h1>
          <p className="mt-2 max-w-3xl font-circular text-sm font-light text-slate-300 sm:text-base">
            {track.description}
          </p>
        </div>

        {/* SECTION 1: DUAL-WINDOW VISUAL-TO-AUDIO CONVERSION ENGINE */}
        <div className="mb-10 grid grid-cols-1 gap-6 lg:grid-cols-12">
          {/* LEFT: Authentic NASA Satellite Visualizer with Active Optical-to-Acoustic Scanline */}
          <div className="relative flex flex-col overflow-hidden rounded-3xl border border-white/15 bg-black/60 shadow-2xl backdrop-blur-xl lg:col-span-7">
            {/* Visualizer Header Bar */}
            <div className="flex items-center justify-between border-b border-white/10 bg-black/50 px-5 py-3">
              <div className="flex items-center gap-2">
                <span className="inline-block size-2 rounded-full bg-emerald-400 animate-ping" />
                <span className="font-mono text-[11px] font-bold uppercase tracking-wider text-emerald-300">
                  Optical-to-Acoustic Sonification Engine
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-[10px] text-slate-400">
                  SCAN POSITION: {Math.round(scanProgress)}%
                </span>
              </div>
            </div>

            {/* NASA Visual Container with Scanning Overlay */}
            <div className="relative aspect-[16/10] w-full overflow-hidden bg-black">
              {track.imageSrc ? (
                <img
                  src={track.imageSrc}
                  alt={`${track.title} - NASA Satellite Visualization`}
                  className="h-full w-full object-cover transition-transform duration-700 hover:scale-105"
                />
              ) : (
                <video
                  src={track.videoSrc}
                  loop
                  muted
                  playsInline
                  autoPlay
                  className="h-full w-full object-cover"
                />
              )}

              {/* Cyan Vertical Scanline converting pixels to audio */}
              <div
                className="pointer-events-none absolute bottom-0 top-0 w-0.5 shadow-[0_0_15px_4px_rgba(56,189,248,0.8)] transition-all duration-100 ease-linear"
                style={{
                  left: `${scanProgress}%`,
                  backgroundColor: track.color.accent,
                }}
              >
                <div
                  className="absolute -top-1 left-1/2 -translate-x-1/2 rounded-full px-1.5 py-0.5 font-mono text-[8px] font-bold text-black"
                  style={{ backgroundColor: track.color.accent }}
                >
                  AUDIO CONVERTER
                </div>
              </div>

              {/* Filmic Vignette */}
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20" />

              {/* Bottom Visual Telemetry Overlay */}
              <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between rounded-xl border border-white/10 bg-black/60 px-4 py-2 text-xs backdrop-blur-md">
                <div className="flex items-center gap-3">
                  <div className="font-mono text-[11px] text-sky-300">
                    SCAN FREQ: <span className="text-white font-bold">{track.frequency}</span>
                  </div>
                  <span className="text-white/20">|</span>
                  <div className="font-mono text-[11px] text-slate-300">
                    MODE: <span className="text-white">Continuous PCM DSP</span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleTogglePlay}
                  className="flex items-center gap-1.5 rounded-lg border border-sky-400/40 bg-sky-950/80 px-3 py-1 font-mono text-xs font-semibold text-sky-200 transition-all hover:bg-sky-900"
                >
                  {isPlaying ? <Pause className="size-3.5 fill-current" /> : <Play className="size-3.5 fill-current" />}
                  <span>{isPlaying ? 'PAUSE SCAN' : 'START CONVERSION'}</span>
                </button>
              </div>
            </div>
          </div>

          {/* RIGHT: High-Precision Studio Analyser & Sonic Console */}
          <div className="flex flex-col justify-between rounded-3xl border border-white/15 bg-black/60 p-6 shadow-2xl backdrop-blur-xl lg:col-span-5">
            {/* Top Row: Circular Radar Visualizer & Title */}
            <div>
              <div className="flex items-start gap-4">
                {/* Circular Radar Visualizer Canvas (Exact Match to Screenshot 2) */}
                <div className="relative size-24 flex-shrink-0 overflow-hidden rounded-2xl border border-white/10 bg-black/80 p-1 sm:size-28">
                  <canvas ref={radarCanvasRef} width={112} height={112} className="h-full w-full" />
                  <div className="absolute bottom-1 left-2 font-mono text-[8px] text-slate-400">
                    STUDIO ANALYSER • {track.frequency}
                  </div>
                </div>

                <div className="flex-1 min-w-0">
                  <span className="font-mono text-[10px] font-semibold uppercase tracking-widest text-sky-400">
                    {track.category}
                  </span>
                  <h3 className="special-font font-zentry mt-0.5 truncate text-lg font-black uppercase text-white sm:text-xl">
                    {track.title}
                  </h3>
                  <div className="mt-1 flex items-center gap-2">
                    <span className="inline-block size-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="font-mono text-[10px] text-emerald-300">
                      PRANA AUDIO ENGINE LIVE
                    </span>
                  </div>
                </div>
              </div>

              {/* Main "HEAR EARTH AUDIO" Button & Quick Toggles (Exact Match to Screenshot 2) */}
              <div className="mt-6 flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={handleTogglePlay}
                  className="group flex flex-1 items-center justify-center gap-2.5 rounded-full border border-white/20 bg-white/10 px-6 py-3 font-mono text-xs font-bold uppercase tracking-wider text-white shadow-xl backdrop-blur-md transition-all hover:scale-[1.02] hover:border-sky-400/80 hover:bg-white/20 active:scale-95"
                >
                  {isPlaying ? (
                    <>
                      <Pause className="size-4 fill-current text-sky-300" />
                      <span>PAUSE SOUNDSCAPE</span>
                    </>
                  ) : (
                    <>
                      <Play className="size-4 fill-current text-sky-300" />
                      <span>HEAR EARTH AUDIO</span>
                    </>
                  )}
                </button>

                {/* Layer Synthesizer Toggle */}
                <button
                  type="button"
                  onClick={() => setShowMixer((prev) => !prev)}
                  className={`flex size-11 items-center justify-center rounded-full border transition-all ${showMixer
                    ? 'border-sky-400 bg-sky-950/80 text-sky-300 shadow-[0_0_15px_rgba(56,189,248,0.4)]'
                    : 'border-white/15 bg-white/5 text-slate-300 hover:border-white/40'
                    }`}
                  aria-label="Toggle Layer Synthesizer Drawer"
                >
                  <Layers className="size-4" />
                </button>

                {/* Scientific Legend Toggle */}
                <button
                  type="button"
                  onClick={() => setShowScience((prev) => !prev)}
                  className={`flex size-11 items-center justify-center rounded-full border transition-all ${showScience
                    ? 'border-amber-400 bg-amber-950/80 text-amber-300 shadow-[0_0_15px_rgba(245,158,11,0.4)]'
                    : 'border-white/15 bg-white/5 text-slate-300 hover:border-white/40'
                    }`}
                  aria-label="Toggle Scientific Interpretation Drawer"
                >
                  <Info className="size-4" />
                </button>

                {/* Audio Mute Toggle */}
                <button
                  type="button"
                  onClick={() => setIsMuted((prev) => !prev)}
                  className="flex size-11 items-center justify-center rounded-full border border-white/15 bg-white/5 text-slate-300 transition-all hover:border-white/40 hover:text-white"
                  aria-label={isMuted ? 'Unmute Audio' : 'Mute Audio'}
                >
                  {isMuted ? <VolumeX className="size-4" /> : <Volume2 className="size-4" />}
                </button>
              </div>

              {/* Progress Scrubber Bar */}
              <div className="mt-6">
                <div className="relative h-1.5 w-full cursor-pointer rounded-full bg-white/15">
                  <div
                    className="absolute left-0 top-0 h-full rounded-full transition-all"
                    style={{
                      width: `${scanProgress}%`,
                      backgroundColor: track.color.accent,
                    }}
                  />
                  <div
                    className="absolute top-1/2 size-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow"
                    style={{
                      left: `${scanProgress}%`,
                      backgroundColor: track.color.accent,
                    }}
                  />
                </div>
                <div className="mt-2 flex justify-between font-mono text-[11px] text-slate-400">
                  <span>{formatTime(currentTime)}</span>
                  <span>{formatTime(duration)}</span>
                </div>
              </div>

              {/* 3-Band Equalizer Sliders (Low/Bass, Mid Resonance, High Shimmer) */}
              <div className="mt-6 space-y-3 rounded-2xl border border-white/10 bg-black/40 p-4">
                <div className="flex items-center justify-between text-xs font-mono text-slate-300">
                  <span>LOW / BASS</span>
                  <span className="text-sky-300 font-bold">{eqBass}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={eqBass}
                  onChange={(e) => setEqBass(Number(e.target.value))}
                  className="h-1 w-full accent-sky-400"
                />

                <div className="flex items-center justify-between text-xs font-mono text-slate-300">
                  <span>MID RESONANCE</span>
                  <span className="text-sky-300 font-bold">{eqMid}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={eqMid}
                  onChange={(e) => setEqMid(Number(e.target.value))}
                  className="h-1 w-full accent-sky-400"
                />

                <div className="flex items-center justify-between text-xs font-mono text-slate-300">
                  <span>HIGH SHIMMER</span>
                  <span className="text-sky-300 font-bold">{eqHigh}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={eqHigh}
                  onChange={(e) => setEqHigh(Number(e.target.value))}
                  className="h-1 w-full accent-sky-400"
                />
              </div>
            </div>

            {/* Bottom Status Bar & Direct WAV Download */}
            <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-4">
              <div className="flex items-center gap-2 font-mono text-[10px] text-slate-300">
                <span className="size-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>NASA DATA SOUNDSCAPE STREAMING (16-BIT STEREO)</span>
              </div>
              <a
                href={activeAudioSource}
                download={`${track.id}-prana-sonification.wav`}
                className="flex items-center gap-1.5 rounded-full border border-white/20 bg-white/5 px-3 py-1 font-mono text-xs text-sky-200 transition-colors hover:border-sky-400 hover:bg-sky-950"
              >
                <Download className="size-3.5" />
                <span>Download Master WAV</span>
              </a>
            </div>
          </div>
        </div>

        {/* SECTION 2: CONSTITUENT LAYER SYNTHESIZER (Matching Screenshot 4) */}
        {showMixer && (
          <div className="mb-10 overflow-hidden rounded-3xl border border-sky-400/30 bg-[#04081e]/90 p-6 shadow-2xl backdrop-blur-xl">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div className="flex items-center gap-2">
                <Layers className="size-5 text-sky-400" />
                <h3 className="font-mono text-sm font-bold uppercase tracking-wider text-white">
                  Constituent Layer Synthesizer
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <span className="rounded-full border border-sky-400/30 bg-sky-950/70 px-3 py-0.5 font-mono text-[10px] font-semibold text-sky-300">
                  Pure Mathematical DSP
                </span>
                <button
                  type="button"
                  onClick={() => setShowMixer(false)}
                  className="text-slate-400 hover:text-white"
                  aria-label="Close Layer Synthesizer"
                >
                  <X className="size-4" />
                </button>
              </div>
            </div>

            {/* Sliders for each constituent layer - dynamically rendered for all 11 datasets */}
            <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {computedLayers.map((layer) => (
                <div key={layer.key} className="rounded-2xl border border-white/10 bg-black/40 p-4">
                  <div className="flex items-center justify-between font-mono text-xs">
                    <span className="font-bold uppercase text-slate-200 truncate pr-2">
                      {layer.name}
                    </span>
                    <span className="text-sky-400 font-bold">{layerVolumes[layer.key] ?? layer.defaultVol}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={layerVolumes[layer.key] ?? layer.defaultVol}
                    onChange={(e) =>
                      setLayerVolumes((prev) => ({
                        ...prev,
                        [layer.key]: Number(e.target.value),
                      }))
                    }
                    className="mt-3 h-1.5 w-full accent-sky-400"
                  />
                  <div className="mt-2 text-[10px] text-slate-400 truncate">
                    {layer.mapping} • {layer.mode}
                  </div>
                </div>
              ))}
            </div>

            {/* Re-Synthesize Trigger */}
            <div className="mt-6 flex flex-wrap items-center justify-between gap-4 border-t border-white/10 pt-4">
              <div className="font-mono text-xs text-slate-300">
                Adjust sliders to re-calculate mathematical sonification rules in Python FastAPI.
              </div>
              <button
                type="button"
                onClick={handleSynthesizeCustomMix}
                disabled={isSynthesizing}
                className="flex items-center gap-2 rounded-full border border-sky-400/80 bg-sky-500/20 px-6 py-2.5 font-mono text-xs font-bold uppercase tracking-wider text-sky-200 transition-all hover:bg-sky-500/30 active:scale-95 disabled:opacity-50"
              >
                {isSynthesizing ? (
                  <>
                    <RefreshCw className="size-4 animate-spin text-sky-300" />
                    <span>SYNTHESIZING CADENCE...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="size-4 text-sky-300" />
                    <span>SYNTHESIZE CUSTOM CADENCE</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* SECTION 3: SCIENTIFIC INTERPRETATION & AUDIO LEGEND (Matching Screenshot 3) */}
        {showScience && (
          <div className="mb-10 overflow-hidden rounded-3xl border border-amber-500/30 bg-[#120e03]/90 p-6 shadow-2xl backdrop-blur-xl">
            <div className="flex items-center justify-between border-b border-amber-500/20 pb-4">
              <div className="flex items-center gap-2">
                <Info className="size-5 text-amber-400" />
                <h3 className="font-mono text-sm font-bold uppercase tracking-wider text-amber-300">
                  Scientific Interpretation & Audio Legend
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowScience(false)}
                className="text-amber-400/60 hover:text-amber-300"
                aria-label="Close Science Legend"
              >
                <X className="size-4" />
              </button>
            </div>

            {/* Context narrative */}
            <p className="mt-4 font-circular text-sm leading-relaxed text-amber-100/90">
              {accessibilityData?.plain_language_summary ||
                `You are listening to composite planetary vital signs synthesized from ${track.title} NASA Earth Science mission observations. The soundscape converts visual satellite measurements directly into audible frequencies, giving voice to planetary circulation and dynamics.`}
            </p>

            {/* Variable-To-Sound Scientific Legend Table - dynamically rendered for all 11 datasets */}
            <div className="mt-6">
              <h4 className="font-mono text-xs font-bold uppercase tracking-wider text-amber-400">
                Variable-to-Sound Scientific Legend
              </h4>
              <div className="mt-3 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
                {computedLayers.map((item, idx) => (
                  <div
                    key={idx}
                    className="rounded-2xl border border-amber-500/20 bg-black/50 p-4"
                  >
                    <div className="font-mono text-xs font-bold text-amber-300">
                      {item.name}
                    </div>
                    <div className="mt-1 font-mono text-[11px] text-amber-400">
                      {item.mapping}
                    </div>
                    <div className="mt-2 text-xs text-amber-100/80">
                      Mapped to: <span className="font-semibold text-white">{item.variable}</span>
                    </div>
                    <div className="mt-1 text-[11px] text-slate-400">
                      {item.mode}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Acoustic Guide */}
            <div className="mt-6 rounded-2xl border border-amber-500/20 bg-black/40 p-4">
              <div className="font-mono text-xs font-bold text-amber-400">
                Acoustic Guide: Orbital Transposition & Sound Design
              </div>
              <p className="mt-1.5 font-circular text-xs leading-relaxed text-amber-100/80">
                {accessibilityData?.audio_guide ||
                  'The sound design transposition models decadal turnover into the audible spectrum. Atmospheric turnover is mapped to cyclic envelope oscillations; soundscape dynamics reflect NASA Earth satellite vital signs.'}
              </p>
            </div>

            {/* Tactile Transducer Guidance */}
            <div className="mt-4 rounded-2xl border border-amber-500/20 bg-black/40 p-4">
              <div className="flex items-center gap-2 font-mono text-xs font-bold text-amber-400">
                <Volume2 className="size-4" />
                <span>Tactile Transducer / Bass Shaker Guidance:</span>
              </div>
              <p className="mt-1.5 font-circular text-xs leading-relaxed text-amber-100/80">
                {accessibilityData?.tactile_equivalent_guidance ||
                  'Sub-bass tactile vibrations (68 Hz and 136 Hz) translate composite planetary vital signs for haptic exploration and bass transducers.'}
              </p>
            </div>
          </div>
        )}

        {/* SECTION 4: MISSION DATA PROVENANCE & INDICATORS */}
        <div className="mb-10 rounded-3xl border border-white/10 bg-black/40 p-6 backdrop-blur-md">
          <h3 className="font-mono text-xs font-bold uppercase tracking-wider text-slate-300">
            NASA Mission Provenance & Scientific Indicators
          </h3>
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 font-mono text-xs">
            <div className="rounded-xl border border-white/10 bg-white/5 p-4">
              <span className="text-[10px] uppercase text-slate-400">Spatial Coverage</span>
              <p className="mt-1 text-slate-200">
                {datasetMeta?.spatial_coverage || 'Global Observation Fleet (180°W - 180°E)'}
              </p>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/5 p-4">
              <span className="text-[10px] uppercase text-slate-400">Temporal Coverage</span>
              <p className="mt-1 text-slate-200">
                {datasetMeta?.temporal_coverage || 'Continuous Decadal Earth Observations'}
              </p>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/5 p-4">
              <span className="text-[10px] uppercase text-slate-400">Data Provenance</span>
              <p className="mt-1 text-slate-200">
                {datasetMeta?.data_provenance || 'NASA Earth Science Division / SVS'}
              </p>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/5 p-4">
              <span className="text-[10px] uppercase text-slate-400">NASA SVS Portal</span>
              <p className="mt-1">
                {track.nasaUrl ? (
                  <a
                    href={track.nasaUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-sky-400 hover:underline"
                  >
                    <span>Official NASA SVS Link</span>
                    <ExternalLink className="size-3" />
                  </a>
                ) : (
                  <span className="text-slate-400">NASA Earth Science Division</span>
                )}
              </p>
            </div>
          </div>
        </div>

        {/* BOTTOM: PREVIOUS / NEXT DATASET NAVIGATION */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-t border-white/15 pt-8">
          {prevTrack ? (
            <Link
              href={`/dataset/${prevTrack.id}`}
              className="group flex items-center gap-3 rounded-2xl border border-white/10 bg-black/40 px-5 py-3 text-left transition-all hover:border-sky-400/50 hover:bg-black/70"
            >
              <ArrowLeft className="size-5 text-sky-400 transition-transform group-hover:-translate-x-1" />
              <div>
                <span className="block font-mono text-[10px] uppercase tracking-wider text-slate-400">
                  Previous Dataset
                </span>
                <span className="block font-bold text-white text-sm truncate max-w-xs">
                  {prevTrack.title}
                </span>
              </div>
            </Link>
          ) : (
            <div />
          )}

          {nextTrack ? (
            <Link
              href={`/dataset/${nextTrack.id}`}
              className="group flex items-center gap-3 rounded-2xl border border-white/10 bg-black/40 px-5 py-3 text-right transition-all hover:border-sky-400/50 hover:bg-black/70 ml-auto"
            >
              <div>
                <span className="block font-mono text-[10px] uppercase tracking-wider text-slate-400">
                  Next Dataset
                </span>
                <span className="block font-bold text-white text-sm truncate max-w-xs">
                  {nextTrack.title}
                </span>
              </div>
              <ArrowRight className="size-5 text-sky-400 transition-transform group-hover:translate-x-1" />
            </Link>
          ) : (
            <div />
          )}
        </div>
      </div>
    </div>
  );
}
