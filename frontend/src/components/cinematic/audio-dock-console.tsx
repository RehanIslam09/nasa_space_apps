'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import type { SonicTrackConfig } from '@/config/earth-song.config';
import {
  Activity,
  ShieldCheck,
  Volume2,
  VolumeX,
  SlidersHorizontal,
  Compass,
  BookOpen,
  Accessibility,
  HelpCircle,
  Disc,
  Download,
  Sparkles,
  Waves,
  CloudLightning,
  Flame,
  X,
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

/**
 * TUNING CONSTANTS — Audio Dock Console Layout & Presets
 */
export const TUNING = {
  console: {
    desktopHeight: 'clamp(560px, 78vh, 720px)',
    desktopLeftWidth: '45%',
    desktopRightWidth: '55%',
  },
  presets: [
    {
      name: 'Calm Earth',
      icon: Sparkles,
      bass: 55,
      mid: 60,
      high: 50,
      dust: 40,
      salt: 60,
      smoke: 20,
      sulfate: 30,
      color: {
        accent: '#10b981', // emerald-500
        glow: 'rgba(16, 185, 129, 0.45)',
        nebula: 'rgba(5, 150, 105, 0.2)',
        bgTint: 'rgba(6, 78, 59, 0.25)',
      },
      effect: 'calm' as const,
    },
    {
      name: 'Deep Ocean',
      icon: Waves,
      bass: 85,
      mid: 50,
      high: 45,
      dust: 20,
      salt: 90,
      smoke: 15,
      sulfate: 25,
      color: {
        accent: '#06b6d4', // cyan-500
        glow: 'rgba(6, 182, 212, 0.45)',
        nebula: 'rgba(14, 165, 233, 0.2)',
        bgTint: 'rgba(8, 51, 68, 0.25)',
      },
      effect: 'ocean' as const,
    },
    {
      name: 'Storm Dynamics',
      icon: CloudLightning,
      bass: 70,
      mid: 80,
      high: 75,
      dust: 75,
      salt: 80,
      smoke: 60,
      sulfate: 50,
      color: {
        accent: '#8b5cf6', // violet-500
        glow: 'rgba(139, 92, 246, 0.5)',
        nebula: 'rgba(124, 58, 237, 0.2)',
        bgTint: 'rgba(46, 16, 101, 0.25)',
      },
      effect: 'storm' as const,
    },
    {
      name: 'Planetary Fever',
      icon: Flame,
      bass: 60,
      mid: 85,
      high: 80,
      dust: 85,
      salt: 40,
      smoke: 90,
      sulfate: 70,
      color: {
        accent: '#f97316', // orange-500
        glow: 'rgba(249, 115, 22, 0.55)',
        nebula: 'rgba(234, 88, 12, 0.25)',
        bgTint: 'rgba(67, 20, 7, 0.25)',
      },
      effect: 'fever' as const,
    },
  ],
};

interface AudioDockConsoleProps {
  activeTrack: SonicTrackConfig;
  isPlaying: boolean;
  onTogglePlay: () => void;
}

export type ConsoleTab = 'mix' | 'move' | 'learn' | 'access';

export function AudioDockConsole({ activeTrack, isPlaying, onTogglePlay }: AudioDockConsoleProps) {
  // Active Tab: 'mix' | 'move' | 'learn' | 'access' (Default: 'mix')
  const [activeTab, setActiveTab] = useState<ConsoleTab>('mix');
  const [activePreset, setActivePreset] = useState<string | null>(null);

  // 3-Band Equalizer (Low / Mid / High)
  const [eqBass, setEqBass] = useState(65);
  const [eqMid, setEqMid] = useState(75);
  const [eqHigh, setEqHigh] = useState(60);

  // 2D Spatial Audio & Atmospheric Reverb
  const [spaceX, setSpaceX] = useState(0);
  const [spaceY, setSpaceY] = useState(0.5);
  const [atmosphereReverb, setAtmosphereReverb] = useState(0.2);

  // Time & Duration (Initialized to 12.0s NASA loop duration instead of hardcoded 180s)
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(12);
  const [healthStatus, setHealthStatus] = useState<'idle' | 'checking' | 'healthy'>('idle');

  // Real NASA audio & customization state
  const [activeAudioSource, setActiveAudioSource] = useState<string>(
    activeTrack.audioSrc || '/audio/loop.mp3'
  );
  const [isSynthesizing, setIsSynthesizing] = useState(false);
  const [customMixActive, setCustomMixActive] = useState(false);
  const [audioFallbackActive, setAudioFallbackActive] = useState(false);

  // Accessibility science legend data
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

  // Shortcuts Dialog State
  const [shortcutsOpen, setShortcutsOpen] = useState(false);

  // Master Media Recording State
  const [isRecording, setIsRecording] = useState(false);
  const [recordedBlobUrl, setRecordedBlobUrl] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  // Refs
  const audioRef = useRef<HTMLAudioElement>(null);
  const mixerBtnRef = useRef<HTMLButtonElement>(null);
  const spaceBtnRef = useRef<HTMLButtonElement>(null);
  const accessibilityBtnRef = useRef<HTMLButtonElement>(null);
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
    setCurrentTime(0);
    announce(`Now exploring ${activeTrack.title}, ${activeTrack.category} sonification.`);
  }, [activeTrack.id, activeTrack.audioSrc, activeTrack.title, activeTrack.category, announce]);

  // Dynamic active mood theme and canvas visual effect
  const selectedPreset = TUNING.presets.find((p) => p.name === activePreset);
  const themeColor = selectedPreset
    ? selectedPreset.color
    : {
        accent: activeTrack.color.accent || '#38bdf8',
        glow: activeTrack.color.glow || 'rgba(56, 189, 248, 0.4)',
        nebula: activeTrack.color.nebula || 'rgba(56, 189, 248, 0.1)',
        bgTint: 'rgba(12, 74, 110, 0.2)',
      };
  const moodEffect = selectedPreset ? selectedPreset.effect : 'calm';

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

  // Procedural earcons based on setting
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

  // Apply mood preset
  const handleApplyPreset = (preset: typeof TUNING.presets[0]) => {
    setActivePreset(preset.name);
    setEqBass(preset.bass);
    setEqMid(preset.mid);
    setEqHigh(preset.high);
    setDustVolume(preset.dust);
    setSaltVolume(preset.salt);
    setSmokeVolume(preset.smoke);
    setSulfateVolume(preset.sulfate);
    triggerDetent();
    announce(`Applied ${preset.name} acoustic mood preset.`);
  };

  // Keyboard navigation & global shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger hotkeys if user is focused on an input or textarea
      const tag = (e.target as HTMLElement).tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;

      if (e.key === 'Escape') {
        if (shortcutsOpen) {
          setShortcutsOpen(false);
          announce('Closed keyboard shortcuts dialog.');
        }
      } else if (e.key === ' ') {
        e.preventDefault();
        handlePlayToggle();
      } else if (e.key === 'm' || e.key === 'M') {
        e.preventDefault();
        handleToggleMute();
      } else if (e.key === 's' || e.key === 'S') {
        e.preventDefault();
        const desc = accessibilityData?.plain_language_summary || activeTrack.description;
        speech.toggleSpeak(`${activeTrack.title}. ${desc}`);
      } else if (e.key === '1') {
        handleSelectTab('mix');
      } else if (e.key === '2') {
        handleSelectTab('move');
      } else if (e.key === '3') {
        handleSelectTab('learn');
      } else if (e.key === '4') {
        handleSelectTab('access');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [shortcutsOpen, accessibilityData, activeTrack, speech, announce]);

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

  // Duration metadata handler (Resolves the 0:12 vs 3:00 mismatch)
  const handleLoadedMetadata = () => {
    if (
      audioRef.current &&
      isFinite(audioRef.current.duration) &&
      !isNaN(audioRef.current.duration) &&
      audioRef.current.duration > 0
    ) {
      setDuration(audioRef.current.duration);
    } else {
      setDuration(12);
    }
  };

  // Handle Master Play/Pause
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
      if (
        isFinite(audioRef.current.duration) &&
        !isNaN(audioRef.current.duration) &&
        audioRef.current.duration > 0
      ) {
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

  // Tab Selection
  const handleSelectTab = async (tab: ConsoleTab) => {
    setActiveTab(tab);
    triggerEarcon('tab');
    if (tab === 'mix') {
      announce('Switched to Mix panel.');
    } else if (tab === 'move') {
      announce('Switched to Move panel.');
    } else if (tab === 'learn') {
      announce('Switched to Learn panel.');
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
    } else if (tab === 'access') {
      announce('Switched to Accessibility panel.');
    }
  };

  // Arrow key roving tabindex navigation for Apple-style segmented tabs
  const handleTabKeyDown = (e: React.KeyboardEvent, currentTab: ConsoleTab) => {
    const tabList: ConsoleTab[] = ['mix', 'move', 'learn', 'access'];
    const idx = tabList.indexOf(currentTab);

    if (e.key === 'ArrowRight') {
      e.preventDefault();
      const nextTab = tabList[(idx + 1) % tabList.length] ?? 'mix';
      handleSelectTab(nextTab);
      if (nextTab === 'mix') mixerBtnRef.current?.focus();
      if (nextTab === 'move') spaceBtnRef.current?.focus();
      if (nextTab === 'learn') accessibilityBtnRef.current?.focus();
      if (nextTab === 'access') accessBtnRef.current?.focus();
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      const prevTab = tabList[(idx - 1 + tabList.length) % tabList.length] ?? 'mix';
      handleSelectTab(prevTab);
      if (prevTab === 'mix') mixerBtnRef.current?.focus();
      if (prevTab === 'move') spaceBtnRef.current?.focus();
      if (prevTab === 'learn') accessibilityBtnRef.current?.focus();
      if (prevTab === 'access') accessBtnRef.current?.focus();
    }
  };

  // Ping Telemetry API (5th button capability preserved with clear label)
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

  // Master 16-bit MediaRecorder Capture
  const handleToggleRecord = () => {
    if (isRecording) {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
        mediaRecorderRef.current.stop();
        setIsRecording(false);
        announce('Master audio recording completed. Ready for download.');
      }
    } else {
      const streamDest = audioGraph.getStreamDestination();
      if (!streamDest || !streamDest.stream) {
        announce('Audio stream not available for recording.');
        return;
      }

      try {
        audioChunksRef.current = [];
        const recorder = new MediaRecorder(streamDest.stream);
        mediaRecorderRef.current = recorder;

        recorder.ondataavailable = (e) => {
          if (e.data.size > 0) {
            audioChunksRef.current.push(e.data);
          }
        };

        recorder.onstop = () => {
          const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
          const url = URL.createObjectURL(blob);
          setRecordedBlobUrl(url);
        };

        recorder.start();
        setIsRecording(true);
        announce('Started recording 16-bit master soundscape...');
      } catch {
        announce('MediaRecorder not supported by this browser.');
      }
    }
  };

  const handleDownloadRecord = () => {
    if (!recordedBlobUrl) return;
    const a = document.createElement('a');
    a.href = recordedBlobUrl;
    a.download = `NASA_Earth_Song_${activeTrack.id}_master.webm`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    announce(`Downloaded master audio recording for ${activeTrack.title}.`);
  };

  // Test tactile pulse
  const handleTestTactilePulse = () => {
    triggerDetent();
    haptics.triggerHaptic('pulse');
    announce('Emitted 136.10 Hz sub-bass tactile vibration test pulse.');
  };

  const formatTime = (sec: number) => {
    if (isNaN(sec) || !isFinite(sec) || sec < 0) return '0:12';
    const mins = Math.floor(sec / 60);
    const secs = Math.floor(sec % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  return (
    <div id="audio-dock-console" className="relative z-30 mx-auto w-full max-w-6xl px-4 pb-20 sm:px-6">
      {/* Screen Reader Live Region for Dynamic Announcements */}
      <div
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      >
        {announcement}
      </div>

      {/* Hidden Audio Player */}
      <audio
        ref={audioRef}
        src={activeAudioSource}
        loop
        onLoadedMetadata={handleLoadedMetadata}
        onTimeUpdate={handleTimeUpdate}
        onError={handleAudioError}
      />

      {/* ─────────────────────────────────────────────────────────────
          ONE FIXED-HEIGHT GLASS CONSOLE CONTAINER
          Zero layout shift across all tabs on desktop.
          ───────────────────────────────────────────────────────────── */}
      <div
        className="apple-glass relative overflow-hidden rounded-3xl border p-5 shadow-2xl backdrop-blur-2xl transition-all duration-700 sm:p-7 md:p-8 h-auto lg:h-[78vh] lg:min-h-[560px] lg:max-h-[720px]"
        style={{
          borderColor: `${themeColor.accent}33`,
          background: `linear-gradient(135deg, ${themeColor.bgTint || 'rgba(12, 74, 110, 0.2)'} 0%, rgba(5, 10, 20, 0.85) 45%, rgba(2, 4, 10, 0.95) 100%)`,
          boxShadow: `0 30px 80px rgba(0, 0, 0, 0.8), 0 0 50px ${themeColor.glow}14, inset 0 1px 0 rgba(255, 255, 255, 0.1)`,
        }}
      >
        <div className="grid h-full grid-cols-1 items-stretch gap-6 lg:grid-cols-12 overflow-hidden">
          {/* ─────────────────────────────────────────────────────────────
              LEFT PANE = "LISTEN" (~45% width, fills full card height)
              ───────────────────────────────────────────────────────────── */}
          <div className="h-full flex flex-col lg:col-span-5 min-h-[320px] lg:min-h-0">
            <ConsoleVisualizer
              activeTrack={activeTrack}
              isPlaying={isPlaying}
              isMuted={isMuted}
              getFrequencyData={audioGraph.getFrequencyData}
              customMixActive={customMixActive}
              spaceX={spaceX}
              spaceY={spaceY}
              onTogglePlay={handlePlayToggle}
              currentTime={currentTime}
              duration={duration}
              onScrub={handleScrub}
              formatTime={formatTime}
              onDetentTick={triggerDetent}
              themeColor={themeColor}
              moodEffect={moodEffect}
            />
          </div>

          {/* ─────────────────────────────────────────────────────────────
              RIGHT PANE = "SHAPE THE SOUND" (~55% width)
              ───────────────────────────────────────────────────────────── */}
          <div className="h-full flex flex-col justify-between gap-3.5 lg:col-span-7 overflow-hidden">
            {/* ─────────────────────────────────────────────────────────
                1. PICK A MOOD (Always visible above the tabs)
                ───────────────────────────────────────────────────────── */}
            <div className="shrink-0 select-none">
              <div className="flex items-center justify-between mb-2">
                <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-slate-300">
                  Pick a mood
                </span>
                <span className="font-mono text-[9px] text-slate-500 uppercase">
                  Harmonic Presets
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {TUNING.presets.map((preset) => {
                  const Icon = preset.icon;
                  const isActive = activePreset === preset.name;
                  return (
                    <button
                      key={preset.name}
                      type="button"
                      onClick={() => handleApplyPreset(preset)}
                      className={`group flex items-center justify-center gap-1.5 rounded-2xl border px-3 py-2 text-xs font-semibold tracking-wide transition-all active:scale-95 ${
                        isActive
                          ? 'text-white'
                          : 'border-white/10 bg-white/5 text-slate-300 hover:border-white/20 hover:bg-white/10 hover:text-white'
                      }`}
                      style={
                        isActive
                          ? {
                              borderColor: preset.color.accent,
                              backgroundColor: `${preset.color.accent}26`,
                              color: '#ffffff',
                              boxShadow: `0 0 16px ${preset.color.glow}`,
                            }
                          : undefined
                      }
                    >
                      <Icon
                        className="size-3.5 transition-transform group-hover:scale-110"
                        style={isActive ? { color: preset.color.accent } : undefined}
                      />
                      <span className="truncate">{preset.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* ─────────────────────────────────────────────────────────
                2. LABELED TABS (Apple-Style Segmented Control)
                Roving tabindex, role="tablist", arrow-key navigation
                ───────────────────────────────────────────────────────── */}
            <div
              role="tablist"
              aria-label="Sound manipulation and science tabs"
              className="shrink-0 flex items-center rounded-2xl border border-white/10 bg-black/40 p-1 backdrop-blur-md"
            >
              {/* MIX TAB */}
              <button
                ref={mixerBtnRef}
                type="button"
                role="tab"
                id="tab-mix"
                aria-selected={activeTab === 'mix'}
                aria-controls="constituent-mixer-panel"
                tabIndex={activeTab === 'mix' ? 0 : -1}
                onClick={() => handleSelectTab('mix')}
                onKeyDown={(e) => handleTabKeyDown(e, 'mix')}
                aria-label="Mix: Toggle Constituent Layer Synthesizer Mixer"
                aria-expanded={activeTab === 'mix'}
                className={`flex-1 flex items-center justify-center gap-2 rounded-xl py-2 text-xs font-semibold uppercase tracking-wider transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 active:scale-95 ${
                  activeTab === 'mix'
                    ? 'border border-white/15 bg-white/15 text-white shadow-lg backdrop-blur-md'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <SlidersHorizontal
                  className="size-3.5"
                  style={{ color: activeTab === 'mix' ? themeColor.accent : '#38bdf8' }}
                />
                <span>Mix</span>
              </button>

              {/* MOVE TAB */}
              <button
                ref={spaceBtnRef}
                type="button"
                role="tab"
                id="tab-move"
                aria-selected={activeTab === 'move'}
                aria-controls="space-audio-panel"
                tabIndex={activeTab === 'move' ? 0 : -1}
                onClick={() => handleSelectTab('move')}
                onKeyDown={(e) => handleTabKeyDown(e, 'move')}
                aria-label="Move: Toggle Spatial Audio and Planetary Field"
                aria-expanded={activeTab === 'move'}
                className={`flex-1 flex items-center justify-center gap-2 rounded-xl py-2 text-xs font-semibold uppercase tracking-wider transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 active:scale-95 ${
                  activeTab === 'move'
                    ? 'border border-white/15 bg-white/15 text-white shadow-lg backdrop-blur-md'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Compass
                  className="size-3.5"
                  style={{ color: activeTab === 'move' ? themeColor.accent : '#38bdf8' }}
                />
                <span>Move</span>
              </button>

              {/* LEARN TAB */}
              <button
                ref={accessibilityBtnRef}
                type="button"
                role="tab"
                id="tab-learn"
                aria-selected={activeTab === 'learn'}
                aria-controls="science-legend-panel"
                tabIndex={activeTab === 'learn' ? 0 : -1}
                onClick={() => handleSelectTab('learn')}
                onKeyDown={(e) => handleTabKeyDown(e, 'learn')}
                aria-label="Learn: Toggle Scientific Interpretation & Audio Legend"
                aria-expanded={activeTab === 'learn'}
                className={`flex-1 flex items-center justify-center gap-2 rounded-xl py-2 text-xs font-semibold uppercase tracking-wider transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 active:scale-95 ${
                  activeTab === 'learn'
                    ? 'border border-white/15 bg-white/15 text-white shadow-lg backdrop-blur-md'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <BookOpen className="size-3.5 text-amber-400" />
                <span>Learn</span>
              </button>

              {/* ACCESS TAB */}
              <button
                ref={accessBtnRef}
                type="button"
                role="tab"
                id="tab-access"
                aria-selected={activeTab === 'access'}
                aria-controls="access-settings-panel"
                tabIndex={activeTab === 'access' ? 0 : -1}
                onClick={() => handleSelectTab('access')}
                onKeyDown={(e) => handleTabKeyDown(e, 'access')}
                aria-label="Access: Toggle Accessibility & Sensory Settings"
                aria-expanded={activeTab === 'access'}
                className={`flex-1 flex items-center justify-center gap-2 rounded-xl py-2 text-xs font-semibold uppercase tracking-wider transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 active:scale-95 ${
                  activeTab === 'access'
                    ? 'border border-white/15 bg-white/15 text-white shadow-lg backdrop-blur-md'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Accessibility className="size-3.5 text-emerald-400" />
                <span>Access</span>
              </button>
            </div>

            {/* ─────────────────────────────────────────────────────────
                3. SCROLLABLE TAB PANEL AREA (Internal Scroll with data-lenis-prevent)
                ───────────────────────────────────────────────────────── */}
            <div
              data-lenis-prevent
              tabIndex={0}
              className="flex-1 overflow-y-auto pr-1 rounded-2xl scrollbar-thin scrollbar-thumb-white/15 focus:outline-none"
            >
              {activeTab === 'mix' && (
                <MixerPanel
                  activeTrack={activeTrack}
                  eqBass={eqBass}
                  setEqBass={setEqBass}
                  eqMid={eqMid}
                  setEqMid={setEqMid}
                  eqHigh={eqHigh}
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
                  customMixActive={customMixActive}
                  onDetentTick={triggerDetent}
                  accentColor={themeColor.accent}
                />
              )}

              {activeTab === 'move' && (
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
                  accentColor={themeColor.accent}
                />
              )}

              {activeTab === 'learn' && (
                <SciencePanel
                  activeTrack={activeTrack}
                  accessibilityData={accessibilityData}
                  isSpeaking={speech.isSpeaking}
                  onToggleSpeech={speech.toggleSpeak}
                />
              )}

              {activeTab === 'access' && (
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
                  onOpenShortcuts={() => setShortcutsOpen(true)}
                  onAnnounce={announce}
                  onDetentTick={triggerDetent}
                />
              )}
            </div>

            {/* ─────────────────────────────────────────────────────────
                4. FOOTER ACTION ROW
                Clearly labeled action buttons & compact status chip
                ───────────────────────────────────────────────────────── */}
            <div className="shrink-0 flex flex-wrap items-center justify-between gap-3 border-t border-white/[0.08] pt-3 text-[11px] select-none">
              {/* Left: Stream Status Chip & Mute Toggle */}
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-2.5 py-1">
                  <span
                    className={`size-2 rounded-full ${
                      audioFallbackActive
                        ? 'bg-amber-400'
                        : 'animate-pulse bg-emerald-400'
                    }`}
                  />
                  <span className="font-mono text-[9px] sm:text-[10px] text-slate-300">
                    {customMixActive
                      ? 'NASA Custom DSP (16-bit PCM)'
                      : audioFallbackActive
                      ? 'PRANA Standby Loop'
                      : 'Streaming NASA data · 16-bit stereo'}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={handleToggleMute}
                  aria-label={isMuted ? 'Unmute audio soundscape' : 'Mute audio soundscape'}
                  aria-pressed={isMuted}
                  className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-2.5 py-1 font-mono text-[10px] text-slate-300 transition-colors hover:border-sky-400/50 hover:bg-sky-500/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400"
                >
                  {isMuted ? (
                    <>
                      <VolumeX className="size-3 text-amber-400" />
                      <span>AUDIO MUTED</span>
                    </>
                  ) : (
                    <>
                      <Volume2 className="size-3 text-sky-400" />
                      <span>AUDIO LIVE</span>
                    </>
                  )}
                </button>
              </div>

              {/* Right: Record Master, Diagnostic Ping & Keyboard Shortcuts Trigger */}
              <div className="flex items-center gap-2">
                {/* 1. Master 16-bit Recorder */}
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={handleToggleRecord}
                    aria-label={isRecording ? 'Stop recording master audio' : 'Record 16-bit master audio'}
                    className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 font-mono text-[10px] font-semibold uppercase transition-all ${
                      isRecording
                        ? 'border-red-400 bg-red-500/20 text-red-200 animate-pulse'
                        : 'border-white/10 bg-white/5 text-slate-300 hover:border-white/20 hover:text-white'
                    }`}
                  >
                    <Disc className={`size-3 ${isRecording ? 'text-red-400 animate-spin' : 'text-slate-400'}`} />
                    <span>{isRecording ? 'Recording...' : 'Record Master'}</span>
                  </button>

                  {recordedBlobUrl && (
                    <button
                      type="button"
                      onClick={handleDownloadRecord}
                      aria-label="Download master recorded audio WAV"
                      className="inline-flex items-center gap-1 rounded-full border border-emerald-400/50 bg-emerald-500/20 px-2.5 py-1 font-mono text-[10px] font-semibold uppercase text-emerald-300 hover:bg-emerald-500/30 transition-colors"
                    >
                      <Download className="size-3" />
                      <span>Save</span>
                    </button>
                  )}
                </div>

                {/* 2. Diagnostic Telemetry Health Ping */}
                <button
                  type="button"
                  onClick={handlePingTelemetry}
                  aria-label="Ping NASA Telemetry Diagnostic Bus"
                  title="NASA Telemetry Bus Diagnostic"
                  className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-2.5 py-1 font-mono text-[10px] text-slate-300 transition-colors hover:border-emerald-400/50 hover:bg-emerald-500/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 active:scale-95"
                >
                  {healthStatus === 'healthy' ? (
                    <>
                      <ShieldCheck className="size-3 text-emerald-400" />
                      <span className="text-emerald-300 font-semibold">Bus: Healthy</span>
                    </>
                  ) : (
                    <>
                      <Activity
                        className={`size-3 ${
                          healthStatus === 'checking' ? 'animate-spin text-sky-400' : 'text-slate-400'
                        }`}
                      />
                      <span>Telemetry Bus</span>
                    </>
                  )}
                </button>

                {/* 3. Keyboard Shortcuts Popover Trigger */}
                <button
                  type="button"
                  onClick={() => setShortcutsOpen(true)}
                  aria-label="View keyboard shortcuts"
                  title="Keyboard shortcuts (?)"
                  className="inline-flex size-7 items-center justify-center rounded-full border border-white/10 bg-white/5 text-slate-400 transition-colors hover:border-white/20 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400"
                >
                  <HelpCircle className="size-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          KEYBOARD SHORTCUTS MODAL DIALOG
          Focus trap, Esc to close, clean Apple glass popover
          ───────────────────────────────────────────────────────────── */}
      {shortcutsOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="shortcuts-dialog-title"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-md"
        >
          <div className="relative w-full max-w-md rounded-3xl border border-white/15 bg-black/85 p-6 shadow-2xl backdrop-blur-2xl text-white">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h4 id="shortcuts-dialog-title" className="text-sm font-bold uppercase tracking-wider text-white">
                Keyboard Shortcuts Reference
              </h4>
              <button
                type="button"
                onClick={() => setShortcutsOpen(false)}
                aria-label="Close shortcuts dialog"
                className="inline-flex size-7 items-center justify-center rounded-full text-slate-400 hover:text-white transition-colors"
              >
                <X className="size-4" />
              </button>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-2.5 font-mono text-xs">
              <div className="rounded-xl border border-white/5 bg-white/5 p-2.5">
                <span className="font-bold text-sky-300">Space</span>: Play / Pause
              </div>
              <div className="rounded-xl border border-white/5 bg-white/5 p-2.5">
                <span className="font-bold text-sky-300">M</span>: Mute / Unmute
              </div>
              <div className="rounded-xl border border-white/5 bg-white/5 p-2.5">
                <span className="font-bold text-sky-300">S</span>: Speak Description
              </div>
              <div className="rounded-xl border border-white/5 bg-white/5 p-2.5">
                <span className="font-bold text-sky-300">1</span>: Mix Panel
              </div>
              <div className="rounded-xl border border-white/5 bg-white/5 p-2.5">
                <span className="font-bold text-sky-300">2</span>: Move Panel
              </div>
              <div className="rounded-xl border border-white/5 bg-white/5 p-2.5">
                <span className="font-bold text-sky-300">3</span>: Learn Panel
              </div>
              <div className="rounded-xl border border-white/5 bg-white/5 p-2.5">
                <span className="font-bold text-sky-300">4</span>: Access Panel
              </div>
              <div className="rounded-xl border border-white/5 bg-white/5 p-2.5">
                <span className="font-bold text-sky-300">Arrows</span>: 2D Spatial Pad
              </div>
            </div>

            <div className="mt-5 flex justify-end">
              <button
                type="button"
                onClick={() => setShortcutsOpen(false)}
                className="rounded-full border border-white/20 bg-white/10 px-4 py-1.5 font-mono text-xs font-semibold uppercase text-white hover:bg-white/20 transition-colors"
              >
                Close (Esc)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
