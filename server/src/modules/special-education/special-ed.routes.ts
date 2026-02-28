import { Router, Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../../types';
import { authenticateTeacher } from '../../middleware/auth';
import { requirePermission } from '../../infrastructure/rbac/rbac.middleware';
import { SpecialEducationService } from './special-ed.service';

const router = Router();

// ─── Module 2: Special Education Compliance Engine Routes ─────────────

/**
 * GET /api/v2/compliance/dashboard
 * Get the compliance dashboard for the teacher's school.
 */
router.get(
  '/dashboard',
  authenticateTeacher,
  requirePermission('accommodation', 'read'),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const dashboard = await SpecialEducationService.getDashboard(req.teacher!.schoolId);
      res.json(dashboard);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/v2/compliance/deadlines
 * Search compliance deadlines.
 */
router.get(
  '/deadlines',
  authenticateTeacher,
  requirePermission('accommodation', 'read'),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const result = await SpecialEducationService.searchDeadlines({
        schoolId: req.teacher!.schoolId,
        status: req.query.status as any,
        type: req.query.type as string,
        assignedToId: req.query.assignedToId as string,
        dueBefore: req.query.dueBefore as string,
        dueAfter: req.query.dueAfter as string,
        page: req.query.page ? parseInt(req.query.page as string) : undefined,
        limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
      });
      res.json(result);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /api/v2/compliance/deadlines
 * Create a compliance deadline.
 */
router.post(
  '/deadlines',
  authenticateTeacher,
  requirePermission('compliance', 'create'),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const deadline = await SpecialEducationService.createDeadline(
        { ...req.body, schoolId: req.teacher!.schoolId },
        req.teacher!.id
      );
      res.status(201).json(deadline);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * PATCH /api/v2/compliance/deadlines/:id
 * Update a compliance deadline.
 */
router.patch(
  '/deadlines/:id',
  authenticateTeacher,
  requirePermission('compliance', 'update'),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const deadline = await SpecialEducationService.updateDeadline(
        req.params.id as string,
        req.body,
        req.teacher!.id
      );
      res.json(deadline);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/v2/compliance/students/:studentId/documents
 * Get IEP documents for a student.
 */
router.get(
  '/students/:studentId/documents',
  authenticateTeacher,
  requirePermission('accommodation', 'read'),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const documents = await SpecialEducationService.getDocuments(req.params.studentId as string);
      res.json(documents);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /api/v2/compliance/documents
 * Create an IEP document.
 */
router.post(
  '/documents',
  authenticateTeacher,
  requirePermission('iep_document', 'create'),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const document = await SpecialEducationService.createDocument(
        { ...req.body, schoolId: req.teacher!.schoolId },
        req.teacher!.id
      );
      res.status(201).json(document);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /api/v2/compliance/check-alerts
 * Trigger deadline alert checking.
 */
router.post(
  '/check-alerts',
  authenticateTeacher,
  requirePermission('compliance', 'read'),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const alertCount = await SpecialEducationService.checkDeadlineAlerts(req.teacher!.schoolId);
      res.json({ alertsCreated: alertCount });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
