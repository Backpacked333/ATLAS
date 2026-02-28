/**
 * In-memory cache service for performance optimization.
 *
 * Provides a simple TTL-based cache for frequently accessed data
 * like student rosters, attendance summaries, and report data.
 * In production, this would be backed by Redis for horizontal scaling.
 */

interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

export class CacheService {
  private static instance: CacheService;
  private cache = new Map<string, CacheEntry<unknown>>();
  private readonly defaultTTL: number;

  private constructor(defaultTTLSeconds = 300) {
    this.defaultTTL = defaultTTLSeconds * 1000;

    // Periodic cleanup of expired entries
    setInterval(() => this.cleanup(), 60_000);
  }

  static getInstance(): CacheService {
    if (!CacheService.instance) {
      CacheService.instance = new CacheService();
    }
    return CacheService.instance;
  }

  /**
   * Get a value from cache.
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    return entry.value as T;
  }

  /**
   * Set a value in cache with optional TTL.
   */
  set<T>(key: string, value: T, ttlSeconds?: number): void {
    const ttl = (ttlSeconds ?? this.defaultTTL / 1000) * 1000;
    this.cache.set(key, {
      value,
      expiresAt: Date.now() + ttl,
    });
  }

  /**
   * Get a value from cache, or compute and cache it if missing.
   */
  async getOrSet<T>(key: string, factory: () => Promise<T>, ttlSeconds?: number): Promise<T> {
    const cached = this.get<T>(key);
    if (cached !== null) return cached;

    const value = await factory();
    this.set(key, value, ttlSeconds);
    return value;
  }

  /**
   * Invalidate a specific cache entry.
   */
  invalidate(key: string): void {
    this.cache.delete(key);
  }

  /**
   * Invalidate all entries matching a prefix.
   */
  invalidateByPrefix(prefix: string): void {
    for (const key of this.cache.keys()) {
      if (key.startsWith(prefix)) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Clear the entire cache.
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Get cache statistics.
   */
  stats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()),
    };
  }

  private cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiresAt) {
        this.cache.delete(key);
      }
    }
  }
}

export const cacheService = CacheService.getInstance();
