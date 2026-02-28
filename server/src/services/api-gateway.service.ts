import crypto from 'crypto';
import { prisma } from '../utils/prisma';
import { NotFoundError, ValidationError } from '../utils/errors';

function hashKey(key: string): string {
  return crypto.createHash('sha256').update(key).digest('hex');
}

export async function createApiKey(
  schoolId: string,
  input: {
    name: string;
    scopes: string;
    expiresAt?: string;
    rateLimitPerMinute?: number;
  }
) {
  // Generate a random API key
  const rawKey = `atlas_${crypto.randomBytes(32).toString('hex')}`;
  const prefix = rawKey.slice(0, 14); // "atlas_" + 8 chars
  const keyHash = hashKey(rawKey);

  const apiKey = await prisma.apiKey.create({
    data: {
      schoolId,
      name: input.name,
      keyHash,
      prefix,
      scopes: input.scopes,
      expiresAt: input.expiresAt ? new Date(input.expiresAt) : null,
      rateLimitPerMinute: input.rateLimitPerMinute || 60,
    },
  });

  // Return the raw key only on creation — it can't be retrieved later
  return {
    id: apiKey.id,
    name: apiKey.name,
    key: rawKey,
    prefix: apiKey.prefix,
    scopes: apiKey.scopes,
    rateLimitPerMinute: apiKey.rateLimitPerMinute,
    expiresAt: apiKey.expiresAt,
    createdAt: apiKey.createdAt,
  };
}

export async function getApiKeys(schoolId: string) {
  return prisma.apiKey.findMany({
    where: { schoolId },
    select: {
      id: true,
      name: true,
      prefix: true,
      scopes: true,
      isActive: true,
      expiresAt: true,
      lastUsedAt: true,
      rateLimitPerMinute: true,
      createdAt: true,
    },
    orderBy: { createdAt: 'desc' },
  });
}

export async function revokeApiKey(keyId: string, schoolId: string) {
  const key = await prisma.apiKey.findFirst({ where: { id: keyId, schoolId } });
  if (!key) {
    throw new NotFoundError('API key not found');
  }

  return prisma.apiKey.update({
    where: { id: keyId },
    data: { isActive: false },
    select: {
      id: true,
      name: true,
      prefix: true,
      isActive: true,
    },
  });
}

export async function updateApiKey(
  keyId: string,
  schoolId: string,
  input: {
    name?: string;
    scopes?: string;
    rateLimitPerMinute?: number;
    isActive?: boolean;
  }
) {
  const key = await prisma.apiKey.findFirst({ where: { id: keyId, schoolId } });
  if (!key) {
    throw new NotFoundError('API key not found');
  }

  return prisma.apiKey.update({
    where: { id: keyId },
    data: {
      ...(input.name !== undefined ? { name: input.name } : {}),
      ...(input.scopes !== undefined ? { scopes: input.scopes } : {}),
      ...(input.rateLimitPerMinute !== undefined ? { rateLimitPerMinute: input.rateLimitPerMinute } : {}),
      ...(input.isActive !== undefined ? { isActive: input.isActive } : {}),
    },
    select: {
      id: true,
      name: true,
      prefix: true,
      scopes: true,
      isActive: true,
      rateLimitPerMinute: true,
      expiresAt: true,
      lastUsedAt: true,
    },
  });
}

export async function logApiRequest(input: {
  apiKeyId?: string;
  method: string;
  path: string;
  statusCode: number;
  responseTime: number;
  ipAddress?: string;
}) {
  return prisma.apiRequestLog.create({
    data: {
      apiKeyId: input.apiKeyId || null,
      method: input.method,
      path: input.path,
      statusCode: input.statusCode,
      responseTime: input.responseTime,
      ipAddress: input.ipAddress || null,
    },
  });
}

export async function getApiRequestStats(schoolId: string) {
  const last24h = new Date(Date.now() - 24 * 60 * 60 * 1000);

  const keys = await prisma.apiKey.findMany({
    where: { schoolId },
    select: { id: true },
  });
  const keyIds = keys.map((k) => k.id);

  if (keyIds.length === 0) {
    return {
      totalRequests24h: 0,
      errorRate: 0,
      avgResponseTime: 0,
      requestsByMethod: [],
    };
  }

  const [totalRequests, errorRequests, avgTime] = await Promise.all([
    prisma.apiRequestLog.count({
      where: { apiKeyId: { in: keyIds }, createdAt: { gte: last24h } },
    }),
    prisma.apiRequestLog.count({
      where: {
        apiKeyId: { in: keyIds },
        createdAt: { gte: last24h },
        statusCode: { gte: 400 },
      },
    }),
    prisma.apiRequestLog.aggregate({
      where: { apiKeyId: { in: keyIds }, createdAt: { gte: last24h } },
      _avg: { responseTime: true },
    }),
  ]);

  const requestsByMethod = await prisma.apiRequestLog.groupBy({
    by: ['method'],
    where: { apiKeyId: { in: keyIds }, createdAt: { gte: last24h } },
    _count: { id: true },
  });

  return {
    totalRequests24h: totalRequests,
    errorRate: totalRequests > 0 ? Math.round((errorRequests / totalRequests) * 100) : 0,
    avgResponseTime: Math.round(avgTime._avg.responseTime || 0),
    requestsByMethod: requestsByMethod.map((r: { method: string; _count: { id: number } }) => ({
      method: r.method,
      count: r._count.id,
    })),
  };
}
