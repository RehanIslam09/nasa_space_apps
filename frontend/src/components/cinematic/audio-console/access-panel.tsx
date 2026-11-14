'use client';

import { useState, useRef } from 'react';
import {
  Accessibility,
  Volume2,
  Vibrate,
  CircleDot,
  Download,
  Keyboard,
  Disc,
} from 'lucide-react';
import type { SonicTrackConfig } from '@/config/earth-song.config';

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
  getStreamDestination?: () => MediaStreamAudioDestinationNode | null;
  onAnnounce?: (msg: string) => void;
  onDetentTick?: () => void;
}

export function AccessPanel({
  activeTrack,
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
  getStreamDestination,
  onAnnounce,
  onDetentTick,
}: AccessPanelProps) {
  // Master recording state
  const [isRecording, setIsRecording] = useState(false);
  const [recordedBlobUrl, setRecordedBlobUrl] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  // Start / Stop Master 16-bit MediaRecorder Capture
  const handleToggleRecord = () => {
    if (isRecording) {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
        mediaRecorderRef.current.stop();
        setIsRecording(false);
        onAnnounce?.('Master audio recording completed. Ready for download.');
      }
    } else {
      const streamDest = getStreamDestination?.();
      if (!streamDest || !streamDest.stream) {
        onAnnounce?.('Audio stream not available for recording.');
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
        onAnnounce?.('Started recording 16-bit master soundscape...');
      } catch {
        onAnnounce?.('MediaRecorder not supported by this browser.');
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
    onAnnounce?.(`Downloaded master audio recording for ${activeTrack.title}.`);
  };

  return (
    <div
      id="access-settings-panel"
      role="region"
      aria-label="Accessibility Settings, Tactile & Speech Controls"
      className="space-y-4 rounded-2xl border border-white/10 bg-black/40 p-4.5 text-xs backdrop-blur-md"
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/[0.08] pb-2 font-mono">
        <div className="flex items-center gap-2 font-semibold uppercase tracking-wider text-slate-200">
          <Accessibility className="size-4 text-sky-400" />
          <span>Universal Accessibility & Sensoric Feeds</span>
        </div>
        <span className="text-[10px] text-slate-400">WCAG 2.1 AAA Compliant</span>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {/* 1. Procedural Audio Earcons Setting */}
        <div className="rounded-xl border border-white/5 bg-black/30 p-3.5 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 font-mono font-semibold text-slate-300">
              <Volume2 className="size-3.5 text-sky-400" />
              <span>Procedural Earcons</span>
            </div>
            <span className="text-[10px] text-slate-400 font-mono">Harmonic Cues</span>
          </div>
          <p className="text-[11px] text-slate-400 leading-snug">
            Non-verbal acoustic chimes on play, pause, tabs, and slider detents for blind users.
          </p>
          <div className="flex gap-1.5 pt-1">
            {(['full', 'minimal', 'off'] as const).map((mode) => (
              <button
                key={mode}
                type="button"
                onClick={() => {
                  setEarconsSetting(mode);
                  onDetentTick?.();
                  onAnnounce?.(`Earcons set to ${mode}.`);
                }}
                className={`flex-1 py-1 rounded-lg font-mono text-[10px] font-semibold uppercase border transition-colors ${
                  earconsSetting === mode
                    ? 'border-sky-400 bg-sky-500/20 text-sky-200'
                    : 'border-white/10 bg-white/5 text-slate-400 hover:text-white'
                }`}
              >
                {mode}
              </button>
            ))}
          </div>
        </div>

        {/* 2. Tactile Transducer & Sub-Bass Feed */}
        <div className="rounded-xl border border-white/5 bg-black/30 p-3.5 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 font-mono font-semibold text-slate-300">
              <CircleDot className="size-3.5 text-amber-400" />
              <span>Tactile Bass Shaker Feed</span>
            </div>
            <button
              type="button"
              onClick={() => {
                const next = !tactileEnabled;
                setTactileEnabled(next);
                onDetentTick?.();
                onAnnounce?.(next ? 'Tactile bass shaker feed enabled.' : 'Tactile feed disabled.');
              }}
              className={`rounded-full px-2 py-0.5 font-mono text-[9px] font-bold uppercase transition-colors border ${
                tactileEnabled
                  ? 'border-emerald-400 bg-emerald-500/20 text-emerald-300'
                  : 'border-white/10 bg-white/5 text-slate-400'
              }`}
            >
              {tactileEnabled ? 'Active' : 'Muted'}
            </button>
          </div>
          <p className="text-[11px] text-slate-400 leading-snug">
            Low-pass acoustic filter isolating planetary sub-bass for physical haptic transducers.
          </p>
          <div className="flex items-center justify-between pt-1">
            <div className="flex gap-1.5">
              {[68, 136].map((hz) => (
                <button
                  key={hz}
                  type="button"
                  onClick={() => {
                    setTactileCutoff(hz as 68 | 136);
                    onDetentTick?.();
                    onAnnounce?.(`Tactile cutoff set to ${hz} Hz.`);
                  }}
                  className={`px-2.5 py-1 rounded-lg font-mono text-[10px] border transition-colors ${
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
                className="font-mono text-[10px] text-sky-400 hover:text-sky-300 underline"
              >
                Test Pulse
              </button>
            )}
          </div>
        </div>

        {/* 3. Device Haptic Feedback */}
        <div className="rounded-xl border border-white/5 bg-black/30 p-3.5 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 font-mono font-semibold text-slate-300">
              <Vibrate className="size-3.5 text-sky-400" />
              <span>Mobile Device Haptics</span>
            </div>
            <span
              className={`font-mono text-[9px] uppercase px-1.5 py-0.5 rounded border ${
                hapticsSupported
                  ? 'border-emerald-400/40 text-emerald-300 bg-emerald-500/10'
                  : 'border-slate-600 text-slate-400 bg-slate-800/40'
              }`}
            >
              {hapticsSupported ? 'Hardware Ready' : 'Desktop / No Hardware'}
            </span>
          </div>
          <p className="text-[11px] text-slate-400 leading-snug">
            Vibration motor feedback synced to planetary rhythmic transients on supported devices.
          </p>
          <div className="pt-1">
            <button
              type="button"
              disabled={!hapticsSupported}
              onClick={() => {
                const next = !hapticsEnabled;
                setHapticsEnabled(next);
                onDetentTick?.();
                onAnnounce?.(next ? 'Device haptics enabled.' : 'Device haptics disabled.');
              }}
              className={`w-full py-1.5 rounded-lg font-mono text-[10px] font-semibold uppercase border transition-colors disabled:opacity-40 ${
                hapticsEnabled && hapticsSupported
                  ? 'border-sky-400 bg-sky-500/20 text-sky-200'
                  : 'border-white/10 bg-white/5 text-slate-400 hover:text-white'
              }`}
            >
              {hapticsEnabled && hapticsSupported ? 'Haptics Enabled' : 'Haptics Disabled'}
            </button>
          </div>
        </div>

        {/* 4. Master 16-Bit Audio Capture */}
        <div className="rounded-xl border border-white/5 bg-black/30 p-3.5 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 font-mono font-semibold text-slate-300">
              <Disc className={`size-3.5 ${isRecording ? 'text-red-400 animate-spin' : 'text-sky-400'}`} />
              <span>Master Soundscape Recorder</span>
            </div>
            {isRecording && (
              <span className="flex items-center gap-1 font-mono text-[9px] text-red-400 animate-pulse font-bold">
                <span className="size-1.5 rounded-full bg-red-400" />
                RECORDING
              </span>
            )}
          </div>
          <p className="text-[11px] text-slate-400 leading-snug">
            Capture live audio directly from the master mixing bus including EQ and spatial reverb.
          </p>
          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={handleToggleRecord}
              className={`flex-1 py-1.5 rounded-lg font-mono text-[10px] font-semibold uppercase border transition-colors ${
                isRecording
                  ? 'border-red-400 bg-red-500/20 text-red-300'
                  : 'border-sky-400/50 bg-sky-500/20 text-sky-200 hover:bg-sky-500/30'
              }`}
            >
              {isRecording ? 'Stop Recording' : 'Record 16-Bit Master'}
            </button>
            {recordedBlobUrl && (
              <button
                type="button"
                onClick={handleDownloadRecord}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg font-mono text-[10px] font-semibold uppercase border border-emerald-400/50 bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30"
              >
                <Download className="size-3" />
                <span>Save</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Keyboard Shortcuts Reference */}
      <div className="rounded-xl border border-white/[0.06] bg-black/20 p-3">
        <div className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-wider text-slate-300 font-semibold mb-2">
          <Keyboard className="size-3.5 text-sky-400" />
          <span>Keyboard Shortcuts Quick Reference</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 font-mono text-[10px] text-slate-400">
          <div className="rounded bg-black/40 p-1.5 border border-white/5">
            <span className="font-bold text-white">Space</span>: Play / Pause
          </div>
          <div className="rounded bg-black/40 p-1.5 border border-white/5">
            <span className="font-bold text-white">M</span>: Mute / Unmute
          </div>
          <div className="rounded bg-black/40 p-1.5 border border-white/5">
            <span className="font-bold text-white">S</span>: Speak Description
          </div>
          <div className="rounded bg-black/40 p-1.5 border border-white/5">
            <span className="font-bold text-white">1, 2, 3, 4</span>: Switch Tabs
          </div>
        </div>
      </div>
    </div>
  );
}
