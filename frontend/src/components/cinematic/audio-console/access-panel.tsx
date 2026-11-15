'use client';

import {
  Volume2,
  CircleDot,
  Vibrate,
  Accessibility,
  Keyboard,
} from 'lucide-react';
import type { SonicTrackConfig } from '@/config/earth-song.config';

/**
 * TUNING CONSTANTS — Access & Sensory Panel
 */
export const TUNING = {
  transitionSpeed: '150ms',
};

interface AccessPanelProps {
  activeTrack: SonicTrackConfig;
  earconsSetting: 'full' | 'minimal' | 'off';
  setEarconsSetting: (val: 'full' | 'minimal' | 'off') => void;
  hapticsEnabled: boolean;
  setHapticsEnabled: (val: boolean) => void;
  hapticsSupported: boolean;
  tactileEnabled: boolean;
  setTactileEnabled: (val: boolean) => void;
  tactileCutoff: 68 | 136;
  setTactileCutoff: (val: 68 | 136) => void;
  onTestTactilePulse?: () => void;
  onOpenShortcuts?: () => void;
  onAnnounce?: (msg: string) => void;
  onDetentTick?: () => void;
}

export function AccessPanel({
  activeTrack: _activeTrack,
  earconsSetting,
  setEarconsSetting,
  hapticsEnabled,
  setHapticsEnabled,
  hapticsSupported,
  tactileEnabled,
  setTactileEnabled,
  tactileCutoff,
  setTactileCutoff,
  onTestTactilePulse,
  onOpenShortcuts,
  onAnnounce,
  onDetentTick,
}: AccessPanelProps) {
  return (
    <div
      id="access-settings-panel"
      role="region"
      aria-label="Accessibility Settings, Tactile & Speech Controls"
      className="space-y-3.5 text-white"
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/[0.08] pb-2.5">
        <div className="flex items-center gap-2">
          <Accessibility className="size-4 text-emerald-400" />
          <h4 className="font-semibold text-sm tracking-wide text-white uppercase">
            Universal Accessibility & Sensory Feeds
          </h4>
        </div>
        <span className="font-mono text-[9px] uppercase tracking-wider text-emerald-400/90 rounded bg-emerald-500/10 px-2 py-0.5 border border-emerald-500/20">
          WCAG 2.1 AAA
        </span>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          SINGLE CLEAN COLUMN OF 4 LABELED TOGGLE ROWS
          ───────────────────────────────────────────────────────────── */}

      {/* Row 1: Sound Cues (Earcons) */}
      <div className="rounded-2xl border border-white/10 bg-black/40 p-4 backdrop-blur-md transition-all hover:border-white/20">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <Volume2 className="size-4 text-sky-400" />
              <span className="font-bold text-sm text-white">Sound cues</span>
              <span className="font-mono text-[10px] text-slate-400 uppercase">
                (Procedural Earcons)
              </span>
            </div>
            <p className="text-xs text-slate-300 leading-snug">
              Subtle harmonic chimes on playback, tab changes, and slider detents for blind and
              low-vision navigation.
            </p>
          </div>

          <div className="flex gap-1.5 font-mono text-[10px]">
            {(['full', 'minimal', 'off'] as const).map((mode) => (
              <button
                key={mode}
                type="button"
                onClick={() => {
                  setEarconsSetting(mode);
                  onDetentTick?.();
                  onAnnounce?.(`Earcons set to ${mode}.`);
                }}
                className={`px-3 py-1.5 rounded-xl font-semibold uppercase border transition-all active:scale-95 ${
                  earconsSetting === mode
                    ? 'border-sky-400 bg-sky-500/25 text-sky-200 shadow-[0_0_10px_rgba(56,189,248,0.3)]'
                    : 'border-white/10 bg-white/5 text-slate-400 hover:text-white hover:border-white/20'
                }`}
              >
                {mode}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Row 2: Feel the bass (Tactile Transducer) */}
      <div className="rounded-2xl border border-white/10 bg-black/40 p-4 backdrop-blur-md transition-all hover:border-white/20">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <CircleDot className="size-4 text-amber-400" />
              <span className="font-bold text-sm text-white">Feel the bass</span>
              <span className="font-mono text-[10px] text-slate-400 uppercase">
                (Tactile Bass Shaker Feed)
              </span>
            </div>
            <p className="text-xs text-slate-300 leading-snug">
              Low-pass sub-bass filter isolating planetary frequencies for physical transducers and
              haptic seats.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                const next = !tactileEnabled;
                setTactileEnabled(next);
                onDetentTick?.();
                onAnnounce?.(next ? 'Tactile bass shaker feed enabled.' : 'Tactile feed disabled.');
              }}
              className={`rounded-xl px-3 py-1.5 font-mono text-[10px] font-bold uppercase transition-all border active:scale-95 ${
                tactileEnabled
                  ? 'border-emerald-400 bg-emerald-500/25 text-emerald-300 shadow-[0_0_10px_rgba(52,211,153,0.3)]'
                  : 'border-white/10 bg-white/5 text-slate-400 hover:text-white'
              }`}
            >
              {tactileEnabled ? 'Active' : 'Muted'}
            </button>
          </div>
        </div>

        {/* Sub-controls: 68 Hz / 136 Hz Cutoff and Test Pulse */}
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-white/[0.06] pt-2.5">
          <div className="flex items-center gap-2 font-mono text-[10px]">
            <span className="text-slate-400 text-[9px] uppercase">Cutoff:</span>
            {[68, 136].map((hz) => (
              <button
                key={hz}
                type="button"
                onClick={() => {
                  setTactileCutoff(hz as 68 | 136);
                  onDetentTick?.();
                  onAnnounce?.(`Tactile cutoff set to ${hz} Hz.`);
                }}
                className={`px-2.5 py-1 rounded-lg border transition-all ${
                  tactileCutoff === hz
                    ? 'border-amber-400 bg-amber-500/20 text-amber-300 font-bold'
                    : 'border-white/10 bg-white/5 text-slate-400 hover:text-white'
                }`}
              >
                {hz} Hz {hz === 136 ? '(Year Tone)' : '(Sub-Octave)'}
              </button>
            ))}
          </div>

          {onTestTactilePulse && (
            <button
              type="button"
              onClick={onTestTactilePulse}
              className="font-mono text-[10px] text-sky-400 hover:text-sky-300 underline font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400"
            >
              Test Pulse
            </button>
          )}
        </div>
      </div>

      {/* Row 3: Phone Vibration (Device Haptics) */}
      <div className="rounded-2xl border border-white/10 bg-black/40 p-4 backdrop-blur-md transition-all hover:border-white/20">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <Vibrate className="size-4 text-sky-400" />
              <span className="font-bold text-sm text-white">Phone vibration</span>
              <span className="font-mono text-[10px] text-slate-400 uppercase">
                (Device Haptics)
              </span>
            </div>
            <p className="text-xs text-slate-300 leading-snug">
              Vibration motor feedback synced to planetary rhythmic transients on supported phones
              and tablets.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <span
              className={`font-mono text-[9px] uppercase px-2 py-0.5 rounded-full border ${
                hapticsSupported
                  ? 'border-emerald-400/40 text-emerald-300 bg-emerald-500/10'
                  : 'border-slate-700 text-slate-400 bg-slate-800/40'
              }`}
            >
              {hapticsSupported ? 'Hardware Ready' : 'Desktop / No Hardware'}
            </span>

            <button
              type="button"
              disabled={!hapticsSupported}
              onClick={() => {
                const next = !hapticsEnabled;
                setHapticsEnabled(next);
                onDetentTick?.();
                onAnnounce?.(next ? 'Device haptics enabled.' : 'Device haptics disabled.');
              }}
              className={`rounded-xl px-3 py-1.5 font-mono text-[10px] font-bold uppercase transition-all border active:scale-95 disabled:opacity-40 ${
                hapticsEnabled && hapticsSupported
                  ? 'border-sky-400 bg-sky-500/25 text-sky-200 shadow-[0_0_10px_rgba(56,189,248,0.3)]'
                  : 'border-white/10 bg-white/5 text-slate-400 hover:text-white'
              }`}
            >
              {hapticsEnabled && hapticsSupported ? 'Enabled' : 'Disabled'}
            </button>
          </div>
        </div>
      </div>

      {/* Row 4: Universal Shortcuts & Navigation */}
      <div className="rounded-2xl border border-white/10 bg-black/40 p-4 backdrop-blur-md transition-all hover:border-white/20">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <Keyboard className="size-4 text-emerald-400" />
              <span className="font-bold text-sm text-white">Universal shortcuts</span>
              <span className="font-mono text-[10px] text-slate-400 uppercase">
                (Keyboard & Roving Tabs)
              </span>
            </div>
            <p className="text-xs text-slate-300 leading-snug">
              Full keyboard accessibility with Space to play/pause, M to mute, S to speak, and 1–4
              to jump tabs.
            </p>
          </div>

          <button
            type="button"
            onClick={onOpenShortcuts}
            aria-label="Open keyboard shortcuts reference dialog"
            className="inline-flex items-center gap-1.5 rounded-xl border border-white/15 bg-white/10 px-3.5 py-1.5 font-mono text-[10px] font-bold uppercase text-slate-200 transition-all hover:border-sky-400 hover:bg-sky-500/20 hover:text-white active:scale-95"
          >
            <Keyboard className="size-3.5 text-sky-400" />
            <span>View shortcuts</span>
          </button>
        </div>
      </div>
    </div>
  );
}
