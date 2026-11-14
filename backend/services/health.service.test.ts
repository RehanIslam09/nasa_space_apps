import { describe, it, expect } from 'vitest';
import { HealthService } from './health.service';
import { HealthStatusSchema } from '@nasa-experience/contracts';

describe('Backend HealthService', () => {
  it('computes health status matching HealthStatus contract without Next.js runtime', async () => {
    const service = new HealthService();
    const result = await service.getHealthStatus();

    expect(result).toBeDefined();
    expect(result.status).toMatch(/healthy|degraded|unhealthy/);
    expect(result.phase).toContain('Backend Supabase Architecture');
    expect(result.services.supabaseAuth).toBeDefined();
    expect(result.services.database).toBeDefined();

    const validation = HealthStatusSchema.safeParse(result);
    expect(validation.success).toBe(true);
  });
});
