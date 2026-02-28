import { Router, Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../../types';
import { authenticateTeacher } from '../../middleware/auth';
import { requirePermission } from '../../infrastructure/rbac/rbac.middleware';
import { AcademicReportingService } from './academic-reporting.service';

const router = Router();

// ─── Module 5: Academic Performance Reporting Routes ──────────────────

/**
 * POST /api/v2/reports/generate
 * Generate a new report.
 */
router.post(
  '/generate',
  authenticateTeacher,
  requirePermission('report', 'create'),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const report = await AcademicReportingService.generateReport(
        req.body,
        req.teacher!.id,
        req.teacher!.schoolId
      );
      res.status(201).json(report);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/v2/reports
 * List generated reports.
 */
router.get(
  '/',
  authenticateTeacher,
  requirePermission('report', 'read'),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const reports = await AcademicReportingService.listReports(req.teacher!.schoolId, {
        type: req.query.type as string,
        limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
      });
      res.json(reports);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/v2/reports/:id
 * Get a specific report.
 */
router.get(
  '/:id',
  authenticateTeacher,
  requirePermission('report', 'read'),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const report = await AcademicReportingService.getReport(req.params.id as string);
      res.json(report);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/v2/reports/grade-distribution/:sectionId
 * Get grade distribution for a section (quick endpoint, no report record).
 */
router.get(
  '/grade-distribution/:sectionId',
  authenticateTeacher,
  requirePermission('report', 'read'),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const distribution = await AcademicReportingService.generateGradeDistribution(
        req.params.sectionId as string
      );
      res.json(distribution);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/v2/reports/at-risk/:schoolId
 * Get at-risk student report.
 */
router.get(
  '/at-risk/:schoolId',
  authenticateTeacher,
  requirePermission('report', 'read'),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const report = await AcademicReportingService.generateAtRiskReport(req.params.schoolId as string);
      res.json(report);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/v2/reports/student-progress/:studentId
 * Get student progress report.
 */
router.get(
  '/student-progress/:studentId',
  authenticateTeacher,
  requirePermission('report', 'read'),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const report = await AcademicReportingService.generateStudentProgress(req.params.studentId as string);
      res.json(report);
    } catch (error) {
      next(error);
    }
  }
);

export default router;
