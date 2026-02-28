import { prisma } from '../utils/prisma';
import { NotFoundError } from '../utils/errors';

export async function getRecoveryPlans(filters: { type?: string; isActive?: boolean }) {
  return prisma.recoveryPlan.findMany({
    where: {
      ...(filters.type ? { type: filters.type as any } : {}),
      ...(filters.isActive !== undefined ? { isActive: filters.isActive } : {}),
    },
    include: {
      _count: { select: { tests: true } },
    },
    orderBy: { priority: 'asc' },
  });
}

export async function getRecoveryPlanById(planId: string) {
  const plan = await prisma.recoveryPlan.findUnique({
    where: { id: planId },
    include: {
      tests: { orderBy: { startedAt: 'desc' }, take: 10 },
      _count: { select: { tests: true } },
    },
  });
  if (!plan) throw new NotFoundError('Recovery plan not found');
  return plan;
}

export async function createRecoveryPlan(input: {
  name: string;
  description?: string;
  type: string;
  priority?: number;
  rtoMinutes: number;
  rpoMinutes: number;
  steps: string;
}) {
  return prisma.recoveryPlan.create({
    data: {
      name: input.name,
      description: input.description || null,
      type: input.type as any,
      priority: input.priority || 1,
      rtoMinutes: input.rtoMinutes,
      rpoMinutes: input.rpoMinutes,
      steps: input.steps,
    },
    include: {
      _count: { select: { tests: true } },
    },
  });
}

export async function startRecoveryTest(planId: string) {
  const plan = await prisma.recoveryPlan.findUnique({ where: { id: planId } });
  if (!plan) throw new NotFoundError('Recovery plan not found');

  return prisma.recoveryTest.create({
    data: {
      recoveryPlanId: planId,
      status: 'IN_PROGRESS',
    },
    include: { recoveryPlan: { select: { name: true, type: true } } },
  });
}

export async function completeRecoveryTest(testId: string, input: {
  passed: boolean;
  notes?: string;
  issues?: string;
}) {
  const test = await prisma.recoveryTest.findUnique({ where: { id: testId } });
  if (!test) throw new NotFoundError('Recovery test not found');

  const durationMs = Date.now() - test.startedAt.getTime();

  const updated = await prisma.recoveryTest.update({
    where: { id: testId },
    data: {
      status: input.passed ? 'PASSED' : 'FAILED',
      passed: input.passed,
      completedAt: new Date(),
      durationMs,
      notes: input.notes || null,
      issues: input.issues || null,
    },
  });

  // Update plan's lastTestedAt
  await prisma.recoveryPlan.update({
    where: { id: test.recoveryPlanId },
    data: { lastTestedAt: new Date() },
  });

  return updated;
}

export async function getFailoverEvents(limit = 50) {
  return prisma.failoverEvent.findMany({
    orderBy: { startedAt: 'desc' },
    take: limit,
  });
}

export async function initiateFailover(input: {
  sourceRegion: string;
  targetRegion: string;
  trigger: string;
}) {
  return prisma.failoverEvent.create({
    data: {
      sourceRegion: input.sourceRegion,
      targetRegion: input.targetRegion,
      trigger: input.trigger,
      status: 'INITIATED',
    },
  });
}

export async function getRecoverySummary() {
  const [
    totalPlans,
    activePlans,
    recentTests,
    failedTests,
    recentFailovers,
  ] = await Promise.all([
    prisma.recoveryPlan.count(),
    prisma.recoveryPlan.count({ where: { isActive: true } }),
    prisma.recoveryTest.count({
      where: {
        startedAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
      },
    }),
    prisma.recoveryTest.count({
      where: {
        passed: false,
        startedAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
      },
    }),
    prisma.failoverEvent.count({
      where: {
        startedAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
      },
    }),
  ]);

  return {
    totalPlans,
    activePlans,
    testsLast30d: recentTests,
    failedTestsLast30d: failedTests,
    failoversLast30d: recentFailovers,
  };
}
