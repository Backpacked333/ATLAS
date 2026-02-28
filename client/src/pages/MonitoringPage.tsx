import { useState, useEffect } from 'react';
import { api } from '../services/api';

interface MonitoringSummary {
  totalAlerts: number;
  activeAlerts: number;
  openIncidents: number;
  totalServices: number;
  healthyServices: number;
  degradedServices: number;
  unhealthyServices: number;
}

interface ServiceHealth {
  id: string;
  serviceName: string;
  status: string;
  responseMs: number | null;
  errorMessage: string | null;
  checkedAt: string;
}

interface MonitoringIncident {
  id: string;
  status: string;
  metricValue: number;
  message: string;
  acknowledgedAt: string | null;
  resolvedAt: string | null;
  createdAt: string;
  monitoringAlert: { name: string; metricName: string; severity: string };
}

export function MonitoringPage() {
  const [summary, setSummary] = useState<MonitoringSummary | null>(null);
  const [services, setServices] = useState<ServiceHealth[]>([]);
  const [incidents, setIncidents] = useState<MonitoringIncident[]>([]);
  const [loading, setLoading] = useState(true);
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    Promise.all([
      api.get<MonitoringSummary>('/monitoring/summary'),
      api.get<ServiceHealth[]>('/monitoring/health'),
      api.get<MonitoringIncident[]>('/monitoring/incidents'),
    ])
      .then(([summaryData, servicesData, incidentsData]) => {
        setSummary(summaryData);
        setServices(servicesData);
        setIncidents(incidentsData);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  async function checkDatabase() {
    setChecking(true);
    try {
      const health = await api.post<ServiceHealth>('/monitoring/health/database', {});
      setServices((prev) => {
        const idx = prev.findIndex((s) => s.serviceName === 'database');
        if (idx >= 0) {
          const updated = [...prev];
          updated[idx] = health;
          return updated;
        }
        return [health, ...prev];
      });
      const updatedSummary = await api.get<MonitoringSummary>('/monitoring/summary');
      setSummary(updatedSummary);
    } catch {
      // ignore
    } finally {
      setChecking(false);
    }
  }

  async function acknowledgeIncident(incidentId: string) {
    try {
      await api.put(`/monitoring/incidents/${incidentId}/acknowledge`);
      setIncidents((prev) =>
        prev.map((i) =>
          i.id === incidentId ? { ...i, status: 'ACKNOWLEDGED_I', acknowledgedAt: new Date().toISOString() } : i
        )
      );
    } catch {
      // ignore
    }
  }

  async function resolveIncident(incidentId: string) {
    try {
      await api.put(`/monitoring/incidents/${incidentId}/resolve`);
      setIncidents((prev) =>
        prev.map((i) =>
          i.id === incidentId ? { ...i, status: 'RESOLVED_I', resolvedAt: new Date().toISOString() } : i
        )
      );
    } catch {
      // ignore
    }
  }

  const healthColor: Record<string, string> = {
    HEALTHY_S: 'green',
    DEGRADED_S: 'amber',
    UNHEALTHY_S: 'red',
    UNREACHABLE: 'red',
  };

  const healthLabel: Record<string, string> = {
    HEALTHY_S: 'Healthy',
    DEGRADED_S: 'Degraded',
    UNHEALTHY_S: 'Unhealthy',
    UNREACHABLE: 'Unreachable',
  };

  const incidentColor: Record<string, string> = {
    OPEN_I: 'red',
    ACKNOWLEDGED_I: 'amber',
    RESOLVED_I: 'green',
  };

  const incidentLabel: Record<string, string> = {
    OPEN_I: 'Open',
    ACKNOWLEDGED_I: 'Acknowledged',
    RESOLVED_I: 'Resolved',
  };

  const severityColor: Record<string, string> = {
    INFO_M: 'blue',
    WARNING_M: 'amber',
    CRITICAL_M: 'red',
  };

  return (
    <div className="max-w-4xl mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Monitoring & Alerting</h1>
        <button onClick={checkDatabase} disabled={checking} className="btn-ghost text-sm">
          {checking ? 'Checking...' : 'Check Database'}
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
          {/* Summary */}
          {summary && (
            <div className="grid grid-cols-4 gap-3">
              <div className="card p-3 text-center">
                <p className="text-2xl font-bold text-green-600">{summary.healthyServices}</p>
                <p className="text-xs text-gray-500">Healthy Services</p>
                <p className="text-xs text-gray-400">{summary.totalServices} total</p>
              </div>
              <div className="card p-3 text-center">
                <p className={`text-2xl font-bold ${summary.degradedServices > 0 ? 'text-amber-600' : 'text-gray-400'}`}>
                  {summary.degradedServices}
                </p>
                <p className="text-xs text-gray-500">Degraded</p>
              </div>
              <div className="card p-3 text-center">
                <p className={`text-2xl font-bold ${summary.openIncidents > 0 ? 'text-red-600' : 'text-green-600'}`}>
                  {summary.openIncidents}
                </p>
                <p className="text-xs text-gray-500">Open Incidents</p>
              </div>
              <div className="card p-3 text-center">
                <p className="text-2xl font-bold text-blue-600">{summary.activeAlerts}</p>
                <p className="text-xs text-gray-500">Active Alerts</p>
              </div>
            </div>
          )}

          {/* Service Health */}
          <div className="card p-4">
            <h2 className="text-sm font-semibold text-gray-700 mb-3">Service Health</h2>
            {services.length === 0 ? (
              <p className="text-sm text-gray-500">No service health data.</p>
            ) : (
              <div className="space-y-2">
                {services.map((svc) => (
                  <div key={svc.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                    <div className="flex items-center gap-2">
                      <span className={`badge badge-${healthColor[svc.status] || 'gray'}`}>
                        {healthLabel[svc.status] || svc.status}
                      </span>
                      <span className="text-sm font-medium text-gray-900">{svc.serviceName}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      {svc.responseMs !== null && (
                        <span className="text-xs text-gray-500">{svc.responseMs}ms</span>
                      )}
                      <span className="text-xs text-gray-400">
                        {new Date(svc.checkedAt).toLocaleTimeString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Incidents */}
          <div className="card p-4">
            <h2 className="text-sm font-semibold text-gray-700 mb-3">Recent Incidents</h2>
            {incidents.length === 0 ? (
              <p className="text-sm text-gray-500">No incidents recorded.</p>
            ) : (
              <div className="space-y-2">
                {incidents.slice(0, 20).map((incident) => (
                  <div key={incident.id} className="py-2 border-b border-gray-100 last:border-0">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className={`badge badge-${incidentColor[incident.status] || 'gray'}`}>
                            {incidentLabel[incident.status] || incident.status}
                          </span>
                          <span className={`badge badge-${severityColor[incident.monitoringAlert.severity] || 'gray'} text-xs`}>
                            {incident.monitoringAlert.severity.replace('_M', '')}
                          </span>
                          <span className="text-sm font-medium text-gray-900">{incident.monitoringAlert.name}</span>
                        </div>
                        <p className="text-sm text-gray-500 mt-1">{incident.message}</p>
                        <p className="text-xs text-gray-400 mt-1">
                          {incident.monitoringAlert.metricName}: {incident.metricValue} |{' '}
                          {new Date(incident.createdAt).toLocaleString()}
                        </p>
                      </div>
                      {incident.status === 'OPEN_I' && (
                        <div className="flex gap-1">
                          <button
                            onClick={() => acknowledgeIncident(incident.id)}
                            className="btn-ghost text-xs"
                          >
                            Ack
                          </button>
                          <button
                            onClick={() => resolveIncident(incident.id)}
                            className="btn-ghost text-xs text-green-600"
                          >
                            Resolve
                          </button>
                        </div>
                      )}
                      {incident.status === 'ACKNOWLEDGED_I' && (
                        <button
                          onClick={() => resolveIncident(incident.id)}
                          className="btn-ghost text-xs text-green-600"
                        >
                          Resolve
                        </button>
                      )}
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
