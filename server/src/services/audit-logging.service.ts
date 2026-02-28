import { prisma } from '../utils/prisma';

export interface AuditLogInput {
  schoolId: string;
  userId?: string;
  userEmail?: string;
  action: string;
  resource: string;
  resourceId?: string;
  details?: string;
  ipAddress?: string;
  userAgent?: string;
  status?: 'SUCCESS' | 'FAILURE' | 'DENIED';
}

export async function createAuditLog(input: AuditLogInput) {
  return prisma.auditLog.create({
    data: {
      schoolId: input.schoolId,
      userId: input.userId || null,
      userEmail: input.userEmail || null,
      action: input.action,
      resource: input.resource,
      resourceId: input.resourceId || null,
      details: input.details || null,
      ipAddress: input.ipAddress || null,
      userAgent: input.userAgent || null,
      status: (input.status as any) || 'SUCCESS',
    },
  });
}

export async function getAuditLogs(
  schoolId: string,
  filters: {
    userId?: string;
    action?: string;
    resource?: string;
    status?: string;
    startDate?: string;
    endDate?: string;
    limit?: number;
    offset?: number;
  }
) {
  const where: any = { schoolId };

  if (filters.userId) where.userId = filters.userId;
  if (filters.action) where.action = filters.action;
  if (filters.resource) where.resource = filters.resource;
  if (filters.status) where.status = filters.status;
  if (filters.startDate || filters.endDate) {
    where.createdAt = {};
    if (filters.startDate) where.createdAt.gte = new Date(filters.startDate);
    if (filters.endDate) where.createdAt.lte = new Date(filters.endDate);
  }

  const [logs, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: filters.limit || 100,
      skip: filters.offset || 0,
    }),
    prisma.auditLog.count({ where }),
  ]);

  return { logs, total };
}

export async function getAuditLogById(logId: string, schoolId: string) {
  return prisma.auditLog.findFirst({
    where: { id: logId, schoolId },
  });
}

export async function getAuditSummary(schoolId: string) {
  const now = new Date();
  const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const last7d = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  const [totalLast24h, failuresLast24h, deniedLast24h, totalLast7d] = await Promise.all([
    prisma.auditLog.count({ where: { schoolId, createdAt: { gte: last24h } } }),
    prisma.auditLog.count({ where: { schoolId, status: 'FAILURE', createdAt: { gte: last24h } } }),
    prisma.auditLog.count({ where: { schoolId, status: 'DENIED', createdAt: { gte: last24h } } }),
    prisma.auditLog.count({ where: { schoolId, createdAt: { gte: last7d } } }),
  ]);

  const actionBreakdown = await prisma.auditLog.groupBy({
    by: ['action'],
    where: { schoolId, createdAt: { gte: last24h } },
    _count: { id: true },
    orderBy: { _count: { id: 'desc' } },
    take: 10,
  });

  return {
    totalLast24h,
    failuresLast24h,
    deniedLast24h,
    totalLast7d,
    topActions: actionBreakdown.map((a: { action: string; _count: { id: number } }) => ({
      action: a.action,
      count: a._count.id,
    })),
  };
}
