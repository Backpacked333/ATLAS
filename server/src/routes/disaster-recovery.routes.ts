import { Router, Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../types';
import { authenticateTeacher } from '../middleware/auth';
import {
  getRecoveryPlans,
  getRecoveryPlanById,
  createRecoveryPlan,
  startRecoveryTest,
  completeRecoveryTest,
  getFailoverEvents,
  initiateFailover,
  getRecoverySummary,
} from '../services/disaster-recovery.service';

const router = Router();

/**
 * GET /api/disaster-recovery/summary
 * Get disaster recovery overview.
 */
router.get('/summary', authenticateTeacher, async (_req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const summary = await getRecoverySummary();
    res.json(summary);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/disaster-recovery/plans
 * List recovery plans.
 * Query: type, isActive
 */
router.get('/plans', authenticateTeacher, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const plans = await getRecoveryPlans({
      type: req.query.type as string | undefined,
      isActive: req.query.isActive ? req.query.isActive === 'true' : undefined,
    });
    res.json(plans);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/disaster-recovery/plans/:planId
 * Get recovery plan details.
 */
router.get('/plans/:planId', authenticateTeacher, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const plan = await getRecoveryPlanById(req.params.planId);
    res.json(plan);
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/disaster-recovery/plans
 * Create a recovery plan.
 */
router.post('/plans', authenticateTeacher, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const plan = await createRecoveryPlan(req.body);
    res.status(201).json(plan);
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/disaster-recovery/plans/:planId/test
 * Start a recovery test for a plan.
 */
router.post('/plans/:planId/test', authenticateTeacher, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const test = await startRecoveryTest(req.params.planId);
    res.status(201).json(test);
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/disaster-recovery/tests/:testId/complete
 * Complete a recovery test.
 */
router.put('/tests/:testId/complete', authenticateTeacher, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const result = await completeRecoveryTest(req.params.testId, req.body);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/disaster-recovery/failovers
 * List failover events.
 */
router.get('/failovers', authenticateTeacher, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;
    const events = await getFailoverEvents(limit);
    res.json(events);
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/disaster-recovery/failovers
 * Initiate a failover.
 */
router.post('/failovers', authenticateTeacher, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const event = await initiateFailover(req.body);
    res.status(201).json(event);
  } catch (error) {
    next(error);
  }
});

export default router;
