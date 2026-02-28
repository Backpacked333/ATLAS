import { prisma } from '../utils/prisma';
import { NotFoundError } from '../utils/errors';

export async function getEncryptionKeys(filters: { purpose?: string; status?: string }) {
  return prisma.encryptionKey.findMany({
    where: {
      ...(filters.purpose ? { purpose: filters.purpose as any } : {}),
      ...(filters.status ? { status: filters.status as any } : {}),
    },
    orderBy: { createdAt: 'desc' },
  });
}

export async function getEncryptionKeyByAlias(alias: string) {
  const key = await prisma.encryptionKey.findUnique({ where: { alias } });
  if (!key) throw new NotFoundError('Encryption key not found');
  return key;
}

export async function createEncryptionKey(input: {
  alias: string;
  algorithm: string;
  purpose: string;
  expiresAt?: string;
}) {
  return prisma.encryptionKey.create({
    data: {
      alias: input.alias,
      algorithm: input.algorithm,
      purpose: input.purpose as any,
      expiresAt: input.expiresAt ? new Date(input.expiresAt) : null,
    },
  });
}

export async function rotateEncryptionKey(alias: string, newAlias: string) {
  const existing = await prisma.encryptionKey.findUnique({ where: { alias } });
  if (!existing) throw new NotFoundError('Encryption key not found');

  // Mark old key as rotated
  await prisma.encryptionKey.update({
    where: { alias },
    data: { status: 'ROTATED', rotatedAt: new Date() },
  });

  // Create new key
  return prisma.encryptionKey.create({
    data: {
      alias: newAlias,
      algorithm: existing.algorithm,
      purpose: existing.purpose,
      rotatedFromId: existing.id,
    },
  });
}

export async function revokeEncryptionKey(alias: string) {
  const key = await prisma.encryptionKey.findUnique({ where: { alias } });
  if (!key) throw new NotFoundError('Encryption key not found');

  return prisma.encryptionKey.update({
    where: { alias },
    data: { status: 'REVOKED_KEY' },
  });
}

export async function getEncryptedFields() {
  return prisma.encryptedField.findMany({
    orderBy: [{ tableName: 'asc' }, { fieldName: 'asc' }],
  });
}

export async function registerEncryptedField(input: {
  tableName: string;
  fieldName: string;
  keyAlias: string;
  encryptionType: string;
}) {
  return prisma.encryptedField.upsert({
    where: {
      tableName_fieldName: {
        tableName: input.tableName,
        fieldName: input.fieldName,
      },
    },
    create: input,
    update: { keyAlias: input.keyAlias, encryptionType: input.encryptionType },
  });
}

export async function startSecurityScan(scanType: string) {
  return prisma.securityScan.create({
    data: {
      scanType: scanType as any,
      status: 'IN_PROGRESS_S',
    },
  });
}

export async function completeSecurityScan(scanId: string, input: {
  vulnerabilities: number;
  criticalCount: number;
  highCount: number;
  mediumCount: number;
  lowCount: number;
  report?: string;
}) {
  const scan = await prisma.securityScan.findUnique({ where: { id: scanId } });
  if (!scan) throw new NotFoundError('Security scan not found');

  return prisma.securityScan.update({
    where: { id: scanId },
    data: {
      status: 'COMPLETED_S',
      vulnerabilities: input.vulnerabilities,
      criticalCount: input.criticalCount,
      highCount: input.highCount,
      mediumCount: input.mediumCount,
      lowCount: input.lowCount,
      report: input.report || null,
      completedAt: new Date(),
    },
  });
}

export async function getSecurityScans(limit = 20) {
  return prisma.securityScan.findMany({
    orderBy: { startedAt: 'desc' },
    take: limit,
  });
}

export async function getEncryptionSummary() {
  const [
    totalKeys,
    activeKeys,
    encryptedFieldCount,
    recentScans,
    criticalVulnerabilities,
  ] = await Promise.all([
    prisma.encryptionKey.count(),
    prisma.encryptionKey.count({ where: { status: 'ACTIVE' } }),
    prisma.encryptedField.count(),
    prisma.securityScan.count({
      where: { startedAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } },
    }),
    prisma.securityScan.findFirst({
      where: { status: 'COMPLETED_S' },
      orderBy: { completedAt: 'desc' },
      select: { criticalCount: true, highCount: true },
    }),
  ]);

  return {
    totalKeys,
    activeKeys,
    encryptedFieldCount,
    scansLast30d: recentScans,
    latestCritical: criticalVulnerabilities?.criticalCount || 0,
    latestHigh: criticalVulnerabilities?.highCount || 0,
  };
}
