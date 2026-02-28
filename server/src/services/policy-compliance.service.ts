import { prisma } from '../utils/prisma';
import { NotFoundError, ValidationError } from '../utils/errors';

export async function createPolicyRule(
  schoolId: string,
  input: {
    name: string;
    description: string;
    category: string;
    threshold?: string;
  }
) {
  return prisma.policyRule.create({
    data: {
      schoolId,
      name: input.name,
      description: input.description,
      category: input.category as any,
      threshold: input.threshold || null,
    },
  });
}

export async function getPolicyRules(
  schoolId: string,
  filters: { category?: string; isActive?: boolean }
) {
  return prisma.policyRule.findMany({
    where: {
      schoolId,
      ...(filters.category ? { category: filters.category as any } : {}),
      ...(filters.isActive !== undefined ? { isActive: filters.isActive } : {}),
    },
    include: {
      _count: { select: { violations: true } },
    },
    orderBy: { name: 'asc' },
  });
}

export async function updatePolicyRule(
  ruleId: string,
  schoolId: string,
  input: {
    name?: string;
    description?: string;
    isActive?: boolean;
    threshold?: string;
  }
) {
  const rule = await prisma.policyRule.findFirst({ where: { id: ruleId, schoolId } });
  if (!rule) {
    throw new NotFoundError('Policy rule not found');
  }

  return prisma.policyRule.update({
    where: { id: ruleId },
    data: {
      ...(input.name !== undefined ? { name: input.name } : {}),
      ...(input.description !== undefined ? { description: input.description } : {}),
      ...(input.isActive !== undefined ? { isActive: input.isActive } : {}),
      ...(input.threshold !== undefined ? { threshold: input.threshold } : {}),
    },
  });
}

export async function recordViolation(
  schoolId: string,
  input: {
    policyRuleId: string;
    studentId?: string;
    teacherId?: string;
    severity: string;
    description: string;
  }
) {
  const rule = await prisma.policyRule.findFirst({
    where: { id: input.policyRuleId, schoolId },
  });
  if (!rule) {
    throw new NotFoundError('Policy rule not found');
  }

  return prisma.complianceViolation.create({
    data: {
      policyRuleId: input.policyRuleId,
      schoolId,
      studentId: input.studentId || null,
      teacherId: input.teacherId || null,
      severity: input.severity as any,
      description: input.description,
    },
    include: {
      policyRule: { select: { name: true, category: true } },
    },
  });
}

export async function getViolations(
  schoolId: string,
  filters: {
    policyRuleId?: string;
    status?: string;
    severity?: string;
    studentId?: string;
    teacherId?: string;
  }
) {
  return prisma.complianceViolation.findMany({
    where: {
      schoolId,
      ...(filters.policyRuleId ? { policyRuleId: filters.policyRuleId } : {}),
      ...(filters.status ? { status: filters.status as any } : {}),
      ...(filters.severity ? { severity: filters.severity as any } : {}),
      ...(filters.studentId ? { studentId: filters.studentId } : {}),
      ...(filters.teacherId ? { teacherId: filters.teacherId } : {}),
    },
    include: {
      policyRule: { select: { name: true, category: true } },
    },
    orderBy: [{ severity: 'desc' }, { createdAt: 'desc' }],
  });
}

export async function updateViolationStatus(
  violationId: string,
  schoolId: string,
  teacherId: string,
  status: string,
  resolution?: string
) {
  const violation = await prisma.complianceViolation.findFirst({
    where: { id: violationId, schoolId },
  });
  if (!violation) {
    throw new NotFoundError('Violation not found');
  }

  return prisma.complianceViolation.update({
    where: { id: violationId },
    data: {
      status: status as any,
      ...(status === 'RESOLVED'
        ? { resolvedById: teacherId, resolvedAt: new Date(), resolution: resolution || null }
        : {}),
    },
    include: {
      policyRule: { select: { name: true, category: true } },
    },
  });
}

export async function getComplianceSummary(schoolId: string) {
  const [totalRules, activeRules, openViolations, criticalViolations] = await Promise.all([
    prisma.policyRule.count({ where: { schoolId } }),
    prisma.policyRule.count({ where: { schoolId, isActive: true } }),
    prisma.complianceViolation.count({
      where: { schoolId, status: { in: ['OPEN', 'ACKNOWLEDGED', 'IN_REMEDIATION'] } },
    }),
    prisma.complianceViolation.count({
      where: { schoolId, severity: 'CRITICAL', status: { in: ['OPEN', 'ACKNOWLEDGED'] } },
    }),
  ]);

  const violationsByCategory = await prisma.complianceViolation.groupBy({
    by: ['severity'],
    where: { schoolId, status: { in: ['OPEN', 'ACKNOWLEDGED', 'IN_REMEDIATION'] } },
    _count: { id: true },
  });

  return {
    totalRules,
    activeRules,
    openViolations,
    criticalViolations,
    violationsBySeverity: violationsByCategory.map((v) => ({
      severity: v.severity,
      count: v._count.id,
    })),
  };
}

/**
 * Run automated compliance checks for attendance policies.
 * Typically called on a schedule.
 */
export async function runAttendanceComplianceCheck(schoolId: string) {
  const attendanceRules = await prisma.policyRule.findMany({
    where: { schoolId, category: 'ATTENDANCE', isActive: true },
  });

  const violations: string[] = [];

  for (const rule of attendanceRules) {
    const threshold = rule.threshold ? JSON.parse(rule.threshold) : {};
    const maxAbsences = threshold.maxAbsences || 10;

    // Find students exceeding the absence threshold this semester
    const semesterStart = new Date();
    semesterStart.setMonth(semesterStart.getMonth() - 4);

    const students = await prisma.student.findMany({
      where: { schoolId },
      include: {
        attendanceRecords: {
          where: { date: { gte: semesterStart }, status: 'ABSENT' },
        },
      },
    });

    for (const student of students) {
      const absentDays = new Set(
        student.attendanceRecords.map((a) => a.date.toISOString().split('T')[0])
      ).size;

      if (absentDays >= maxAbsences) {
        // Check if violation already exists for this student and rule
        const existing = await prisma.complianceViolation.findFirst({
          where: {
            policyRuleId: rule.id,
            studentId: student.id,
            status: { in: ['OPEN', 'ACKNOWLEDGED', 'IN_REMEDIATION'] },
          },
        });

        if (!existing) {
          await prisma.complianceViolation.create({
            data: {
              policyRuleId: rule.id,
              schoolId,
              studentId: student.id,
              severity: absentDays >= maxAbsences * 1.5 ? 'CRITICAL' : 'WARNING',
              description: `Student ${student.firstName} ${student.lastName} has ${absentDays} absences this semester, exceeding the threshold of ${maxAbsences}.`,
            },
          });
          violations.push(`${student.firstName} ${student.lastName}: ${absentDays} absences`);
        }
      }
    }
  }

  return { violationsGenerated: violations.length, details: violations };
}
