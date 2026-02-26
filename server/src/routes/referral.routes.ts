import { Router, Response, NextFunction } from 'express';
import { AuthenticatedRequest, CreateReferralInput } from '../types';
import { authenticateTeacher } from '../middleware/auth';
import { verifyStudentAccess } from '../middleware/ferpa';
import {
  createReferral,
  getReferralPrePopulatedData,
  getTeacherReferrals,
} from '../services/referral.service';
import { ValidationError } from '../utils/errors';

const router = Router();

const VALID_CONCERNS = ['ACADEMIC', 'BEHAVIORAL', 'ATTENDANCE', 'SOCIAL_EMOTIONAL', 'OTHER'];
const VALID_URGENCIES = ['STANDARD', 'URGENT'];

/**
 * GET /api/referrals/prepopulate/:studentId
 * Get pre-populated data for SST referral form.
 * Auto-populates ~80% of the referral from existing data.
 */
router.get(
  '/prepopulate/:studentId',
  authenticateTeacher,
  verifyStudentAccess,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const data = await getReferralPrePopulatedData(req.teacher!.id, req.params.studentId);
      res.json(data);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /api/referrals
 * Submit a new SST referral.
 */
router.post('/', authenticateTeacher, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const input = req.body as CreateReferralInput;

    if (!input.studentId || !input.primaryConcern || !input.narrative || !input.urgency) {
      throw new ValidationError('studentId, primaryConcern, narrative, and urgency are required');
    }
    if (!VALID_CONCERNS.includes(input.primaryConcern)) {
      throw new ValidationError(`primaryConcern must be one of: ${VALID_CONCERNS.join(', ')}`);
    }
    if (!VALID_URGENCIES.includes(input.urgency)) {
      throw new ValidationError(`urgency must be one of: ${VALID_URGENCIES.join(', ')}`);
    }
    if (input.narrative.length < 20) {
      throw new ValidationError('Narrative must be at least 2-3 sentences');
    }
    if (input.narrative.length > 3000) {
      throw new ValidationError('Narrative must be 500 words or less');
    }

    const { teacherHasStudentAccess } = await import('../middleware/ferpa');
    const hasAccess = await teacherHasStudentAccess(req.teacher!.id, input.studentId);
    if (!hasAccess) {
      throw new ValidationError('You do not have access to this student');
    }

    const referral = await createReferral(req.teacher!.id, input);
    res.status(201).json(referral);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/referrals
 * Get all referrals submitted by this teacher.
 */
router.get('/', authenticateTeacher, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const referrals = await getTeacherReferrals(req.teacher!.id);
    res.json(referrals);
  } catch (error) {
    next(error);
  }
});

export default router;
