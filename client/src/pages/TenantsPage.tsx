import { useState, useEffect } from 'react';
import { api } from '../services/api';

interface TenancySummary {
  totalTenants: number;
  activeTenants: number;
  suspendedTenants: number;
  partitionCount: number;
  byTier: { tier: string; count: number }[];
}

interface Tenant {
  id: string;
  name: string;
  displayName: string;
  domain: string | null;
  status: string;
  tier: string;
  maxUsers: number;
  maxStorage: number;
  createdAt: string;
  _count: { resourceQuotas: number };
}

export function TenantsPage() {
  const [summary, setSummary] = useState<TenancySummary | null>(null);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get<TenancySummary>('/tenants/summary'),
      api.get<Tenant[]>('/tenants'),
    ])
      .then(([summaryData, tenantsData]) => {
        setSummary(summaryData);
        setTenants(tenantsData);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const statusColor: Record<string, string> = {
    ACTIVE: 'green',
    SUSPENDED: 'red',
    PROVISIONING: 'blue',
    DECOMMISSIONED: 'gray',
  };

  const tierColor: Record<string, string> = {
    FREE: 'gray',
    STANDARD: 'blue',
    PREMIUM: 'amber',
    ENTERPRISE: 'green',
  };

  function formatStorage(bytes: number): string {
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(0)} MB`;
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-4">
      <h1 className="text-2xl font-bold text-gray-900">Multi-Tenancy</h1>

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
          {/* Summary */}
          {summary && (
            <div className="grid grid-cols-4 gap-3">
              <div className="card p-3 text-center">
                <p className="text-2xl font-bold text-gray-900">{summary.totalTenants}</p>
                <p className="text-xs text-gray-500">Total Tenants</p>
              </div>
              <div className="card p-3 text-center">
                <p className="text-2xl font-bold text-green-600">{summary.activeTenants}</p>
                <p className="text-xs text-gray-500">Active</p>
              </div>
              <div className="card p-3 text-center">
                <p className={`text-2xl font-bold ${summary.suspendedTenants > 0 ? 'text-red-600' : 'text-gray-400'}`}>
                  {summary.suspendedTenants}
                </p>
                <p className="text-xs text-gray-500">Suspended</p>
              </div>
              <div className="card p-3 text-center">
                <p className="text-2xl font-bold text-blue-600">{summary.partitionCount}</p>
                <p className="text-xs text-gray-500">Partitions</p>
              </div>
            </div>
          )}

          {/* Tier Breakdown */}
          {summary && summary.byTier.length > 0 && (
            <div className="card p-4">
              <h2 className="text-sm font-semibold text-gray-700 mb-3">Tenants by Tier</h2>
              <div className="flex gap-4">
                {summary.byTier.map((t) => (
                  <div key={t.tier} className="flex items-center gap-2">
                    <span className={`badge badge-${tierColor[t.tier] || 'gray'}`}>{t.tier}</span>
                    <span className="text-sm font-medium text-gray-700">{t.count}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tenants List */}
          <h2 className="text-lg font-semibold text-gray-900">Tenants</h2>
          {tenants.length === 0 ? (
            <div className="card p-8 text-center">
              <p className="text-gray-500">No tenants configured.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {tenants.map((tenant) => (
                <div key={tenant.id} className="card p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className={`badge badge-${statusColor[tenant.status] || 'gray'}`}>
                          {tenant.status}
                        </span>
                        <span className={`badge badge-${tierColor[tenant.tier] || 'gray'}`}>
                          {tenant.tier}
                        </span>
                      </div>
                      <p className="text-sm font-medium text-gray-900 mt-2">{tenant.displayName}</p>
                      <div className="flex items-center gap-3 mt-1">
                        <p className="text-xs text-gray-400">ID: {tenant.name}</p>
                        {tenant.domain && (
                          <p className="text-xs text-gray-400">{tenant.domain}</p>
                        )}
                        <p className="text-xs text-gray-400">Max users: {tenant.maxUsers}</p>
                        <p className="text-xs text-gray-400">Storage: {formatStorage(tenant.maxStorage)}</p>
                      </div>
                    </div>
                    <p className="text-xs text-gray-400">{new Date(tenant.createdAt).toLocaleDateString()}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
