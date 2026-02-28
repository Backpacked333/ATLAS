import { prisma } from '../utils/prisma';
import { NotFoundError, ValidationError } from '../utils/errors';

const VALID_REPORT_TYPES = [
  'ATTENDANCE_SUMMARY', 'GRADE_DISTRIBUTION', 'INTERVENTION_PROGRESS',
  'BEHAVIOR_TRENDS', 'COMPLIANCE_STATUS', 'STUDENT_RISK', 'CUSTOM',
];

export async function createReportDefinition(
  teacherId: string,
  schoolId: string,
  input: {
    name: string;
    description?: string;
    type: string;
    config: string;
    schedule?: string;
  }
) {
  if (!VALID_REPORT_TYPES.includes(input.type)) {
    throw new ValidationError(`type must be one of: ${VALID_REPORT_TYPES.join(', ')}`);
  }

  return prisma.reportDefinition.create({
    data: {
      schoolId,
      createdById: teacherId,
      name: input.name,
      description: input.description || null,
      type: input.type as any,
      config: input.config,
      schedule: input.schedule || null,
    },
    include: {
      createdBy: { select: { firstName: true, lastName: true } },
    },
  });
}

export async function getReportDefinitions(
  schoolId: string,
  filters: { type?: string; isActive?: boolean }
) {
  return prisma.reportDefinition.findMany({
    where: {
      schoolId,
      ...(filters.type ? { type: filters.type as any } : {}),
      ...(filters.isActive !== undefined ? { isActive: filters.isActive } : {}),
    },
    include: {
      createdBy: { select: { firstName: true, lastName: true } },
      _count: { select: { snapshots: true } },
    },
    orderBy: { updatedAt: 'desc' },
  });
}

export async function getReportDefinitionById(reportId: string, schoolId: string) {
  const report = await prisma.reportDefinition.findFirst({
    where: { id: reportId, schoolId },
    include: {
      createdBy: { select: { firstName: true, lastName: true } },
      snapshots: {
        orderBy: { generatedAt: 'desc' },
        take: 10,
      },
    },
  });

  if (!report) {
    throw new NotFoundError('Report definition not found');
  }

  return report;
}

export async function updateReportDefinition(
  reportId: string,
  schoolId: string,
  input: {
    name?: string;
    description?: string;
    config?: string;
    schedule?: string;
    isActive?: boolean;
  }
) {
  const report = await prisma.reportDefinition.findFirst({ where: { id: reportId, schoolId } });
  if (!report) {
    throw new NotFoundError('Report definition not found');
  }

  return prisma.reportDefinition.update({
    where: { id: reportId },
    data: {
      ...(input.name !== undefined ? { name: input.name } : {}),
      ...(input.description !== undefined ? { description: input.description } : {}),
      ...(input.config !== undefined ? { config: input.config } : {}),
      ...(input.schedule !== undefined ? { schedule: input.schedule } : {}),
      ...(input.isActive !== undefined ? { isActive: input.isActive } : {}),
    },
    include: {
      createdBy: { select: { firstName: true, lastName: true } },
    },
  });
}

export async function generateReport(
  reportId: string,
  schoolId: string,
  teacherId: string
) {
  const report = await prisma.reportDefinition.findFirst({
    where: { id: reportId, schoolId },
  });
  if (!report) {
    throw new NotFoundError('Report definition not found');
  }

  // Generate report data based on type
  const data = await generateReportData(report.type, schoolId, report.config);

  const snapshot = await prisma.reportSnapshot.create({
    data: {
      reportDefinitionId: reportId,
      generatedById: teacherId,
      data: JSON.stringify(data.rows),
      recordCount: data.recordCount,
    },
  });

  // Update lastRunAt
  await prisma.reportDefinition.update({
    where: { id: reportId },
    data: { lastRunAt: new Date() },
  });

  return snapshot;
}

async function generateReportData(
  type: string,
  schoolId: string,
  _config: string
): Promise<{ rows: any[]; recordCount: number }> {
  switch (type) {
    case 'ATTENDANCE_SUMMARY': {
      const students = await prisma.student.findMany({
        where: { schoolId },
        select: {
          id: true, firstName: true, lastName: true, gradeLevel: true,
          attendanceRecords: {
            where: { date: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } },
          },
        },
      });

      const rows = students.map((s) => {
        const total = s.attendanceRecords.length;
        const present = s.attendanceRecords.filter((a) => a.status === 'PRESENT').length;
        const absent = s.attendanceRecords.filter((a) => a.status === 'ABSENT').length;
        const tardy = s.attendanceRecords.filter((a) => a.status === 'TARDY').length;
        return {
          studentId: s.id,
          name: `${s.firstName} ${s.lastName}`,
          gradeLevel: s.gradeLevel,
          totalDays: total,
          present,
          absent,
          tardy,
          attendanceRate: total > 0 ? Math.round((present / total) * 100) : 0,
        };
      });

      return { rows, recordCount: rows.length };
    }

    case 'GRADE_DISTRIBUTION': {
      const sections = await prisma.section.findMany({
        where: { schoolId },
        include: {
          enrollments: {
            where: { status: 'ACTIVE' },
            include: {
              student: {
                select: {
                  id: true, firstName: true, lastName: true,
                  grades: {
                    include: { assignment: { select: { sectionId: true, pointsPossible: true } } },
                  },
                },
              },
            },
          },
        },
      });

      const rows = sections.map((section) => {
        const grades = section.enrollments.map((e) => {
          const sectionGrades = e.student.grades.filter(
            (g) => g.assignment.sectionId === section.id && g.pointsEarned !== null
          );
          const totalEarned = sectionGrades.reduce((sum, g) => sum + (g.pointsEarned || 0), 0);
          const totalPossible = sectionGrades.reduce((sum, g) => sum + g.assignment.pointsPossible, 0);
          return totalPossible > 0 ? (totalEarned / totalPossible) * 100 : 0;
        });
        const avg = grades.length > 0 ? grades.reduce((a, b) => a + b, 0) / grades.length : 0;
        return {
          sectionId: section.id,
          courseName: section.courseName,
          period: section.period,
          studentCount: section.enrollments.length,
          averageGrade: Math.round(avg * 10) / 10,
          failingCount: grades.filter((g) => g < 60).length,
        };
      });

      return { rows, recordCount: rows.length };
    }

    default: {
      return { rows: [], recordCount: 0 };
    }
  }
}

export async function getReportSnapshots(
  reportId: string,
  schoolId: string,
  limit = 20
) {
  const report = await prisma.reportDefinition.findFirst({
    where: { id: reportId, schoolId },
  });
  if (!report) {
    throw new NotFoundError('Report definition not found');
  }

  return prisma.reportSnapshot.findMany({
    where: { reportDefinitionId: reportId },
    orderBy: { generatedAt: 'desc' },
    take: limit,
  });
}
