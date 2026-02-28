import { Router, Request, Response, NextFunction } from 'express';
import { HealthService } from './health.service';

const router = Router();

// ─── Monitoring & Health Check Routes ─────────────────────────────────

/**
 * GET /api/v2/health
 * Comprehensive health check endpoint.
 */
router.get(
  '/',
  async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const health = await HealthService.check();
      const statusCode = health.status === 'healthy' ? 200 : health.status === 'degraded' ? 200 : 503;
      res.status(statusCode).json(health);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/v2/health/ready
 * Readiness probe - checks if the service is ready to accept traffic.
 */
router.get(
  '/ready',
  async (_req: Request, res: Response) => {
    try {
      const health = await HealthService.check();
      if (health.status === 'unhealthy') {
        res.status(503).json({ ready: false });
      } else {
        res.json({ ready: true });
      }
    } catch {
      res.status(503).json({ ready: false });
    }
  }
);

/**
 * GET /api/v2/health/live
 * Liveness probe - checks if the service process is alive.
 */
router.get(
  '/live',
  (_req: Request, res: Response) => {
    res.json({ alive: true, timestamp: new Date().toISOString() });
  }
);

export default router;
