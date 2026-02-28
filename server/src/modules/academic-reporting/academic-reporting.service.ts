import { prisma } from '../../utils/prisma';
import { AuditService } from '../../infrastructure/audit/audit.service';
import { cacheService } from '../../infrastructure/cache/cache.service';
import { percentageToLetter } from '../../utils/grades';
import {
  ReportRequest,
  GradeDistributionReport,
  PerformanceTrendReport,
  AtRiskReport,
  SectionComparisonReport,
  StudentProgressReport,
  ReportMetadata,
} from './academic-reporting.types';

// ─── Module 5: Academic Performance Reporting ─────────────────────────

export class AcademicReportingService {
  /**
   * Generate a report based on type and parameters.
   */
  static async generateReport(request: ReportRequest, requesterId: string, schoolId: string) {
    // Create report record
    const report = await prisma.academicReport.create({
      data: {
        title: `${request.type.replace(/_/g, ' ')} Report`,
        type: request.type,
        scope: request.scope,
        scopeId: request.scopeId,
        generatedById: requesterId,
        parameters: (request.parameters as any) ?? null,
        format: request.format ?? 'JSON',
        status: 'GENERATING',
        schoolId,
      },
    });

    try {
      let data: unknown;

      switch (request.type) {
        case 'GRADE_DISTRIBUTION':
          data = await this.generateGradeDistribution(request.scopeId);
          break;
        case 'PERFORMANCE_TREND':
          data = await this.generatePerformanceTrend(request.scope, request.scopeId);
          break;
        case 'AT_RISK_IDENTIFICATION':
          data = await this.generateAtRiskReport(request.scopeId);
          break;
        case 'SECTION_COMPARISON':
          data = await this.generateSectionComparison(request.scopeId);
          break;
        case 'STUDENT_PROGRESS':
          data = await this.generateStudentProgress(request.scopeId);
          break;
        default:
          data = { message: `Report type ${request.type} is being generated` };
      }

      // Update report with data
      await prisma.academicReport.update({
        where: { id: report.id },
        data: { data: data as any, status: 'COMPLETED', completedAt: new Date() },
      });

      await AuditService.log({
        userId: requesterId,
        userRole: 'teacher',
        action: 'CREATE',
        resource: 'AcademicReport',
        resourceId: report.id,
        details: { type: request.type, scope: request.scope },
        schoolId,
      });

      return { ...report, data, status: 'COMPLETED' };
    } catch (error) {
      await prisma.academicReport.update({
        where: { id: report.id },
        data: { status: 'FAILED' },
      });
      throw error;
    }
  }

  /**
   * Generate grade distribution report for a section.
   */
  static async generateGradeDistribution(sectionId: string): Promise<GradeDistributionReport> {
    const cacheKey = `report:grade-dist:${sectionId}`;

    return cacheService.getOrSet(cacheKey, async () => {
      const section = await prisma.section.findUniqueOrThrow({
        where: { id: sectionId },
        include: {
          assignments: {
            include: {
              grades: { where: { pointsEarned: { not: null } } },
            },
          },
          enrollments: { where: { status: 'ACTIVE' } },
        },
      });

      // Calculate each student's overall grade
      const studentGrades = new Map<string, number>();
      const studentIds = section.enrollments.map((e) => e.studentId);

      for (const studentId of studentIds) {
        let totalEarned = 0;
        let totalPossible = 0;
        for (const assignment of section.assignments) {
          const grade = assignment.grades.find((g) => g.studentId === studentId);
          if (grade?.pointsEarned != null) {
            totalEarned += grade.pointsEarned;
            totalPossible += assignment.pointsPossible;
          }
        }
        if (totalPossible > 0) {
          studentGrades.set(studentId, (totalEarned / totalPossible) * 100);
        }
      }

      const grades = Array.from(studentGrades.values());
      const sorted = [...grades].sort((a, b) => a - b);

      // Grade distribution
      const letterBuckets: Record<string, number> = { A: 0, B: 0, C: 0, D: 0, F: 0 };
      for (const g of grades) {
        if (g >= 90) letterBuckets['A']++;
        else if (g >= 80) letterBuckets['B']++;
        else if (g >= 70) letterBuckets['C']++;
        else if (g >= 60) letterBuckets['D']++;
        else letterBuckets['F']++;
      }

      const total = grades.length || 1;
      const mean = grades.reduce((s, g) => s + g, 0) / total;
      const median = sorted.length > 0 ? sorted[Math.floor(sorted.length / 2)] : 0;
      const variance = grades.reduce((s, g) => s + Math.pow(g - mean, 2), 0) / total;

      return {
        sectionId,
        courseName: section.courseName,
        period: section.period,
        totalStudents: studentIds.length,
        distribution: Object.entries(letterBuckets).map(([letter, count]) => ({
          letter,
          count,
          percentage: Math.round((count / total) * 1000) / 10,
        })),
        classAverage: Math.round(mean * 10) / 10,
        median: Math.round(median * 10) / 10,
        standardDeviation: Math.round(Math.sqrt(variance) * 10) / 10,
        passingRate: Math.round(((total - letterBuckets['F']) / total) * 1000) / 10,
      };
    }, 300);
  }

  /**
   * Generate performance trend report.
   */
  static async generatePerformanceTrend(scope: string, scopeId: string): Promise<PerformanceTrendReport> {
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

    let entityName = '';

    if (scope === 'STUDENT') {
      const student = await prisma.student.findUniqueOrThrow({
        where: { id: scopeId },
        select: { firstName: true, lastName: true },
      });
      entityName = `${student.firstName} ${student.lastName}`;
    } else if (scope === 'SECTION') {
      const section = await prisma.section.findUniqueOrThrow({
        where: { id: scopeId },
        select: { courseName: true, period: true },
      });
      entityName = `${section.courseName} — ${section.period}`;
    }

    // Generate 8-week trend data
    const trendData: PerformanceTrendReport['trendData'] = [];
    const today = new Date();

    for (let w = 7; w >= 0; w--) {
      const weekEnd = new Date(today);
      weekEnd.setDate(weekEnd.getDate() - w * 7);
      const weekStart = new Date(weekEnd);
      weekStart.setDate(weekStart.getDate() - 7);

      // For simplicity, compute a weekly aggregate
      trendData.push({
        period: weekEnd.toISOString().split('T')[0],
        averageGrade: 75 + Math.random() * 15, // Placeholder - in production, compute from real data
        attendanceRate: 85 + Math.random() * 12,
        missingWorkCount: Math.floor(Math.random() * 5),
        interventionCount: Math.floor(Math.random() * 3),
      });
    }

    // Determine trend direction
    const firstHalf = trendData.slice(0, 4);
    const secondHalf = trendData.slice(4);
    const firstAvg = firstHalf.reduce((s, d) => s + d.averageGrade, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((s, d) => s + d.averageGrade, 0) / secondHalf.length;

    const overallTrend = secondAvg - firstAvg > 2 ? 'improving' : secondAvg - firstAvg < -2 ? 'declining' : 'stable';

    return {
      entityId: scopeId,
      entityType: scope,
      entityName,
      trendData,
      overallTrend,
    };
  }

  /**
   * Generate at-risk identification report.
   */
  static async generateAtRiskReport(schoolId: string): Promise<AtRiskReport> {
    const cacheKey = `report:at-risk:${schoolId}`;

    return cacheService.getOrSet(cacheKey, async () => {
      const students = await prisma.student.findMany({
        where: {
          schoolId,
          riskTier: { in: ['NEEDS_SUPPORT', 'URGENT'] },
        },
        include: {
          enrollments: {
            where: { status: 'ACTIVE' },
            include: {
              section: {
                include: {
                  assignments: { include: { grades: true } },
                },
              },
            },
          },
          interventions: { where: { status: 'ACTIVE' } },
          attendanceRecords: {
            where: {
              date: { gte: new Date(new Date().setDate(new Date().getDate() - 90)) },
            },
          },
        },
      });

      const atRiskStudents = students.map((student) => {
        // Calculate current performance
        let totalEarned = 0;
        let totalPossible = 0;
        let missingCount = 0;
        let failingCourses = 0;

        for (const enrollment of student.enrollments) {
          let sectionEarned = 0;
          let sectionPossible = 0;
          for (const assignment of enrollment.section.assignments) {
            const grade = assignment.grades.find((g) => g.studentId === student.id);
            if (grade?.pointsEarned != null) {
              sectionEarned += grade.pointsEarned;
              sectionPossible += assignment.pointsPossible;
            }
            if (grade?.isMissing) missingCount++;
          }
          totalEarned += sectionEarned;
          totalPossible += sectionPossible;
          if (sectionPossible > 0 && (sectionEarned / sectionPossible) * 100 < 60) {
            failingCourses++;
          }
        }

        const totalDays = student.attendanceRecords.length || 1;
        const absentDays = student.attendanceRecords.filter((r) => r.status === 'ABSENT').length;
        const attendanceRate = Math.round(((totalDays - absentDays) / totalDays) * 1000) / 10;

        // Identify risk factors
        const riskFactors: string[] = [];
        if (attendanceRate < 90) riskFactors.push('Chronic absenteeism');
        if (failingCourses > 0) riskFactors.push(`Failing ${failingCourses} course(s)`);
        if (missingCount >= 5) riskFactors.push('High missing work count');
        if (student.cumulativeGpa !== null && student.cumulativeGpa < 2.0) riskFactors.push('Low GPA');

        // Recommend actions
        const recommendedActions: string[] = [];
        if (attendanceRate < 85) recommendedActions.push('Attendance intervention plan');
        if (failingCourses > 0) recommendedActions.push('Academic tutoring referral');
        if (missingCount >= 3) recommendedActions.push('Missing work recovery plan');
        if (student.interventions.length === 0) recommendedActions.push('Consider SST referral');

        return {
          studentId: student.id,
          studentName: `${student.firstName} ${student.lastName}`,
          gradeLevel: student.gradeLevel,
          riskTier: student.riskTier,
          riskFactors,
          currentGpa: student.cumulativeGpa,
          attendanceRate,
          failingCourseCount: failingCourses,
          missingWorkCount: missingCount,
          activeInterventions: student.interventions.length,
          recommendedActions,
        };
      });

      // Summary stats
      const byGradeLevel = new Map<number, number>();
      const factorCounts = new Map<string, number>();

      for (const s of atRiskStudents) {
        byGradeLevel.set(s.gradeLevel, (byGradeLevel.get(s.gradeLevel) || 0) + 1);
        for (const f of s.riskFactors) {
          factorCounts.set(f, (factorCounts.get(f) || 0) + 1);
        }
      }

      return {
        students: atRiskStudents,
        summary: {
          totalAtRisk: atRiskStudents.length,
          totalUrgent: atRiskStudents.filter((s) => s.riskTier === 'URGENT').length,
          byGradeLevel: Array.from(byGradeLevel.entries())
            .map(([gradeLevel, count]) => ({ gradeLevel, count }))
            .sort((a, b) => a.gradeLevel - b.gradeLevel),
          topRiskFactors: Array.from(factorCounts.entries())
            .map(([factor, count]) => ({ factor, count }))
            .sort((a, b) => b.count - a.count),
        },
      };
    }, 300);
  }

  /**
   * Generate section comparison report.
   */
  static async generateSectionComparison(schoolId: string): Promise<SectionComparisonReport> {
    const sections = await prisma.section.findMany({
      where: { schoolId },
      include: {
        teachers: {
          include: { teacher: { select: { firstName: true, lastName: true } } },
          where: { role: 'primary' },
        },
        enrollments: {
          where: { status: 'ACTIVE' },
          select: { studentId: true },
        },
        assignments: {
          include: {
            grades: { where: { pointsEarned: { not: null } } },
          },
        },
      },
    });

    const sectionData = sections.map((section) => {
      const studentIds = section.enrollments.map((e) => e.studentId);
      const studentGrades: number[] = [];

      for (const studentId of studentIds) {
        let earned = 0;
        let possible = 0;
        for (const a of section.assignments) {
          const g = a.grades.find((g) => g.studentId === studentId);
          if (g?.pointsEarned != null) {
            earned += g.pointsEarned;
            possible += a.pointsPossible;
          }
        }
        if (possible > 0) studentGrades.push((earned / possible) * 100);
      }

      const avg = studentGrades.length > 0
        ? studentGrades.reduce((s, g) => s + g, 0) / studentGrades.length
        : 0;
      const passingRate = studentGrades.length > 0
        ? (studentGrades.filter((g) => g >= 60).length / studentGrades.length) * 100
        : 100;

      const teacherName = section.teachers[0]
        ? `${section.teachers[0].teacher.firstName} ${section.teachers[0].teacher.lastName}`
        : 'Unassigned';

      return {
        sectionId: section.id,
        courseName: section.courseName,
        period: section.period,
        teacherName,
        classAverage: Math.round(avg * 10) / 10,
        attendanceRate: 0, // Would compute from attendance records
        passingRate: Math.round(passingRate * 10) / 10,
        missingWorkRate: 0,
        studentCount: studentIds.length,
      };
    });

    return { sections: sectionData };
  }

  /**
   * Generate student progress report.
   */
  static async generateStudentProgress(studentId: string): Promise<StudentProgressReport> {
    const student = await prisma.student.findUniqueOrThrow({
      where: { id: studentId },
      include: {
        enrollments: {
          where: { status: 'ACTIVE' },
          include: {
            section: {
              include: {
                assignments: {
                  include: { grades: { where: { studentId } } },
                  orderBy: { dueDate: 'desc' },
                },
              },
            },
          },
        },
        interventions: { where: { status: 'ACTIVE' } },
        behavioralIncidents: {
          where: {
            incidentDate: { gte: new Date(new Date().setDate(new Date().getDate() - 30)) },
          },
        },
        attendanceRecords: {
          where: {
            date: { gte: new Date(new Date().setDate(new Date().getDate() - 90)) },
          },
        },
      },
    });

    const totalDays = new Set(student.attendanceRecords.map((r) => r.date.toISOString().split('T')[0])).size || 1;
    const absentDays = new Set(
      student.attendanceRecords.filter((r) => r.status === 'ABSENT').map((r) => r.date.toISOString().split('T')[0])
    ).size;
    const overallAttendanceRate = Math.round(((totalDays - absentDays) / totalDays) * 1000) / 10;

    const courses = student.enrollments.map((enrollment) => {
      const section = enrollment.section;
      let earned = 0;
      let possible = 0;
      let missingAssignments = 0;

      for (const a of section.assignments) {
        const grade = a.grades[0];
        if (grade?.pointsEarned != null) {
          earned += grade.pointsEarned;
          possible += a.pointsPossible;
        }
        if (grade?.isMissing) missingAssignments++;
      }

      const currentGrade = possible > 0 ? Math.round((earned / possible) * 1000) / 10 : 0;

      return {
        courseName: section.courseName,
        period: section.period,
        currentGrade,
        letterGrade: percentageToLetter(currentGrade),
        previousGrade: currentGrade, // Simplified: would compare to prior period
        trend: 'stable' as const,
        missingAssignments,
        attendanceRate: overallAttendanceRate,
        teacherObservations: 0,
      };
    });

    return {
      studentId: student.id,
      studentName: `${student.firstName} ${student.lastName}`,
      gradeLevel: student.gradeLevel,
      reportPeriod: {
        start: new Date(new Date().setDate(new Date().getDate() - 90)).toISOString().split('T')[0],
        end: new Date().toISOString().split('T')[0],
      },
      courses,
      overallGpa: student.cumulativeGpa,
      overallAttendanceRate,
      activeInterventions: student.interventions.length,
      behavioralIncidents: student.behavioralIncidents.length,
    };
  }

  /**
   * List generated reports for a school.
   */
  static async listReports(schoolId: string, params?: { type?: string; limit?: number }): Promise<ReportMetadata[]> {
    const where: Record<string, unknown> = { schoolId };
    if (params?.type) where.type = params.type;

    const reports = await prisma.academicReport.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: params?.limit ?? 50,
    });

    return reports.map((r) => ({
      id: r.id,
      title: r.title,
      type: r.type,
      scope: r.scope,
      scopeId: r.scopeId,
      status: r.status,
      format: r.format,
      generatedById: r.generatedById,
      createdAt: r.createdAt.toISOString(),
      completedAt: r.completedAt?.toISOString() ?? null,
    }));
  }

  /**
   * Get a specific report by ID.
   */
  static async getReport(reportId: string) {
    return prisma.academicReport.findUniqueOrThrow({ where: { id: reportId } });
  }
}
