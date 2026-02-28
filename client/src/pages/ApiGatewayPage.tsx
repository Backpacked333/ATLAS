import { useState, useEffect } from 'react';
import { api } from '../services/api';

interface ApiKeyInfo {
  id: string;
  name: string;
  prefix: string;
  scopes: string;
  isActive: boolean;
  expiresAt: string | null;
  lastUsedAt: string | null;
  rateLimitPerMinute: number;
  createdAt: string;
}

interface ApiStats {
  totalRequests24h: number;
  errorRate: number;
  avgResponseTime: number;
  requestsByMethod: { method: string; count: number }[];
}

export function ApiGatewayPage() {
  const [keys, setKeys] = useState<ApiKeyInfo[]>([]);
  const [stats, setStats] = useState<ApiStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get<ApiKeyInfo[]>('/gateway/keys'),
      api.get<ApiStats>('/gateway/stats'),
    ])
      .then(([keyData, statsData]) => {
        setKeys(keyData);
        setStats(statsData);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  async function revokeKey(keyId: string) {
    try {
      await api.put(`/gateway/keys/${keyId}/revoke`);
      setKeys((prev) =>
        prev.map((k) => (k.id === keyId ? { ...k, isActive: false } : k))
      );
    } catch {
      // ignore
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-4">
      <h1 className="text-2xl font-bold text-gray-900">API Gateway</h1>

      {stats && (
        <div className="grid grid-cols-4 gap-3">
          <div className="card p-3 text-center">
            <p className="text-2xl font-bold text-gray-900">{stats.totalRequests24h}</p>
            <p className="text-xs text-gray-500">Requests (24h)</p>
          </div>
          <div className="card p-3 text-center">
            <p className="text-2xl font-bold text-red-600">{stats.errorRate}%</p>
            <p className="text-xs text-gray-500">Error Rate</p>
          </div>
          <div className="card p-3 text-center">
            <p className="text-2xl font-bold text-blue-600">{stats.avgResponseTime}ms</p>
            <p className="text-xs text-gray-500">Avg Response</p>
          </div>
          <div className="card p-3 text-center">
            <p className="text-2xl font-bold text-green-600">{keys.filter((k) => k.isActive).length}</p>
            <p className="text-xs text-gray-500">Active Keys</p>
          </div>
        </div>
      )}

      {stats && stats.requestsByMethod.length > 0 && (
        <div className="card p-4">
          <h2 className="text-sm font-semibold text-gray-700 mb-3">Requests by Method (24h)</h2>
          <div className="flex gap-4">
            {stats.requestsByMethod.map((r) => (
              <div key={r.method} className="flex items-center gap-2">
                <span className="badge badge-gray">{r.method}</span>
                <span className="text-sm font-medium text-gray-700">{r.count}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <h2 className="text-lg font-semibold text-gray-900">API Keys</h2>

      {loading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="card p-4 animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
              <div className="h-3 bg-gray-200 rounded w-1/2" />
            </div>
          ))}
        </div>
      ) : keys.length === 0 ? (
        <div className="card p-8 text-center">
          <p className="text-gray-500">No API keys configured.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {keys.map((key) => (
            <div key={key.id} className="card p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className={`badge ${key.isActive ? 'badge-green' : 'badge-gray'}`}>
                      {key.isActive ? 'Active' : 'Revoked'}
                    </span>
                    <code className="text-xs bg-gray-100 px-2 py-0.5 rounded">{key.prefix}...</code>
                  </div>
                  <p className="text-sm font-medium text-gray-900 mt-2">{key.name}</p>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {key.scopes.split(',').map((scope) => (
                      <span key={scope} className="badge badge-blue text-xs">{scope.trim()}</span>
                    ))}
                  </div>
                  <div className="flex items-center gap-3 mt-1">
                    <p className="text-xs text-gray-400">Rate: {key.rateLimitPerMinute}/min</p>
                    {key.lastUsedAt && (
                      <p className="text-xs text-gray-400">
                        Last used: {new Date(key.lastUsedAt).toLocaleDateString()}
                      </p>
                    )}
                    {key.expiresAt && (
                      <p className="text-xs text-gray-400">
                        Expires: {new Date(key.expiresAt).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                </div>
                {key.isActive && (
                  <button
                    onClick={() => revokeKey(key.id)}
                    className="btn-ghost text-xs text-red-600"
                  >
                    Revoke
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
