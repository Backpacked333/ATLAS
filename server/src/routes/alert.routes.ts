import { Router, Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../types';
import { authenticateTeacher } from '../middleware/auth';
import {
  createAlertRule,
  getAlertRules,
  updateAlertRule,
  getTeacherAlerts,
  acknowledgeAlert,
  resolveAlert,
  getAlertSummary,
} from '../services/alert.service';
import { ValidationError } from '../utils/errors';

const router = Router();

const VALID_CATEGORIES = ['ATTENDANCE_ALERT', 'GRADE_ALERT', 'BEHAVIOR_ALERT', 'SAFETY_ALERT', 'SYSTEM_ALERT', 'CUSTOM'];
const VALID_PRIORITIES = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];

/**
 * GET /api/alerts
 * Get alerts for the authenticated teacher.
 * Query: status, priority, limit
 */
router.get('/', authenticateTeacher, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const alerts = await getTeacherAlerts(req.teacher!.id, {
      status: req.query.status as string | undefined,
      priority: req.query.priority as string | undefined,
      limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
    });
    res.json(alerts);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/alerts/summary
 * Get alert count summary for the authenticated teacher.
 */
router.get('/summary', authenticateTeacher, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const summary = await getAlertSummary(req.teacher!.id);
    res.json(summary);
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/alerts/:alertId/acknowledge
 * Acknowledge an alert.
 */
router.put('/:alertId/acknowledge', authenticateTeacher, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const alert = await acknowledgeAlert(req.params.alertId, req.teacher!.id);
    res.json(alert);
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/alerts/:alertId/resolve
 * Resolve an alert.
 */
router.put('/:alertId/resolve', authenticateTeacher, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const alert = await resolveAlert(req.params.alertId, req.teacher!.id);
    res.json(alert);
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/alerts/rules
 * Create a new alert rule.
 */
router.post('/rules', authenticateTeacher, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { name, description, category, condition, channels, priority } = req.body;

    if (!name || !category || !condition) {
      throw new ValidationError('name, category, and condition are required');
    }
    if (!VALID_CATEGORIES.includes(category)) {
      throw new ValidationError(`category must be one of: ${VALID_CATEGORIES.join(', ')}`);
    }
    if (priority && !VALID_PRIORITIES.includes(priority)) {
      throw new ValidationError(`priority must be one of: ${VALID_PRIORITIES.join(', ')}`);
    }

    const rule = await createAlertRule(req.teacher!.id, req.teacher!.schoolId, {
      name,
      description,
      category,
      condition,
      channels,
      priority,
    });
    res.status(201).json(rule);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/alerts/rules
 * Get alert rules for the school.
 * Query: category, isActive
 */
router.get('/rules', authenticateTeacher, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const rules = await getAlertRules(req.teacher!.schoolId, {
      category: req.query.category as string | undefined,
      isActive: req.query.isActive !== undefined ? req.query.isActive === 'true' : undefined,
    });
    res.json(rules);
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/alerts/rules/:ruleId
 * Update an alert rule.
 */
router.put('/rules/:ruleId', authenticateTeacher, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { name, description, condition, isActive, channels, priority } = req.body;

    if (priority && !VALID_PRIORITIES.includes(priority)) {
      throw new ValidationError(`priority must be one of: ${VALID_PRIORITIES.join(', ')}`);
    }

    const rule = await updateAlertRule(req.params.ruleId, req.teacher!.schoolId, {
      name,
      description,
      condition,
      isActive,
      channels,
      priority,
    });
    res.json(rule);
  } catch (error) {
    next(error);
  }
});

export default router;
