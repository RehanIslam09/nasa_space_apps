/**
 * Earth Song — Centralized Media, Copy, Telemetry Datasets, and Animation Configuration
 * All media paths, display text, NASA observational datasets, and animation constants are declared here.
 */

export interface TelemetryPoint {
  year: string;
  value: number;
}

export interface TelemetryPanelConfig {
  id: string;
  topic: string;
  numericTarget: number;
  decimals?: number;
  prefix: string;
  suffix: string;
  unitDecade: string;
  label: string;
  caption: string;
  sensor: string;
  frequency: string;
  sonicStatus: string;
  color: {
    accent: string;
    glow: string;
    nebula: string;
  };
  chart: TelemetryPoint[];
  waveform: {
    frequency: number;
    amplitude: number;
    jaggedness: number;
  };
}

export interface SonicTrackConfig {
  id: string;
  title: string;
  category: string;
  frequency: string;
  description: string;
  videoSrc: string;
  imageSrc?: string;
  nasaUrl?: string;
  svsId?: number | null;
  color: {
    accent: string;
    glow: string;
    nebula: string;
  };
  audioSrc?: string;
  sonificationRules?: unknown[];
  scientificVariables?: unknown[];
}

export const earthSongConfig = {
  media: {
    heroVideo: '/videos/earth-narrative.mp4',
    spaceTexture: '/videos/Recording%202026-11-14%20165733.mp4',
    storyVideo: '/videos/Recording%202026-11-14%20165733.mp4',
    cryosphereVideo: '/videos/polar_video.mp4',
    atmosphereVideo: '/videos/hurricane_video.mp4',
    oceanVideo: '/videos/deep_ocean_video.mp4',
    solarVideo: '/videos/solar_flares.mp4',
    ambientAudio: '/audio/loop.mp3',
  },

  copy: {
    brand: 'EARTH SONG',
    tagline: 'The Living Breath of Earth',
    heroWord: 'EARTH',
    alternateWord: 'PRANA',
    bottomWord: 'SONG',
    pranaCaption: 'Prana — the breath of life.',

    chapter01: {
      line1: 'Four billion years.',
      line2: 'One unbroken rhythm.',
      paragraph:
        'Every tide keeps time. Every wind carries a melody. Even the ice sings as it breaks. Earth has never been silent. We just forgot how to listen.',
      highlightWords: ['rhythm.', 'listen.'],
    },

    balanceDisrupted: {
      label: 'PLANETARY VULNERABILITY',
      titleLine1: 'A BALANCE',
      titleLine2: 'DISRUPTED',
      description:
        "Rising temperatures, rapid cryosphere melt, and intensified atmospheric shifts are transforming the planet's natural cadence into an urgent cry.",
    },

    shiftingHarmony: {
      titleWord1: 'THE',
      titleWord2: 'SHIFTING',
      titleWord3: 'HARMONY',
      subtitle:
        "NASA satellite observations document undeniable alterations in Earth's biological and meteorological rhythms.",
    },

    sonicHeadline: {
      line1: "Let's hear her story.",
      line2Prefix: "The planet's ",
      line2Highlight: 'living song.',
      subtitle:
        'Earth is not silent. Every environmental metric generates vibrations. Through NASA observation telemetry and data sonification, we translate planetary frequencies into an immersive sonic odyssey.',
    },
  },

  telemetryPanels: [
    {
      id: 'cryosphere',
      topic: 'Cryosphere Dissolution',
      numericTarget: -12.6,
      decimals: 1,
      prefix: '',
      suffix: '%',
      unitDecade: 'per decade',
      label: 'Arctic Sea Ice Retreat',
      caption:
        'Passive microwave satellite telemetry documents 44 years of continuous polar sea ice extent loss.',
      sensor: 'NASA AMSR2 & Nimbus SMMR',
      frequency: '432 Hz',
      sonicStatus: 'Harmonic Detuning',
      color: {
        accent: '#38bdf8', // sky-400
        glow: 'rgba(56, 189, 248, 0.4)',
        nebula: 'rgba(14, 165, 233, 0.16)',
      },
      chart: [
        { year: '1980', value: 7.8 },
        { year: '1990', value: 7.2 },
        { year: '2000', value: 6.5 },
        { year: '2010', value: 5.1 },
        { year: '2020', value: 4.3 },
        { year: '2024', value: 3.8 },
      ],
      waveform: {
        frequency: 2.2,
        amplitude: 16,
        jaggedness: 0.18,
      },
    },
    {
      id: 'atmosphere',
      topic: 'Thermal Biomass Stress',
      numericTarget: 423,
      decimals: 0,
      prefix: '+',
      suffix: ' ppm',
      unitDecade: 'carbon concentration',
      label: 'Atmospheric CO2 Forcing',
      caption:
        'Carbon concentration index exceeds any historical baseline recorded across 3 million years.',
      sensor: 'NASA OCO-2 & AIRS',
      frequency: '528 Hz',
      sonicStatus: 'High-Frequency Tension',
      color: {
        accent: '#fbbf24', // amber-400
        glow: 'rgba(251, 191, 36, 0.4)',
        nebula: 'rgba(245, 158, 11, 0.16)',
      },
      chart: [
        { year: '1960', value: 316 },
        { year: '1980', value: 338 },
        { year: '2000', value: 369 },
        { year: '2010', value: 389 },
        { year: '2020', value: 414 },
        { year: '2024', value: 423 },
      ],
      waveform: {
        frequency: 4.5,
        amplitude: 24,
        jaggedness: 0.55,
      },
    },
    {
      id: 'ocean',
      topic: 'Ocean Heat Reservoir',
      numericTarget: 384,
      decimals: 0,
      prefix: '+',
      suffix: ' ZJ',
      unitDecade: 'excess enthalpy',
      label: 'Oceanic Thermal Content',
      caption:
        'Upper ocean layers absorb over 90% of planetary excess heat, shifting global thermohaline currents.',
      sensor: 'NASA Jason-3 & SWOT',
      frequency: '174 Hz',
      sonicStatus: 'Sub-Bass Resonance Surge',
      color: {
        accent: '#34d399', // emerald-400
        glow: 'rgba(52, 211, 153, 0.4)',
        nebula: 'rgba(16, 185, 129, 0.16)',
      },
      chart: [
        { year: '1960', value: 12 },
        { year: '1980', value: 48 },
        { year: '2000', value: 120 },
        { year: '2010', value: 210 },
        { year: '2020', value: 320 },
        { year: '2024', value: 384 },
      ],
      waveform: {
        frequency: 1.4,
        amplitude: 28,
        jaggedness: 0.32,
      },
    },
    {
      id: 'radiation',
      topic: 'Planetary Energy Balance',
      numericTarget: 1.85,
      decimals: 2,
      prefix: '+',
      suffix: ' W/m²',
      unitDecade: 'net radiative flux',
      label: 'Earth Energy Imbalance',
      caption:
        'Earth currently absorbs nearly twice as much solar energy as it radiates back to deep space.',
      sensor: 'NASA CERES Instrument',
      frequency: '639 Hz',
      sonicStatus: 'Planetary Dysrhythmia',
      color: {
        accent: '#f87171', // red-400
        glow: 'rgba(248, 113, 113, 0.45)',
        nebula: 'rgba(239, 68, 68, 0.22)',
      },
      chart: [
        { year: '2005', value: 0.58 },
        { year: '2010', value: 0.82 },
        { year: '2015', value: 1.15 },
        { year: '2019', value: 1.45 },
        { year: '2022', value: 1.68 },
        { year: '2024', value: 1.85 },
      ],
      waveform: {
        frequency: 6.2,
        amplitude: 26,
        jaggedness: 0.88,
      },
    },
  ] as TelemetryPanelConfig[],

  sonicTracks: [
    {
      id: 'track-1',
      title: 'POLAR RESONANCE',
      category: 'Cryosphere Telemetry',
      frequency: '432 Hz',
      description:
        'Acoustic recordings of Arctic shelf fractures harmonized with ice-sheet elevation loss data.',
      videoSrc: '/videos/polar_video.mp4',
      color: {
        accent: '#38bdf8', // sky-400
        glow: 'rgba(56, 189, 248, 0.4)',
        nebula: 'rgba(14, 165, 233, 0.18)',
      },
    },
    {
      id: 'track-2',
      title: 'ATMOSPHERIC PULSE',
      category: 'Troposphere & Jet Streams',
      frequency: '528 Hz',
      description:
        'Dynamic pressure gradients and hurricane vortex speed sonified into polyphonic ambient textures.',
      videoSrc: '/videos/hurricane_video.mp4',
      color: {
        accent: '#2dd4bf', // teal-400
        glow: 'rgba(45, 212, 191, 0.4)',
        nebula: 'rgba(20, 184, 166, 0.18)',
      },
    },
    {
      id: 'track-3',
      title: 'ABYSSAL HARMONICS',
      category: 'Oceanic Gyres & Hydrophones',
      frequency: '174 Hz',
      description:
        'Deep-ocean thermohaline circulation mapped to sub-bass drones and acoustic wave frequencies.',
      videoSrc: '/videos/deep_ocean_video.mp4',
      color: {
        accent: '#a78bfa', // violet-400
        glow: 'rgba(167, 139, 250, 0.4)',
        nebula: 'rgba(139, 92, 246, 0.18)',
      },
    },
    {
      id: 'track-4',
      title: 'SOLAR FLARE CADENCE',
      category: 'Geomagnetic Shielding',
      frequency: '639 Hz',
      description:
        'Solar wind particulate impacts against Earth’s magnetosphere captured by NASA Van Allen Probes.',
      videoSrc: '/videos/solar_flares.mp4',
      color: {
        accent: '#f59e0b', // amber-500
        glow: 'rgba(245, 158, 11, 0.4)',
        nebula: 'rgba(217, 119, 6, 0.18)',
      },
    },
  ] as SonicTrackConfig[],

  animation: {
    pranaFlip: {
      duration: 0.55,
      stagger: 0.045,
      ease: 'power3.inOut',
    },
    heroTransition: {
      scaleMax: 1.15,
      scrubSpeed: 0.8,
    },
    starfield: {
      nearStarCount: 40,
      midStarCount: 90,
      distantStarCount: 160,
      shootingStarInterval: 6000, // ms
      maxDpr: 2,
    },
    balanceDisrupted: {
      pinDistance: '200vh',
      initialClipInset: '14% 18%',
      kenBurnsScale: 1.14,
    },
    shiftingHarmony: {
      pinDistance: '320vh',
    },
    sonicGallery: {
      pinDistance: '280vh',
    },
  },
} as const;

export type EarthSongConfig = typeof earthSongConfig;
