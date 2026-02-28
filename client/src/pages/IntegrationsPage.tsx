import { useState, useEffect } from 'react';
import { api } from '../services/api';
import { IntegrationConnector, IntegrationSummary } from '../types';

const typeLabel: Record<string, string> = {
  SIS: 'Student Information System',
  LMS: 'Learning Management System',
  ASSESSMENT: 'Assessment Platform',
  IDENTITY: 'Identity Provider',
  COMMUNICATION: 'Communication',
};

export function IntegrationsPage() {
  const [connectors, setConnectors] = useState<IntegrationConnector[]>([]);
  const [summary, setSummary] = useState<IntegrationSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get<IntegrationConnector[]>('/integrations/connectors'),
      api.get<IntegrationSummary>('/integrations/summary'),
    ])
      .then(([connectorData, summaryData]) => {
        setConnectors(connectorData);
        setSummary(summaryData);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="max-w-4xl mx-auto space-y-4">
      <h1 className="text-2xl font-bold text-gray-900">Data Integrations</h1>

      {summary && (
        <div className="grid grid-cols-4 gap-3">
          <div className="card p-3 text-center">
            <p className="text-2xl font-bold text-gray-900">{summary.totalConnectors}</p>
            <p className="text-xs text-gray-500">Total Connectors</p>
          </div>
          <div className="card p-3 text-center">
            <p className="text-2xl font-bold text-green-600">{summary.activeConnectors}</p>
            <p className="text-xs text-gray-500">Active</p>
          </div>
          <div className="card p-3 text-center">
            <p className="text-2xl font-bold text-blue-600">{summary.recentSyncsLast24h}</p>
            <p className="text-xs text-gray-500">Syncs (24h)</p>
          </div>
          <div className="card p-3 text-center">
            <p className="text-2xl font-bold text-red-600">{summary.failedSyncsLast24h}</p>
            <p className="text-xs text-gray-500">Failed (24h)</p>
          </div>
        </div>
      )}

      {summary && summary.connectorsByType.length > 0 && (
        <div className="card p-4">
          <h2 className="text-sm font-semibold text-gray-700 mb-3">Connectors by Type</h2>
          <div className="flex gap-3 flex-wrap">
            {summary.connectorsByType.map((c) => (
              <div key={c.type} className="flex items-center gap-2">
                <span className="badge badge-gray">{typeLabel[c.type] || c.type}</span>
                <span className="text-sm font-medium text-gray-700">{c.count}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {loading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="card p-4 animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
              <div className="h-3 bg-gray-200 rounded w-1/2" />
            </div>
          ))}
        </div>
      ) : connectors.length === 0 ? (
        <div className="card p-8 text-center">
          <p className="text-gray-500">No integration connectors configured.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {connectors.map((connector) => (
            <div key={connector.id} className="card p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="badge badge-gray">{typeLabel[connector.type] || connector.type}</span>
                    <span className={`badge ${connector.isActive ? 'badge-green' : 'badge-gray'}`}>
                      {connector.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  <p className="text-sm font-medium text-gray-900 mt-2">{connector.name}</p>
                  <p className="text-sm text-gray-500 mt-1">Provider: {connector.provider}</p>
                  <div className="flex items-center gap-3 mt-1">
                    <p className="text-xs text-gray-400">
                      {connector.lastSyncAt
                        ? `Last sync: ${new Date(connector.lastSyncAt).toLocaleDateString()} ${new Date(connector.lastSyncAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
                        : 'Never synced'}
                    </p>
                    <p className="text-xs text-gray-400">{connector._count.syncLogs} total syncs</p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
