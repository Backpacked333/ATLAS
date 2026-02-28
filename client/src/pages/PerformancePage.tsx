import { useState, useEffect } from 'react';
import { api } from '../services/api';

interface PerformanceSummary {
  totalRequests24h: number;
  totalErrors24h: number;
  errorRate: number;
  avgResponseMs: number;
  maxP99Ms: number;
  endpointCount: number;
}

interface CacheSummary {
  totalEntries: number;
  totalSizeBytes: number;
  hitRate: number;
  totalHits: number;
  totalMisses: number;
  byRegion: { region: string; count: number; sizeBytes: number }[];
}

interface Benchmark {
  id: string;
  name: string;
  category: string;
  targetMs: number;
  actualMs: number;
  passed: boolean;
  runAt: string;
}

export function PerformancePage() {
  const [summary, setSummary] = useState<PerformanceSummary | null>(null);
  const [cache, setCache] = useState<CacheSummary | null>(null);
  const [benchmarks, setBenchmarks] = useState<Benchmark[]>([]);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);

  useEffect(() => {
    Promise.all([
      api.get<PerformanceSummary>('/performance/summary'),
      api.get<CacheSummary>('/performance/cache'),
      api.get<Benchmark[]>('/performance/benchmarks'),
    ])
      .then(([summaryData, cacheData, benchData]) => {
        setSummary(summaryData);
        setCache(cacheData);
        setBenchmarks(benchData);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  async function runBenchmark() {
    setRunning(true);
    try {
      const result = await api.post<Benchmark>('/performance/benchmark', {
        name: 'Database Query',
        category: 'query',
        targetMs: 100,
      });
      setBenchmarks((prev) => [result, ...prev]);
    } catch {
      // ignore
    } finally {
      setRunning(false);
    }
  }

  async function invalidateCache() {
    try {
      await api.post('/performance/cache/invalidate', {});
      const updated = await api.get<CacheSummary>('/performance/cache');
      setCache(updated);
    } catch {
      // ignore
    }
  }

  function formatBytes(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Performance Optimization</h1>
        <button onClick={runBenchmark} disabled={running} className="btn-ghost text-sm">
          {running ? 'Running...' : 'Run Benchmark'}
        </button>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="card p-4 animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
              <div className="h-3 bg-gray-200 rounded w-1/2" />
            </div>
          ))}
        </div>
      ) : (
        <>
          {/* Performance Stats */}
          {summary && (
            <div className="grid grid-cols-3 gap-3">
              <div className="card p-3 text-center">
                <p className="text-2xl font-bold text-gray-900">{summary.totalRequests24h}</p>
                <p className="text-xs text-gray-500">Requests (24h)</p>
              </div>
              <div className="card p-3 text-center">
                <p className="text-2xl font-bold text-blue-600">{summary.avgResponseMs}ms</p>
                <p className="text-xs text-gray-500">Avg Response</p>
              </div>
              <div className="card p-3 text-center">
                <p className={`text-2xl font-bold ${summary.errorRate > 5 ? 'text-red-600' : 'text-green-600'}`}>
                  {summary.errorRate}%
                </p>
                <p className="text-xs text-gray-500">Error Rate</p>
              </div>
            </div>
          )}

          {/* Cache Stats */}
          {cache && (
            <div className="card p-4">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-semibold text-gray-700">Cache Performance</h2>
                <button onClick={invalidateCache} className="btn-ghost text-xs text-red-600">
                  Invalidate All
                </button>
              </div>
              <div className="grid grid-cols-4 gap-3 mb-3">
                <div className="text-center">
                  <p className="text-lg font-bold text-gray-900">{cache.totalEntries}</p>
                  <p className="text-xs text-gray-500">Entries</p>
                </div>
                <div className="text-center">
                  <p className="text-lg font-bold text-green-600">{cache.hitRate}%</p>
                  <p className="text-xs text-gray-500">Hit Rate</p>
                </div>
                <div className="text-center">
                  <p className="text-lg font-bold text-blue-600">{formatBytes(cache.totalSizeBytes)}</p>
                  <p className="text-xs text-gray-500">Total Size</p>
                </div>
                <div className="text-center">
                  <p className="text-lg font-bold text-gray-600">{cache.byRegion.length}</p>
                  <p className="text-xs text-gray-500">Regions</p>
                </div>
              </div>
              {cache.byRegion.length > 0 && (
                <div className="space-y-1">
                  {cache.byRegion.map((r) => (
                    <div key={r.region} className="flex items-center justify-between text-xs py-1 border-t border-gray-100">
                      <span className="badge badge-gray">{r.region}</span>
                      <span className="text-gray-500">{r.count} entries / {formatBytes(r.sizeBytes)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Benchmarks */}
          <div className="card p-4">
            <h2 className="text-sm font-semibold text-gray-700 mb-3">Recent Benchmarks</h2>
            {benchmarks.length === 0 ? (
              <p className="text-sm text-gray-500">No benchmarks recorded.</p>
            ) : (
              <div className="space-y-2">
                {benchmarks.slice(0, 10).map((b) => (
                  <div key={b.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                    <div className="flex items-center gap-2">
                      <span className={`badge ${b.passed ? 'badge-green' : 'badge-red'}`}>
                        {b.passed ? 'PASS' : 'FAIL'}
                      </span>
                      <span className="text-sm text-gray-900">{b.name}</span>
                      <span className="badge badge-gray text-xs">{b.category}</span>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-700">{b.actualMs}ms / {b.targetMs}ms</p>
                      <p className="text-xs text-gray-400">{new Date(b.runAt).toLocaleString()}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
