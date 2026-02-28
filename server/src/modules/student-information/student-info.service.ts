import { prisma } from '../../utils/prisma';
import { AuditService } from '../../infrastructure/audit/audit.service';
import { eventBus } from '../../infrastructure/events/event-bus';
import { cacheService } from '../../infrastructure/cache/cache.service';
import { AlertService } from '../../infrastructure/alerts/alert.service';
import {
  StudentSearchParams,
  StudentSearchResult,
  CreateStudentInput,
  UpdateStudentInput,
  StudentEnrollmentInfo,
  StudentDemographicSummary,
} from './student-info.types';

// ─── Module 1: Student Information Management System ──────────────────

export class StudentInformationService {
  /**
   * Search students with filtering, pagination, and caching.
   */
  static async search(params: StudentSearchParams, requesterId: string): Promise<StudentSearchResult> {
    const page = params.page ?? 1;
    const limit = Math.min(params.limit ?? 25, 100);
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};
    if (params.schoolId) where.schoolId = params.schoolId;
    if (params.gradeLevel !== undefined) where.gradeLevel = params.gradeLevel;
    if (params.riskTier) where.riskTier = params.riskTier;
    if (params.ellStatus !== undefined) where.ellStatus = params.ellStatus;
    if (params.iepActive !== undefined) where.iepActive = params.iepActive;
    if (params.has504 !== undefined) where.has504 = params.has504;
    if (params.query) {
      where.OR = [
        { firstName: { contains: params.query, mode: 'insensitive' } },
        { lastName: { contains: params.query, mode: 'insensitive' } },
        { studentIdNo: { contains: params.query } },
      ];
    }

    const orderBy: Record<string, string> = {};
    switch (params.sortBy) {
      case 'gradeLevel':
        orderBy.gradeLevel = params.sortOrder || 'asc';
        break;
      case 'riskTier':
        orderBy.riskTier = params.sortOrder || 'asc';
        break;
      case 'gpa':
        orderBy.cumulativeGpa = params.sortOrder || 'desc';
        break;
      default:
        orderBy.lastName = params.sortOrder || 'asc';
    }

    const [students, total] = await Promise.all([
      prisma.student.findMany({
        where,
        orderBy,
        skip,
        take: limit,
      }),
      prisma.student.count({ where }),
    ]);

    await AuditService.log({
      userId: requesterId,
      userRole: 'teacher',
      action: 'READ',
      resource: 'Student',
      details: { searchParams: params, resultCount: students.length },
    });

    return {
      students: students.map((s) => ({
        id: s.id,
        studentIdNo: s.studentIdNo,
        firstName: s.firstName,
        lastName: s.lastName,
        gradeLevel: s.gradeLevel,
        photoUrl: s.photoUrl,
        ellStatus: s.ellStatus,
        iepActive: s.iepActive,
        has504: s.has504,
        cumulativeGpa: s.cumulativeGpa,
        totalCredits: s.totalCredits,
        creditsRequired: s.creditsRequired,
        riskTier: s.riskTier,
        schoolId: s.schoolId,
        createdAt: s.createdAt.toISOString(),
        updatedAt: s.updatedAt.toISOString(),
      })),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Get a single student by ID with caching.
   */
  static async getById(studentId: string, requesterId: string) {
    const cacheKey = `student:${studentId}`;
    const cached = cacheService.get<Record<string, unknown>>(cacheKey);
    if (cached) return cached;

    const student = await prisma.student.findUniqueOrThrow({
      where: { id: studentId },
      include: {
        enrollments: {
          where: { status: 'ACTIVE' },
          include: {
            section: {
              include: { teachers: { include: { teacher: true } } },
            },
          },
        },
        guardians: true,
        accommodations: { where: { isActive: true } },
      },
    });

    const result = {
      id: student.id,
      studentIdNo: student.studentIdNo,
      firstName: student.firstName,
      lastName: student.lastName,
      gradeLevel: student.gradeLevel,
      photoUrl: student.photoUrl,
      ellStatus: student.ellStatus,
      iepActive: student.iepActive,
      has504: student.has504,
      cumulativeGpa: student.cumulativeGpa,
      totalCredits: student.totalCredits,
      creditsRequired: student.creditsRequired,
      riskTier: student.riskTier,
      schoolId: student.schoolId,
      enrollments: student.enrollments.map((e) => ({
        sectionId: e.sectionId,
        courseName: e.section.courseName,
        period: e.section.period,
        status: e.status,
        teachers: e.section.teachers.map((t) => ({
          id: t.teacher.id,
          name: `${t.teacher.firstName} ${t.teacher.lastName}`,
          role: t.role,
        })),
      })),
      guardians: student.guardians.map((g) => ({
        id: g.id,
        firstName: g.firstName,
        lastName: g.lastName,
        email: g.email,
        phone: g.phone,
        relation: g.relation,
        isPrimary: g.isPrimary,
      })),
      accommodations: student.accommodations.map((a) => ({
        id: a.id,
        type: a.type,
        description: a.description,
        category: a.category,
      })),
      createdAt: student.createdAt.toISOString(),
      updatedAt: student.updatedAt.toISOString(),
    };

    cacheService.set(cacheKey, result, 120); // Cache for 2 minutes

    await AuditService.log({
      userId: requesterId,
      userRole: 'teacher',
      action: 'READ',
      resource: 'Student',
      resourceId: studentId,
    });

    return result;
  }

  /**
   * Create a new student record.
   */
  static async create(input: CreateStudentInput, requesterId: string) {
    const student = await prisma.student.create({
      data: {
        studentIdNo: input.studentIdNo,
        firstName: input.firstName,
        lastName: input.lastName,
        gradeLevel: input.gradeLevel,
        schoolId: input.schoolId,
        photoUrl: input.photoUrl,
        ellStatus: input.ellStatus ?? false,
        iepActive: input.iepActive ?? false,
        has504: input.has504 ?? false,
      },
    });

    eventBus.publish({
      type: 'student.created',
      payload: { studentId: student.id, schoolId: student.schoolId },
      timestamp: new Date(),
      source: 'StudentInformationService',
    });

    await AuditService.log({
      userId: requesterId,
      userRole: 'teacher',
      action: 'CREATE',
      resource: 'Student',
      resourceId: student.id,
      details: { studentIdNo: input.studentIdNo },
      schoolId: input.schoolId,
    });

    cacheService.invalidateByPrefix('demographics:');

    return student;
  }

  /**
   * Update a student record.
   */
  static async update(studentId: string, input: UpdateStudentInput, requesterId: string) {
    const previous = await prisma.student.findUniqueOrThrow({ where: { id: studentId } });

    const student = await prisma.student.update({
      where: { id: studentId },
      data: input,
    });

    // Publish risk tier change event if applicable
    if (input.riskTier && input.riskTier !== previous.riskTier) {
      eventBus.publish({
        type: 'student.risk_tier_changed',
        payload: {
          studentId: student.id,
          schoolId: student.schoolId,
          previousTier: previous.riskTier,
          newTier: input.riskTier,
        },
        timestamp: new Date(),
        source: 'StudentInformationService',
      });

      if (input.riskTier === 'URGENT') {
        await AlertService.create({
          type: 'GRADE_DROP',
          severity: 'CRITICAL',
          title: `Student moved to URGENT risk tier`,
          message: `${student.firstName} ${student.lastName} risk tier changed from ${previous.riskTier} to URGENT`,
          resourceType: 'Student',
          resourceId: studentId,
          schoolId: student.schoolId,
        });
      }
    }

    cacheService.invalidate(`student:${studentId}`);
    cacheService.invalidateByPrefix('demographics:');

    await AuditService.log({
      userId: requesterId,
      userRole: 'teacher',
      action: 'UPDATE',
      resource: 'Student',
      resourceId: studentId,
      details: { changes: input },
      schoolId: student.schoolId,
    });

    return student;
  }

  /**
   * Get enrollment details for a student.
   */
  static async getEnrollments(studentId: string): Promise<StudentEnrollmentInfo> {
    const enrollments = await prisma.enrollment.findMany({
      where: { studentId },
      include: {
        section: {
          include: {
            teachers: {
              include: { teacher: true },
              where: { role: 'primary' },
            },
          },
        },
      },
      orderBy: { enrollDate: 'desc' },
    });

    return {
      studentId,
      sections: enrollments.map((e) => ({
        sectionId: e.sectionId,
        courseName: e.section.courseName,
        period: e.section.period,
        teacherName: e.section.teachers[0]
          ? `${e.section.teachers[0].teacher.firstName} ${e.section.teachers[0].teacher.lastName}`
          : 'Unassigned',
        enrollDate: e.enrollDate.toISOString().split('T')[0],
        status: e.status,
      })),
    };
  }

  /**
   * Get demographic summary for a school.
   */
  static async getDemographicSummary(schoolId: string): Promise<StudentDemographicSummary> {
    const cacheKey = `demographics:${schoolId}`;

    return cacheService.getOrSet(cacheKey, async () => {
      const [students, byGrade, byRisk] = await Promise.all([
        prisma.student.count({ where: { schoolId } }),
        prisma.student.groupBy({
          by: ['gradeLevel'],
          where: { schoolId },
          _count: true,
          orderBy: { gradeLevel: 'asc' },
        }),
        prisma.student.groupBy({
          by: ['riskTier'],
          where: { schoolId },
          _count: true,
        }),
      ]);

      const [ellCount, iepCount, count504] = await Promise.all([
        prisma.student.count({ where: { schoolId, ellStatus: true } }),
        prisma.student.count({ where: { schoolId, iepActive: true } }),
        prisma.student.count({ where: { schoolId, has504: true } }),
      ]);

      return {
        totalStudents: students,
        byGradeLevel: byGrade.map((g) => ({ gradeLevel: g.gradeLevel, count: g._count })),
        byRiskTier: byRisk.map((r) => ({ tier: r.riskTier, count: r._count })),
        ellCount,
        iepCount,
        count504,
      };
    }, 300);
  }
}
