import { Router, Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../types';
import { authenticateTeacher } from '../middleware/auth';
import { verifySectionAccess } from '../middleware/ferpa';
import { getSectionSummary, getEnhancedSectionSummary } from '../services/section.service';
import { prisma } from '../utils/prisma';

const router = Router();

/**
 * GET /api/sections
 * Get all sections for the authenticated teacher.
 */
router.get('/', authenticateTeacher, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const sections = await prisma.teacherSection.findMany({
      where: { teacherId: req.teacher!.id },
      include: {
        section: {
          include: {
            _count: {
              select: { enrollments: { where: { status: 'ACTIVE' } } },
            },
          },
        },
      },
    });

    res.json(
      sections.map((ts) => ({
        id: ts.section.id,
        courseName: ts.section.courseName,
        period: ts.section.period,
        semester: ts.section.semester,
        room: ts.section.room,
        studentCount: ts.section._count.enrollments,
        role: ts.role,
      }))
    );
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/sections/:sectionId
 * Get detailed summary for a specific section.
 */
router.get(
  '/:sectionId',
  authenticateTeacher,
  verifySectionAccess,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const summary = await getSectionSummary(req.teacher!.id, req.params.sectionId);
      res.json(summary);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/sections/:sectionId/enhanced
 * Get enhanced section summary with trends, rankings, and insights.
 */
router.get(
  '/:sectionId/enhanced',
  authenticateTeacher,
  verifySectionAccess,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const summary = await getEnhancedSectionSummary(req.teacher!.id, req.params.sectionId);
      res.json(summary);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/sections/:sectionId/seats
 * Get seating chart for a section.
 */
router.get(
  '/:sectionId/seats',
  authenticateTeacher,
  verifySectionAccess,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const seats = await prisma.seatAssignment.findMany({
        where: { sectionId: req.params.sectionId },
        orderBy: [{ row: 'asc' }, { col: 'asc' }],
      });

      // Enrich with student data
      const studentIds = seats.map((s) => s.studentId).filter(Boolean) as string[];
      const students = await prisma.student.findMany({
        where: { id: { in: studentIds } },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          riskTier: true,
        },
      });

      const studentMap = new Map(students.map((s) => [s.id, s]));

      res.json(
        seats.map((seat) => ({
          row: seat.row,
          col: seat.col,
          label: seat.label,
          student: seat.studentId ? studentMap.get(seat.studentId) || null : null,
        }))
      );
    } catch (error) {
      next(error);
    }
  }
);

export default router;
