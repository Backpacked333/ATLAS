import { prisma } from '../utils/prisma';
import { NotFoundError } from '../utils/errors';

export async function getScheduledBackups(isActive?: boolean) {
  return prisma.scheduledBackup.findMany({
    where: {
      ...(isActive !== undefined ? { isActive } : {}),
    },
    include: {
      _count: { select: { recoveryPoints: true } },
    },
    orderBy: { name: 'asc' },
  });
}

export async function getScheduledBackupById(backupId: string) {
  const backup = await prisma.scheduledBackup.findUnique({
    where: { id: backupId },
    include: {
      recoveryPoints: { orderBy: { createdAt: 'desc' }, take: 10 },
      _count: { select: { recoveryPoints: true } },
    },
  });
  if (!backup) throw new NotFoundError('Scheduled backup not found');
  return backup;
}

export async function createScheduledBackup(input: {
  name: string;
  type: string;
  schedule: string;
  retention?: number;
  destination: string;
}) {
  return prisma.scheduledBackup.create({
    data: {
      name: input.name,
      type: input.type as any,
      schedule: input.schedule,
      retention: input.retention || 30,
      destination: input.destination,
    },
    include: {
      _count: { select: { recoveryPoints: true } },
    },
  });
}

export async function updateScheduledBackup(backupId: string, input: {
  schedule?: string;
  retention?: number;
  isActive?: boolean;
  destination?: string;
}) {
  const backup = await prisma.scheduledBackup.findUnique({ where: { id: backupId } });
  if (!backup) throw new NotFoundError('Scheduled backup not found');

  return prisma.scheduledBackup.update({
    where: { id: backupId },
    data: input,
  });
}

export async function getRecoveryPoints(filters: {
  scheduledBackupId?: string;
  type?: string;
  status?: string;
  limit?: number;
}) {
  return prisma.recoveryPoint.findMany({
    where: {
      ...(filters.scheduledBackupId ? { scheduledBackupId: filters.scheduledBackupId } : {}),
      ...(filters.type ? { type: filters.type as any } : {}),
      ...(filters.status ? { status: filters.status as any } : {}),
    },
    orderBy: { createdAt: 'desc' },
    take: filters.limit || 50,
  });
}

export async function createRecoveryPoint(input: {
  scheduledBackupId?: string;
  type: string;
  location: string;
  retainUntil?: string;
}) {
  const point = await prisma.recoveryPoint.create({
    data: {
      scheduledBackupId: input.scheduledBackupId || null,
      type: input.type as any,
      location: input.location,
      retainUntil: input.retainUntil ? new Date(input.retainUntil) : null,
      status: 'IN_PROGRESS',
    },
  });

  // Update parent's lastRunAt
  if (input.scheduledBackupId) {
    await prisma.scheduledBackup.update({
      where: { id: input.scheduledBackupId },
      data: { lastRunAt: new Date() },
    });
  }

  return point;
}

export async function completeRecoveryPoint(pointId: string, input: {
  status: string;
  sizeBytes?: number;
  checksum?: string;
  errorMessage?: string;
}) {
  const point = await prisma.recoveryPoint.findUnique({ where: { id: pointId } });
  if (!point) throw new NotFoundError('Recovery point not found');

  return prisma.recoveryPoint.update({
    where: { id: pointId },
    data: {
      status: input.status as any,
      sizeBytes: input.sizeBytes ? BigInt(input.sizeBytes) : null,
      checksum: input.checksum || null,
      isVerified: input.checksum ? true : false,
      completedAt: new Date(),
      errorMessage: input.errorMessage || null,
    },
  });
}

export async function getRetentionPolicies() {
  return prisma.retentionPolicy.findMany({
    orderBy: { name: 'asc' },
  });
}

export async function createRetentionPolicy(input: {
  name: string;
  backupType: string;
  retentionDays: number;
  maxCopies?: number;
}) {
  return prisma.retentionPolicy.create({
    data: {
      name: input.name,
      backupType: input.backupType as any,
      retentionDays: input.retentionDays,
      maxCopies: input.maxCopies || 10,
    },
  });
}

export async function enforceRetention() {
  const policies = await prisma.retentionPolicy.findMany({ where: { isActive: true } });
  let totalCleaned = 0;

  for (const policy of policies) {
    const cutoff = new Date(Date.now() - policy.retentionDays * 24 * 60 * 60 * 1000);
    const result = await prisma.recoveryPoint.deleteMany({
      where: {
        type: policy.backupType,
        retainUntil: { lt: cutoff },
        status: 'COMPLETED',
      },
    });
    totalCleaned += result.count;
  }

  return { cleanedPoints: totalCleaned };
}

export async function getBackupRecoverySummary() {
  const [
    totalScheduled,
    activeScheduled,
    totalRecoveryPoints,
    completedPoints,
    totalSize,
    retentionPolicies,
  ] = await Promise.all([
    prisma.scheduledBackup.count(),
    prisma.scheduledBackup.count({ where: { isActive: true } }),
    prisma.recoveryPoint.count(),
    prisma.recoveryPoint.count({ where: { status: 'COMPLETED' } }),
    prisma.recoveryPoint.aggregate({
      _sum: { sizeBytes: true },
      where: { status: 'COMPLETED' },
    }),
    prisma.retentionPolicy.count({ where: { isActive: true } }),
  ]);

  return {
    totalScheduled,
    activeScheduled,
    totalRecoveryPoints,
    completedPoints,
    totalSizeBytes: totalSize._sum.sizeBytes ? Number(totalSize._sum.sizeBytes) : 0,
    activeRetentionPolicies: retentionPolicies,
  };
}
