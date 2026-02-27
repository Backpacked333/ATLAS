import { Router, Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../types';
import { authenticateTeacher } from '../middleware/auth';
import { verifySectionAccess } from '../middleware/ferpa';
import { generateSubstituteBrief } from '../services/substitute.service';

const router = Router();

/**
 * GET /api/substitute/:sectionId
 * Generate a substitute teacher brief for a specific section.
 * Contains only the operational minimum: seating, accommodations, interventions.
 * No risk scores, grades, attendance data, IEP content, or parent info.
 */
router.get(
  '/:sectionId',
  authenticateTeacher,
  verifySectionAccess,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const brief = await generateSubstituteBrief(req.teacher!.id, req.params.sectionId as string);
      res.json(brief);
    } catch (error) {
      next(error);
    }
  }
);

export default router;
