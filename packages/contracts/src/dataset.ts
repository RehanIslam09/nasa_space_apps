import { z } from 'zod';
import { createApiSuccessSchema } from './common';

/**
 * Scientific variable associated with a NASA dataset.
 */
export const ScientificVariableSchema = z.object({
  name: z.string().min(1),
  unit: z.string(),
  description: z.string(),
  typical_range: z.array(z.number()).default([0.0, 1.0]),
  is_visual_derived: z.boolean().default(false),
});
export type ScientificVariable = z.infer<typeof ScientificVariableSchema>;

/**
 * Acoustic mapping rule connecting a scientific variable to a sound synthesis parameter.
 */
export const SonificationLayerRuleSchema = z.object({
  layer_name: z.string().min(1),
  variable_mapped: z.string().min(1),
  audio_parameter: z.string().min(1),
  mapping_range: z.string().min(1),
  synthesis_mode: z.string().min(1),
  scientific_rationale: z.string().min(1),
});
export type SonificationLayerRule = z.infer<typeof SonificationLayerRuleSchema>;

/**
 * Complete catalog metadata for a NASA Earth observation dataset.
 */
export const DatasetMetadataSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  description: z.string(),
  category: z.string(),
  nasa_url: z.string().url(),
  svs_id: z.number().nullable().optional(),
  scientific_variables: z.array(ScientificVariableSchema).default([]),
  spatial_coverage: z.string(),
  temporal_coverage: z.string(),
  data_provenance: z.string(),
  sonification_rules: z.array(SonificationLayerRuleSchema).default([]),
  available_media: z.array(z.string()).default([]),
  sample_asset_url: z.string().nullable().optional(),
  color_scale_url: z.string().nullable().optional(),
  processing_status: z.string().default('available'),
});
export type DatasetMetadata = z.infer<typeof DatasetMetadataSchema>;

/**
 * Standard API Response envelope schemas for datasets.
 */
export const DatasetListResponseSchema = createApiSuccessSchema(z.array(DatasetMetadataSchema));
export type DatasetListResponse = z.infer<typeof DatasetListResponseSchema>;

export const DatasetDetailResponseSchema = createApiSuccessSchema(DatasetMetadataSchema);
export type DatasetDetailResponse = z.infer<typeof DatasetDetailResponseSchema>;

/**
 * Ingestion request and response contracts supporting force_refresh.
 */
export const IngestRequestSchema = z.object({
  dataset_id: z.string().min(1),
  force_refresh: z.boolean().default(false),
  sample_rate_frames: z.number().optional().default(1),
});
export type IngestRequest = z.infer<typeof IngestRequestSchema>;

export const IngestResponseSchema = z.object({
  job_id: z.string().min(1),
  dataset_id: z.string().min(1),
  status: z.string(),
  message: z.string(),
});
export type IngestResponse = z.infer<typeof IngestResponseSchema>;
