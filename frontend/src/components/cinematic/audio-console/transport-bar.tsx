'use client';

import { Play, Pause, Activity, ShieldCheck, Sliders, Compass, BookOpen, Accessibility } from 'lucide-react';
import type { SonicTrackConfig } from '@/config/earth-song.config';

export type ConsoleTab = 'mix' | 'space' | 'science' | 'access';

interface TransportBarProps {
  activeTrack: SonicTrackConfig;
  isPlaying: boolean;
  onTogglePlay: () => void;
  currentTime: number;
  duration: number;
  onScrub: (time: number) => void;
  activeTab: ConsoleTab;
  onSelectTab: (tab: ConsoleTab) => void;
  healthStatus: 'idle' | 'checking' | 'healthy';
  onPingTelemetry: () => void;
  mixerBtnRef?: React.RefObject<HTMLButtonElement | null>;
  accessibilityBtnRef?: React.RefObject<HTMLButtonElement | null>;
}

export function TransportBar({
  activeTrack,
  isPlaying,
  onTogglePlay,
  currentTime,
  duration,
  onScrub,
  activeTab,
  onSelectTab,
  healthStatus,
  onPingTelemetry,
  mixerBtnRef,
  accessibilityBtnRef,
}: TransportBarProps) {
  // Format seconds to mm:ss
  const formatTime = (sec: number) => {
    if (isNaN(sec) || sec < 0) return '0:00';
    const mins = Math.floor(sec / 60);
    const secs = Math.floor(sec % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const tabs: Array<{
    id: ConsoleTab;
    label: string;
    icon: typeof Sliders;
    ariaLabel: string;
    ariaControls?: string;
    ref?: React.RefObject<HTMLButtonElement | null>;
  }> = [
    {
      id: 'mix',
      label: 'Mixer',
      icon: Sliders,
      ariaLabel: 'Toggle Constituent Layer Synthesizer Mixer',
      ariaControls: 'constituent-mixer-panel',
      ref: mixerBtnRef,
    },
    {
      id: 'space',
      label: 'Spatial 2D',
      icon: Compass,
      ariaLabel: 'Spatial Audio and Atmospheric Reverb Field',
      ariaControls: 'space-audio-panel',
    },
    {
      id: 'science',
      label: 'Science',
      icon: BookOpen,
      ariaLabel: 'Toggle Scientific Interpretation & Audio Legend',
      ariaControls: 'science-legend-panel',
      ref: accessibilityBtnRef,
    },
    {
      id: 'access',
      label: 'Access',
      icon: Accessibility,
      ariaLabel: 'Accessibility Settings, Tactile & Speech Controls',
      ariaControls: 'access-settings-panel',
    },
  ];

  return (
    <div className="flex flex-col gap-4">
      {/* Top Row: Track Meta & Play Pill Cluster */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        {/* Track Title with Clamped Typography */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="size-1.5 rounded-full bg-sky-400 animate-pulse" />
            <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.2em] text-sky-400 sm:text-xs">
              {activeTrack.category}
            </span>
          </div>
          <h3
            title={activeTrack.title}
            aria-label={`Soundscape: ${activeTrack.title}`}
            className="special-font font-zentry mt-0.5 text-xl font-black uppercase text-white tracking-tight sm:text-2xl md:text-3xl line-clamp-1 drop-shadow-md"
          >
            {activeTrack.title}
          </h3>
        </div>

        {/* Master Play Pill & Health Ping */}
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={onTogglePlay}
            aria-label={
              isPlaying
                ? `Pause soundscape: ${activeTrack.title}`
                : `Play soundscape: ${activeTrack.title}`
            }
            className="group relative inline-flex items-center gap-2.5 rounded-full border border-sky-400/40 bg-white/10 px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-white shadow-lg backdrop-blur-md transition-all hover:border-sky-400 hover:bg-sky-500/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 active:scale-95"
          >
            {isPlaying ? (
              <>
                <Pause className="size-4 fill-current text-sky-400" />
                <span>Pause Soundscape</span>
                <span className="absolute -inset-0.5 animate-ping rounded-full border border-sky-400/50 opacity-60" />
              </>
            ) : (
              <>
                <Play className="size-4 fill-current text-white group-hover:text-sky-300" />
                <span>Hear Earth Audio</span>
              </>
            )}
          </button>

          {/* Diagnostic Telemetry Health Ping */}
          <button
            type="button"
            onClick={onPingTelemetry}
            aria-label="Ping NASA Telemetry Diagnostic Bus"
            title="NASA Telemetry Bus Diagnostic"
            className="inline-flex size-9 items-center justify-center rounded-full border border-white/15 bg-black/40 text-slate-300 transition-all hover:border-emerald-400/60 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 active:scale-95"
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

      {/* Timeline Scrubbing Bar */}
      <div className="space-y-1">
        <div className="relative flex items-center">
          <input
            type="range"
            min="0"
            max={duration || 180}
            value={currentTime}
            onChange={(e) => onScrub(Number(e.target.value))}
            aria-label="Audio timeline position"
            aria-valuenow={Math.round(currentTime)}
            aria-valuemin={0}
            aria-valuemax={Math.round(duration || 180)}
            aria-valuetext={`${formatTime(currentTime)} of ${formatTime(duration)}`}
            className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-white/15 accent-sky-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-400"
          />
        </div>
        <div className="flex justify-between font-mono text-[10px] text-slate-500">
          <span>{formatTime(currentTime)}</span>
          <span className="tracking-wider text-slate-400">
            {duration ? `${formatTime(duration)} DURATION` : 'STREAMING'}
          </span>
        </div>
      </div>

      {/* Segmented Navigation Tablist */}
      <div
        role="tablist"
        aria-label="Audio Console Views"
        className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-black/50 p-1 backdrop-blur-md"
      >
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              ref={tab.ref}
              type="button"
              role="tab"
              id={`tab-${tab.id}`}
              aria-selected={isActive}
              aria-expanded={isActive}
              aria-controls={tab.ariaControls}
              aria-label={tab.ariaLabel}
              onClick={() => onSelectTab(tab.id)}
              className={`flex flex-1 items-center justify-center gap-2 rounded-lg py-1.5 px-2 text-xs font-mono font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 active:scale-95 ${
                isActive
                  ? 'border border-sky-400/50 bg-sky-500/20 text-sky-200 shadow-[0_0_12px_rgba(56,189,248,0.25)] font-bold'
                  : 'border border-transparent text-slate-400 hover:bg-white/5 hover:text-white'
              }`}
            >
              <Icon className={`size-3.5 ${isActive ? 'text-sky-400' : 'text-slate-400'}`} />
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
