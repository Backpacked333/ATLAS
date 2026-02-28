import { useState, useEffect } from 'react';
import { api } from '../services/api';

interface DatabaseSummary {
  health: {
    status: string;
    responseTimeMs: number;
    checkedAt: string;
  } | null;
  migrations: {
    total: number;
    pending: number;
  };
  recentBackups: {
    id: string;
    type: string;
    status: string;
    sizeBytes: number | null;
    completedAt: string | null;
  }[];
}

interface HealthCheck {
  id: string;
  component: string;
  status: string;
  responseTimeMs: number;
  details: string | null;
  checkedAt: string;
  parsedDetails?: any;
}

export function DatabaseAdminPage() {
  const [summary, setSummary] = useState<DatabaseSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [checking, setChecking] = useState(false);
  const [lastCheck, setLastCheck] = useState<HealthCheck | null>(null);

  useEffect(() => {
    api.get<DatabaseSummary>('/database/summary')
      .then(setSummary)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  async function runHealthCheck() {
    setChecking(true);
    try {
      const result = await api.post<HealthCheck>('/database/health-check', {});
      setLastCheck(result);
      // Refresh summary
      const updated = await api.get<DatabaseSummary>('/database/summary');
      setSummary(updated);
    } catch {
      // ignore
    } finally {
      setChecking(false);
    }
  }

  const healthColor: Record<string, string> = {
    HEALTHY: 'green',
    DEGRADED: 'amber',
    UNHEALTHY: 'red',
  };

  function formatBytes(bytes: number | null): string {
    if (bytes === null) return 'N/A';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Database Administration</h1>
        <button
          onClick={runHealthCheck}
          disabled={checking}
          className="btn-ghost text-sm"
        >
          {checking ? 'Checking...' : 'Run Health Check'}
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
      ) : summary ? (
        <>
          {/* Health Status */}
          <div className="grid grid-cols-3 gap-3">
            <div className="card p-4 text-center">
              <span className={`badge badge-${summary.health ? healthColor[summary.health.status] || 'gray' : 'gray'} text-lg`}>
                {summary.health?.status || 'UNKNOWN'}
              </span>
              <p className="text-xs text-gray-500 mt-2">Database Status</p>
              {summary.health && (
                <p className="text-xs text-gray-400 mt-1">{summary.health.responseTimeMs}ms</p>
              )}
            </div>
            <div className="card p-4 text-center">
              <p className="text-2xl font-bold text-gray-900">{summary.migrations.total}</p>
              <p className="text-xs text-gray-500">Migrations Applied</p>
              {summary.migrations.pending > 0 && (
                <p className="text-xs text-amber-600 mt-1">{summary.migrations.pending} pending</p>
              )}
            </div>
            <div className="card p-4 text-center">
              <p className="text-2xl font-bold text-green-600">{summary.recentBackups.length}</p>
              <p className="text-xs text-gray-500">Recent Backups</p>
            </div>
          </div>

          {/* Last Health Check Result */}
          {lastCheck && (
            <div className="card p-4">
              <h2 className="text-sm font-semibold text-gray-700 mb-2">Latest Health Check</h2>
              <div className="flex items-center gap-3">
                <span className={`badge badge-${healthColor[lastCheck.status] || 'gray'}`}>
                  {lastCheck.status}
                </span>
                <span className="text-sm text-gray-600">{lastCheck.responseTimeMs}ms</span>
                <span className="text-xs text-gray-400">
                  {new Date(lastCheck.checkedAt).toLocaleTimeString()}
                </span>
              </div>
              {lastCheck.parsedDetails && (
                <div className="mt-2 text-xs text-gray-500">
                  <p>Connected: {lastCheck.parsedDetails.databaseConnected ? 'Yes' : 'No'}</p>
                  {lastCheck.parsedDetails.tableCounts && (
                    <p>
                      Students: {lastCheck.parsedDetails.tableCounts.students} |
                      Teachers: {lastCheck.parsedDetails.tableCounts.teachers} |
                      Sections: {lastCheck.parsedDetails.tableCounts.sections}
                    </p>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Recent Backups */}
          <div className="card p-4">
            <h2 className="text-sm font-semibold text-gray-700 mb-3">Recent Backups</h2>
            {summary.recentBackups.length === 0 ? (
              <p className="text-sm text-gray-500">No backup records.</p>
            ) : (
              <div className="space-y-2">
                {summary.recentBackups.map((backup) => (
                  <div key={backup.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                    <div className="flex items-center gap-2">
                      <span className="badge badge-gray">{backup.type}</span>
                      <span className={`badge badge-${backup.status === 'COMPLETED' ? 'green' : backup.status === 'FAILED' ? 'red' : 'blue'}`}>
                        {backup.status}
                      </span>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-500">{formatBytes(backup.sizeBytes)}</p>
                      {backup.completedAt && (
                        <p className="text-xs text-gray-400">{new Date(backup.completedAt).toLocaleDateString()}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      ) : (
        <div className="card p-8 text-center">
          <p className="text-gray-500">Unable to load database status.</p>
        </div>
      )}
    </div>
  );
}
