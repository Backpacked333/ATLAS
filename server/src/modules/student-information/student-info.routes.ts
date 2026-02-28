import { Router, Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../../types';
import { authenticateTeacher } from '../../middleware/auth';
import { auditMiddleware } from '../../infrastructure/audit/audit.service';
import { requirePermission } from '../../infrastructure/rbac/rbac.middleware';
import { StudentInformationService } from './student-info.service';

const router = Router();

// ─── Module 1: Student Information Management System Routes ───────────

/**
 * GET /api/v2/students/search
 * Search students with filtering and pagination.
 */
router.get(
  '/search',
  authenticateTeacher,
  requirePermission('student', 'read'),
  auditMiddleware('Student', 'READ'),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const result = await StudentInformationService.search(
        {
          query: req.query.q as string,
          schoolId: req.teacher!.schoolId,
          gradeLevel: req.query.gradeLevel ? parseInt(req.query.gradeLevel as string) : undefined,
          riskTier: req.query.riskTier as 'ON_TRACK' | 'NEEDS_SUPPORT' | 'URGENT',
          ellStatus: req.query.ellStatus === 'true' ? true : undefined,
          iepActive: req.query.iepActive === 'true' ? true : undefined,
          has504: req.query.has504 === 'true' ? true : undefined,
          page: req.query.page ? parseInt(req.query.page as string) : 1,
          limit: req.query.limit ? parseInt(req.query.limit as string) : 25,
          sortBy: req.query.sortBy as 'name' | 'gradeLevel' | 'riskTier' | 'gpa',
          sortOrder: req.query.sortOrder as 'asc' | 'desc',
        },
        req.teacher!.id
      );
      res.json(result);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/v2/students/demographics
 * Get demographic summary for the teacher's school.
 */
router.get(
  '/demographics',
  authenticateTeacher,
  requirePermission('student', 'read'),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const summary = await StudentInformationService.getDemographicSummary(req.teacher!.schoolId);
      res.json(summary);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/v2/students/:studentId
 * Get detailed student record.
 */
router.get(
  '/:studentId',
  authenticateTeacher,
  requirePermission('student', 'read'),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const student = await StudentInformationService.getById(
        req.params.studentId as string,
        req.teacher!.id
      );
      res.json(student);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/v2/students/:studentId/enrollments
 * Get enrollment details for a student.
 */
router.get(
  '/:studentId/enrollments',
  authenticateTeacher,
  requirePermission('student', 'read'),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const enrollments = await StudentInformationService.getEnrollments(req.params.studentId as string);
      res.json(enrollments);
    } catch (error) {
      next(error);
    }
  }
);

export default router;
