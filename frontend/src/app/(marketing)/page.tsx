import { CinematicHero } from '@/components/cinematic/cinematic-hero';
import { StorySection } from '@/components/cinematic/story-section';
import { JukeboxExperience } from '@/components/cinematic/jukebox-experience';
import { ScrollProgress } from '@/components/cinematic/scroll-progress';

export const metadata = {
  title: 'Earth Song — The Living Breath of Earth',
  description:
    'Listen to the living Earth. Explore NASA Earth science visualizations transformed into immersive soundscapes through PRANA.',
};

export default function HomePage() {
  return (
    <div className="relative flex w-full flex-col overflow-hidden bg-black text-white">
      {/* 1. Global 1px Right Edge Scroll Progress */}
      <ScrollProgress />

      {/* 2. Flagship Cinematic Hero Viewport */}
      <CinematicHero />

      {/* 3. Earth Story & Crisis Telemetry Narrative */}
      <StorySection />

      {/* 4. Interactive Earth Jukebox & Sonification Console */}
      <JukeboxExperience />
    </div>
  );
}
