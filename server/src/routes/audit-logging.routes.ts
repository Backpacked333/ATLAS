import { Router, Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../types';
import { authenticateTeacher } from '../middleware/auth';
import {
  getAuditLogs,
  getAuditLogById,
  getAuditSummary,
} from '../services/audit-logging.service';

const router = Router();

/**
 * GET /api/audit/summary
 * Get audit log summary for the school.
 */
router.get('/summary', authenticateTeacher, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const summary = await getAuditSummary(req.teacher!.schoolId);
    res.json(summary);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/audit/logs
 * Get audit logs with filtering.
 * Query: userId, action, resource, status, startDate, endDate, limit, offset
 */
router.get('/logs', authenticateTeacher, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const result = await getAuditLogs(req.teacher!.schoolId, {
      userId: req.query.userId as string | undefined,
      action: req.query.action as string | undefined,
      resource: req.query.resource as string | undefined,
      status: req.query.status as string | undefined,
      startDate: req.query.startDate as string | undefined,
      endDate: req.query.endDate as string | undefined,
      limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
      offset: req.query.offset ? parseInt(req.query.offset as string) : undefined,
    });
    res.json(result);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/audit/logs/:logId
 * Get a specific audit log entry.
 */
router.get('/logs/:logId', authenticateTeacher, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const log = await getAuditLogById(req.params.logId, req.teacher!.schoolId);
    res.json(log);
  } catch (error) {
    next(error);
  }
});

export default router;
