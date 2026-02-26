import { Router, Response, NextFunction } from 'express';
import { AuthenticatedRequest, LogInterventionInput } from '../types';
import { authenticateTeacher } from '../middleware/auth';
import { logIntervention, getTeacherInterventions } from '../services/intervention.service';
import { ValidationError } from '../utils/errors';

const router = Router();

const VALID_STATUSES = ['COMPLETED', 'PARTIALLY_COMPLETED', 'NOT_COMPLETED'];

/**
 * GET /api/interventions
 * Get all active interventions assigned to this teacher's students.
 */
router.get('/', authenticateTeacher, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const interventions = await getTeacherInterventions(req.teacher!.id);
    res.json(interventions);
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/interventions/log
 * Log an intervention completion for today.
 * One-click interaction: Completed, Partially Completed, or Not Completed.
 */
router.post('/log', authenticateTeacher, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const input = req.body as LogInterventionInput;

    if (!input.interventionId || !input.completionStatus) {
      throw new ValidationError('interventionId and completionStatus are required');
    }
    if (!VALID_STATUSES.includes(input.completionStatus)) {
      throw new ValidationError(`completionStatus must be one of: ${VALID_STATUSES.join(', ')}`);
    }

    const log = await logIntervention(req.teacher!.id, input);
    res.status(201).json(log);
  } catch (error) {
    next(error);
  }
});

export default router;
