import { prisma } from '../utils/prisma';
import { NotFoundError, ValidationError } from '../utils/errors';

export async function createConnector(
  schoolId: string,
  input: {
    name: string;
    provider: string;
    type: string;
    config: string;
  }
) {
  return prisma.integrationConnector.create({
    data: {
      schoolId,
      name: input.name,
      provider: input.provider,
      type: input.type as any,
      config: input.config,
    },
  });
}

export async function getConnectors(
  schoolId: string,
  filters: { type?: string; isActive?: boolean }
) {
  return prisma.integrationConnector.findMany({
    where: {
      schoolId,
      ...(filters.type ? { type: filters.type as any } : {}),
      ...(filters.isActive !== undefined ? { isActive: filters.isActive } : {}),
    },
    select: {
      id: true,
      schoolId: true,
      name: true,
      provider: true,
      type: true,
      isActive: true,
      lastSyncAt: true,
      createdAt: true,
      updatedAt: true,
      _count: { select: { syncLogs: true } },
    },
    orderBy: { name: 'asc' },
  });
}

export async function getConnectorById(connectorId: string, schoolId: string) {
  const connector = await prisma.integrationConnector.findFirst({
    where: { id: connectorId, schoolId },
    select: {
      id: true,
      schoolId: true,
      name: true,
      provider: true,
      type: true,
      isActive: true,
      lastSyncAt: true,
      createdAt: true,
      updatedAt: true,
      syncLogs: {
        orderBy: { startedAt: 'desc' },
        take: 20,
      },
    },
  });

  if (!connector) {
    throw new NotFoundError('Connector not found');
  }

  return connector;
}

export async function updateConnector(
  connectorId: string,
  schoolId: string,
  input: {
    name?: string;
    config?: string;
    isActive?: boolean;
  }
) {
  const connector = await prisma.integrationConnector.findFirst({
    where: { id: connectorId, schoolId },
  });
  if (!connector) {
    throw new NotFoundError('Connector not found');
  }

  return prisma.integrationConnector.update({
    where: { id: connectorId },
    data: {
      ...(input.name !== undefined ? { name: input.name } : {}),
      ...(input.config !== undefined ? { config: input.config } : {}),
      ...(input.isActive !== undefined ? { isActive: input.isActive } : {}),
    },
    select: {
      id: true,
      schoolId: true,
      name: true,
      provider: true,
      type: true,
      isActive: true,
      lastSyncAt: true,
      createdAt: true,
      updatedAt: true,
    },
  });
}

export async function startSync(
  connectorId: string,
  schoolId: string,
  input: {
    direction: string;
    entityType: string;
  }
) {
  const connector = await prisma.integrationConnector.findFirst({
    where: { id: connectorId, schoolId, isActive: true },
  });
  if (!connector) {
    throw new NotFoundError('Active connector not found');
  }

  const syncLog = await prisma.integrationSyncLog.create({
    data: {
      connectorId,
      direction: input.direction as any,
      entityType: input.entityType,
      status: 'IN_PROGRESS',
    },
    include: {
      connector: { select: { name: true, provider: true } },
    },
  });

  // In a real system, this would trigger an async job.
  // For now we simulate a sync completion.
  return syncLog;
}

export async function completeSyncLog(
  syncLogId: string,
  input: {
    recordsTotal: number;
    recordsSynced: number;
    recordsFailed: number;
    status: string;
    errorLog?: string;
  }
) {
  const syncLog = await prisma.integrationSyncLog.findUnique({
    where: { id: syncLogId },
  });
  if (!syncLog) {
    throw new NotFoundError('Sync log not found');
  }

  const updated = await prisma.integrationSyncLog.update({
    where: { id: syncLogId },
    data: {
      recordsTotal: input.recordsTotal,
      recordsSynced: input.recordsSynced,
      recordsFailed: input.recordsFailed,
      status: input.status as any,
      errorLog: input.errorLog || null,
      completedAt: new Date(),
    },
  });

  // Update the connector's lastSyncAt
  await prisma.integrationConnector.update({
    where: { id: syncLog.connectorId },
    data: { lastSyncAt: new Date() },
  });

  return updated;
}

export async function getSyncLogs(
  connectorId: string,
  schoolId: string,
  filters: { status?: string; limit?: number }
) {
  // Verify connector belongs to school
  const connector = await prisma.integrationConnector.findFirst({
    where: { id: connectorId, schoolId },
  });
  if (!connector) {
    throw new NotFoundError('Connector not found');
  }

  return prisma.integrationSyncLog.findMany({
    where: {
      connectorId,
      ...(filters.status ? { status: filters.status as any } : {}),
    },
    orderBy: { startedAt: 'desc' },
    take: filters.limit || 50,
  });
}

export async function getIntegrationSummary(schoolId: string) {
  const [totalConnectors, activeConnectors, recentSyncs, failedSyncs] = await Promise.all([
    prisma.integrationConnector.count({ where: { schoolId } }),
    prisma.integrationConnector.count({ where: { schoolId, isActive: true } }),
    prisma.integrationSyncLog.count({
      where: {
        connector: { schoolId },
        startedAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
      },
    }),
    prisma.integrationSyncLog.count({
      where: {
        connector: { schoolId },
        status: 'FAILED',
        startedAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
      },
    }),
  ]);

  const connectorsByType = await prisma.integrationConnector.groupBy({
    by: ['type'],
    where: { schoolId },
    _count: { id: true },
  });

  return {
    totalConnectors,
    activeConnectors,
    recentSyncsLast24h: recentSyncs,
    failedSyncsLast24h: failedSyncs,
    connectorsByType: connectorsByType.map((c) => ({
      type: c.type,
      count: c._count.id,
    })),
  };
}
