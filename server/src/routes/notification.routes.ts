import { Router, Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../types';
import { authenticateTeacher } from '../middleware/auth';
import {
  getTeacherNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  getUnreadCount,
} from '../services/notification.service';

const router = Router();

/**
 * GET /api/notifications
 * Get notifications for the authenticated teacher.
 * Query: unreadOnly=true, limit=50
 */
router.get('/', authenticateTeacher, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const unreadOnly = req.query.unreadOnly === 'true';
    const limit = parseInt(req.query.limit as string) || 50;

    const notifications = await getTeacherNotifications(req.teacher!.id, unreadOnly, limit);
    res.json(notifications);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/notifications/unread-count
 * Get the count of unread notifications.
 */
router.get('/unread-count', authenticateTeacher, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const count = await getUnreadCount(req.teacher!.id);
    res.json({ count });
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/notifications/:notificationId/read
 * Mark a single notification as read.
 */
router.put('/:notificationId/read', authenticateTeacher, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    await markNotificationRead(req.params.notificationId, req.teacher!.id);
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/notifications/read-all
 * Mark all notifications as read.
 */
router.put('/read-all', authenticateTeacher, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    await markAllNotificationsRead(req.teacher!.id);
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

export default router;
