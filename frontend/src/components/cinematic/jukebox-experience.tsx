'use client';

import { useState, useEffect, useCallback } from 'react';
import { earthSongConfig, type SonicTrackConfig } from '@/config/earth-song.config';
import { datasetsService } from '@/services/api';
import { Starfield } from './starfield';
import { SonicHeadline } from './sonic-headline';
import { SonicGallery } from './sonic-gallery';
import { AudioDockConsole } from './audio-dock-console';
import { useAppStore } from '@/stores/app-store';

export function JukeboxExperience() {
  const [tracks, setTracks] = useState<SonicTrackConfig[]>(earthSongConfig.sonicTracks);
  const [activeTrack, setActiveTrack] = useState<SonicTrackConfig>(earthSongConfig.sonicTracks[0]!);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const { isMuted, setMuted } = useAppStore();

  // Asynchronously fetch live NASA datasets catalog from FastAPI / BFF
  useEffect(() => {
    let isMounted = true;
    async function loadCatalog() {
      try {
        const res = await datasetsService.getDatasets();
        if (res.success && res.data && res.data.length > 0 && isMounted) {
          const adapted = res.data.map((d, index) =>
            datasetsService.adaptDatasetToTrack(d, index)
          );
          setTracks(adapted);
          setActiveTrack((prev) => {
            const match = adapted.find((t) => t.id === prev.id);
            return match || adapted[0]!;
          });
        }
      } catch {
        // Fallback tracks preserved gracefully
      }
    }

    loadCatalog();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleTogglePlay = useCallback(() => {
    const nextState = !isPlayingAudio;
    setIsPlayingAudio(nextState);
    if (nextState && isMuted) {
      setMuted(false);
    }
  }, [isPlayingAudio, isMuted, setMuted]);

  const handleSelectTrack = useCallback((track: SonicTrackConfig) => {
    setActiveTrack((prev) => (prev.id === track.id ? prev : track));
  }, []);

  return (
    <section
      id="jukebox"
      className="relative min-h-screen w-full overflow-hidden bg-gradient-to-b from-black via-[#030616] to-black text-white selection:bg-sky-400 selection:text-black"
      aria-label="Interactive Earth Song Console"
    >
      {/* 1. Continuous Starfield Background across Sonic Section */}
      <Starfield />

      {/* 2. Dynamic Ambient Nebula Glow shifting hue to match active source with smooth top feather */}
      <div
        className="pointer-events-none absolute inset-0 transition-colors duration-1000 ease-out"
        style={{
          background: `radial-gradient(circle at 50% 50%, ${activeTrack.color.nebula} 0%, rgba(3,6,22,0.7) 55%, transparent 90%)`,
          maskImage:
            'linear-gradient(to bottom, transparent 0%, black 140px, black 90%, transparent 100%)',
          WebkitMaskImage:
            'linear-gradient(to bottom, transparent 0%, black 140px, black 90%, transparent 100%)',
        }}
      />

      {/* 3. Hero-Sized Restrained Sonic Headline */}
      <SonicHeadline />

      {/* 4. Apple-Style Pinned Horizontal Gallery of Cinematic Sources */}
      <SonicGallery
        tracks={tracks}
        activeTrack={activeTrack}
        isPlaying={isPlayingAudio}
        onSelectTrack={handleSelectTrack}
        onTogglePlay={handleTogglePlay}
      />

      {/* 5. Apple Music "Now Playing" Studio Visualizer & Deck Finale */}
      <AudioDockConsole
        activeTrack={activeTrack}
        isPlaying={isPlayingAudio}
        onTogglePlay={handleTogglePlay}
      />
    </section>
  );
}
