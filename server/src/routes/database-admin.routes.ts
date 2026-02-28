import { Router, Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../types';
import { authenticateTeacher } from '../middleware/auth';
import {
  getMigrations,
  runHealthCheck,
  getHealthCheckHistory,
  getBackupRecords,
  getDatabaseSummary,
} from '../services/database-admin.service';

const router = Router();

/**
 * GET /api/database/summary
 * Get database administration overview.
 */
router.get('/summary', authenticateTeacher, async (_req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const summary = await getDatabaseSummary();
    res.json(summary);
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/database/health-check
 * Run a database health check.
 */
router.post('/health-check', authenticateTeacher, async (_req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const result = await runHealthCheck();
    res.json(result);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/database/health-check/history
 * Get health check history.
 * Query: component, limit
 */
router.get('/health-check/history', authenticateTeacher, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const component = (req.query.component as string) || 'primary_db';
    const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;
    const history = await getHealthCheckHistory(component, limit);
    res.json(history);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/database/migrations
 * Get database migrations.
 * Query: status
 */
router.get('/migrations', authenticateTeacher, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const migrations = await getMigrations({
      status: req.query.status as string | undefined,
    });
    res.json(migrations);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/database/backups
 * Get backup records.
 * Query: type, status, limit
 */
router.get('/backups', authenticateTeacher, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const backups = await getBackupRecords({
      type: req.query.type as string | undefined,
      status: req.query.status as string | undefined,
      limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
    });
    res.json(backups);
  } catch (error) {
    next(error);
  }
});

export default router;
