import { prisma } from '../../utils/prisma';
import { cacheService } from '../cache/cache.service';

// ─── Health Check Types ───────────────────────────────────────────────

export interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  uptime: number;
  version: string;
  checks: ComponentHealth[];
}

export interface ComponentHealth {
  component: string;
  status: 'healthy' | 'degraded' | 'unhealthy';
  responseTime?: number;
  details?: Record<string, unknown>;
}

// ─── Health Service ───────────────────────────────────────────────────

const startTime = Date.now();

export class HealthService {
  /**
   * Perform comprehensive health checks across all system components.
   */
  static async check(): Promise<HealthStatus> {
    const checks = await Promise.all([
      HealthService.checkDatabase(),
      HealthService.checkCache(),
      HealthService.checkMemory(),
    ]);

    const overallStatus = checks.some((c) => c.status === 'unhealthy')
      ? 'unhealthy'
      : checks.some((c) => c.status === 'degraded')
        ? 'degraded'
        : 'healthy';

    return {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      uptime: Math.floor((Date.now() - startTime) / 1000),
      version: process.env.npm_package_version || '1.0.0',
      checks,
    };
  }

  /**
   * Check database connectivity and response time.
   */
  private static async checkDatabase(): Promise<ComponentHealth> {
    const start = Date.now();
    try {
      await prisma.$queryRaw`SELECT 1`;
      return {
        component: 'database',
        status: 'healthy',
        responseTime: Date.now() - start,
      };
    } catch (error) {
      return {
        component: 'database',
        status: 'unhealthy',
        responseTime: Date.now() - start,
        details: { error: error instanceof Error ? error.message : 'Unknown error' },
      };
    }
  }

  /**
   * Check cache service status.
   */
  private static async checkCache(): Promise<ComponentHealth> {
    try {
      const stats = cacheService.stats();
      return {
        component: 'cache',
        status: 'healthy',
        details: { entries: stats.size },
      };
    } catch {
      return {
        component: 'cache',
        status: 'degraded',
        details: { error: 'Cache unavailable' },
      };
    }
  }

  /**
   * Check memory usage.
   */
  private static async checkMemory(): Promise<ComponentHealth> {
    const usage = process.memoryUsage();
    const heapUsedMB = Math.round(usage.heapUsed / 1024 / 1024);
    const heapTotalMB = Math.round(usage.heapTotal / 1024 / 1024);
    const usagePercent = Math.round((usage.heapUsed / usage.heapTotal) * 100);

    return {
      component: 'memory',
      status: usagePercent > 90 ? 'unhealthy' : usagePercent > 75 ? 'degraded' : 'healthy',
      details: {
        heapUsedMB,
        heapTotalMB,
        usagePercent,
        rssMB: Math.round(usage.rss / 1024 / 1024),
      },
    };
  }
}
