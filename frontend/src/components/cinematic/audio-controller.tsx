'use client';

import { Volume2, VolumeX } from 'lucide-react';
import { useAppStore } from '@/stores/app-store';

export function FloatingAudioBadge() {
  const { isMuted, toggleMute } = useAppStore();

  return (
    <aside
      aria-label="Audio Controls"
      className="apple-glass fixed bottom-6 left-6 z-50 flex items-center gap-3 rounded-full px-4 py-2 transition-all duration-300 hover:border-white/20"
    >
      <button
        type="button"
        onClick={toggleMute}
        className="flex items-center gap-2.5 text-xs font-semibold uppercase tracking-wider text-white"
        aria-label={isMuted ? 'Unmute experience sound' : 'Mute experience sound'}
      >
        {isMuted ? (
          <>
            <VolumeX className="h-4 w-4 text-slate-400" />
            <span className="font-general text-[11px] text-slate-400">Audio Muted</span>
          </>
        ) : (
          <>
            <Volume2 className="h-4 w-4 text-sky-400" />
            <span className="font-general text-[11px] text-sky-300">Audio Live</span>
            <div className="ml-1 flex items-center gap-0.5">
              {[1, 2, 3, 4].map((bar) => (
                <div
                  key={bar}
                  className="indicator-line active"
                  style={{ animationDelay: `${bar * 0.12}s` }}
                />
              ))}
            </div>
          </>
        )}
      </button>
    </aside>
  );
}
