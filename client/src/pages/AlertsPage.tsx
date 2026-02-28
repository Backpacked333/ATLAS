import { useState, useEffect } from 'react';
import { api } from '../services/api';
import { Alert, AlertSummary, AlertPriority } from '../types';

const priorityColor: Record<AlertPriority, string> = {
  LOW: 'gray',
  MEDIUM: 'blue',
  HIGH: 'amber',
  CRITICAL: 'red',
};

export function AlertsPage() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [summary, setSummary] = useState<AlertSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('');

  useEffect(() => {
    Promise.all([
      api.get<Alert[]>('/alerts'),
      api.get<AlertSummary>('/alerts/summary'),
    ])
      .then(([alertData, summaryData]) => {
        setAlerts(alertData);
        setSummary(summaryData);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  async function acknowledge(alertId: string) {
    try {
      const updated = await api.put<Alert>(`/alerts/${alertId}/acknowledge`);
      setAlerts((prev) => prev.map((a) => (a.id === alertId ? updated : a)));
    } catch {
      // ignore
    }
  }

  async function resolve(alertId: string) {
    try {
      const updated = await api.put<Alert>(`/alerts/${alertId}/resolve`);
      setAlerts((prev) => prev.map((a) => (a.id === alertId ? updated : a)));
    } catch {
      // ignore
    }
  }

  const filteredAlerts = statusFilter
    ? alerts.filter((a) => a.status === statusFilter)
    : alerts;

  return (
    <div className="max-w-4xl mx-auto space-y-4">
      <h1 className="text-2xl font-bold text-gray-900">Alerts</h1>

      {summary && (
        <div className="grid grid-cols-4 gap-3">
          <div className="card p-3 text-center">
            <p className="text-2xl font-bold text-red-600">{summary.active}</p>
            <p className="text-xs text-gray-500">Active</p>
          </div>
          <div className="card p-3 text-center">
            <p className="text-2xl font-bold text-red-800">{summary.critical}</p>
            <p className="text-xs text-gray-500">Critical</p>
          </div>
          <div className="card p-3 text-center">
            <p className="text-2xl font-bold text-amber-600">{summary.acknowledged}</p>
            <p className="text-xs text-gray-500">Acknowledged</p>
          </div>
          <div className="card p-3 text-center">
            <p className="text-2xl font-bold text-gray-600">{summary.total}</p>
            <p className="text-xs text-gray-500">Total</p>
          </div>
        </div>
      )}

      <div className="flex gap-2">
        <button
          className={`btn-ghost text-sm ${!statusFilter ? 'bg-atlas-primary text-white' : ''}`}
          onClick={() => setStatusFilter('')}
        >
          All
        </button>
        {['ACTIVE', 'ACKNOWLEDGED', 'RESOLVED', 'EXPIRED'].map((status) => (
          <button
            key={status}
            className={`btn-ghost text-sm ${statusFilter === status ? 'bg-atlas-primary text-white' : ''}`}
            onClick={() => setStatusFilter(status)}
          >
            {status.charAt(0) + status.slice(1).toLowerCase()}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="card p-4 animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
              <div className="h-3 bg-gray-200 rounded w-1/2" />
            </div>
          ))}
        </div>
      ) : filteredAlerts.length === 0 ? (
        <div className="card p-8 text-center">
          <p className="text-gray-500">No alerts found.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filteredAlerts.map((alert) => (
            <div
              key={alert.id}
              className={`card p-4 ${
                alert.priority === 'CRITICAL' && alert.status === 'ACTIVE'
                  ? 'border-l-4 border-l-red-500 bg-red-50/30'
                  : alert.status === 'ACTIVE'
                    ? 'border-l-4 border-l-amber-400'
                    : ''
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className={`badge badge-${priorityColor[alert.priority]}`}>{alert.priority}</span>
                    <span className="badge badge-blue">{alert.status}</span>
                    {alert.alertRule && <span className="badge badge-gray">{alert.alertRule.category}</span>}
                  </div>
                  <p className="text-sm font-medium text-gray-900 mt-2">{alert.title}</p>
                  <p className="text-sm text-gray-500 mt-1">{alert.message}</p>
                  <p className="text-xs text-gray-400 mt-1">
                    {new Date(alert.createdAt).toLocaleDateString()} at{' '}
                    {new Date(alert.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
                <div className="flex gap-1">
                  {alert.status === 'ACTIVE' && (
                    <button onClick={() => acknowledge(alert.id)} className="btn-ghost text-xs">
                      Acknowledge
                    </button>
                  )}
                  {(alert.status === 'ACTIVE' || alert.status === 'ACKNOWLEDGED') && (
                    <button onClick={() => resolve(alert.id)} className="btn-ghost text-xs">
                      Resolve
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
