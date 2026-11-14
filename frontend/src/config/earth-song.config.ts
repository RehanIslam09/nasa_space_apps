/**
 * Earth Song — Centralized Media, Copy, and Animation Configuration
 * All media paths, display text, and animation constants are declared here.
 */

export const earthSongConfig = {
  media: {
    heroVideo: '/videos/earth-narrative.mp4',
    spaceTexture: '/videos/earth-narrative.mp4',
    cryosphereVideo: '/videos/earth-narrative.mp4',
    atmosphereVideo: '/videos/earth-narrative.mp4',
    oceanVideo: '/videos/earth-narrative.mp4',
    solarVideo: '/videos/earth-narrative.mp4',
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
  },

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
  },
} as const;

export type EarthSongConfig = typeof earthSongConfig;
