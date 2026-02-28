import { Router, Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../../types';
import { authenticateTeacher } from '../../middleware/auth';
import { requirePermission } from '../../infrastructure/rbac/rbac.middleware';
import { ParentCommunicationService } from './parent-comm.service';

const router = Router();

// ─── Module 7: Parent Communication Portal Routes ────────────────────

/**
 * GET /api/v2/communication/dashboard
 * Get communication dashboard for the teacher.
 */
router.get(
  '/dashboard',
  authenticateTeacher,
  requirePermission('parent_communication', 'read'),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const dashboard = await ParentCommunicationService.getDashboard(req.teacher!.id);
      res.json(dashboard);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/v2/communication/messages
 * Get messages for the teacher.
 */
router.get(
  '/messages',
  authenticateTeacher,
  requirePermission('parent_communication', 'read'),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const result = await ParentCommunicationService.getMessages({
        userId: req.teacher!.id,
        userType: 'TEACHER',
        unreadOnly: req.query.unreadOnly === 'true',
        studentId: req.query.studentId as string,
        priority: req.query.priority as string,
        page: req.query.page ? parseInt(req.query.page as string) : undefined,
        limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
      });
      res.json(result);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /api/v2/communication/messages
 * Send a new message.
 */
router.post(
  '/messages',
  authenticateTeacher,
  requirePermission('parent_communication', 'create'),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const message = await ParentCommunicationService.sendMessage(
        req.body,
        req.teacher!.id,
        'TEACHER'
      );
      res.status(201).json(message);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/v2/communication/threads/:threadId
 * Get a message thread.
 */
router.get(
  '/threads/:threadId',
  authenticateTeacher,
  requirePermission('parent_communication', 'read'),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const thread = await ParentCommunicationService.getThread(req.params.threadId as string);
      if (!thread) {
        res.status(404).json({ error: 'Thread not found' });
        return;
      }
      res.json(thread);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * PATCH /api/v2/communication/messages/:id/read
 * Mark a message as read.
 */
router.patch(
  '/messages/:id/read',
  authenticateTeacher,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const message = await ParentCommunicationService.markRead(req.params.id as string, req.teacher!.id);
      res.json(message);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * PATCH /api/v2/communication/threads/:threadId/read
 * Mark all messages in a thread as read.
 */
router.patch(
  '/threads/:threadId/read',
  authenticateTeacher,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      await ParentCommunicationService.markThreadRead(req.params.threadId as string, req.teacher!.id);
      res.json({ success: true });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /api/v2/communication/contacts
 * Log a parent contact (phone call, in-person meeting, etc.)
 */
router.post(
  '/contacts',
  authenticateTeacher,
  requirePermission('parent_communication', 'create'),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const contact = await ParentCommunicationService.logParentContact(req.body, req.teacher!.id);
      res.status(201).json(contact);
    } catch (error) {
      next(error);
    }
  }
);

export default router;
