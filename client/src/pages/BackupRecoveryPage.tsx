import { useState, useEffect } from 'react';
import { api } from '../services/api';

interface BackupSummary {
  totalScheduled: number;
  activeScheduled: number;
  totalRecoveryPoints: number;
  completedPoints: number;
  totalSizeBytes: number;
  activeRetentionPolicies: number;
}

interface ScheduledBackup {
  id: string;
  name: string;
  type: string;
  schedule: string;
  isActive: boolean;
  retention: number;
  destination: string;
  lastRunAt: string | null;
  _count: { recoveryPoints: number };
}

interface RetentionPolicy {
  id: string;
  name: string;
  backupType: string;
  retentionDays: number;
  maxCopies: number;
  isActive: boolean;
}

export function BackupRecoveryPage() {
  const [summary, setSummary] = useState<BackupSummary | null>(null);
  const [backups, setBackups] = useState<ScheduledBackup[]>([]);
  const [policies, setPolicies] = useState<RetentionPolicy[]>([]);
  const [loading, setLoading] = useState(true);
  const [enforcing, setEnforcing] = useState(false);

  useEffect(() => {
    Promise.all([
      api.get<BackupSummary>('/backup-recovery/summary'),
      api.get<ScheduledBackup[]>('/backup-recovery/scheduled'),
      api.get<RetentionPolicy[]>('/backup-recovery/retention-policies'),
    ])
      .then(([summaryData, backupsData, policiesData]) => {
        setSummary(summaryData);
        setBackups(backupsData);
        setPolicies(policiesData);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  async function enforceRetention() {
    setEnforcing(true);
    try {
      await api.post('/backup-recovery/enforce-retention', {});
      const updated = await api.get<BackupSummary>('/backup-recovery/summary');
      setSummary(updated);
    } catch {
      // ignore
    } finally {
      setEnforcing(false);
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
        <h1 className="text-2xl font-bold text-gray-900">Backup & Recovery</h1>
        <button onClick={enforceRetention} disabled={enforcing} className="btn-ghost text-sm">
          {enforcing ? 'Enforcing...' : 'Enforce Retention'}
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
            <div className="grid grid-cols-3 gap-3">
              <div className="card p-3 text-center">
                <p className="text-2xl font-bold text-green-600">{summary.activeScheduled}</p>
                <p className="text-xs text-gray-500">Active Schedules</p>
                <p className="text-xs text-gray-400">{summary.totalScheduled} total</p>
              </div>
              <div className="card p-3 text-center">
                <p className="text-2xl font-bold text-blue-600">{summary.completedPoints}</p>
                <p className="text-xs text-gray-500">Recovery Points</p>
                <p className="text-xs text-gray-400">{summary.totalRecoveryPoints} total</p>
              </div>
              <div className="card p-3 text-center">
                <p className="text-2xl font-bold text-gray-900">{formatBytes(summary.totalSizeBytes)}</p>
                <p className="text-xs text-gray-500">Total Backup Size</p>
              </div>
            </div>
          )}

          {/* Scheduled Backups */}
          <h2 className="text-lg font-semibold text-gray-900">Scheduled Backups</h2>
          {backups.length === 0 ? (
            <div className="card p-8 text-center">
              <p className="text-gray-500">No scheduled backups configured.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {backups.map((backup) => (
                <div key={backup.id} className="card p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="badge badge-blue">{backup.type}</span>
                        <span className={`badge ${backup.isActive ? 'badge-green' : 'badge-gray'}`}>
                          {backup.isActive ? 'Active' : 'Disabled'}
                        </span>
                      </div>
                      <p className="text-sm font-medium text-gray-900 mt-2">{backup.name}</p>
                      <div className="flex items-center gap-3 mt-1">
                        <p className="text-xs text-gray-400">Schedule: {backup.schedule}</p>
                        <p className="text-xs text-gray-400">Retain: {backup.retention}d</p>
                        <p className="text-xs text-gray-400">{backup._count.recoveryPoints} points</p>
                        {backup.lastRunAt && (
                          <p className="text-xs text-gray-400">
                            Last run: {new Date(backup.lastRunAt).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                      <p className="text-xs text-gray-400 mt-1">{backup.destination}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Retention Policies */}
          <div className="card p-4">
            <h2 className="text-sm font-semibold text-gray-700 mb-3">Retention Policies</h2>
            {policies.length === 0 ? (
              <p className="text-sm text-gray-500">No retention policies.</p>
            ) : (
              <div className="space-y-2">
                {policies.map((policy) => (
                  <div key={policy.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                    <div className="flex items-center gap-2">
                      <span className={`badge ${policy.isActive ? 'badge-green' : 'badge-gray'}`}>
                        {policy.isActive ? 'Active' : 'Inactive'}
                      </span>
                      <span className="badge badge-gray">{policy.backupType}</span>
                      <span className="text-sm text-gray-900">{policy.name}</span>
                    </div>
                    <div className="text-xs text-gray-500">
                      {policy.retentionDays}d / max {policy.maxCopies} copies
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
