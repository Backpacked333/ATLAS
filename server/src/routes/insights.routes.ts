import { Router, Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../types';
import { authenticateTeacher } from '../middleware/auth';
import { getProfessionalInsights } from '../services/insights.service';

const router = Router();

/**
 * GET /api/insights
 * Get professional growth insights for the authenticated teacher.
 * This data is visible ONLY to the teacher. Never shared with administrators.
 */
router.get(
  '/',
  authenticateTeacher,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const insights = await getProfessionalInsights(req.teacher!.id);
      res.json(insights);
    } catch (error) {
      next(error);
    }
  }
);

export default router;
