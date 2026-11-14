import { z } from 'zod';
import { createApiSuccessSchema } from './common';

/**
 * Service status enumeration.
 */
export const ServiceStatusEnum = z.enum([
  'configured',
  'pending_configuration',
  'unavailable',
  'mocked',
]);
export type ServiceStatus = z.infer<typeof ServiceStatusEnum>;

/**
 * Core health check payload schema.
 */
export const HealthStatusSchema = z.object({
  status: z.enum(['healthy', 'degraded', 'unhealthy']),
  phase: z.string().min(1),
  services: z.object({
    supabaseAuth: ServiceStatusEnum,
    database: ServiceStatusEnum,
  }),
});

export type HealthStatus = z.infer<typeof HealthStatusSchema>;

/**
 * Full contract response schema for /api/health endpoint.
 */
export const HealthResponseSchema = createApiSuccessSchema(HealthStatusSchema);
export type HealthResponse = z.infer<typeof HealthResponseSchema>;
