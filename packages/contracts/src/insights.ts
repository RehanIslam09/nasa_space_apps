import { z } from 'zod';
import { createApiSuccessSchema } from './common';

/**
 * Statistical summary and telemetry insights for a NASA dataset.
 */
export const InsightsResponseSchema = z.object({
  dataset_id: z.string().min(1),
  title: z.string().min(1),
  mean_intensity: z.number(),
  max_intensity: z.number(),
  min_intensity: z.number(),
  dominant_layer: z.string(),
  spatial_distribution_entropy: z.number(),
  regional_breakdown: z.array(z.record(z.unknown())).default([]),
  scientific_interpretation: z.string(),
});
export type InsightsResponse = z.infer<typeof InsightsResponseSchema>;

export const InsightsResultEnvelopeSchema = createApiSuccessSchema(InsightsResponseSchema);
export type InsightsResultEnvelope = z.infer<typeof InsightsResultEnvelopeSchema>;

/**
 * Screen-reader legends, audio guides, and tactile equivalents.
 */
export const AccessibilityResponseSchema = z.object({
  dataset_id: z.string().min(1),
  title: z.string().min(1),
  plain_language_summary: z.string(),
  screen_reader_legend: z.array(z.record(z.string())).default([]),
  audio_guide: z.string(),
  tactile_equivalent_guidance: z.string(),
});
export type AccessibilityResponse = z.infer<typeof AccessibilityResponseSchema>;

export const AccessibilityResultEnvelopeSchema = createApiSuccessSchema(AccessibilityResponseSchema);
export type AccessibilityResultEnvelope = z.infer<typeof AccessibilityResultEnvelopeSchema>;
