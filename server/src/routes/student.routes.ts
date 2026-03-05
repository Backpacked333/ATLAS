import { Router, Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../types';
import { authenticateTeacher } from '../middleware/auth';
import { verifyStudentAccess } from '../middleware/ferpa';
import { getStudentProfile, getEnhancedStudentProfile } from '../services/student.service';

const router = Router();

/**
 * GET /api/students/:studentId
 * Get the teacher-scoped profile for a specific student.
 * FERPA-enforced: only accessible for students in teacher's sections.
 */
router.get(
  '/:studentId',
  authenticateTeacher,
  verifyStudentAccess,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const profile = await getStudentProfile(req.teacher!.id, req.params.studentId);
      res.json(profile);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/students/:studentId/enhanced
 * Get the enhanced student profile with narrative summary, risk analysis,
 * recommended actions, attendance calendar, grade trajectory, and class comparison.
 */
router.get(
  '/:studentId/enhanced',
  authenticateTeacher,
  verifyStudentAccess,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const profile = await getEnhancedStudentProfile(req.teacher!.id, req.params.studentId);
      res.json(profile);
    } catch (error) {
      next(error);
    }
  }
);

export default router;
