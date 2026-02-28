import { prisma } from '../utils/prisma';
import { NotFoundError, ValidationError } from '../utils/errors';

export async function createAlertRule(
  teacherId: string,
  schoolId: string,
  input: {
    name: string;
    description?: string;
    category: string;
    condition: string;
    channels?: string;
    priority?: string;
  }
) {
  return prisma.alertRule.create({
    data: {
      schoolId,
      createdById: teacherId,
      name: input.name,
      description: input.description || null,
      category: input.category as any,
      condition: input.condition,
      channels: input.channels || 'IN_APP',
      priority: (input.priority as any) || 'MEDIUM',
    },
    include: {
      createdBy: { select: { firstName: true, lastName: true } },
    },
  });
}

export async function getAlertRules(
  schoolId: string,
  filters: { category?: string; isActive?: boolean }
) {
  return prisma.alertRule.findMany({
    where: {
      schoolId,
      ...(filters.category ? { category: filters.category as any } : {}),
      ...(filters.isActive !== undefined ? { isActive: filters.isActive } : {}),
    },
    include: {
      createdBy: { select: { firstName: true, lastName: true } },
      _count: { select: { alerts: true } },
    },
    orderBy: { createdAt: 'desc' },
  });
}

export async function updateAlertRule(
  ruleId: string,
  schoolId: string,
  input: {
    name?: string;
    description?: string;
    condition?: string;
    isActive?: boolean;
    channels?: string;
    priority?: string;
  }
) {
  const rule = await prisma.alertRule.findFirst({ where: { id: ruleId, schoolId } });
  if (!rule) {
    throw new NotFoundError('Alert rule not found');
  }

  return prisma.alertRule.update({
    where: { id: ruleId },
    data: {
      ...(input.name !== undefined ? { name: input.name } : {}),
      ...(input.description !== undefined ? { description: input.description } : {}),
      ...(input.condition !== undefined ? { condition: input.condition } : {}),
      ...(input.isActive !== undefined ? { isActive: input.isActive } : {}),
      ...(input.channels !== undefined ? { channels: input.channels } : {}),
      ...(input.priority !== undefined ? { priority: input.priority as any } : {}),
    },
    include: {
      createdBy: { select: { firstName: true, lastName: true } },
    },
  });
}

export async function createAlert(
  schoolId: string,
  input: {
    alertRuleId?: string;
    teacherId?: string;
    studentId?: string;
    title: string;
    message: string;
    priority?: string;
    channel?: string;
    expiresAt?: string;
  }
) {
  return prisma.alert.create({
    data: {
      schoolId,
      alertRuleId: input.alertRuleId || null,
      teacherId: input.teacherId || null,
      studentId: input.studentId || null,
      title: input.title,
      message: input.message,
      priority: (input.priority as any) || 'MEDIUM',
      channel: input.channel || 'IN_APP',
      expiresAt: input.expiresAt ? new Date(input.expiresAt) : null,
    },
  });
}

export async function getAlerts(
  schoolId: string,
  filters: {
    teacherId?: string;
    studentId?: string;
    status?: string;
    priority?: string;
    limit?: number;
  }
) {
  return prisma.alert.findMany({
    where: {
      schoolId,
      ...(filters.teacherId ? { teacherId: filters.teacherId } : {}),
      ...(filters.studentId ? { studentId: filters.studentId } : {}),
      ...(filters.status ? { status: filters.status as any } : {}),
      ...(filters.priority ? { priority: filters.priority as any } : {}),
    },
    include: {
      alertRule: { select: { name: true, category: true } },
    },
    orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }],
    take: filters.limit || 100,
  });
}

export async function getTeacherAlerts(
  teacherId: string,
  filters: { status?: string; priority?: string; limit?: number }
) {
  return prisma.alert.findMany({
    where: {
      teacherId,
      ...(filters.status ? { status: filters.status as any } : {}),
      ...(filters.priority ? { priority: filters.priority as any } : {}),
    },
    include: {
      alertRule: { select: { name: true, category: true } },
    },
    orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }],
    take: filters.limit || 50,
  });
}

export async function acknowledgeAlert(alertId: string, teacherId: string) {
  const alert = await prisma.alert.findFirst({ where: { id: alertId, teacherId } });
  if (!alert) {
    throw new NotFoundError('Alert not found');
  }

  return prisma.alert.update({
    where: { id: alertId },
    data: {
      status: 'ACKNOWLEDGED',
      acknowledgedById: teacherId,
      acknowledgedAt: new Date(),
    },
  });
}

export async function resolveAlert(alertId: string, teacherId: string) {
  const alert = await prisma.alert.findFirst({ where: { id: alertId, teacherId } });
  if (!alert) {
    throw new NotFoundError('Alert not found');
  }

  return prisma.alert.update({
    where: { id: alertId },
    data: { status: 'RESOLVED' },
  });
}

export async function getAlertSummary(teacherId: string) {
  const [active, critical, acknowledged, total] = await Promise.all([
    prisma.alert.count({ where: { teacherId, status: 'ACTIVE' } }),
    prisma.alert.count({ where: { teacherId, status: 'ACTIVE', priority: 'CRITICAL' } }),
    prisma.alert.count({ where: { teacherId, status: 'ACKNOWLEDGED' } }),
    prisma.alert.count({ where: { teacherId } }),
  ]);

  return { active, critical, acknowledged, total };
}

/**
 * Expire alerts that have passed their expiration time.
 * Typically run on a schedule.
 */
export async function expireAlerts() {
  const now = new Date();

  const result = await prisma.alert.updateMany({
    where: {
      expiresAt: { lte: now },
      status: { in: ['ACTIVE', 'ACKNOWLEDGED'] },
    },
    data: { status: 'EXPIRED' },
  });

  return { expiredCount: result.count };
}
