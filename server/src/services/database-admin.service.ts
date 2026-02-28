import { prisma } from '../utils/prisma';
import { NotFoundError } from '../utils/errors';

export async function getMigrations(filters: { status?: string }) {
  return prisma.databaseMigration.findMany({
    where: {
      ...(filters.status ? { status: filters.status as any } : {}),
    },
    orderBy: { createdAt: 'desc' },
  });
}

export async function getMigrationById(migrationId: string) {
  const migration = await prisma.databaseMigration.findUnique({
    where: { id: migrationId },
  });
  if (!migration) {
    throw new NotFoundError('Migration not found');
  }
  return migration;
}

export async function recordMigration(input: {
  version: string;
  name: string;
  description?: string;
  checksum?: string;
}) {
  return prisma.databaseMigration.create({
    data: {
      version: input.version,
      name: input.name,
      description: input.description || null,
      checksum: input.checksum || null,
      status: 'APPLIED',
      appliedAt: new Date(),
    },
  });
}

export async function runHealthCheck() {
  const startTime = Date.now();
  let status: 'HEALTHY' | 'DEGRADED' | 'UNHEALTHY' = 'HEALTHY';
  let details: any = {};

  try {
    // Test database connectivity
    await prisma.$queryRaw`SELECT 1`;
    const responseTime = Date.now() - startTime;

    // Get table counts for key tables
    const [studentCount, teacherCount, sectionCount] = await Promise.all([
      prisma.student.count(),
      prisma.teacher.count(),
      prisma.section.count(),
    ]);

    details = {
      databaseConnected: true,
      responseTimeMs: responseTime,
      tableCounts: {
        students: studentCount,
        teachers: teacherCount,
        sections: sectionCount,
      },
    };

    if (responseTime > 1000) {
      status = 'DEGRADED';
    }
  } catch (error) {
    status = 'UNHEALTHY';
    details = {
      databaseConnected: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }

  const responseTime = Date.now() - startTime;

  // Record the health check
  const healthCheck = await prisma.databaseHealthCheck.create({
    data: {
      component: 'primary_db',
      status: status as any,
      responseTimeMs: responseTime,
      details: JSON.stringify(details),
    },
  });

  return {
    ...healthCheck,
    parsedDetails: details,
  };
}

export async function getHealthCheckHistory(
  component: string,
  limit = 50
) {
  return prisma.databaseHealthCheck.findMany({
    where: { component },
    orderBy: { checkedAt: 'desc' },
    take: limit,
  });
}

export async function getBackupRecords(filters: {
  type?: string;
  status?: string;
  limit?: number;
}) {
  return prisma.backupRecord.findMany({
    where: {
      ...(filters.type ? { type: filters.type as any } : {}),
      ...(filters.status ? { status: filters.status as any } : {}),
    },
    orderBy: { startedAt: 'desc' },
    take: filters.limit || 50,
  });
}

export async function recordBackup(input: {
  type: string;
  location?: string;
  expiresAt?: string;
}) {
  return prisma.backupRecord.create({
    data: {
      type: input.type as any,
      location: input.location || null,
      expiresAt: input.expiresAt ? new Date(input.expiresAt) : null,
      status: 'IN_PROGRESS',
    },
  });
}

export async function completeBackup(
  backupId: string,
  input: {
    status: string;
    sizeBytes?: number;
    errorMessage?: string;
  }
) {
  const backup = await prisma.backupRecord.findUnique({ where: { id: backupId } });
  if (!backup) {
    throw new NotFoundError('Backup record not found');
  }

  return prisma.backupRecord.update({
    where: { id: backupId },
    data: {
      status: input.status as any,
      sizeBytes: input.sizeBytes ? BigInt(input.sizeBytes) : null,
      completedAt: new Date(),
      errorMessage: input.errorMessage || null,
    },
  });
}

export async function getDatabaseSummary() {
  const [
    latestHealthCheck,
    totalMigrations,
    pendingMigrations,
    recentBackups,
  ] = await Promise.all([
    prisma.databaseHealthCheck.findFirst({
      where: { component: 'primary_db' },
      orderBy: { checkedAt: 'desc' },
    }),
    prisma.databaseMigration.count(),
    prisma.databaseMigration.count({ where: { status: 'PENDING' } }),
    prisma.backupRecord.findMany({
      where: { status: 'COMPLETED' },
      orderBy: { completedAt: 'desc' },
      take: 5,
    }),
  ]);

  return {
    health: latestHealthCheck
      ? { status: latestHealthCheck.status, responseTimeMs: latestHealthCheck.responseTimeMs, checkedAt: latestHealthCheck.checkedAt }
      : null,
    migrations: { total: totalMigrations, pending: pendingMigrations },
    recentBackups: recentBackups.map((b) => ({
      id: b.id,
      type: b.type,
      status: b.status,
      sizeBytes: b.sizeBytes ? Number(b.sizeBytes) : null,
      completedAt: b.completedAt,
    })),
  };
}
