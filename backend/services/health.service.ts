import { hasDatabaseCredentials, hasSupabaseCredentials } from '../config/env';
import type { HealthStatus } from '@nasa-experience/contracts';

/**
 * Backend Health Domain Service
 *
 * Implements business logic for system diagnostics and Supabase service availability.
 * Isolated from presentation layers, React components, and Next.js runtimes.
 */
export class HealthService {
  /**
   * Evaluates the health status of all infrastructure and application services.
   */
  public async getHealthStatus(): Promise<HealthStatus> {
    const supabaseConfigured = hasSupabaseCredentials();
    const databaseConfigured = hasDatabaseCredentials();

    let overallStatus: HealthStatus['status'] = 'healthy';
    if (!supabaseConfigured && !databaseConfigured) {
      overallStatus = 'unhealthy';
    } else if (!supabaseConfigured || !databaseConfigured) {
      overallStatus = 'degraded';
    }

    return {
      status: overallStatus,
      phase: '02-application-shell (Backend Supabase Architecture)',
      services: {
        supabaseAuth: supabaseConfigured ? 'configured' : 'pending_configuration',
        database: databaseConfigured ? 'configured' : 'pending_configuration',
      },
    };
  }
}

export const healthService = new HealthService();
