import { Router, Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../../types';
import { authenticateTeacher } from '../../middleware/auth';
import { AlertService } from './alert.service';

const router = Router();

// ─── Real-time Alert System Routes ────────────────────────────────────

/**
 * GET /api/v2/alerts
 * Get alerts for the current teacher.
 */
router.get(
  '/',
  authenticateTeacher,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const alerts = await AlertService.getForRecipient(req.teacher!.id, {
        unreadOnly: req.query.unreadOnly === 'true',
        limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
      });
      res.json(alerts);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/v2/alerts/count
 * Get unread alert count.
 */
router.get(
  '/count',
  authenticateTeacher,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const count = await AlertService.getUnreadCount(req.teacher!.id);
      res.json({ unreadCount: count });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * PATCH /api/v2/alerts/:id/read
 * Mark an alert as read.
 */
router.patch(
  '/:id/read',
  authenticateTeacher,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const alert = await AlertService.markRead(req.params.id as string);
      res.json(alert);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * PATCH /api/v2/alerts/:id/dismiss
 * Dismiss an alert.
 */
router.patch(
  '/:id/dismiss',
  authenticateTeacher,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const alert = await AlertService.dismiss(req.params.id as string);
      res.json(alert);
    } catch (error) {
      next(error);
    }
  }
);

export default router;
