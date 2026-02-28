import { Router, Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../../types';
import { authenticateTeacher } from '../../middleware/auth';
import { requirePermission } from '../../infrastructure/rbac/rbac.middleware';
import { StaffSchedulingService } from './staff-scheduling.service';

const router = Router();

// ─── Module 6: Staff Scheduling Coordinator Routes ────────────────────

/**
 * GET /api/v2/scheduling/dashboard
 * Get schedule dashboard for the school.
 */
router.get(
  '/dashboard',
  authenticateTeacher,
  requirePermission('schedule', 'read'),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const dashboard = await StaffSchedulingService.getDashboard(req.teacher!.schoolId);
      res.json(dashboard);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/v2/scheduling/staff
 * Get all staff members for the school.
 */
router.get(
  '/staff',
  authenticateTeacher,
  requirePermission('schedule', 'read'),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const staff = await StaffSchedulingService.getStaffMembers(req.teacher!.schoolId);
      res.json(staff);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /api/v2/scheduling/staff
 * Create a new staff member.
 */
router.post(
  '/staff',
  authenticateTeacher,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const staff = await StaffSchedulingService.createStaffMember(
        req.body,
        req.teacher!.schoolId,
        req.teacher!.id
      );
      res.status(201).json(staff);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /api/v2/scheduling/schedules
 * Create a schedule entry.
 */
router.post(
  '/schedules',
  authenticateTeacher,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const schedule = await StaffSchedulingService.createSchedule(req.body, req.teacher!.id);
      res.status(201).json(schedule);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /api/v2/scheduling/absences
 * Report a staff absence.
 */
router.post(
  '/absences',
  authenticateTeacher,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const absence = await StaffSchedulingService.reportAbsence(
        req.body,
        req.teacher!.schoolId,
        req.teacher!.id
      );
      res.status(201).json(absence);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * PATCH /api/v2/scheduling/absences/:id/status
 * Update absence status.
 */
router.patch(
  '/absences/:id/status',
  authenticateTeacher,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const absence = await StaffSchedulingService.updateAbsenceStatus(
        req.params.id as string,
        req.body.status,
        req.teacher!.id
      );
      res.json(absence);
    } catch (error) {
      next(error);
    }
  }
);

export default router;
