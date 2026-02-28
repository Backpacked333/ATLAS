import { prisma } from '../utils/prisma';
import { NotFoundError } from '../utils/errors';

export async function getTenants(filters: { status?: string; tier?: string }) {
  return prisma.tenant.findMany({
    where: {
      ...(filters.status ? { status: filters.status as any } : {}),
      ...(filters.tier ? { tier: filters.tier as any } : {}),
    },
    include: {
      _count: { select: { resourceQuotas: true } },
    },
    orderBy: { name: 'asc' },
  });
}

export async function getTenantById(tenantId: string) {
  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    include: {
      resourceQuotas: { orderBy: { resourceType: 'asc' } },
    },
  });
  if (!tenant) throw new NotFoundError('Tenant not found');
  return tenant;
}

export async function createTenant(input: {
  name: string;
  displayName: string;
  domain?: string;
  tier?: string;
  maxUsers?: number;
  maxStorage?: number;
  config?: string;
}) {
  return prisma.tenant.create({
    data: {
      name: input.name,
      displayName: input.displayName,
      domain: input.domain || null,
      tier: (input.tier as any) || 'STANDARD',
      maxUsers: input.maxUsers || 100,
      maxStorage: input.maxStorage ? BigInt(input.maxStorage) : BigInt(5368709120),
      config: input.config || null,
      status: 'PROVISIONING',
    },
  });
}

export async function updateTenantStatus(tenantId: string, status: string) {
  const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });
  if (!tenant) throw new NotFoundError('Tenant not found');

  return prisma.tenant.update({
    where: { id: tenantId },
    data: { status: status as any },
  });
}

export async function updateTenantTier(tenantId: string, tier: string, maxUsers?: number, maxStorage?: number) {
  const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });
  if (!tenant) throw new NotFoundError('Tenant not found');

  return prisma.tenant.update({
    where: { id: tenantId },
    data: {
      tier: tier as any,
      ...(maxUsers !== undefined ? { maxUsers } : {}),
      ...(maxStorage !== undefined ? { maxStorage: BigInt(maxStorage) } : {}),
    },
  });
}

export async function getResourceQuotas(tenantId: string) {
  return prisma.tenantResourceQuota.findMany({
    where: { tenantId },
    orderBy: { resourceType: 'asc' },
  });
}

export async function setResourceQuota(tenantId: string, input: {
  resourceType: string;
  limitValue: number;
  periodStart: string;
  periodEnd: string;
}) {
  const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });
  if (!tenant) throw new NotFoundError('Tenant not found');

  const periodStart = new Date(input.periodStart);

  return prisma.tenantResourceQuota.upsert({
    where: {
      tenantId_resourceType_periodStart: {
        tenantId,
        resourceType: input.resourceType,
        periodStart,
      },
    },
    create: {
      tenantId,
      resourceType: input.resourceType,
      limitValue: BigInt(input.limitValue),
      periodStart,
      periodEnd: new Date(input.periodEnd),
    },
    update: {
      limitValue: BigInt(input.limitValue),
      periodEnd: new Date(input.periodEnd),
    },
  });
}

export async function getDataPartitions(tenantId?: string) {
  return prisma.dataPartition.findMany({
    where: {
      ...(tenantId ? { tenantId } : {}),
    },
    orderBy: [{ tenantId: 'asc' }, { tableName: 'asc' }],
  });
}

export async function getTenancySummary() {
  const [
    totalTenants,
    activeTenants,
    suspendedTenants,
    partitionCount,
  ] = await Promise.all([
    prisma.tenant.count(),
    prisma.tenant.count({ where: { status: 'ACTIVE' } }),
    prisma.tenant.count({ where: { status: 'SUSPENDED' } }),
    prisma.dataPartition.count(),
  ]);

  const tenantsByTier = await prisma.tenant.groupBy({
    by: ['tier'],
    _count: { tier: true },
  });

  return {
    totalTenants,
    activeTenants,
    suspendedTenants,
    partitionCount,
    byTier: tenantsByTier.map((t: any) => ({ tier: t.tier, count: t._count.tier })),
  };
}
