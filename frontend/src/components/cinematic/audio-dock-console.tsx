'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import type { SonicTrackConfig } from '@/config/earth-song.config';
import {
  Play,
  Pause,
  Activity,
  ShieldCheck,
  Volume2,
  VolumeX,
  Sliders,
  Compass,
  Info,
  Accessibility,
  Radio,
} from 'lucide-react';
import { useAppStore } from '@/stores/app-store';
import { sonificationService, insightsService } from '@/services/api';
import type { AccessibilityResponse } from '@nasa-experience/contracts';

// Subcomponents and hooks
import { useAudioGraph } from './audio-console/use-audio-graph';
import { useAnnouncer } from './audio-console/use-announcer';
import { useSpeech } from './audio-console/use-speech';
import { useHaptics } from './audio-console/use-haptics';
import { ConsoleVisualizer } from './audio-console/console-visualizer';
import { MixerPanel } from './audio-console/mixer-panel';
import { SpacePanel } from './audio-console/space-panel';
import { SciencePanel } from './audio-console/science-panel';
import { AccessPanel } from './audio-console/access-panel';

interface AudioDockConsoleProps {
  activeTrack: SonicTrackConfig;
  isPlaying: boolean;
  onTogglePlay: () => void;
}

export type ConsoleDrawer = 'mixer' | 'space' | 'science' | 'access' | null;

export function AudioDockConsole({ activeTrack, isPlaying, onTogglePlay }: AudioDockConsoleProps) {
  // 3-Band Equalizer (Low / Mid / High)
  const [eqBass, setEqBass] = useState(65);
  const [eqMid, setEqMid] = useState(75);
  const [eqHigh, setEqHigh] = useState(60);

  // 2D Spatial Audio & Atmospheric Reverb
  const [spaceX, setSpaceX] = useState(0);
  const [spaceY, setSpaceY] = useState(0.5);
  const [atmosphereReverb, setAtmosphereReverb] = useState(0.2);

  // Time & Duration
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(180);
  const [healthStatus, setHealthStatus] = useState<'idle' | 'checking' | 'healthy'>('idle');

  // Real NASA audio & customization state
  const [activeAudioSource, setActiveAudioSource] = useState<string>(
    activeTrack.audioSrc || '/audio/loop.mp3'
  );
  const [isSynthesizing, setIsSynthesizing] = useState(false);
  const [customMixActive, setCustomMixActive] = useState(false);
  const [audioFallbackActive, setAudioFallbackActive] = useState(false);

  // Active drawer tab: 'mixer' | 'space' | 'science' | 'access' | null
  const [activeDrawer, setActiveDrawer] = useState<ConsoleDrawer>(null);
  const [accessibilityData, setAccessibilityData] = useState<AccessibilityResponse | null>(null);

  // 4-layer constituent adjustments (0 to 100%)
  const [dustVolume, setDustVolume] = useState(80);
  const [saltVolume, setSaltVolume] = useState(70);
  const [smokeVolume, setSmokeVolume] = useState(65);
  const [sulfateVolume, setSulfateVolume] = useState(50);

  // Accessibility & Sensory Settings
  const [earconsSetting, setEarconsSetting] = useState<'full' | 'minimal' | 'off'>('full');
  const [tactileEnabled, setTactileEnabled] = useState(false);
  const [tactileCutoff, setTactileCutoff] = useState<68 | 136>(136);

  // Refs
  const audioRef = useRef<HTMLAudioElement>(null);
  const mixerBtnRef = useRef<HTMLButtonElement>(null);
  const accessibilityBtnRef = useRef<HTMLButtonElement>(null);
  const spaceBtnRef = useRef<HTMLButtonElement>(null);
  const accessBtnRef = useRef<HTMLButtonElement>(null);

  // Global store
  const { isMuted, toggleMute } = useAppStore();

  // Custom audio hooks
  const audioGraph = useAudioGraph();
  const { announcement, announce, announceDebounced } = useAnnouncer();
  const speech = useSpeech();
  const haptics = useHaptics();

  // Reset and sync audio source when activeTrack changes
  useEffect(() => {
    setActiveAudioSource(activeTrack.audioSrc || '/audio/loop.mp3');
    setCustomMixActive(false);
    setAudioFallbackActive(false);
    setAccessibilityData(null);
    announce(`Now exploring ${activeTrack.title}, ${activeTrack.category} sonification.`);
  }, [activeTrack.id, activeTrack.audioSrc, activeTrack.title, activeTrack.category, announce]);

  // Sync Equalizer with AudioGraph
  useEffect(() => {
    audioGraph.setEq(eqBass, eqMid, eqHigh);
  }, [eqBass, eqMid, eqHigh, audioGraph]);

  // Sync Spatial 2D position with AudioGraph
  useEffect(() => {
    audioGraph.setSpacePosition(spaceX, spaceY);
  }, [spaceX, spaceY, audioGraph]);

  // Sync Atmospheric Reverb with AudioGraph
  useEffect(() => {
    audioGraph.setAtmosphere(atmosphereReverb);
  }, [atmosphereReverb, audioGraph]);

  // Sync Tactile Sub-Bass with AudioGraph
  useEffect(() => {
    audioGraph.setTactile(tactileEnabled, tactileCutoff);
  }, [tactileEnabled, tactileCutoff, audioGraph]);

  // Play procedural earcons based on setting
  const triggerEarcon = useCallback(
    (type: 'play' | 'pause' | 'tab' | 'success' | 'alert') => {
      if (earconsSetting === 'off') return;
      if (earconsSetting === 'minimal' && (type === 'tab' || type === 'pause')) return;
      audioGraph.playEarcon(type);
    },
    [earconsSetting, audioGraph]
  );

  const triggerDetent = useCallback(() => {
    if (earconsSetting !== 'off') {
      audioGraph.playDetentTick();
    }
    haptics.triggerHaptic('tick');
  }, [earconsSetting, audioGraph, haptics]);

  // Handle Escape key to dismiss drawers and return focus
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && activeDrawer !== null) {
        const closed = activeDrawer;
        setActiveDrawer(null);
        if (closed === 'science') {
          accessibilityBtnRef.current?.focus();
          announce('Closed Scientific Interpretation and Audio Legend panel.');
        } else if (closed === 'mixer') {
          mixerBtnRef.current?.focus();
          announce('Closed Constituent Layer Synthesizer panel.');
        } else if (closed === 'space') {
          spaceBtnRef.current?.focus();
          announce('Closed Spatial Audio panel.');
        } else if (closed === 'access') {
          accessBtnRef.current?.focus();
          announce('Closed Accessibility Settings panel.');
        }
      } else if (e.key === ' ' && (e.target as HTMLElement).tagName !== 'INPUT') {
        // Spacebar plays/pauses when not typing
        e.preventDefault();
        handlePlayToggle();
      } else if ((e.key === 'm' || e.key === 'M') && (e.target as HTMLElement).tagName !== 'INPUT') {
        handleToggleMute();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeDrawer, announce]);

  // Reload audio on source update
  useEffect(() => {
    if (!audioRef.current) return;
    audioRef.current.load();
    if (isPlaying) {
      audioRef.current.play().catch(() => {});
    }
  }, [activeAudioSource, isPlaying]);

  // Sync audio tag with isPlaying state
  useEffect(() => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.play().catch(() => {});
    } else {
      audioRef.current.pause();
    }
  }, [isPlaying]);

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

  // Handle Play/Pause
  const handlePlayToggle = async () => {
    if (audioRef.current) {
      audioGraph.initGraph(audioRef.current);
      await audioGraph.resumeContext();
    }
    const next = !isPlaying;
    triggerEarcon(next ? 'play' : 'pause');
    haptics.triggerHaptic(next ? 'double' : 'tap');
    announce(next ? `Playing ${activeTrack.title} soundscape.` : `Paused ${activeTrack.title} soundscape.`);
    onTogglePlay();
  };

  const handleToggleMute = () => {
    toggleMute();
    triggerDetent();
    announce(isMuted ? 'Audio soundscape unmuted.' : 'Audio soundscape muted.');
  };

  // Timeline scrub
  const handleScrub = (val: number) => {
    setCurrentTime(val);
    if (audioRef.current) {
      audioRef.current.currentTime = val;
    }
    announceDebounced(`Timeline at ${formatTime(val)} of ${formatTime(duration)}`, 500);
  };

  // Audio Time Update
  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
      if (audioRef.current.duration && !isNaN(audioRef.current.duration)) {
        setDuration(audioRef.current.duration);
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
        triggerEarcon('success');
        haptics.triggerHaptic('success');
        announce('Custom sonification mix generated successfully and active.');
        if (!isPlaying) {
          onTogglePlay();
        }
      }
    } catch {
      announce('Failed to synthesize custom mix. Please retry.');
      triggerEarcon('alert');
    } finally {
      setIsSynthesizing(false);
    }
  };

  // Drawer Toggle Handlers
  const handleToggleMixer = () => {
    const next = activeDrawer === 'mixer' ? null : 'mixer';
    setActiveDrawer(next);
    triggerEarcon('tab');
    announce(next ? 'Opened Constituent Layer Synthesizer panel.' : 'Closed Constituent Layer Synthesizer panel.');
  };

  const handleToggleScience = async () => {
    const next = activeDrawer === 'science' ? null : 'science';
    setActiveDrawer(next);
    triggerEarcon('tab');
    if (next) {
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

  const handleToggleSpace = () => {
    const next = activeDrawer === 'space' ? null : 'space';
    setActiveDrawer(next);
    triggerEarcon('tab');
    announce(next ? 'Opened 2D Planetary Sound Field panel.' : 'Closed 2D Planetary Sound Field panel.');
  };

  const handleToggleAccess = () => {
    const next = activeDrawer === 'access' ? null : 'access';
    setActiveDrawer(next);
    triggerEarcon('tab');
    announce(next ? 'Opened Accessibility Settings panel.' : 'Closed Accessibility Settings panel.');
  };

  // Ping Telemetry API
  const handlePingTelemetry = async () => {
    setHealthStatus('checking');
    triggerDetent();
    try {
      const res = await fetch('/api/health');
      if (res.ok) {
        setHealthStatus('healthy');
        announce('NASA telemetry diagnostic bus healthy.');
        setTimeout(() => setHealthStatus('idle'), 3500);
      } else {
        setHealthStatus('idle');
      }
    } catch {
      setHealthStatus('idle');
    }
  };

  // Test tactile pulse
  const handleTestTactilePulse = () => {
    triggerDetent();
    haptics.triggerHaptic('pulse');
    announce('Emitted 136.10 Hz sub-bass tactile vibration test pulse.');
  };

  const formatTime = (sec: number) => {
    if (isNaN(sec) || sec < 0) return '0:00';
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
      <div className="apple-glass relative overflow-hidden rounded-3xl border border-white/10 p-6 shadow-2xl backdrop-blur-2xl sm:p-8 md:p-10 transition-all duration-300">
        <div className="grid grid-cols-1 items-stretch gap-8 lg:grid-cols-12">
          {/* ─────────────────────────────────────────────────────────────
              LEFT COLUMN: LARGE CONTINUOUSLY ANIMATED VISUALIZER
              ───────────────────────────────────────────────────────────── */}
          <div className="lg:col-span-5 flex flex-col">
            <ConsoleVisualizer
              activeTrack={activeTrack}
              isPlaying={isPlaying}
              isMuted={isMuted}
              getFrequencyData={audioGraph.getFrequencyData}
              customMixActive={customMixActive}
              spaceX={spaceX}
              spaceY={spaceY}
            />
          </div>

          {/* ─────────────────────────────────────────────────────────────
              RIGHT COLUMN: TRANSPORT, EQ, AND EXPANDABLE PANELS
              ───────────────────────────────────────────────────────────── */}
          <div className="flex flex-col justify-between gap-6 lg:col-span-7">
            {/* Header: Track title, Play button & Action Pill Cluster */}
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="min-w-0 flex-1">
                <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.25em] text-sky-400 sm:text-xs">
                  {activeTrack.category}
                </span>
                <h4
                  title={activeTrack.title}
                  className="special-font font-zentry mt-1 text-2xl font-black uppercase text-white tracking-tight sm:text-3xl md:text-4xl line-clamp-1 drop-shadow-md"
                >
                  {activeTrack.title}
                </h4>
              </div>

              {/* Master Play Pill & Drawer Action Cluster */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handlePlayToggle}
                  aria-label={
                    isPlaying
                      ? `Pause soundscape: ${activeTrack.title}`
                      : `Play soundscape: ${activeTrack.title}`
                  }
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
                  aria-expanded={activeDrawer === 'mixer'}
                  aria-controls="constituent-mixer-panel"
                  aria-label="Toggle Constituent Layer Synthesizer Mixer"
                  className={`inline-flex size-10 items-center justify-center rounded-full border transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 active:scale-95 ${
                    activeDrawer === 'mixer' || customMixActive
                      ? 'border-sky-400 bg-sky-500/20 text-sky-300 shadow-[0_0_12px_rgba(56,189,248,0.3)]'
                      : 'border-white/15 bg-black/40 text-slate-300 hover:border-sky-400/60 hover:text-white'
                  }`}
                  title="Constituent Harmonic Mixer"
                >
                  <Sliders className="size-4" />
                </button>

                {/* Toggle Spatial 2D Audio */}
                <button
                  ref={spaceBtnRef}
                  type="button"
                  onClick={handleToggleSpace}
                  aria-expanded={activeDrawer === 'space'}
                  aria-controls="space-audio-panel"
                  aria-label="Toggle Spatial Audio and Planetary Field"
                  className={`inline-flex size-10 items-center justify-center rounded-full border transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 active:scale-95 ${
                    activeDrawer === 'space'
                      ? 'border-sky-400 bg-sky-500/20 text-sky-300 shadow-[0_0_12px_rgba(56,189,248,0.3)]'
                      : 'border-white/15 bg-black/40 text-slate-300 hover:border-sky-400/60 hover:text-white'
                  }`}
                  title="Spatial 2D Earth Field"
                >
                  <Compass className="size-4" />
                </button>

                {/* Science Legend & Accessibility */}
                <button
                  ref={accessibilityBtnRef}
                  type="button"
                  onClick={handleToggleScience}
                  aria-expanded={activeDrawer === 'science'}
                  aria-controls="science-legend-panel"
                  aria-label="Toggle Scientific Interpretation & Audio Legend"
                  className={`inline-flex size-10 items-center justify-center rounded-full border transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 active:scale-95 ${
                    activeDrawer === 'science'
                      ? 'border-amber-400 bg-amber-500/20 text-amber-300 shadow-[0_0_12px_rgba(251,191,36,0.3)]'
                      : 'border-white/15 bg-black/40 text-slate-300 hover:border-amber-400/60 hover:text-white'
                  }`}
                  title="Science Legend & Audio Narrative"
                >
                  <Info className="size-4" />
                </button>

                {/* Access & Sensory Settings */}
                <button
                  ref={accessBtnRef}
                  type="button"
                  onClick={handleToggleAccess}
                  aria-expanded={activeDrawer === 'access'}
                  aria-controls="access-settings-panel"
                  aria-label="Toggle Accessibility & Sensory Settings"
                  className={`inline-flex size-10 items-center justify-center rounded-full border transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 active:scale-95 ${
                    activeDrawer === 'access'
                      ? 'border-emerald-400 bg-emerald-500/20 text-emerald-300 shadow-[0_0_12px_rgba(52,211,153,0.3)]'
                      : 'border-white/15 bg-black/40 text-slate-300 hover:border-emerald-400/60 hover:text-white'
                  }`}
                  title="Accessibility & Sensory Feeds"
                >
                  <Accessibility className="size-4" />
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
                onChange={(e) => handleScrub(Number(e.target.value))}
                aria-label="Audio timeline position"
                aria-valuenow={Math.round(currentTime)}
                aria-valuemin={0}
                aria-valuemax={Math.round(duration || 180)}
                aria-valuetext={`${formatTime(currentTime)} of ${formatTime(duration)}`}
                className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-white/15 accent-sky-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-400"
              />
              <div className="flex justify-between font-mono text-[10px] text-slate-500">
                <span>{formatTime(currentTime)}</span>
                <span className="text-slate-400">
                  {duration ? formatTime(duration) : 'LIVE STREAM'}
                </span>
              </div>
            </div>

            {/* 3-Band Equalizer Sliders (Low / Mid / High) - Always accessible */}
            <div className="rounded-2xl border border-white/10 bg-black/30 p-3.5 backdrop-blur-md">
              <div className="flex items-center justify-between border-b border-white/[0.08] pb-1.5 font-mono text-xs">
                <div className="flex items-center gap-1.5 text-slate-300">
                  <Radio className="size-3.5 text-sky-400" />
                  <span className="font-semibold uppercase tracking-wider text-[11px]">
                    Live Acoustic Equalizer
                  </span>
                </div>
                <span className="font-mono text-[9px] text-sky-400 uppercase tracking-wider">
                  Real-Time Web Audio DSP
                </span>
              </div>

              <div className="mt-2.5 grid grid-cols-1 gap-3 font-mono text-xs sm:grid-cols-3">
                <div>
                  <div className="flex justify-between text-[11px] text-slate-400">
                    <span>LOW / BASS</span>
                    <span className="font-bold text-white">{eqBass}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={eqBass}
                    onChange={(e) => {
                      setEqBass(Number(e.target.value));
                      triggerDetent();
                    }}
                    aria-label="Bass equalizer"
                    aria-valuenow={eqBass}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-valuetext={`${eqBass} percent bass`}
                    className="mt-1 h-1.5 w-full cursor-pointer appearance-none rounded-full bg-white/15 accent-sky-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-400"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-[11px] text-slate-400">
                    <span>MID RESONANCE</span>
                    <span className="font-bold text-white">{eqMid}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={eqMid}
                    onChange={(e) => {
                      setEqMid(Number(e.target.value));
                      triggerDetent();
                    }}
                    aria-label="Midrange resonance equalizer"
                    aria-valuenow={eqMid}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-valuetext={`${eqMid} percent midrange`}
                    className="mt-1 h-1.5 w-full cursor-pointer appearance-none rounded-full bg-white/15 accent-sky-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-400"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-[11px] text-slate-400">
                    <span>HIGH SHIMMER</span>
                    <span className="font-bold text-white">{eqHigh}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={eqHigh}
                    onChange={(e) => {
                      setEqHigh(Number(e.target.value));
                      triggerDetent();
                    }}
                    aria-label="High shimmer equalizer"
                    aria-valuenow={eqHigh}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-valuetext={`${eqHigh} percent treble shimmer`}
                    className="mt-1 h-1.5 w-full cursor-pointer appearance-none rounded-full bg-white/15 accent-sky-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-400"
                  />
                </div>
              </div>
            </div>

            {/* ─────────────────────────────────────────────────────────────
                EXPANDABLE DRAWER PANELS (Mixer / Space / Science / Access)
                ───────────────────────────────────────────────────────────── */}
            {activeDrawer === 'mixer' && (
              <MixerPanel
                activeTrack={activeTrack}
                setEqBass={setEqBass}
                setEqMid={setEqMid}
                setEqHigh={setEqHigh}
                dustVolume={dustVolume}
                setDustVolume={setDustVolume}
                saltVolume={saltVolume}
                setSaltVolume={setSaltVolume}
                smokeVolume={smokeVolume}
                setSmokeVolume={setSmokeVolume}
                sulfateVolume={sulfateVolume}
                setSulfateVolume={setSulfateVolume}
                onSynthesizeMix={handleSynthesizeMix}
                isSynthesizing={isSynthesizing}
                onClose={() => {
                  setActiveDrawer(null);
                  mixerBtnRef.current?.focus();
                  announce('Closed Constituent Layer Synthesizer panel.');
                }}
                onApplyPreset={(p) => announce(`Applied ${p} acoustic preset.`)}
                onDetentTick={triggerDetent}
              />
            )}

            {activeDrawer === 'space' && (
              <SpacePanel
                activeTrack={activeTrack}
                spaceX={spaceX}
                setSpaceX={setSpaceX}
                spaceY={spaceY}
                setSpaceY={setSpaceY}
                atmosphereReverb={atmosphereReverb}
                setAtmosphereReverb={setAtmosphereReverb}
                onDetentTick={triggerDetent}
                onAnnounce={announce}
              />
            )}

            {activeDrawer === 'science' && (
              <SciencePanel
                activeTrack={activeTrack}
                accessibilityData={accessibilityData}
                onClose={() => {
                  setActiveDrawer(null);
                  accessibilityBtnRef.current?.focus();
                  announce('Closed Scientific Interpretation and Audio Legend panel.');
                }}
                isSpeaking={speech.isSpeaking}
                onToggleSpeech={speech.toggleSpeak}
              />
            )}

            {activeDrawer === 'access' && (
              <AccessPanel
                activeTrack={activeTrack}
                earconsSetting={earconsSetting}
                setEarconsSetting={setEarconsSetting}
                hapticsEnabled={haptics.isEnabled}
                setHapticsEnabled={haptics.setIsEnabled}
                hapticsSupported={haptics.isSupported}
                tactileEnabled={tactileEnabled}
                setTactileEnabled={setTactileEnabled}
                tactileCutoff={tactileCutoff}
                setTactileCutoff={setTactileCutoff}
                onTestTactilePulse={handleTestTactilePulse}
                getStreamDestination={audioGraph.getStreamDestination}
                onAnnounce={announce}
                onDetentTick={triggerDetent}
              />
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
