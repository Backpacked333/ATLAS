import { prisma } from '../utils/prisma';
import { NotFoundError } from '../utils/errors';

export async function getActiveSessions(userId?: string, limit = 50) {
  return prisma.authSession.findMany({
    where: {
      isActive: true,
      ...(userId ? { userId } : {}),
    },
    orderBy: { lastActivityAt: 'desc' },
    take: limit,
  });
}

export async function terminateSession(sessionId: string) {
  const session = await prisma.authSession.findUnique({ where: { id: sessionId } });
  if (!session) throw new NotFoundError('Session not found');

  return prisma.authSession.update({
    where: { id: sessionId },
    data: { isActive: false },
  });
}

export async function terminateAllUserSessions(userId: string) {
  const result = await prisma.authSession.updateMany({
    where: { userId, isActive: true },
    data: { isActive: false },
  });
  return { terminated: result.count };
}

export async function cleanExpiredSessions() {
  const result = await prisma.authSession.updateMany({
    where: {
      isActive: true,
      expiresAt: { lt: new Date() },
    },
    data: { isActive: false },
  });
  return { cleaned: result.count };
}

export async function getLoginAttempts(filters: {
  email?: string;
  success?: boolean;
  limit?: number;
}) {
  return prisma.loginAttempt.findMany({
    where: {
      ...(filters.email ? { email: filters.email } : {}),
      ...(filters.success !== undefined ? { success: filters.success } : {}),
    },
    orderBy: { createdAt: 'desc' },
    take: filters.limit || 100,
  });
}

export async function getLoginStats() {
  const now = new Date();
  const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  const [
    total24h,
    failed24h,
    total7d,
    activeSessions,
  ] = await Promise.all([
    prisma.loginAttempt.count({ where: { createdAt: { gte: oneDayAgo } } }),
    prisma.loginAttempt.count({ where: { createdAt: { gte: oneDayAgo }, success: false } }),
    prisma.loginAttempt.count({ where: { createdAt: { gte: oneWeekAgo } } }),
    prisma.authSession.count({ where: { isActive: true } }),
  ]);

  return {
    totalAttempts24h: total24h,
    failedAttempts24h: failed24h,
    totalAttempts7d: total7d,
    activeSessions,
    failureRate24h: total24h > 0 ? Math.round((failed24h / total24h) * 10000) / 100 : 0,
  };
}

export async function getPasswordPolicies() {
  return prisma.passwordPolicy.findMany({
    orderBy: { name: 'asc' },
  });
}

export async function getActivePasswordPolicy() {
  return prisma.passwordPolicy.findFirst({
    where: { isActive: true },
    orderBy: { updatedAt: 'desc' },
  });
}

export async function createPasswordPolicy(input: {
  name: string;
  minLength?: number;
  requireUppercase?: boolean;
  requireLowercase?: boolean;
  requireNumbers?: boolean;
  requireSpecial?: boolean;
  maxAgeDays?: number;
  historyCount?: number;
  lockoutThreshold?: number;
  lockoutDurationMinutes?: number;
}) {
  return prisma.passwordPolicy.create({
    data: {
      name: input.name,
      minLength: input.minLength ?? 12,
      requireUppercase: input.requireUppercase ?? true,
      requireLowercase: input.requireLowercase ?? true,
      requireNumbers: input.requireNumbers ?? true,
      requireSpecial: input.requireSpecial ?? true,
      maxAgeDays: input.maxAgeDays ?? 90,
      historyCount: input.historyCount ?? 5,
      lockoutThreshold: input.lockoutThreshold ?? 5,
      lockoutDurationMinutes: input.lockoutDurationMinutes ?? 30,
    },
  });
}

export async function updatePasswordPolicy(policyId: string, input: {
  minLength?: number;
  requireUppercase?: boolean;
  requireLowercase?: boolean;
  requireNumbers?: boolean;
  requireSpecial?: boolean;
  maxAgeDays?: number;
  historyCount?: number;
  lockoutThreshold?: number;
  lockoutDurationMinutes?: number;
  isActive?: boolean;
}) {
  const policy = await prisma.passwordPolicy.findUnique({ where: { id: policyId } });
  if (!policy) throw new NotFoundError('Password policy not found');

  return prisma.passwordPolicy.update({
    where: { id: policyId },
    data: input,
  });
}

export async function getMfaEnrollments(userId?: string) {
  return prisma.mfaEnrollment.findMany({
    where: {
      ...(userId ? { userId } : {}),
    },
    orderBy: { createdAt: 'desc' },
  });
}

export async function enrollMfa(userId: string, method: string) {
  return prisma.mfaEnrollment.upsert({
    where: {
      userId_method: { userId, method: method as any },
    },
    create: {
      userId,
      method: method as any,
      isVerified: false,
    },
    update: {
      isActive: true,
      isVerified: false,
    },
  });
}

export async function verifyMfa(userId: string, method: string) {
  const enrollment = await prisma.mfaEnrollment.findUnique({
    where: { userId_method: { userId, method: method as any } },
  });
  if (!enrollment) throw new NotFoundError('MFA enrollment not found');

  return prisma.mfaEnrollment.update({
    where: { userId_method: { userId, method: method as any } },
    data: { isVerified: true, lastUsedAt: new Date() },
  });
}

export async function getAuthSummary() {
  const [loginStats, policies, mfaCount, sessionCount] = await Promise.all([
    getLoginStats(),
    prisma.passwordPolicy.count({ where: { isActive: true } }),
    prisma.mfaEnrollment.count({ where: { isActive: true, isVerified: true } }),
    prisma.authSession.count({ where: { isActive: true } }),
  ]);

  return {
    ...loginStats,
    activePolicies: policies,
    mfaEnrollments: mfaCount,
    activeSessions: sessionCount,
  };
}
