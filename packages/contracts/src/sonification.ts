import { z } from 'zod';
import { createApiSuccessSchema } from './common';

/**
 * Custom layer adjustment for acoustic constituents.
 */
export const LayerCustomizationSchema = z.object({
  name: z.string().min(1),
  enabled: z.boolean().default(true),
  volume: z.number().min(0.0).max(1.0).default(0.8),
  pan: z.number().min(-1.0).max(1.0).default(0.0),
  base_freq: z.number().nullable().optional(),
  synthesis_type: z.string().nullable().optional(),
});
export type LayerCustomization = z.infer<typeof LayerCustomizationSchema>;

/**
 * Request payload to synthesize a custom soundscape.
 */
export const GenerateSonificationRequestSchema = z.object({
  dataset_id: z.string().min(1),
  duration_seconds: z.number().min(2.0).max(60.0).optional().default(10.0),
  sample_rate: z.number().optional().default(44100),
  preset: z.string().optional().default('balanced'),
  layers: z.array(LayerCustomizationSchema).nullable().optional(),
  loop_seamless: z.boolean().optional().default(true),
});
export type GenerateSonificationRequest = z.input<typeof GenerateSonificationRequestSchema>;

/**
 * Response payload containing synthesized audio details.
 */
export const GenerateSonificationResponseSchema = z.object({
  audio_id: z.string().min(1),
  dataset_id: z.string().min(1),
  title: z.string().min(1),
  duration: z.number(),
  sample_rate: z.number(),
  audio_url: z.string(),
  download_url: z.string(),
  layers_active: z.array(z.string()).default([]),
  accessibility_narrative: z.string(),
  musical_key: z.string(),
});
export type GenerateSonificationResponse = z.infer<typeof GenerateSonificationResponseSchema>;

export const SonificationResultEnvelopeSchema = createApiSuccessSchema(GenerateSonificationResponseSchema);
export type SonificationResultEnvelope = z.infer<typeof SonificationResultEnvelopeSchema>;

/**
 * Request payload for Then vs Now temporal soundscape comparison.
 */
export const CompareRequestSchema = z.object({
  dataset_id: z.string().min(1),
  period_a: z.string().min(1),
  period_b: z.string().min(1),
  duration_seconds: z.number().min(4.0).max(60.0).optional().default(12.0),
});
export type CompareRequest = z.input<typeof CompareRequestSchema>;

/**
 * Response payload for dual-phase comparative soundscape.
 */
export const CompareResponseSchema = z.object({
  comparison_id: z.string().min(1),
  dataset_id: z.string().min(1),
  period_a: z.string().min(1),
  period_b: z.string().min(1),
  audio_a_url: z.string(),
  audio_b_url: z.string(),
  audio_diff_url: z.string(),
  metrics: z.record(z.unknown()).default({}),
  insights: z.array(z.string()).default([]),
  accessibility_summary: z.string(),
  // Milestone 2 Additive Provenance and Visualization Fields
  observation_date_a: z.string().optional(),
  observation_date_b: z.string().optional(),
  source_asset_a_url: z.string().optional(),
  source_asset_b_url: z.string().optional(),
  image_a_url: z.string().optional(),
  image_b_url: z.string().optional(),
  source_asset_a_checksum: z.string().optional(),
  source_asset_b_checksum: z.string().optional(),
  audio_diff_checksum: z.string().optional(),
  comparison_method: z.string().optional(),
  retrieved_at: z.string().optional(),
  feature_version: z.string().optional(),
});
export type CompareResponse = z.infer<typeof CompareResponseSchema>;

export const CompareResultEnvelopeSchema = createApiSuccessSchema(CompareResponseSchema);
export type CompareResultEnvelope = z.infer<typeof CompareResultEnvelopeSchema>;
