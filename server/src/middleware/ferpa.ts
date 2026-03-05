import { Response, NextFunction } from 'express';
import { prisma } from '../utils/prisma';
import { AuthenticatedRequest } from '../types';
import { ForbiddenError, NotFoundError } from '../utils/errors';

/**
 * FERPA Compliance Middleware
 *
 * Ensures teachers can ONLY access students enrolled in their sections.
 * This is the core data access control layer for AtlasED Classroom.
 *
 * Teachers can see:
 * - Student name, grade level, photo (own roster only)
 * - Attendance data (overall + own period)
 * - Grades in own course
 * - Summary GPA (no individual course grades from other teachers)
 * - Assessment scores relevant to own subject area
 * - ELL status, IEP/504 flag (boolean only)
 * - 504 accommodations applicable to own classroom
 * - Parent contact info (no home address)
 *
 * Teachers CANNOT see:
 * - Dropout risk score / risk factors
 * - Discipline history
 * - IEP document content, goals, BIP
 * - Free/reduced lunch status
 * - Suspension history
 * - Home address
 */

/**
 * Middleware: verifies the teacher has access to the specified student.
 * Extracts studentId from req.params.studentId.
 */
export async function verifyStudentAccess(
  req: AuthenticatedRequest,
  _res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const studentId = String(req.params.studentId);
    const teacher = req.teacher;

    if (!teacher) {
      throw new ForbiddenError('Teacher context not available');
    }

    if (!studentId || studentId === 'undefined') {
      next();
      return;
    }

    const hasAccess = await teacherHasStudentAccess(teacher.id, studentId);
    if (!hasAccess) {
      throw new ForbiddenError(
        'You do not have access to this student. Teachers can only view students enrolled in their sections.'
      );
    }

    next();
  } catch (error) {
    next(error);
  }
}

/**
 * Middleware: verifies the teacher has access to the specified section.
 * Extracts sectionId from req.params.sectionId.
 */
export async function verifySectionAccess(
  req: AuthenticatedRequest,
  _res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const sectionId = String(req.params.sectionId);
    const teacher = req.teacher;

    if (!teacher) {
      throw new ForbiddenError('Teacher context not available');
    }

    if (!sectionId || sectionId === 'undefined') {
      next();
      return;
    }

    if (!teacher.sectionIds.includes(sectionId)) {
      throw new ForbiddenError(
        'You do not have access to this section. Teachers can only view their own class sections.'
      );
    }

    next();
  } catch (error) {
    next(error);
  }
}

/**
 * Check if a teacher has access to a specific student through enrollment.
 */
export async function teacherHasStudentAccess(
  teacherId: string,
  studentId: string
): Promise<boolean> {
  const enrollment = await prisma.enrollment.findFirst({
    where: {
      studentId,
      status: 'ACTIVE',
      section: {
        teachers: {
          some: { teacherId },
        },
      },
    },
  });

  return !!enrollment;
}

/**
 * Returns all student IDs a teacher has access to (across all their sections).
 */
export async function getTeacherStudentIds(teacherId: string): Promise<string[]> {
  const enrollments = await prisma.enrollment.findMany({
    where: {
      status: 'ACTIVE',
      section: {
        teachers: {
          some: { teacherId },
        },
      },
    },
    select: { studentId: true },
    distinct: ['studentId'],
  });

  return enrollments.map((e) => e.studentId);
}

/**
 * Returns student IDs for a specific section.
 */
export async function getSectionStudentIds(sectionId: string): Promise<string[]> {
  const enrollments = await prisma.enrollment.findMany({
    where: {
      sectionId,
      status: 'ACTIVE',
    },
    select: { studentId: true },
  });

  return enrollments.map((e) => e.studentId);
}

/**
 * Verify a student exists and is in the teacher's roster. Returns the student or throws.
 */
export async function getVerifiedStudent(teacherId: string, studentId: string) {
  const student = await prisma.student.findUnique({
    where: { id: studentId },
  });

  if (!student) {
    throw new NotFoundError('Student');
  }

  const hasAccess = await teacherHasStudentAccess(teacherId, studentId);
  if (!hasAccess) {
    throw new ForbiddenError(
      'You do not have access to this student. Teachers can only view students enrolled in their sections.'
    );
  }

  return student;
}
