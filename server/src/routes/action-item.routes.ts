import { Router, Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../types';
import { authenticateTeacher } from '../middleware/auth';
import {
  createActionItem,
  completeActionItem,
  reviewOutcome,
  dismissActionItem,
  getActionItemDashboard,
  getStudentActionItems,
} from '../services/action-item.service';

const router = Router();

/**
 * GET /api/action-items
 * Get action items dashboard (pending, reviews, outcomes, stats).
 */
router.get('/', authenticateTeacher, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const dashboard = await getActionItemDashboard(req.teacher!.id);
    res.json(dashboard);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/action-items/student/:studentId
 * Get open action items for a specific student.
 */
router.get('/student/:studentId', authenticateTeacher, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const items = await getStudentActionItems(req.teacher!.id, req.params.studentId as string);
    res.json(items);
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/action-items
 * Create a new action item.
 */
router.post('/', authenticateTeacher, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const item = await createActionItem(req.teacher!.id, req.body);
    res.status(201).json(item);
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/action-items/:id/complete
 * Mark an action item as completed with details.
 */
router.put('/:id/complete', authenticateTeacher, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const item = await completeActionItem(req.teacher!.id, req.params.id as string, req.body);
    res.json(item);
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/action-items/:id/review
 * Record the outcome after a follow-up period.
 */
router.put('/:id/review', authenticateTeacher, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const item = await reviewOutcome(req.teacher!.id, req.params.id as string, req.body);
    res.json(item);
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/action-items/:id/dismiss
 * Dismiss an action item.
 */
router.put('/:id/dismiss', authenticateTeacher, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const item = await dismissActionItem(req.teacher!.id, req.params.id as string);
    res.json(item);
  } catch (error) {
    next(error);
  }
});

export default router;
