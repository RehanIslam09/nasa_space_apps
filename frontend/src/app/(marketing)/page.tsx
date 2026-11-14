import { CinematicHero } from '@/components/cinematic/cinematic-hero';
import { StorySection } from '@/components/cinematic/story-section';
import { JukeboxExperience } from '@/components/cinematic/jukebox-experience';
import { FloatingAudioBadge } from '@/components/cinematic/audio-controller';

export const metadata = {
  title: 'Earth Song — NASA Space Apps Cinematic Experience',
  description:
    'The Living Breath of Earth. An immersive, cinematic exploration of Earth through NASA observation telemetry, visual storytelling, and planetary sonification.',
};

export default function HomePage() {
  return (
    <div className="relative flex w-full flex-col overflow-hidden bg-black text-white">
      {/* 1. Flagship Cinematic Hero Viewport */}
      <CinematicHero />

      {/* 2. Earth Story & Crisis Telemetry Narrative */}
      <StorySection />

      {/* 3. Interactive Earth Jukebox & Sonification Console */}
      <JukeboxExperience />

      {/* 4. Global Floating Sound Status Controller */}
      <FloatingAudioBadge />
    </div>
  );
}
