import { useState, useEffect } from 'react';
import { api } from '../services/api';

interface AuthSummary {
  totalAttempts24h: number;
  failedAttempts24h: number;
  totalAttempts7d: number;
  activeSessions: number;
  failureRate24h: number;
  activePolicies: number;
  mfaEnrollments: number;
}

interface AuthSession {
  id: string;
  userId: string;
  userType: string;
  ipAddress: string | null;
  isActive: boolean;
  expiresAt: string;
  lastActivityAt: string;
  createdAt: string;
}

interface PasswordPolicy {
  id: string;
  name: string;
  minLength: number;
  requireUppercase: boolean;
  requireLowercase: boolean;
  requireNumbers: boolean;
  requireSpecial: boolean;
  maxAgeDays: number;
  lockoutThreshold: number;
  lockoutDurationMinutes: number;
  isActive: boolean;
}

export function AuthManagementPage() {
  const [summary, setSummary] = useState<AuthSummary | null>(null);
  const [sessions, setSessions] = useState<AuthSession[]>([]);
  const [policies, setPolicies] = useState<PasswordPolicy[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get<AuthSummary>('/auth-management/summary'),
      api.get<AuthSession[]>('/auth-management/sessions'),
      api.get<PasswordPolicy[]>('/auth-management/password-policies'),
    ])
      .then(([summaryData, sessionsData, policiesData]) => {
        setSummary(summaryData);
        setSessions(sessionsData);
        setPolicies(policiesData);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  async function terminateSession(sessionId: string) {
    try {
      await api.put(`/auth-management/sessions/${sessionId}/terminate`);
      setSessions((prev) =>
        prev.map((s) => (s.id === sessionId ? { ...s, isActive: false } : s))
      );
    } catch {
      // ignore
    }
  }

  async function cleanExpired() {
    try {
      await api.post('/auth-management/sessions/clean-expired', {});
      const updated = await api.get<AuthSession[]>('/auth-management/sessions');
      setSessions(updated);
    } catch {
      // ignore
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Authentication Management</h1>
        <button onClick={cleanExpired} className="btn-ghost text-sm">Clean Expired Sessions</button>
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
                <p className="text-2xl font-bold text-gray-900">{summary.activeSessions}</p>
                <p className="text-xs text-gray-500">Active Sessions</p>
              </div>
              <div className="card p-3 text-center">
                <p className="text-2xl font-bold text-blue-600">{summary.totalAttempts24h}</p>
                <p className="text-xs text-gray-500">Logins (24h)</p>
              </div>
              <div className="card p-3 text-center">
                <p className={`text-2xl font-bold ${summary.failureRate24h > 10 ? 'text-red-600' : 'text-green-600'}`}>
                  {summary.failureRate24h}%
                </p>
                <p className="text-xs text-gray-500">Failure Rate</p>
              </div>
              <div className="card p-3 text-center">
                <p className="text-2xl font-bold text-green-600">{summary.mfaEnrollments}</p>
                <p className="text-xs text-gray-500">MFA Enrolled</p>
              </div>
            </div>
          )}

          {/* Active Sessions */}
          <div className="card p-4">
            <h2 className="text-sm font-semibold text-gray-700 mb-3">Active Sessions</h2>
            {sessions.length === 0 ? (
              <p className="text-sm text-gray-500">No active sessions.</p>
            ) : (
              <div className="space-y-2">
                {sessions.slice(0, 20).map((session) => (
                  <div key={session.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="badge badge-gray">{session.userType}</span>
                        <span className={`badge ${session.isActive ? 'badge-green' : 'badge-gray'}`}>
                          {session.isActive ? 'Active' : 'Terminated'}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 mt-1">
                        <p className="text-xs text-gray-500">{session.ipAddress || 'Unknown IP'}</p>
                        <p className="text-xs text-gray-400">
                          Last active: {new Date(session.lastActivityAt).toLocaleString()}
                        </p>
                      </div>
                    </div>
                    {session.isActive && (
                      <button
                        onClick={() => terminateSession(session.id)}
                        className="btn-ghost text-xs text-red-600"
                      >
                        Terminate
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Password Policies */}
          <div className="card p-4">
            <h2 className="text-sm font-semibold text-gray-700 mb-3">Password Policies</h2>
            {policies.length === 0 ? (
              <p className="text-sm text-gray-500">No password policies configured.</p>
            ) : (
              <div className="space-y-2">
                {policies.map((policy) => (
                  <div key={policy.id} className="py-2 border-b border-gray-100 last:border-0">
                    <div className="flex items-center gap-2">
                      <span className={`badge ${policy.isActive ? 'badge-green' : 'badge-gray'}`}>
                        {policy.isActive ? 'Active' : 'Inactive'}
                      </span>
                      <span className="text-sm font-medium text-gray-900">{policy.name}</span>
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                      <span>Min length: {policy.minLength}</span>
                      <span>Max age: {policy.maxAgeDays}d</span>
                      <span>Lockout: {policy.lockoutThreshold} attempts / {policy.lockoutDurationMinutes}min</span>
                      {policy.requireUppercase && <span className="badge badge-gray text-xs">A-Z</span>}
                      {policy.requireNumbers && <span className="badge badge-gray text-xs">0-9</span>}
                      {policy.requireSpecial && <span className="badge badge-gray text-xs">!@#</span>}
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
