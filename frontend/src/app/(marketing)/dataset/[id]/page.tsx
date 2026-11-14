import { notFound } from 'next/navigation';
import { datasetsService } from '@/services/api';
import { earthSongConfig, type SonicTrackConfig } from '@/config/earth-song.config';
import { mockDatasets } from '@/services/api/mocks/fixtures/datasets.mock';
import { DatasetSonificationView } from '@/components/cinematic/dataset-sonification-view';
import type { Metadata } from 'next';

export const dynamic = 'force-dynamic';

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata(props: PageProps): Promise<Metadata> {
  const { id } = await props.params;
  const res = await datasetsService.getDataset(id);
  const title = res.success && res.data?.title ? res.data.title : id.replace(/-/g, ' ').toUpperCase();
  const description = res.success && res.data?.description ? res.data.description : `NASA Earth science sonification experience for ${title}.`;
  return {
    title: `${title} — NASA Data Sonification | PRANA`,
    description,
  };
}

export default async function DatasetPage(props: PageProps) {
  const { id } = await props.params;

  // 1. Fetch live or fallback catalog
  const catalogRes = await datasetsService.getDatasets();
  const allDatasets = catalogRes.success && catalogRes.data && catalogRes.data.length > 0 ? catalogRes.data : mockDatasets;

  // Find index and matching dataset
  const datasetIndex = allDatasets.findIndex((d) => d.id === id);
  const dataset = datasetIndex !== -1 ? allDatasets[datasetIndex] : null;

  // If not found by ID directly, check if it matches fallback sonicTracks (e.g. track-1)
  let track: SonicTrackConfig | null = null;
  if (dataset) {
    track = datasetsService.adaptDatasetToTrack(dataset, datasetIndex);
  } else {
    const fallbackTrack = earthSongConfig.sonicTracks.find((t) => t.id === id);
    if (fallbackTrack) {
      track = fallbackTrack;
    }
  }

  if (!track) {
    notFound();
  }

  // Calculate adjacent tracks for previous / next navigation
  let prevTrack: SonicTrackConfig | null = null;
  let nextTrack: SonicTrackConfig | null = null;

  if (datasetIndex > 0) {
    prevTrack = datasetsService.adaptDatasetToTrack(allDatasets[datasetIndex - 1]!, datasetIndex - 1);
  }
  if (datasetIndex !== -1 && datasetIndex < allDatasets.length - 1) {
    nextTrack = datasetsService.adaptDatasetToTrack(allDatasets[datasetIndex + 1]!, datasetIndex + 1);
  }

  return (
    <DatasetSonificationView
      track={track}
      datasetMeta={dataset}
      prevTrack={prevTrack}
      nextTrack={nextTrack}
    />
  );
}
