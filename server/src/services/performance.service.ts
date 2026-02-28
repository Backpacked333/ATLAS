import { prisma } from '../utils/prisma';
import { NotFoundError } from '../utils/errors';

export async function getCacheEntries(region?: string) {
  return prisma.cacheEntry.findMany({
    where: {
      ...(region ? { region } : {}),
    },
    orderBy: { updatedAt: 'desc' },
    take: 100,
  });
}

export async function getCacheSummary() {
  const entries = await prisma.cacheEntry.findMany();
  const totalSize = entries.reduce((sum, e) => sum + e.sizeBytes, 0);
  const totalHits = entries.reduce((sum, e) => sum + e.hitCount, 0);
  const totalMisses = entries.reduce((sum, e) => sum + e.missCount, 0);
  const hitRate = totalHits + totalMisses > 0
    ? (totalHits / (totalHits + totalMisses)) * 100
    : 0;

  // Group by region
  const regionMap: Record<string, { count: number; sizeBytes: number }> = {};
  for (const entry of entries) {
    if (!regionMap[entry.region]) {
      regionMap[entry.region] = { count: 0, sizeBytes: 0 };
    }
    regionMap[entry.region].count++;
    regionMap[entry.region].sizeBytes += entry.sizeBytes;
  }

  return {
    totalEntries: entries.length,
    totalSizeBytes: totalSize,
    hitRate: Math.round(hitRate * 100) / 100,
    totalHits,
    totalMisses,
    byRegion: Object.entries(regionMap).map(([region, data]) => ({
      region,
      ...data,
    })),
  };
}

export async function invalidateCache(region?: string) {
  if (region) {
    const result = await prisma.cacheEntry.deleteMany({ where: { region } });
    return { deleted: result.count, region };
  }
  const result = await prisma.cacheEntry.deleteMany();
  return { deleted: result.count, region: 'all' };
}

export async function getPerformanceMetrics(filters: {
  endpoint?: string;
  limit?: number;
}) {
  return prisma.performanceMetric.findMany({
    where: {
      ...(filters.endpoint ? { endpoint: filters.endpoint } : {}),
    },
    orderBy: { periodStart: 'desc' },
    take: filters.limit || 50,
  });
}

export async function getPerformanceSummary() {
  const now = new Date();
  const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

  const recentMetrics = await prisma.performanceMetric.findMany({
    where: { periodStart: { gte: oneDayAgo } },
  });

  const totalRequests = recentMetrics.reduce((sum, m) => sum + m.requestCount, 0);
  const totalErrors = recentMetrics.reduce((sum, m) => sum + m.errorCount, 0);
  const avgResponse = recentMetrics.length > 0
    ? recentMetrics.reduce((sum, m) => sum + m.avgResponseMs, 0) / recentMetrics.length
    : 0;
  const maxP99 = recentMetrics.length > 0
    ? Math.max(...recentMetrics.map((m) => m.p99ResponseMs))
    : 0;

  return {
    totalRequests24h: totalRequests,
    totalErrors24h: totalErrors,
    errorRate: totalRequests > 0 ? Math.round((totalErrors / totalRequests) * 10000) / 100 : 0,
    avgResponseMs: Math.round(avgResponse * 100) / 100,
    maxP99Ms: Math.round(maxP99 * 100) / 100,
    endpointCount: new Set(recentMetrics.map((m) => m.endpoint)).size,
  };
}

export async function runBenchmark(input: {
  name: string;
  category: string;
  targetMs: number;
}) {
  // Simulate a benchmark by timing a database operation
  const startTime = Date.now();
  await prisma.$queryRaw`SELECT 1`;
  const actualMs = Date.now() - startTime;

  return prisma.performanceBenchmark.create({
    data: {
      name: input.name,
      category: input.category,
      targetMs: input.targetMs,
      actualMs,
      passed: actualMs <= input.targetMs,
      details: JSON.stringify({
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development',
      }),
    },
  });
}

export async function getBenchmarkHistory(category?: string, limit = 50) {
  return prisma.performanceBenchmark.findMany({
    where: {
      ...(category ? { category } : {}),
    },
    orderBy: { runAt: 'desc' },
    take: limit,
  });
}
