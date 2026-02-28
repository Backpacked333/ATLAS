/**
 * Module 19: Performance Optimization Module
 *
 * Provides caching, query performance tracking, and system resource monitoring.
 * Designed for high availability with automatic failover and recovery mechanisms.
 *
 * Cross-References:
 *   - Backup Recovery System (supporting core functionality)
 *   - Behavioral Management System (design of core functionality)
 *   - Task Assignment System (implementation of core functionality)
 *   - Audit Logging Module (operational concerns)
 *
 * Functional Themes: core functionality, integration, operational, security, scalability, reliability
 */

import {
  CacheEntry,
  CacheStats,
  QueryMetrics,
  PerformanceReport,
} from './types';

// ─── In-Memory LRU Cache ──────────────────────────────────────────────

export class CacheManager {
  private cache = new Map<string, CacheEntry>();
  private stats: CacheStats = {
    hits: 0,
    misses: 0,
    size: 0,
    maxSize: 0,
    hitRate: 0,
    evictions: 0,
  };
  private readonly maxSize: number;
  private readonly defaultTtl: number;

  constructor(maxSize = 1000, defaultTtlMs = 5 * 60 * 1000) {
    this.maxSize = maxSize;
    this.defaultTtl = defaultTtlMs;
    this.stats.maxSize = maxSize;
  }

  get<T = unknown>(key: string): T | null {
    const entry = this.cache.get(key);

    if (!entry) {
      this.stats.misses++;
      this.updateHitRate();
      return null;
    }

    if (Date.now() - entry.createdAt > entry.ttl) {
      this.cache.delete(key);
      this.stats.misses++;
      this.stats.size = this.cache.size;
      this.updateHitRate();
      return null;
    }

    entry.accessCount++;
    entry.lastAccessed = Date.now();
    this.stats.hits++;
    this.updateHitRate();

    // Move to end for LRU ordering
    this.cache.delete(key);
    this.cache.set(key, entry);

    return entry.value as T;
  }

  set<T = unknown>(key: string, value: T, ttlMs?: number): void {
    if (this.cache.size >= this.maxSize) {
      this.evictLRU();
    }

    const entry: CacheEntry<T> = {
      key,
      value,
      ttl: ttlMs ?? this.defaultTtl,
      createdAt: Date.now(),
      accessCount: 0,
      lastAccessed: Date.now(),
    };

    this.cache.set(key, entry as CacheEntry);
    this.stats.size = this.cache.size;
  }

  invalidate(key: string): boolean {
    const deleted = this.cache.delete(key);
    this.stats.size = this.cache.size;
    return deleted;
  }

  invalidatePattern(pattern: string): number {
    const regex = new RegExp(pattern.replace(/\*/g, '.*'));
    let count = 0;

    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        this.cache.delete(key);
        count++;
      }
    }

    this.stats.size = this.cache.size;
    return count;
  }

  flush(): void {
    this.cache.clear();
    this.stats.size = 0;
  }

  getStats(): CacheStats {
    return { ...this.stats };
  }

  private evictLRU(): void {
    const firstKey = this.cache.keys().next().value;
    if (firstKey !== undefined) {
      this.cache.delete(firstKey);
      this.stats.evictions++;
    }
  }

  private updateHitRate(): void {
    const total = this.stats.hits + this.stats.misses;
    this.stats.hitRate = total > 0 ? this.stats.hits / total : 0;
  }
}

// ─── Query Performance Tracker ────────────────────────────────────────

export class QueryPerformanceTracker {
  private metrics: QueryMetrics[] = [];
  private readonly maxHistory: number;
  private readonly slowQueryThresholdMs: number;

  constructor(maxHistory = 1000, slowQueryThresholdMs = 500) {
    this.maxHistory = maxHistory;
    this.slowQueryThresholdMs = slowQueryThresholdMs;
  }

  record(query: string, durationMs: number, rowCount: number, cached: boolean): void {
    const metric: QueryMetrics = {
      query: this.sanitizeQuery(query),
      duration: durationMs,
      timestamp: Date.now(),
      rowCount,
      cached,
    };

    this.metrics.push(metric);

    if (this.metrics.length > this.maxHistory) {
      this.metrics = this.metrics.slice(-this.maxHistory);
    }

    if (durationMs > this.slowQueryThresholdMs) {
      console.warn(
        `[Performance] Slow query detected (${durationMs}ms): ${metric.query.substring(0, 100)}`
      );
    }
  }

  getSlowQueries(limit = 20): QueryMetrics[] {
    return [...this.metrics]
      .filter((m) => m.duration > this.slowQueryThresholdMs)
      .sort((a, b) => b.duration - a.duration)
      .slice(0, limit);
  }

  getAverageDuration(): number {
    if (this.metrics.length === 0) return 0;
    const total = this.metrics.reduce((sum, m) => sum + m.duration, 0);
    return total / this.metrics.length;
  }

  getTotalExecuted(): number {
    return this.metrics.length;
  }

  getCacheHitRate(): number {
    if (this.metrics.length === 0) return 0;
    const cached = this.metrics.filter((m) => m.cached).length;
    return cached / this.metrics.length;
  }

  private sanitizeQuery(query: string): string {
    // Remove sensitive values from query strings for logging
    return query
      .replace(/= '.*?'/g, "= '[REDACTED]'")
      .replace(/= ".*?"/g, '= "[REDACTED]"');
  }
}

// ─── Performance Optimization Service ─────────────────────────────────

export class PerformanceOptimizationService {
  private readonly cacheManager: CacheManager;
  private readonly queryTracker: QueryPerformanceTracker;
  private readonly startTime: number;

  constructor() {
    this.cacheManager = new CacheManager(
      parseInt(process.env.CACHE_MAX_SIZE || '1000', 10),
      parseInt(process.env.CACHE_DEFAULT_TTL_MS || '300000', 10)
    );
    this.queryTracker = new QueryPerformanceTracker(
      parseInt(process.env.QUERY_HISTORY_SIZE || '1000', 10),
      parseInt(process.env.SLOW_QUERY_THRESHOLD_MS || '500', 10)
    );
    this.startTime = Date.now();
  }

  getCache(): CacheManager {
    return this.cacheManager;
  }

  getQueryTracker(): QueryPerformanceTracker {
    return this.queryTracker;
  }

  /**
   * Generate a comprehensive performance report.
   * Used by monitoring dashboards and the Backup Recovery System for operational visibility.
   */
  generateReport(): PerformanceReport {
    const memUsage = process.memoryUsage();

    return {
      timestamp: new Date().toISOString(),
      cache: this.cacheManager.getStats(),
      queries: {
        totalExecuted: this.queryTracker.getTotalExecuted(),
        averageDuration: Math.round(this.queryTracker.getAverageDuration() * 100) / 100,
        slowQueries: this.queryTracker.getSlowQueries(10),
      },
      memory: {
        heapUsed: memUsage.heapUsed,
        heapTotal: memUsage.heapTotal,
        rss: memUsage.rss,
        external: memUsage.external,
      },
      uptime: Math.floor((Date.now() - this.startTime) / 1000),
    };
  }

  /**
   * Execute a function with cache-aside pattern.
   * Checks cache first, executes function on miss, stores result.
   */
  async withCache<T>(
    key: string,
    fn: () => Promise<T>,
    ttlMs?: number
  ): Promise<T> {
    const cached = this.cacheManager.get<T>(key);
    if (cached !== null) {
      return cached;
    }

    const start = Date.now();
    const result = await fn();
    const duration = Date.now() - start;

    this.cacheManager.set(key, result, ttlMs);
    this.queryTracker.record(key, duration, 1, false);

    return result;
  }

  /**
   * Track a database query's performance.
   */
  trackQuery<T>(queryName: string, fn: () => Promise<T>): Promise<T> {
    const start = Date.now();
    return fn().then((result) => {
      const duration = Date.now() - start;
      const rowCount = Array.isArray(result) ? result.length : 1;
      this.queryTracker.record(queryName, duration, rowCount, false);
      return result;
    });
  }
}

// ─── Singleton Export ─────────────────────────────────────────────────

export const performanceService = new PerformanceOptimizationService();
