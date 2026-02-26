import { Router, Response, NextFunction } from 'express';
import { AuthenticatedRequest, CreateObservationInput } from '../types';
import { authenticateTeacher } from '../middleware/auth';
import { verifyStudentAccess } from '../middleware/ferpa';
import { createObservation, updateObservation, getStudentObservations } from '../services/observation.service';
import { ValidationError } from '../utils/errors';

const router = Router();

const VALID_CATEGORIES = ['ACADEMIC', 'BEHAVIORAL', 'SOCIAL_EMOTIONAL', 'ATTENDANCE', 'POSITIVE'];
const VALID_SEVERITIES = ['POSITIVE', 'CONCERN', 'URGENT'];

/**
 * POST /api/observations
 * Create a new observation for a student.
 * Target: < 20 seconds total interaction time.
 */
router.post('/', authenticateTeacher, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { studentId, category, severity, content } = req.body as CreateObservationInput;

    if (!studentId || !category || !severity || !content) {
      throw new ValidationError('studentId, category, severity, and content are required');
    }
    if (!VALID_CATEGORIES.includes(category)) {
      throw new ValidationError(`category must be one of: ${VALID_CATEGORIES.join(', ')}`);
    }
    if (!VALID_SEVERITIES.includes(severity)) {
      throw new ValidationError(`severity must be one of: ${VALID_SEVERITIES.join(', ')}`);
    }

    // FERPA check via middleware pattern
    req.params.studentId = studentId;
    const { teacherHasStudentAccess } = await import('../middleware/ferpa');
    const hasAccess = await teacherHasStudentAccess(req.teacher!.id, studentId);
    if (!hasAccess) {
      throw new ValidationError('You do not have access to this student');
    }

    const observation = await createObservation(req.teacher!.id, {
      studentId,
      category,
      severity,
      content,
    });

    res.status(201).json(observation);
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/observations/:observationId
 * Update an observation (within 24-hour window).
 */
router.put('/:observationId', authenticateTeacher, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { content } = req.body;
    if (!content) throw new ValidationError('content is required');

    const observation = await updateObservation(
      req.params.observationId,
      req.teacher!.id,
      content
    );

    res.json(observation);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/observations/student/:studentId
 * Get all observations by this teacher for a student.
 */
router.get(
  '/student/:studentId',
  authenticateTeacher,
  verifyStudentAccess,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const observations = await getStudentObservations(req.teacher!.id, req.params.studentId);
      res.json(observations);
    } catch (error) {
      next(error);
    }
  }
);

export default router;
