import { Router, Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../types';
import { authenticateTeacher } from '../middleware/auth';
import {
  createPolicyRule,
  getPolicyRules,
  updatePolicyRule,
  recordViolation,
  getViolations,
  updateViolationStatus,
  getComplianceSummary,
  runAttendanceComplianceCheck,
} from '../services/policy-compliance.service';
import { ValidationError } from '../utils/errors';

const router = Router();

const VALID_POLICY_CATEGORIES = ['ATTENDANCE', 'GRADING', 'BEHAVIORAL', 'DATA_PRIVACY', 'ACCOMMODATION', 'REPORTING'];
const VALID_VIOLATION_SEVERITIES = ['INFO', 'WARNING', 'CRITICAL'];
const VALID_VIOLATION_STATUSES = ['OPEN', 'ACKNOWLEDGED', 'IN_REMEDIATION', 'RESOLVED', 'DISMISSED'];

/**
 * GET /api/compliance/summary
 * Get compliance overview for the school.
 */
router.get('/summary', authenticateTeacher, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const summary = await getComplianceSummary(req.teacher!.schoolId);
    res.json(summary);
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/compliance/rules
 * Create a new policy rule.
 */
router.post('/rules', authenticateTeacher, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { name, description, category, threshold } = req.body;

    if (!name || !description || !category) {
      throw new ValidationError('name, description, and category are required');
    }
    if (!VALID_POLICY_CATEGORIES.includes(category)) {
      throw new ValidationError(`category must be one of: ${VALID_POLICY_CATEGORIES.join(', ')}`);
    }

    const rule = await createPolicyRule(req.teacher!.schoolId, { name, description, category, threshold });
    res.status(201).json(rule);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/compliance/rules
 * Get policy rules for the school.
 * Query: category, isActive
 */
router.get('/rules', authenticateTeacher, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const rules = await getPolicyRules(req.teacher!.schoolId, {
      category: req.query.category as string | undefined,
      isActive: req.query.isActive !== undefined ? req.query.isActive === 'true' : undefined,
    });
    res.json(rules);
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/compliance/rules/:ruleId
 * Update a policy rule.
 */
router.put('/rules/:ruleId', authenticateTeacher, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { name, description, isActive, threshold } = req.body;

    const rule = await updatePolicyRule(req.params.ruleId, req.teacher!.schoolId, {
      name,
      description,
      isActive,
      threshold,
    });
    res.json(rule);
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/compliance/violations
 * Record a compliance violation.
 */
router.post('/violations', authenticateTeacher, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { policyRuleId, studentId, teacherId, severity, description } = req.body;

    if (!policyRuleId || !severity || !description) {
      throw new ValidationError('policyRuleId, severity, and description are required');
    }
    if (!VALID_VIOLATION_SEVERITIES.includes(severity)) {
      throw new ValidationError(`severity must be one of: ${VALID_VIOLATION_SEVERITIES.join(', ')}`);
    }

    const violation = await recordViolation(req.teacher!.schoolId, {
      policyRuleId,
      studentId,
      teacherId,
      severity,
      description,
    });
    res.status(201).json(violation);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/compliance/violations
 * Get compliance violations for the school.
 * Query: policyRuleId, status, severity, studentId, teacherId
 */
router.get('/violations', authenticateTeacher, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const violations = await getViolations(req.teacher!.schoolId, {
      policyRuleId: req.query.policyRuleId as string | undefined,
      status: req.query.status as string | undefined,
      severity: req.query.severity as string | undefined,
      studentId: req.query.studentId as string | undefined,
      teacherId: req.query.teacherId as string | undefined,
    });
    res.json(violations);
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/compliance/violations/:violationId/status
 * Update the status of a violation.
 */
router.put('/violations/:violationId/status', authenticateTeacher, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { status, resolution } = req.body;
    if (!status) {
      throw new ValidationError('status is required');
    }
    if (!VALID_VIOLATION_STATUSES.includes(status)) {
      throw new ValidationError(`status must be one of: ${VALID_VIOLATION_STATUSES.join(', ')}`);
    }

    const violation = await updateViolationStatus(
      req.params.violationId,
      req.teacher!.schoolId,
      req.teacher!.id,
      status,
      resolution
    );
    res.json(violation);
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/compliance/check/attendance
 * Run automated attendance compliance checks.
 */
router.post('/check/attendance', authenticateTeacher, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const result = await runAttendanceComplianceCheck(req.teacher!.schoolId);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

export default router;
