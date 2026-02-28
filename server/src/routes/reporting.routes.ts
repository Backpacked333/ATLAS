import { Router, Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../types';
import { authenticateTeacher } from '../middleware/auth';
import {
  createReportDefinition,
  getReportDefinitions,
  getReportDefinitionById,
  updateReportDefinition,
  generateReport,
  getReportSnapshots,
} from '../services/reporting.service';
import { ValidationError } from '../utils/errors';

const router = Router();

const VALID_TYPES = [
  'ATTENDANCE_SUMMARY', 'GRADE_DISTRIBUTION', 'INTERVENTION_PROGRESS',
  'BEHAVIOR_TRENDS', 'COMPLIANCE_STATUS', 'STUDENT_RISK', 'CUSTOM',
];

/**
 * POST /api/reports
 * Create a new report definition.
 */
router.post('/', authenticateTeacher, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { name, description, type, config, schedule } = req.body;

    if (!name || !type || !config) {
      throw new ValidationError('name, type, and config are required');
    }
    if (!VALID_TYPES.includes(type)) {
      throw new ValidationError(`type must be one of: ${VALID_TYPES.join(', ')}`);
    }

    const report = await createReportDefinition(req.teacher!.id, req.teacher!.schoolId, {
      name, description, type, config, schedule,
    });
    res.status(201).json(report);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/reports
 * Get all report definitions for the school.
 * Query: type, isActive
 */
router.get('/', authenticateTeacher, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const reports = await getReportDefinitions(req.teacher!.schoolId, {
      type: req.query.type as string | undefined,
      isActive: req.query.isActive !== undefined ? req.query.isActive === 'true' : undefined,
    });
    res.json(reports);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/reports/:reportId
 * Get a specific report definition with recent snapshots.
 */
router.get('/:reportId', authenticateTeacher, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const report = await getReportDefinitionById(req.params.reportId, req.teacher!.schoolId);
    res.json(report);
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/reports/:reportId
 * Update a report definition.
 */
router.put('/:reportId', authenticateTeacher, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { name, description, config, schedule, isActive } = req.body;
    const report = await updateReportDefinition(req.params.reportId, req.teacher!.schoolId, {
      name, description, config, schedule, isActive,
    });
    res.json(report);
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/reports/:reportId/generate
 * Generate a new report snapshot.
 */
router.post('/:reportId/generate', authenticateTeacher, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const snapshot = await generateReport(req.params.reportId, req.teacher!.schoolId, req.teacher!.id);
    res.status(201).json(snapshot);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/reports/:reportId/snapshots
 * Get snapshots for a specific report.
 */
router.get('/:reportId/snapshots', authenticateTeacher, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;
    const snapshots = await getReportSnapshots(req.params.reportId, req.teacher!.schoolId, limit);
    res.json(snapshots);
  } catch (error) {
    next(error);
  }
});

export default router;
