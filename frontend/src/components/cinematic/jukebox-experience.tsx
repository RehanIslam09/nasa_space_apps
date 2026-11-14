'use client';

import { useState, useRef, useEffect } from 'react';
import { BentoTilt } from './bento-tilt';
import { AnimatedTitle } from './animated-title';
import { Play, Pause, Radio, Disc, ShieldCheck, ExternalLink, Activity } from 'lucide-react';
import { useAppStore } from '@/stores/app-store';

interface SonicTrack {
  id: string;
  title: string;
  category: string;
  frequency: string;
  description: string;
  videoSrc: string;
  accentColor: string;
}

const SONIC_TRACKS: SonicTrack[] = [
  {
    id: 'track-1',
    title: 'POLAR RESONANCE',
    category: 'Cryosphere Telemetry',
    frequency: '432 Hz',
    description:
      'Acoustic recordings of Arctic shelf fractures harmonized with ice-sheet elevation loss data.',
    videoSrc: '/videos/earth-narrative.mp4',
    accentColor: 'border-sky-400 text-sky-400 bg-sky-400',
  },
  {
    id: 'track-2',
    title: 'ATMOSPHERIC PULSE',
    category: 'Troposphere & Jet Streams',
    frequency: '528 Hz',
    description:
      'Dynamic pressure gradients and hurricane vortex speed sonified into polyphonic ambient textures.',
    videoSrc: '/videos/earth-narrative.mp4',
    accentColor: 'border-violet-400 text-violet-400 bg-violet-400',
  },
  {
    id: 'track-3',
    title: 'ABYSSAL HARMONICS',
    category: 'Oceanic Gyres & Hydrophones',
    frequency: '174 Hz',
    description:
      'Deep-ocean thermohaline circulation mapped to sub-bass drones and acoustic wave frequencies.',
    videoSrc: '/videos/earth-narrative.mp4',
    accentColor: 'border-emerald-400 text-emerald-400 bg-emerald-400',
  },
  {
    id: 'track-4',
    title: 'SOLAR FLARE CADENCE',
    category: 'Geomagnetic Shielding',
    frequency: '639 Hz',
    description:
      'Solar wind particulate impacts against Earth’s magnetosphere captured by NASA Van Allen Probes.',
    videoSrc: '/videos/earth-narrative.mp4',
    accentColor: 'border-amber-400 text-amber-400 bg-amber-400',
  },
];

export function JukeboxExperience() {
  const [activeTrack, setActiveTrack] = useState<SonicTrack>(SONIC_TRACKS[0]!);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [eqBass, setEqBass] = useState(65);
  const [eqMid, setEqMid] = useState(80);
  const [eqHigh, setEqHigh] = useState(50);
  const [healthStatus, setHealthStatus] = useState<'idle' | 'checking' | 'healthy'>('idle');

  const audioRef = useRef<HTMLAudioElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { isMuted, setMuted } = useAppStore();

  // Audio Play/Pause
  const togglePlayAudio = () => {
    if (!audioRef.current) return;

    if (isPlayingAudio) {
      audioRef.current.pause();
      setIsPlayingAudio(false);
    } else {
      audioRef.current
        .play()
        .then(() => {
          setIsPlayingAudio(true);
          if (isMuted) setMuted(false);
        })
        .catch(() => {});
    }
  };

  // Switch Track
  const handleSelectTrack = (track: SonicTrack) => {
    setActiveTrack(track);
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current
        .play()
        .then(() => {
          setIsPlayingAudio(true);
          if (isMuted) setMuted(false);
        })
        .catch(() => {});
    }
  };

  // Simulated live audio spectrum visualizer on Canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;
    let phase = 0;

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const bars = 36;
      const barWidth = canvas.width / bars - 2;

      for (let i = 0; i < bars; i++) {
        const heightMultiplier = isPlayingAudio ? Math.sin(phase + i * 0.3) * 0.4 + 0.6 : 0.15;
        const barHeight = Math.max(4, heightMultiplier * (canvas.height * 0.85));
        const x = i * (barWidth + 2);
        const y = canvas.height - barHeight;

        // Gradient color for visualizer bars
        const gradient = ctx.createLinearGradient(0, canvas.height, 0, 0);
        gradient.addColorStop(0, 'rgba(56, 189, 248, 0.2)');
        gradient.addColorStop(0.5, 'rgba(56, 189, 248, 0.7)');
        gradient.addColorStop(1, 'rgba(255, 255, 255, 0.9)');

        ctx.fillStyle = gradient;
        ctx.fillRect(x, y, barWidth, barHeight);
      }

      if (isPlayingAudio) {
        phase += 0.12;
      }
      animationId = requestAnimationFrame(render);
    };

    render();

    return () => cancelAnimationFrame(animationId);
  }, [isPlayingAudio]);

  // Check API health status directly
  const verifyHealth = async () => {
    setHealthStatus('checking');
    try {
      const res = await fetch('/api/health');
      if (res.ok) {
        setHealthStatus('healthy');
      } else {
        setHealthStatus('idle');
      }
    } catch {
      setHealthStatus('idle');
    }
  };

  return (
    <section
      id="jukebox"
      className="relative min-h-screen w-full bg-black py-24 text-white selection:bg-sky-400 selection:text-black"
      aria-label="Interactive Earth Song Console"
    >
      <audio ref={audioRef} src="/audio/loop.mp3" loop />

      <div className="container mx-auto max-w-7xl px-6">
        {/* Section Header */}
        <div className="text-center">
          <div className="apple-glass inline-flex items-center gap-2 rounded-full px-3.5 py-1 text-xs font-semibold uppercase tracking-widest text-sky-400">
            <Disc className="h-3.5 w-3.5 animate-spin" />
            <span>Chapter 02 • The Sonic Transformation</span>
          </div>

          <AnimatedTitle
            title="LET'S HE<b>A</b>R HER STORY <br /> THE PL<b>A</b>NET'S LIVING SONG"
            containerClass="mt-6 !text-white"
          />

          <p className="font-circular text-muted-foreground mx-auto mt-4 max-w-2xl text-base sm:text-lg">
            Earth is not silent. Every environmental metric generates vibrations. Through NASA
            observation telemetry and data sonification, we translate planetary frequencies into an
            immersive sonic odyssey.
          </p>
        </div>

        {/* 3D Bento Grid of Sonification Instruments */}
        <div className="mt-16 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
          {SONIC_TRACKS.map((track) => {
            const isCurrent = activeTrack.id === track.id;
            return (
              <BentoTilt
                key={track.id}
                className="group relative cursor-pointer overflow-hidden rounded-2xl border border-white/10 bg-slate-950/80 p-5 backdrop-blur-md transition-all duration-300 hover:border-sky-400/60"
              >
                <div
                  onClick={() => handleSelectTrack(track)}
                  className="flex h-full flex-col justify-between"
                >
                  {/* Card Video Background */}
                  <div className="relative mb-4 h-44 w-full overflow-hidden rounded-xl border border-white/10">
                    <video
                      src={track.videoSrc}
                      loop
                      muted
                      playsInline
                      autoPlay
                      preload="metadata"
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                    <div className="absolute left-2.5 top-2.5 rounded-full border border-white/10 bg-black/60 px-2 py-0.5 font-mono text-[10px] text-sky-300">
                      {track.frequency}
                    </div>
                    {isCurrent && isPlayingAudio && (
                      <div className="absolute right-2.5 top-2.5 flex items-center gap-1 rounded-full bg-sky-500/80 px-2 py-0.5 text-[10px] font-bold text-black">
                        <Radio className="h-3 w-3 animate-pulse" />
                        PLAYING
                      </div>
                    )}
                  </div>

                  <div>
                    <span className="font-general text-[11px] font-semibold uppercase tracking-wider text-sky-400">
                      {track.category}
                    </span>
                    <h3 className="special-font font-zentry mt-1 text-2xl font-black uppercase text-white">
                      {track.title}
                    </h3>
                    <p className="font-circular text-muted-foreground mt-2 line-clamp-3 text-xs">
                      {track.description}
                    </p>
                  </div>

                  <div className="mt-4 flex items-center justify-between border-t border-white/10 pt-3">
                    <button
                      type="button"
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-sky-400 group-hover:text-sky-300"
                    >
                      {isCurrent && isPlayingAudio ? (
                        <>
                          <Pause className="h-3.5 w-3.5 fill-current" />
                          <span>Pause Track</span>
                        </>
                      ) : (
                        <>
                          <Play className="h-3.5 w-3.5 fill-current" />
                          <span>Load & Play</span>
                        </>
                      )}
                    </button>
                    <span className="font-mono text-[10px] text-slate-500">NASA OBS</span>
                  </div>
                </div>
              </BentoTilt>
            );
          })}
        </div>

        {/* Live Master Sonification Deck & Telemetry Console */}
        <div className="glass-panel-glow mt-12 overflow-hidden rounded-3xl border border-sky-400/30 p-6 md:p-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            {/* Left: Active Track Details */}
            <div className="max-w-xl">
              <div className="flex items-center gap-2">
                <span className="inline-flex size-2 animate-ping rounded-full bg-emerald-400" />
                <span className="font-general text-xs font-semibold uppercase tracking-widest text-emerald-400">
                  Planetary Audio Console Active
                </span>
              </div>
              <h4 className="special-font font-zentry mt-2 text-3xl font-black uppercase text-white sm:text-4xl">
                {activeTrack.title}
              </h4>
              <p className="font-circular text-muted-foreground mt-1 text-sm">
                {activeTrack.description}
              </p>

              {/* Sliders for EQ controls */}
              <div className="mt-5 grid grid-cols-3 gap-4 font-mono text-xs">
                <div>
                  <div className="flex justify-between text-slate-400">
                    <span>LOW / BASS</span>
                    <span>{eqBass}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={eqBass}
                    onChange={(e) => setEqBass(Number(e.target.value))}
                    className="mt-1 w-full cursor-pointer accent-sky-400"
                  />
                </div>
                <div>
                  <div className="flex justify-between text-slate-400">
                    <span>MID RESONANCE</span>
                    <span>{eqMid}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={eqMid}
                    onChange={(e) => setEqMid(Number(e.target.value))}
                    className="mt-1 w-full cursor-pointer accent-sky-400"
                  />
                </div>
                <div>
                  <div className="flex justify-between text-slate-400">
                    <span>HIGH SHIMMER</span>
                    <span>{eqHigh}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={eqHigh}
                    onChange={(e) => setEqHigh(Number(e.target.value))}
                    className="mt-1 w-full cursor-pointer accent-sky-400"
                  />
                </div>
              </div>
            </div>

            {/* Right: Audio Waveform Canvas & Controls */}
            <div className="flex flex-col items-center gap-4 lg:items-end">
              <div className="relative h-20 w-full max-w-sm overflow-hidden rounded-xl border border-sky-400/20 bg-slate-950 p-2">
                <canvas ref={canvasRef} width={340} height={64} className="h-full w-full" />
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={togglePlayAudio}
                  className="inline-flex items-center gap-2 rounded-full bg-sky-400 px-6 py-2.5 text-xs font-bold uppercase tracking-wider text-black shadow-lg shadow-sky-400/20 transition-all hover:bg-sky-300 active:scale-95"
                >
                  {isPlayingAudio ? (
                    <>
                      <Pause className="h-4 w-4 fill-current" />
                      <span>Pause Synthesis</span>
                    </>
                  ) : (
                    <>
                      <Play className="ml-0.5 h-4 w-4 fill-current" />
                      <span>Synthesize Earth Audio</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={verifyHealth}
                  className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-black/40 px-4 py-2.5 text-xs font-semibold uppercase text-slate-200 transition-all hover:border-emerald-400/60 hover:text-emerald-300"
                >
                  {healthStatus === 'healthy' ? (
                    <>
                      <ShieldCheck className="h-4 w-4 text-emerald-400" />
                      <span className="font-mono text-emerald-300">Telemetry OK</span>
                    </>
                  ) : (
                    <>
                      <Activity className="h-4 w-4 text-sky-400" />
                      <span>{healthStatus === 'checking' ? 'Checking...' : 'Ping Telemetry'}</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Call To Action & Exploration Footer */}
        <div className="mt-16 text-center">
          <div className="inline-flex flex-wrap items-center justify-center gap-4">
            <a
              href="/api/health"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/5 px-5 py-2.5 text-xs font-medium text-slate-300 backdrop-blur-md transition-colors hover:border-sky-400/50 hover:text-white"
            >
              <span>Inspect API Contract & Health Status</span>
              <ExternalLink className="h-3.5 w-3.5 text-sky-400" />
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
