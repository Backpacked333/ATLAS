import { Router, Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../../types';
import { authenticateTeacher } from '../../middleware/auth';
import { requirePermission } from '../../infrastructure/rbac/rbac.middleware';
import { auditMiddleware } from '../../infrastructure/audit/audit.service';
import { AttendanceService } from './attendance.service';

const router = Router();

// ─── Module 3: Attendance Tracking Module Routes ──────────────────────

/**
 * GET /api/v2/attendance/dashboard
 * Get attendance dashboard for teacher's sections.
 */
router.get(
  '/dashboard',
  authenticateTeacher,
  requirePermission('attendance', 'read'),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const dashboard = await AttendanceService.getDashboard(
        req.teacher!.schoolId,
        req.teacher!.sectionIds
      );
      res.json(dashboard);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /api/v2/attendance/record
 * Record a single attendance entry.
 */
router.post(
  '/record',
  authenticateTeacher,
  requirePermission('attendance', 'create'),
  auditMiddleware('AttendanceRecord', 'CREATE'),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const record = await AttendanceService.recordAttendance(req.body, req.teacher!.id);
      res.status(201).json(record);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /api/v2/attendance/bulk
 * Record attendance for an entire section.
 */
router.post(
  '/bulk',
  authenticateTeacher,
  requirePermission('attendance', 'create'),
  auditMiddleware('AttendanceRecord', 'CREATE'),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const result = await AttendanceService.recordBulkAttendance(req.body, req.teacher!.id);
      res.status(201).json(result);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/v2/attendance/query
 * Query attendance records with filters.
 */
router.get(
  '/query',
  authenticateTeacher,
  requirePermission('attendance', 'read'),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const records = await AttendanceService.queryRecords({
        studentId: req.query.studentId as string,
        sectionId: req.query.sectionId as string,
        startDate: req.query.startDate as string,
        endDate: req.query.endDate as string,
        status: req.query.status as any,
        period: req.query.period as string,
      });
      res.json(records);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/v2/attendance/students/:studentId/summary
 * Get attendance summary for a student.
 */
router.get(
  '/students/:studentId/summary',
  authenticateTeacher,
  requirePermission('attendance', 'read'),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const days = req.query.days ? parseInt(req.query.days as string) : 90;
      const summary = await AttendanceService.getStudentSummary(req.params.studentId as string, days);
      res.json(summary);
    } catch (error) {
      next(error);
    }
  }
);

export default router;
