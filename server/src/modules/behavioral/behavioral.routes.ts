import { Router, Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../../types';
import { authenticateTeacher } from '../../middleware/auth';
import { requirePermission } from '../../infrastructure/rbac/rbac.middleware';
import { auditMiddleware } from '../../infrastructure/audit/audit.service';
import { BehavioralService } from './behavioral.service';

const router = Router();

// ─── Module 4: Behavioral Management System Routes ────────────────────

/**
 * GET /api/v2/behavioral/summary
 * Get behavioral summary for the teacher's school.
 */
router.get(
  '/summary',
  authenticateTeacher,
  requirePermission('behavioral_incident', 'read'),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const summary = await BehavioralService.getSummary(req.teacher!.schoolId);
      res.json(summary);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/v2/behavioral/incidents
 * Search behavioral incidents.
 */
router.get(
  '/incidents',
  authenticateTeacher,
  requirePermission('behavioral_incident', 'read'),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const result = await BehavioralService.search({
        studentId: req.query.studentId as string,
        reportedById: req.query.reportedById as string,
        incidentType: req.query.incidentType as string,
        severity: req.query.severity as string,
        status: req.query.status as string,
        startDate: req.query.startDate as string,
        endDate: req.query.endDate as string,
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
 * POST /api/v2/behavioral/incidents
 * Create a behavioral incident.
 */
router.post(
  '/incidents',
  authenticateTeacher,
  requirePermission('behavioral_incident', 'create'),
  auditMiddleware('BehavioralIncident', 'CREATE'),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const incident = await BehavioralService.createIncident(
        req.body,
        req.teacher!.id,
        req.teacher!.schoolId
      );
      res.status(201).json(incident);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * PATCH /api/v2/behavioral/incidents/:id
 * Update a behavioral incident.
 */
router.patch(
  '/incidents/:id',
  authenticateTeacher,
  requirePermission('behavioral_incident', 'update'),
  auditMiddleware('BehavioralIncident', 'UPDATE'),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const incident = await BehavioralService.updateIncident(
        req.params.id as string,
        req.body,
        req.teacher!.id
      );
      res.json(incident);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/v2/behavioral/students/:studentId
 * Get all incidents for a student.
 */
router.get(
  '/students/:studentId',
  authenticateTeacher,
  requirePermission('behavioral_incident', 'read'),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const incidents = await BehavioralService.getStudentIncidents(req.params.studentId as string);
      res.json(incidents);
    } catch (error) {
      next(error);
    }
  }
);

export default router;
