import { Router, Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../../types';
import { authenticateTeacher } from '../../middleware/auth';
import { AuditService } from './audit.service';

const router = Router();

// ─── Audit Logging Module Routes ──────────────────────────────────────

/**
 * GET /api/v2/audit
 * Query audit logs (restricted to admin roles in production).
 */
router.get(
  '/',
  authenticateTeacher,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const result = await AuditService.query({
        userId: req.query.userId as string,
        resource: req.query.resource as string,
        action: req.query.action as string,
        schoolId: req.teacher!.schoolId,
        startDate: req.query.startDate ? new Date(req.query.startDate as string) : undefined,
        endDate: req.query.endDate ? new Date(req.query.endDate as string) : undefined,
        page: req.query.page ? parseInt(req.query.page as string) : undefined,
        limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
      });
      res.json(result);
    } catch (error) {
      next(error);
    }
  }
);

export default router;
