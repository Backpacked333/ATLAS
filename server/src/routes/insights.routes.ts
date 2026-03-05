import { Router, Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../types';
import { authenticateTeacher } from '../middleware/auth';
import { getTeacherInsights } from '../services/insights.service';

const router = Router();

router.get('/', authenticateTeacher, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const insights = await getTeacherInsights(req.teacher!.id);
    res.json(insights);
  } catch (error) {
    next(error);
  }
});

export default router;
