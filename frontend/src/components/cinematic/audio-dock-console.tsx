'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { type SonicTrackConfig } from '@/config/earth-song.config';
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
} from 'lucide-react';
import { useAppStore } from '@/stores/app-store';
import { sonificationService, insightsService } from '@/services/api';
import type { AccessibilityResponse } from '@nasa-experience/contracts';

interface AudioDockConsoleProps {
  activeTrack: SonicTrackConfig;
  isPlaying: boolean;
  onTogglePlay: () => void;
}

export function AudioDockConsole({ activeTrack, isPlaying, onTogglePlay }: AudioDockConsoleProps) {
  const [eqBass, setEqBass] = useState(65);
  const [eqMid, setEqMid] = useState(75);
  const [eqHigh, setEqHigh] = useState(60);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(180);
  const [healthStatus, setHealthStatus] = useState<'idle' | 'checking' | 'healthy'>('idle');
  const [announcement, setAnnouncement] = useState('');

  // Real NASA audio & customization state
  const [activeAudioSource, setActiveAudioSource] = useState<string>(
    activeTrack.audioSrc || '/audio/loop.mp3'
  );
  const [isSynthesizing, setIsSynthesizing] = useState(false);
  const [customMixActive, setCustomMixActive] = useState(false);
  const [audioFallbackActive, setAudioFallbackActive] = useState(false);
  const [showMixer, setShowMixer] = useState(false);
  const [showAccessibility, setShowAccessibility] = useState(false);
  const [accessibilityData, setAccessibilityData] = useState<AccessibilityResponse | null>(null);

  // 4-layer constituent adjustments (0 to 100%)
  const [dustVolume, setDustVolume] = useState(80);
  const [saltVolume, setSaltVolume] = useState(70);
  const [smokeVolume, setSmokeVolume] = useState(65);
  const [sulfateVolume, setSulfateVolume] = useState(50);

  const audioRef = useRef<HTMLAudioElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<MediaElementAudioSourceNode | null>(null);
  const bassFilterRef = useRef<BiquadFilterNode | null>(null);
  const midFilterRef = useRef<BiquadFilterNode | null>(null);
  const highFilterRef = useRef<BiquadFilterNode | null>(null);

  const mixerBtnRef = useRef<HTMLButtonElement>(null);
  const accessibilityBtnRef = useRef<HTMLButtonElement>(null);

  const { isMuted, toggleMute } = useAppStore();

  const announce = useCallback((msg: string) => {
    setAnnouncement(msg);
  }, []);

  // Reset and sync audio source when activeTrack changes
  useEffect(() => {
    setActiveAudioSource(activeTrack.audioSrc || '/audio/loop.mp3');
    setCustomMixActive(false);
    setAudioFallbackActive(false);
    setAccessibilityData(null);
    announce(`Now exploring ${activeTrack.title}, ${activeTrack.category} sonification.`);
  }, [activeTrack.id, activeTrack.audioSrc, activeTrack.title, activeTrack.category, announce]);

  // Handle Escape key to dismiss drawers and return focus
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (showAccessibility) {
          setShowAccessibility(false);
          accessibilityBtnRef.current?.focus();
          announce('Closed Scientific Interpretation and Audio Legend panel.');
        } else if (showMixer) {
          setShowMixer(false);
          mixerBtnRef.current?.focus();
          announce('Closed Constituent Layer Synthesizer panel.');
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showAccessibility, showMixer, announce]);

  // Reload audio on source update
  useEffect(() => {
    if (!audioRef.current) return;
    audioRef.current.load();
    if (isPlaying) {
      audioRef.current.play().catch(() => {});
    }
  }, [activeAudioSource, isPlaying]);

  // Audio error fallback
  const handleAudioError = () => {
    if (audioRef.current && !audioRef.current.src.endsWith('/audio/loop.mp3')) {
      audioRef.current.src = '/audio/loop.mp3';
      setActiveAudioSource('/audio/loop.mp3');
      setAudioFallbackActive(true);
      announce('Connecting to PRANA engine; playing standby acoustic loop.');
      audioRef.current.load();
      if (isPlaying) {
        audioRef.current.play().catch(() => {});
      }
    }
  };

  // Synthesize customized WAV mix using Python DSP engine
  const handleSynthesizeMix = async () => {
    setIsSynthesizing(true);
    announce(`Synthesizing custom 16-bit WAV for ${activeTrack.title} with adjusted constituent layers...`);
    try {
      const res = await sonificationService.generateSonification({
        dataset_id: activeTrack.id,
        duration_seconds: 12.0,
        sample_rate: 44100,
        preset: 'custom_interactive',
        layers: [
          { name: 'dust', enabled: dustVolume > 0, volume: dustVolume / 100, pan: -0.3 },
          { name: 'sea_salt', enabled: saltVolume > 0, volume: saltVolume / 100, pan: 0.4 },
          { name: 'smoke', enabled: smokeVolume > 0, volume: smokeVolume / 100, pan: 0.1 },
          { name: 'sulfate', enabled: sulfateVolume > 0, volume: sulfateVolume / 100, pan: -0.1 },
        ],
        loop_seamless: true,
      });

      if (res.success && res.data) {
        setActiveAudioSource(res.data.download_url);
        setCustomMixActive(true);
        announce(`Custom sonification mix generated successfully and active.`);
        if (!isPlaying) {
          onTogglePlay();
        }
      }
    } catch {
      announce('Failed to synthesize custom mix. Please retry.');
    } finally {
      setIsSynthesizing(false);
    }
  };

  // Toggle Accessibility & Science Legend Drawer
  const handleToggleAccessibility = async () => {
    const nextState = !showAccessibility;
    setShowAccessibility(nextState);
    if (nextState) {
      announce('Opened Scientific Interpretation and Audio Legend panel.');
      if (!accessibilityData) {
        try {
          const res = await insightsService.getAccessibility(activeTrack.id);
          if (res.success && res.data) {
            setAccessibilityData(res.data);
            announce(`Loaded scientific audio legend for ${res.data.title}.`);
          }
        } catch {
          // Gracefully handled
        }
      }
    } else {
      announce('Closed Scientific Interpretation and Audio Legend panel.');
    }
  };

  // Toggle Constituent Harmonic Mixer
  const handleToggleMixer = () => {
    const nextState = !showMixer;
    setShowMixer(nextState);
    announce(nextState ? 'Opened Constituent Layer Synthesizer panel.' : 'Closed Constituent Layer Synthesizer panel.');
  };

  // Setup Web Audio API & Filters
  const setupWebAudio = useCallback(() => {
    if (audioContextRef.current || !audioRef.current) return;

    try {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const ctx = new AudioCtx();
      audioContextRef.current = ctx;

      const analyser = ctx.createAnalyser();
      analyser.fftSize = 128;
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
      // AudioContext fallback handled gracefully
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

  // Handle Play/Pause
  const handlePlayToggle = () => {
    setupWebAudio();
    if (audioContextRef.current?.state === 'suspended') {
      audioContextRef.current.resume();
    }
    announce(!isPlaying ? `Playing ${activeTrack.title} soundscape.` : `Paused ${activeTrack.title} soundscape.`);
    onTogglePlay();
  };

  const handleToggleMute = () => {
    toggleMute();
    announce(isMuted ? 'Audio soundscape unmuted.' : 'Audio soundscape muted.');
  };

  // Sync audio tag with isPlaying state
  useEffect(() => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.play().catch(() => {});
    } else {
      audioRef.current.pause();
    }
  }, [isPlaying]);

  // Audio Time Update
  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
      if (audioRef.current.duration && !isNaN(audioRef.current.duration)) {
        setDuration(audioRef.current.duration);
      }
    }
  };

  // Timeline scrub
  const handleScrub = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = Number(e.target.value);
    setCurrentTime(val);
    if (audioRef.current) {
      audioRef.current.currentTime = val;
    }
  };

  // Real Audio-Reactive Radial & Waveform Visualizer
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let idlePhase = 0;
    const freqData = new Uint8Array(64);

    const handleResize = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.scale(dpr, dpr);
    };

    handleResize();
    window.addEventListener('resize', handleResize);

    const isAudible = isPlaying && !isMuted;

    const render = () => {
      const rect = canvas.getBoundingClientRect();
      const width = rect.width;
      const height = rect.height;
      ctx.clearRect(0, 0, width, height);

      const centerX = width * 0.28;
      const centerY = height * 0.5;
      const baseRadius = Math.min(width, height) * 0.26;

      // Read real audio frequency data if analyser exists and audio is actively playing
      if (analyserRef.current && isAudible) {
        analyserRef.current.getByteFrequencyData(freqData);
      } else {
        // Paused / Muted: Truthful zero data, calm resting state
        freqData.fill(0);
      }

      // ─────────────────────────────────────────────────────────────
      // 1. RADIAL ORBITAL FREQUENCY SPOKES
      // ─────────────────────────────────────────────────────────────
      const spokes = 48;
      const angleStep = (Math.PI * 2) / spokes;

      for (let i = 0; i < spokes; i++) {
        const angle = i * angleStep + (isAudible ? idlePhase * 0.15 : 0);
        const freqVal = freqData[i % freqData.length] || 0;
        const spokeLen = isAudible ? (freqVal / 255) * (baseRadius * 0.95) : 2;

        const x1 = centerX + Math.cos(angle) * baseRadius;
        const y1 = centerY + Math.sin(angle) * baseRadius;
        const x2 = centerX + Math.cos(angle) * (baseRadius + spokeLen);
        const y2 = centerY + Math.sin(angle) * (baseRadius + spokeLen);

        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.strokeStyle = isAudible ? activeTrack.color.accent : 'rgba(255, 255, 255, 0.2)';
        ctx.lineWidth = isAudible ? 1.8 : 1.0;
        ctx.shadowColor = activeTrack.color.glow;
        ctx.shadowBlur = isAudible ? 10 : 0;
        ctx.stroke();
      }

      // Center core planetary ring
      const avgVol = isAudible ? freqData.reduce((a, b) => a + b, 0) / freqData.length : 0;
      const corePulse = (avgVol / 255) * 6;

      ctx.beginPath();
      ctx.arc(centerX, centerY, baseRadius * 0.78 + corePulse, 0, Math.PI * 2);
      ctx.strokeStyle = isAudible ? 'rgba(255, 255, 255, 0.5)' : 'rgba(255, 255, 255, 0.18)';
      ctx.lineWidth = 1.2;
      ctx.stroke();

      // ─────────────────────────────────────────────────────────────
      // 2. LINEAR WAVEFORM STREAM (Right Portion of Canvas)
      // ─────────────────────────────────────────────────────────────
      const waveStartX = width * 0.56;
      const waveWidth = width * 0.42;
      const waveMidY = height * 0.5;
      const waveSteps = 40;

      ctx.beginPath();
      for (let i = 0; i <= waveSteps; i++) {
        const wx = waveStartX + (i / waveSteps) * waveWidth;
        const sampleIdx = Math.floor((i / waveSteps) * 32);
        const sampleVal = (freqData[sampleIdx] || 0) / 255;
        const wy = isAudible
          ? waveMidY + Math.sin(idlePhase * 2 + i * 0.35) * (sampleVal * (height * 0.32))
          : waveMidY; // Flat resting baseline when paused/muted

        if (i === 0) {
          ctx.moveTo(wx, wy);
        } else {
          ctx.lineTo(wx, wy);
        }
      }

      ctx.strokeStyle = isAudible ? activeTrack.color.accent : 'rgba(255, 255, 255, 0.25)';
      ctx.lineWidth = isAudible ? 2 : 1.2;
      ctx.shadowColor = activeTrack.color.glow;
      ctx.shadowBlur = isAudible ? 8 : 0;
      ctx.stroke();

      if (isAudible) {
        idlePhase += 0.05;
      }
      animId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
    };
  }, [activeTrack, isPlaying, isMuted]);

  // Ping Telemetry API
  const handlePingTelemetry = async () => {
    setHealthStatus('checking');
    try {
      const res = await fetch('/api/health');
      if (res.ok) {
        setHealthStatus('healthy');
        setTimeout(() => setHealthStatus('idle'), 3500);
      } else {
        setHealthStatus('idle');
      }
    } catch {
      setHealthStatus('idle');
    }
  };

  // Format time mm:ss
  const formatTime = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const secs = Math.floor(sec % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  return (
    <div className="relative z-30 mx-auto w-full max-w-6xl px-4 pb-24 sm:px-6">
      {/* Screen Reader Live Region for Dynamic Announcements */}
      <div
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      >
        {announcement}
      </div>

      <audio
        ref={audioRef}
        src={activeAudioSource}
        loop
        onTimeUpdate={handleTimeUpdate}
        onError={handleAudioError}
      />

      {/* Floating Apple Music Frosted-Glass Studio Deck */}
      <div className="apple-glass relative overflow-hidden rounded-3xl border border-white/10 p-6 shadow-2xl backdrop-blur-2xl sm:p-8 md:p-10">
        <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-12">
          {/* Left Column: Visualizer Canvas */}
          <div className="lg:col-span-5">
            <div className="relative h-44 w-full overflow-hidden rounded-2xl border border-white/[0.08] bg-black/60 p-2 backdrop-blur-md">
              <canvas ref={canvasRef} className="h-full w-full" />
              <div className="absolute bottom-2 left-4 font-mono text-[9px] uppercase tracking-widest text-slate-400">
                Studio Analyser • {activeTrack.frequency}
                {customMixActive && (
                  <span className="ml-2 font-bold text-sky-400">• Custom Mix</span>
                )}
              </div>
            </div>
          </div>

          {/* Right Column: Track Details & Equalizer Sliders */}
          <div className="flex flex-col justify-between gap-6 lg:col-span-7">
            {/* Header: Title with smooth text swap */}
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.25em] text-sky-400 sm:text-xs">
                  {activeTrack.category}
                </span>
                <h4 className="special-font font-zentry mt-1 text-2xl font-black uppercase text-white transition-all duration-300 sm:text-3xl md:text-4xl">
                  {activeTrack.title}
                </h4>
              </div>

              {/* Master Play Pill & Control Cluster */}
              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={handlePlayToggle}
                  aria-label={isPlaying ? `Pause soundscape: ${activeTrack.title}` : `Play soundscape: ${activeTrack.title}`}
                  className="group relative inline-flex items-center gap-2.5 rounded-full border border-white/20 bg-white/10 px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-white shadow-lg backdrop-blur-md transition-all hover:border-sky-400/60 hover:bg-white/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 active:scale-95"
                >
                  {isPlaying ? (
                    <>
                      <Pause className="size-4 fill-current text-sky-400" />
                      <span>Pause Soundscape</span>
                      <span className="absolute -inset-0.5 animate-ping rounded-full border border-sky-400/40 opacity-60" />
                    </>
                  ) : (
                    <>
                      <Play className="size-4 fill-current text-white group-hover:text-sky-300" />
                      <span>Hear Earth Audio</span>
                    </>
                  )}
                </button>

                {/* Toggle Constituent Harmonic Mixer */}
                <button
                  ref={mixerBtnRef}
                  type="button"
                  onClick={handleToggleMixer}
                  aria-expanded={showMixer}
                  aria-controls="constituent-mixer-panel"
                  aria-label="Toggle Constituent Layer Synthesizer Mixer"
                  className={`inline-flex size-10 items-center justify-center rounded-full border transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 active:scale-95 ${
                    showMixer || customMixActive
                      ? 'border-sky-400 bg-sky-500/20 text-sky-300 shadow-[0_0_12px_rgba(56,189,248,0.3)]'
                      : 'border-white/15 bg-black/40 text-slate-300 hover:border-sky-400/60 hover:text-white'
                  }`}
                  title="Constituent Harmonic Mixer"
                >
                  <Layers className="size-4" />
                </button>

                {/* Science Legend & Accessibility */}
                <button
                  ref={accessibilityBtnRef}
                  type="button"
                  onClick={handleToggleAccessibility}
                  aria-expanded={showAccessibility}
                  aria-controls="science-legend-panel"
                  aria-label="Toggle Scientific Interpretation & Audio Legend"
                  className={`inline-flex size-10 items-center justify-center rounded-full border transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 active:scale-95 ${
                    showAccessibility
                      ? 'border-amber-400 bg-amber-500/20 text-amber-300 shadow-[0_0_12px_rgba(251,191,36,0.3)]'
                      : 'border-white/15 bg-black/40 text-slate-300 hover:border-amber-400/60 hover:text-white'
                  }`}
                  title="Science Legend & Accessibility"
                >
                  <Info className="size-4" />
                </button>

                {/* Diagnostic Telemetry Health Ping */}
                <button
                  type="button"
                  onClick={handlePingTelemetry}
                  aria-label="Ping NASA Telemetry Diagnostic Bus"
                  className="inline-flex size-10 items-center justify-center rounded-full border border-white/15 bg-black/40 text-slate-300 transition-all hover:border-emerald-400/60 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 active:scale-95"
                  title="NASA Telemetry Bus Diagnostic"
                >
                  {healthStatus === 'healthy' ? (
                    <ShieldCheck className="size-4 text-emerald-400" />
                  ) : (
                    <Activity
                      className={`size-4 ${
                        healthStatus === 'checking' ? 'animate-spin text-sky-400' : 'text-slate-400'
                      }`}
                    />
                  )}
                </button>
              </div>
            </div>

            {/* Scrubbing Audio Timeline */}
            <div className="space-y-1">
              <input
                type="range"
                min="0"
                max={duration || 180}
                value={currentTime}
                onChange={handleScrub}
                aria-label="Audio timeline position"
                aria-valuenow={Math.round(currentTime)}
                aria-valuemin={0}
                aria-valuemax={Math.round(duration || 180)}
                aria-valuetext={`${formatTime(currentTime)} of ${formatTime(duration)}`}
                className="h-1 w-full cursor-pointer appearance-none rounded-full bg-white/15 accent-sky-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-400"
              />
              <div className="flex justify-between font-mono text-[10px] text-slate-500">
                <span>{formatTime(currentTime)}</span>
                <span>{formatTime(duration)}</span>
              </div>
            </div>

            {/* 3-Band Equalizer Sliders (Low / Mid / High) */}
            <div className="grid grid-cols-1 gap-4 font-mono text-xs sm:grid-cols-3">
              <div>
                <div className="flex justify-between text-[11px] text-slate-400">
                  <span>LOW / BASS</span>
                  <span className="text-white">{eqBass}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={eqBass}
                  onChange={(e) => setEqBass(Number(e.target.value))}
                  aria-label="Bass equalizer"
                  aria-valuenow={eqBass}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuetext={`${eqBass} percent bass`}
                  className="mt-1 h-1 w-full cursor-pointer appearance-none rounded-full bg-white/15 accent-sky-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-400"
                />
              </div>

              <div>
                <div className="flex justify-between text-[11px] text-slate-400">
                  <span>MID RESONANCE</span>
                  <span className="text-white">{eqMid}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={eqMid}
                  onChange={(e) => setEqMid(Number(e.target.value))}
                  aria-label="Midrange resonance equalizer"
                  aria-valuenow={eqMid}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuetext={`${eqMid} percent midrange`}
                  className="mt-1 h-1 w-full cursor-pointer appearance-none rounded-full bg-white/15 accent-sky-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-400"
                />
              </div>

              <div>
                <div className="flex justify-between text-[11px] text-slate-400">
                  <span>HIGH SHIMMER</span>
                  <span className="text-white">{eqHigh}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={eqHigh}
                  onChange={(e) => setEqHigh(Number(e.target.value))}
                  aria-label="High shimmer equalizer"
                  aria-valuenow={eqHigh}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuetext={`${eqHigh} percent treble shimmer`}
                  className="mt-1 h-1 w-full cursor-pointer appearance-none rounded-full bg-white/15 accent-sky-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-400"
                />
              </div>
            </div>

            {/* Expandable Atmospheric Constituent Mixer (Phase 3B) */}
            {showMixer && (
              <div
                id="constituent-mixer-panel"
                role="region"
                aria-label="Constituent Layer Synthesizer"
                className="rounded-2xl border border-sky-400/20 bg-sky-950/20 p-4 backdrop-blur-md"
              >
                <div className="flex items-center justify-between border-b border-white/[0.08] pb-2 text-xs">
                  <div className="flex items-center gap-2">
                    <Sparkles className="size-3.5 text-sky-400" />
                    <span className="font-mono font-semibold uppercase tracking-wider text-sky-200">
                      Constituent Layer Synthesizer
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-[10px] text-slate-400">
                      Pure Mathematical DSP
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setShowMixer(false);
                        mixerBtnRef.current?.focus();
                        announce('Closed Constituent Layer Synthesizer panel.');
                      }}
                      aria-label="Close Constituent Layer Synthesizer panel"
                      className="inline-flex size-6 items-center justify-center rounded-full text-slate-400 transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400"
                    >
                      <X className="size-3.5" />
                    </button>
                  </div>
                </div>

                <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4 font-mono text-[11px]">
                  <div>
                    <div className="flex justify-between text-slate-400">
                      <span>DUST</span>
                      <span className="text-amber-300">{dustVolume}%</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={dustVolume}
                      onChange={(e) => setDustVolume(Number(e.target.value))}
                      aria-label="Dust layer volume"
                      aria-valuenow={dustVolume}
                      aria-valuemin={0}
                      aria-valuemax={100}
                      aria-valuetext={`${dustVolume} percent dust layer`}
                      className="mt-1 h-1 w-full cursor-pointer appearance-none rounded-full bg-white/15 accent-amber-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
                    />
                  </div>
                  <div>
                    <div className="flex justify-between text-slate-400">
                      <span>SEA SALT</span>
                      <span className="text-cyan-300">{saltVolume}%</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={saltVolume}
                      onChange={(e) => setSaltVolume(Number(e.target.value))}
                      aria-label="Sea salt layer volume"
                      aria-valuenow={saltVolume}
                      aria-valuemin={0}
                      aria-valuemax={100}
                      aria-valuetext={`${saltVolume} percent sea salt layer`}
                      className="mt-1 h-1 w-full cursor-pointer appearance-none rounded-full bg-white/15 accent-cyan-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400"
                    />
                  </div>
                  <div>
                    <div className="flex justify-between text-slate-400">
                      <span>SMOKE</span>
                      <span className="text-emerald-300">{smokeVolume}%</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={smokeVolume}
                      onChange={(e) => setSmokeVolume(Number(e.target.value))}
                      aria-label="Smoke layer volume"
                      aria-valuenow={smokeVolume}
                      aria-valuemin={0}
                      aria-valuemax={100}
                      aria-valuetext={`${smokeVolume} percent smoke layer`}
                      className="mt-1 h-1 w-full cursor-pointer appearance-none rounded-full bg-white/15 accent-emerald-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
                    />
                  </div>
                  <div>
                    <div className="flex justify-between text-slate-400">
                      <span>SULFATE</span>
                      <span className="text-slate-200">{sulfateVolume}%</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={sulfateVolume}
                      onChange={(e) => setSulfateVolume(Number(e.target.value))}
                      aria-label="Sulfate layer volume"
                      aria-valuenow={sulfateVolume}
                      aria-valuemin={0}
                      aria-valuemax={100}
                      aria-valuetext={`${sulfateVolume} percent sulfate layer`}
                      className="mt-1 h-1 w-full cursor-pointer appearance-none rounded-full bg-white/15 accent-slate-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-300"
                    />
                  </div>
                </div>

                <div className="mt-3 flex justify-end">
                  <button
                    type="button"
                    onClick={handleSynthesizeMix}
                    disabled={isSynthesizing}
                    aria-label="Synthesize Custom Cadence 16-Bit WAV"
                    className="inline-flex items-center gap-2 rounded-full border border-sky-400/40 bg-sky-500/20 px-4 py-1.5 font-mono text-[10px] font-semibold uppercase tracking-wider text-sky-200 transition-colors hover:bg-sky-500/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 active:scale-95 disabled:opacity-50"
                  >
                    {isSynthesizing ? (
                      <>
                        <RefreshCw className="size-3 animate-spin text-sky-300" />
                        <span>Synthesizing 16-Bit WAV...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="size-3 text-sky-300" />
                        <span>Synthesize Custom Cadence</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* Expandable Science Legend & Accessibility Drawer (Phase 5) */}
            {showAccessibility && (
              <div
                id="science-legend-panel"
                role="region"
                aria-label="Scientific Interpretation and Audio Legend"
                className="rounded-2xl border border-amber-400/20 bg-amber-950/20 p-4 text-xs backdrop-blur-md"
              >
                <div className="flex items-center justify-between border-b border-white/[0.08] pb-2">
                  <div className="flex items-center gap-2 font-mono font-semibold uppercase tracking-wider text-amber-300">
                    <Info className="size-3.5 text-amber-400" />
                    <span>Scientific Interpretation & Audio Legend</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setShowAccessibility(false);
                      accessibilityBtnRef.current?.focus();
                      announce('Closed Scientific Interpretation and Audio Legend panel.');
                    }}
                    aria-label="Close Scientific Interpretation and Audio Legend panel"
                    className="inline-flex size-6 items-center justify-center rounded-full text-slate-400 transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
                  >
                    <X className="size-3.5" />
                  </button>
                </div>

                <div className="mt-2.5 space-y-3 text-slate-300">
                  <p className="leading-relaxed">
                    {accessibilityData?.plain_language_summary ||
                      activeTrack.description}
                  </p>

                  {/* Structured Variable-to-Sound Mappings */}
                  {accessibilityData?.screen_reader_legend && accessibilityData.screen_reader_legend.length > 0 && (
                    <div className="space-y-2">
                      <div className="font-mono text-[11px] font-semibold uppercase tracking-wider text-amber-300">
                        Variable-to-Sound Scientific Legend
                      </div>
                      <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                        {accessibilityData.screen_reader_legend.map((item, idx) => (
                          <div
                            key={idx}
                            className="rounded-xl border border-amber-400/20 bg-black/40 p-3 text-[11px] transition-colors hover:border-amber-400/40"
                          >
                            <div className="flex items-center justify-between font-mono font-bold text-amber-200">
                              <span>{item.layer_name || item.scientific_variable}</span>
                              <span className="text-[10px] text-amber-400/80">{item.pitch_range}</span>
                            </div>
                            <div className="mt-1 font-mono text-[10px] text-slate-300">
                              <span className="font-semibold text-amber-300">Audio Mapping: </span>
                              {item.audio_characteristic} ({item.synthesis_timbre})
                            </div>
                            {item.scientific_reasoning && (
                              <div className="mt-1.5 text-[10px] leading-relaxed text-slate-400">
                                {item.scientific_reasoning}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Acoustic Narrative Guide */}
                  {accessibilityData?.audio_guide && (
                    <div className="rounded-lg bg-black/40 p-2.5 font-mono text-[11px] text-amber-200/90">
                      <span className="font-semibold text-amber-300">Acoustic Guide: </span>
                      {accessibilityData.audio_guide}
                    </div>
                  )}

                  {/* Honest Tactile Transducer Guidance */}
                  {accessibilityData?.tactile_equivalent_guidance && (
                    <div className="rounded-xl border border-white/[0.08] bg-black/30 p-2.5 font-mono text-[10px] text-slate-400">
                      <div className="flex items-center gap-1.5 font-semibold text-slate-300">
                        <Volume2 className="size-3 text-amber-400" />
                        <span>Tactile Transducer / Bass Shaker Guidance:</span>
                      </div>
                      <p className="mt-1 leading-relaxed">
                        {accessibilityData.tactile_equivalent_guidance}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Footer Status Bar */}
            <div className="flex items-center justify-between border-t border-white/[0.08] pt-3 text-[11px] text-slate-400">
              <div className="flex items-center gap-2">
                <span
                  className={`size-2 rounded-full ${
                    audioFallbackActive
                      ? 'bg-amber-400'
                      : 'animate-pulse bg-emerald-400'
                  }`}
                />
                <span className="font-mono text-[10px]">
                  {customMixActive
                    ? 'NASA CUSTOM DSP SYNTHESIS ACTIVE (16-BIT PCM)'
                    : audioFallbackActive
                    ? 'LOCAL STANDBY LOOP (PRANA AUDIO ENGINE OFFLINE)'
                    : activeTrack.audioSrc
                    ? 'NASA DATA SOUNDSCAPE STREAMING (16-BIT STEREO)'
                    : 'NASA TELEMETRY BUS ACTIVE'}
                </span>
              </div>
              <button
                type="button"
                onClick={handleToggleMute}
                aria-label={isMuted ? 'Unmute audio soundscape' : 'Mute audio soundscape'}
                aria-pressed={isMuted}
                className="inline-flex items-center gap-1.5 font-mono text-[10px] text-slate-400 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400"
              >
                {isMuted ? (
                  <>
                    <VolumeX className="size-3.5 text-amber-400" />
                    <span>AUDIO MUTED</span>
                  </>
                ) : (
                  <>
                    <Volume2 className="size-3.5 text-sky-400" />
                    <span>AUDIO LIVE</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
