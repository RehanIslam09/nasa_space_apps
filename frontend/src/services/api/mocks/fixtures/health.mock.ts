import type { HealthStatus } from '@nasa-experience/contracts';

/**
 * Standard contract-compliant mock fixture for system health.
 */
export const mockHealthStatus: HealthStatus = {
  status: 'healthy',
  phase: '02-application-shell (Mock Mode)',
  services: {
    supabaseAuth: 'mocked',
    database: 'mocked',
  },
};
