import { useState, useEffect } from 'react';
import { api } from '../services/api';

interface AuditLog {
  id: string;
  userId: string | null;
  userEmail: string | null;
  action: string;
  resource: string;
  resourceId: string | null;
  details: string | null;
  status: string;
  createdAt: string;
}

interface AuditSummary {
  totalLast24h: number;
  failuresLast24h: number;
  deniedLast24h: number;
  totalLast7d: number;
  topActions: { action: string; count: number }[];
}

export function AuditLogPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [summary, setSummary] = useState<AuditSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionFilter, setActionFilter] = useState('');

  useEffect(() => {
    Promise.all([
      api.get<{ logs: AuditLog[]; total: number }>('/audit/logs?limit=100'),
      api.get<AuditSummary>('/audit/summary'),
    ])
      .then(([logData, summaryData]) => {
        setLogs(logData.logs);
        setSummary(summaryData);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const statusColor: Record<string, string> = {
    SUCCESS: 'green',
    FAILURE: 'red',
    DENIED: 'amber',
  };

  const filteredLogs = actionFilter
    ? logs.filter((l) => l.action === actionFilter)
    : logs;

  return (
    <div className="max-w-4xl mx-auto space-y-4">
      <h1 className="text-2xl font-bold text-gray-900">Audit Log</h1>

      {summary && (
        <div className="grid grid-cols-4 gap-3">
          <div className="card p-3 text-center">
            <p className="text-2xl font-bold text-gray-900">{summary.totalLast24h}</p>
            <p className="text-xs text-gray-500">Events (24h)</p>
          </div>
          <div className="card p-3 text-center">
            <p className="text-2xl font-bold text-red-600">{summary.failuresLast24h}</p>
            <p className="text-xs text-gray-500">Failures (24h)</p>
          </div>
          <div className="card p-3 text-center">
            <p className="text-2xl font-bold text-amber-600">{summary.deniedLast24h}</p>
            <p className="text-xs text-gray-500">Denied (24h)</p>
          </div>
          <div className="card p-3 text-center">
            <p className="text-2xl font-bold text-blue-600">{summary.totalLast7d}</p>
            <p className="text-xs text-gray-500">Events (7d)</p>
          </div>
        </div>
      )}

      {summary && summary.topActions.length > 0 && (
        <div className="flex gap-2 flex-wrap">
          <button
            className={`btn-ghost text-sm ${!actionFilter ? 'bg-atlas-primary text-white' : ''}`}
            onClick={() => setActionFilter('')}
          >
            All
          </button>
          {summary.topActions.slice(0, 5).map((a) => (
            <button
              key={a.action}
              className={`btn-ghost text-sm ${actionFilter === a.action ? 'bg-atlas-primary text-white' : ''}`}
              onClick={() => setActionFilter(a.action)}
            >
              {a.action} ({a.count})
            </button>
          ))}
        </div>
      )}

      {loading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="card p-4 animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
              <div className="h-3 bg-gray-200 rounded w-1/2" />
            </div>
          ))}
        </div>
      ) : filteredLogs.length === 0 ? (
        <div className="card p-8 text-center">
          <p className="text-gray-500">No audit logs found.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filteredLogs.map((log) => (
            <div key={log.id} className="card p-4">
              <div className="flex items-start gap-3">
                <span className={`badge badge-${statusColor[log.status] || 'gray'} mt-0.5`}>
                  {log.status}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="badge badge-gray">{log.action}</span>
                    <span className="badge badge-blue">{log.resource}</span>
                  </div>
                  {log.userEmail && (
                    <p className="text-sm text-gray-500 mt-1">User: {log.userEmail}</p>
                  )}
                  <p className="text-xs text-gray-400 mt-1">
                    {new Date(log.createdAt).toLocaleDateString()} at{' '}
                    {new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
