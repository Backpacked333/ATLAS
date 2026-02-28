import { Router, Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../types';
import { authenticateTeacher } from '../middleware/auth';
import {
  getCacheSummary,
  getCacheEntries,
  invalidateCache,
  getPerformanceSummary,
  getPerformanceMetrics,
  runBenchmark,
  getBenchmarkHistory,
} from '../services/performance.service';

const router = Router();

/**
 * GET /api/performance/summary
 * Get overall performance summary.
 */
router.get('/summary', authenticateTeacher, async (_req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const summary = await getPerformanceSummary();
    res.json(summary);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/performance/cache
 * Get cache summary.
 */
router.get('/cache', authenticateTeacher, async (_req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const summary = await getCacheSummary();
    res.json(summary);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/performance/cache/entries
 * Get cache entries by region.
 * Query: region
 */
router.get('/cache/entries', authenticateTeacher, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const entries = await getCacheEntries(req.query.region as string | undefined);
    res.json(entries);
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/performance/cache/invalidate
 * Invalidate cache entries.
 * Body: { region? }
 */
router.post('/cache/invalidate', authenticateTeacher, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const result = await invalidateCache(req.body.region);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/performance/metrics
 * Get performance metrics.
 * Query: endpoint, limit
 */
router.get('/metrics', authenticateTeacher, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const metrics = await getPerformanceMetrics({
      endpoint: req.query.endpoint as string | undefined,
      limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
    });
    res.json(metrics);
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/performance/benchmark
 * Run a benchmark.
 * Body: { name, category, targetMs }
 */
router.post('/benchmark', authenticateTeacher, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const result = await runBenchmark(req.body);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/performance/benchmarks
 * Get benchmark history.
 * Query: category, limit
 */
router.get('/benchmarks', authenticateTeacher, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const history = await getBenchmarkHistory(
      req.query.category as string | undefined,
      req.query.limit ? parseInt(req.query.limit as string) : undefined,
    );
    res.json(history);
  } catch (error) {
    next(error);
  }
});

export default router;
