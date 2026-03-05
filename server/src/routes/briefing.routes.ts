import { Router, Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../types';
import { authenticateTeacher } from '../middleware/auth';
import { getMorningBriefing, getEnhancedBriefing } from '../services/briefing.service';

const router = Router();

/**
 * GET /api/briefing
 * Get the morning briefing for the authenticated teacher.
 * Returns absent students, grade alerts, missing work, interventions, accommodations, new students.
 */
router.get('/', authenticateTeacher, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const briefing = await getMorningBriefing(req.teacher!.id);
    res.json(briefing);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/briefing/enhanced
 * Get the enhanced morning briefing with priority actions, stats, celebrations, and week ahead.
 */
router.get('/enhanced', authenticateTeacher, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const briefing = await getEnhancedBriefing(req.teacher!.id);
    res.json(briefing);
  } catch (error) {
    next(error);
  }
});

export default router;
