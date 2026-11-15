export interface GalleryMediaClip {
  src: string; // '/videos/hurricane_video.mp4' etc.
  start: number; // seconds
  end: number; // seconds
  poster: string; // path to poster image
  objectPosition?: string; // CSS object-position for framing
  scale?: number; // micro-zoom (1.05 - 1.2) to crop out black bars or letterboxing
  tint?: string; // subtle brand tint overlay
}

export const SONIC_GALLERY_MEDIA: Record<string, GalleryMediaClip> = {
  'geos-aerosols': {
    src: '/videos/hurricane_video.mp4',
    start: 0.5,
    end: 7.5,
    poster: '/videos/posters/geos-aerosols.jpg',
    objectPosition: 'center center',
    scale: 1.05,
    tint: 'rgba(56, 189, 248, 0.15)',
  },
  'ocean-currents-temp': {
    src: '/videos/deep_ocean_video.mp4',
    start: 1.0,
    end: 8.0,
    poster: '/videos/posters/ocean-currents-temp.jpg',
    objectPosition: 'center 40%',
    scale: 1.1,
    tint: 'rgba(45, 212, 191, 0.15)',
  },
  'night-lights': {
    src: '/videos/cool_video_happy.mp4',
    start: 5.0,
    end: 9.5,
    poster: '/videos/posters/night-lights.jpg',
    objectPosition: 'center center',
    scale: 1.15,
    tint: 'rgba(251, 191, 36, 0.15)',
  },
  'air-quality': {
    src: '/videos/hurricane_video.mp4',
    start: 17.5,
    end: 24.5,
    poster: '/videos/posters/air-quality.jpg',
    objectPosition: 'center 30%',
    scale: 1.1,
    tint: 'rgba(167, 139, 250, 0.15)',
  },
  'perpetual-ocean': {
    src: '/videos/deep_ocean_video.mp4',
    start: 16.5,
    end: 22.5,
    poster: '/videos/posters/perpetual-ocean.jpg',
    objectPosition: 'center center',
    scale: 1.15,
    tint: 'rgba(52, 211, 153, 0.15)',
  },
  'dyamond-co2': {
    src: '/videos/polar_video.mp4',
    start: 6.5,
    end: 11.5,
    poster: '/videos/posters/dyamond-co2.jpg',
    objectPosition: 'center 45%',
    scale: 1.08,
    tint: 'rgba(245, 158, 11, 0.15)',
  },
  'lightning-iss': {
    src: '/videos/hurricane_video.mp4',
    start: 24.5,
    end: 29.0,
    poster: '/videos/posters/lightning-iss.jpg',
    objectPosition: 'center center',
    scale: 1.2,
    tint: 'rgba(139, 92, 246, 0.18)',
  },
  'atmospheric-river': {
    src: '/videos/deep_ocean_video.mp4',
    start: 22.5,
    end: 27.0,
    poster: '/videos/posters/atmospheric-river.jpg',
    objectPosition: 'center 60%',
    scale: 1.12,
    tint: 'rgba(56, 189, 248, 0.15)',
  },
  'gedi-forest': {
    src: '/videos/cool_video_happy.mp4',
    start: 0.5,
    end: 4.5,
    poster: '/videos/posters/gedi-forest.jpg',
    objectPosition: 'center 65%',
    scale: 1.06,
    tint: 'rgba(16, 185, 129, 0.15)',
  },
  'caldwell-73': {
    src: '/videos/cool_video_happy.mp4',
    start: 10.0,
    end: 16.5,
    poster: '/videos/posters/caldwell-73.jpg',
    objectPosition: 'center 40%',
    scale: 1.08,
    tint: 'rgba(167, 139, 250, 0.15)',
  },
  'earth-info-center': {
    src: '/videos/polar_video.mp4',
    start: 1.0,
    end: 6.0,
    poster: '/videos/posters/earth-info-center.jpg',
    objectPosition: 'center center',
    scale: 1.05,
    tint: 'rgba(56, 189, 248, 0.15)',
  },
};

const DEFAULT_MEDIA_CLIP: GalleryMediaClip = {
  src: '/videos/hurricane_video.mp4',
  start: 0.5,
  end: 7.5,
  poster: '/videos/posters/geos-aerosols.jpg',
  objectPosition: 'center center',
  scale: 1.05,
  tint: 'rgba(56, 189, 248, 0.15)',
};

/**
 * Returns the cinematic media clip configuration for a given dataset ID.
 */
export function getGalleryMedia(trackId: string): GalleryMediaClip {
  return SONIC_GALLERY_MEDIA[trackId] || DEFAULT_MEDIA_CLIP;
}
