import { Router, Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../types';
import { authenticateTeacher } from '../middleware/auth';
import {
  getScheduledBackups,
  getScheduledBackupById,
  createScheduledBackup,
  updateScheduledBackup,
  getRecoveryPoints,
  createRecoveryPoint,
  completeRecoveryPoint,
  getRetentionPolicies,
  createRetentionPolicy,
  enforceRetention,
  getBackupRecoverySummary,
} from '../services/backup-recovery.service';

const router = Router();

/**
 * GET /api/backup-recovery/summary
 * Get backup recovery overview.
 */
router.get('/summary', authenticateTeacher, async (_req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const summary = await getBackupRecoverySummary();
    res.json(summary);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/backup-recovery/scheduled
 * List scheduled backups.
 * Query: isActive
 */
router.get('/scheduled', authenticateTeacher, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const backups = await getScheduledBackups(
      req.query.isActive ? req.query.isActive === 'true' : undefined,
    );
    res.json(backups);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/backup-recovery/scheduled/:backupId
 * Get scheduled backup details.
 */
router.get('/scheduled/:backupId', authenticateTeacher, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const backup = await getScheduledBackupById(req.params.backupId);
    res.json(backup);
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/backup-recovery/scheduled
 * Create a scheduled backup.
 */
router.post('/scheduled', authenticateTeacher, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const backup = await createScheduledBackup(req.body);
    res.status(201).json(backup);
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/backup-recovery/scheduled/:backupId
 * Update a scheduled backup.
 */
router.put('/scheduled/:backupId', authenticateTeacher, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const backup = await updateScheduledBackup(req.params.backupId, req.body);
    res.json(backup);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/backup-recovery/recovery-points
 * List recovery points.
 * Query: scheduledBackupId, type, status, limit
 */
router.get('/recovery-points', authenticateTeacher, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const points = await getRecoveryPoints({
      scheduledBackupId: req.query.scheduledBackupId as string | undefined,
      type: req.query.type as string | undefined,
      status: req.query.status as string | undefined,
      limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
    });
    res.json(points);
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/backup-recovery/recovery-points
 * Create a recovery point.
 */
router.post('/recovery-points', authenticateTeacher, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const point = await createRecoveryPoint(req.body);
    res.status(201).json(point);
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/backup-recovery/recovery-points/:pointId/complete
 * Complete a recovery point.
 */
router.put('/recovery-points/:pointId/complete', authenticateTeacher, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const point = await completeRecoveryPoint(req.params.pointId, req.body);
    res.json(point);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/backup-recovery/retention-policies
 * List retention policies.
 */
router.get('/retention-policies', authenticateTeacher, async (_req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const policies = await getRetentionPolicies();
    res.json(policies);
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/backup-recovery/retention-policies
 * Create a retention policy.
 */
router.post('/retention-policies', authenticateTeacher, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const policy = await createRetentionPolicy(req.body);
    res.status(201).json(policy);
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/backup-recovery/enforce-retention
 * Enforce retention policies.
 */
router.post('/enforce-retention', authenticateTeacher, async (_req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const result = await enforceRetention();
    res.json(result);
  } catch (error) {
    next(error);
  }
});

export default router;
