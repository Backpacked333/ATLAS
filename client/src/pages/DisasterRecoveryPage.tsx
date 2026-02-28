import { useState, useEffect } from 'react';
import { api } from '../services/api';

interface RecoverySummary {
  totalPlans: number;
  activePlans: number;
  testsLast30d: number;
  failedTestsLast30d: number;
  failoversLast30d: number;
}

interface RecoveryPlan {
  id: string;
  name: string;
  description: string | null;
  type: string;
  priority: number;
  rtoMinutes: number;
  rpoMinutes: number;
  isActive: boolean;
  lastTestedAt: string | null;
  _count: { tests: number };
}

export function DisasterRecoveryPage() {
  const [summary, setSummary] = useState<RecoverySummary | null>(null);
  const [plans, setPlans] = useState<RecoveryPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [testing, setTesting] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      api.get<RecoverySummary>('/disaster-recovery/summary'),
      api.get<RecoveryPlan[]>('/disaster-recovery/plans'),
    ])
      .then(([summaryData, plansData]) => {
        setSummary(summaryData);
        setPlans(plansData);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  async function startTest(planId: string) {
    setTesting(planId);
    try {
      await api.post(`/disaster-recovery/plans/${planId}/test`, {});
      const [updatedSummary, updatedPlans] = await Promise.all([
        api.get<RecoverySummary>('/disaster-recovery/summary'),
        api.get<RecoveryPlan[]>('/disaster-recovery/plans'),
      ]);
      setSummary(updatedSummary);
      setPlans(updatedPlans);
    } catch {
      // ignore
    } finally {
      setTesting(null);
    }
  }

  const typeLabel: Record<string, string> = {
    DATABASE_FAILURE: 'Database Failure',
    APPLICATION_FAILURE: 'Application Failure',
    NETWORK_FAILURE: 'Network Failure',
    FULL_SITE_RECOVERY: 'Full Site Recovery',
    DATA_CORRUPTION: 'Data Corruption',
    RANSOMWARE: 'Ransomware',
  };

  return (
    <div className="max-w-4xl mx-auto space-y-4">
      <h1 className="text-2xl font-bold text-gray-900">Disaster Recovery</h1>

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
          {/* Summary Stats */}
          {summary && (
            <div className="grid grid-cols-5 gap-3">
              <div className="card p-3 text-center">
                <p className="text-2xl font-bold text-gray-900">{summary.totalPlans}</p>
                <p className="text-xs text-gray-500">Total Plans</p>
              </div>
              <div className="card p-3 text-center">
                <p className="text-2xl font-bold text-green-600">{summary.activePlans}</p>
                <p className="text-xs text-gray-500">Active</p>
              </div>
              <div className="card p-3 text-center">
                <p className="text-2xl font-bold text-blue-600">{summary.testsLast30d}</p>
                <p className="text-xs text-gray-500">Tests (30d)</p>
              </div>
              <div className="card p-3 text-center">
                <p className={`text-2xl font-bold ${summary.failedTestsLast30d > 0 ? 'text-red-600' : 'text-green-600'}`}>
                  {summary.failedTestsLast30d}
                </p>
                <p className="text-xs text-gray-500">Failed Tests</p>
              </div>
              <div className="card p-3 text-center">
                <p className="text-2xl font-bold text-amber-600">{summary.failoversLast30d}</p>
                <p className="text-xs text-gray-500">Failovers</p>
              </div>
            </div>
          )}

          {/* Recovery Plans */}
          <h2 className="text-lg font-semibold text-gray-900">Recovery Plans</h2>
          {plans.length === 0 ? (
            <div className="card p-8 text-center">
              <p className="text-gray-500">No recovery plans configured.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {plans.map((plan) => (
                <div key={plan.id} className="card p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="badge badge-blue">{typeLabel[plan.type] || plan.type}</span>
                        <span className={`badge ${plan.isActive ? 'badge-green' : 'badge-gray'}`}>
                          {plan.isActive ? 'Active' : 'Inactive'}
                        </span>
                        <span className="badge badge-gray">P{plan.priority}</span>
                      </div>
                      <p className="text-sm font-medium text-gray-900 mt-2">{plan.name}</p>
                      {plan.description && (
                        <p className="text-sm text-gray-500 mt-1">{plan.description}</p>
                      )}
                      <div className="flex items-center gap-4 mt-1">
                        <p className="text-xs text-gray-400">
                          RTO: {plan.rtoMinutes}min | RPO: {plan.rpoMinutes}min
                        </p>
                        <p className="text-xs text-gray-400">
                          {plan._count.tests} test{plan._count.tests !== 1 ? 's' : ''}
                        </p>
                        {plan.lastTestedAt && (
                          <p className="text-xs text-gray-400">
                            Last tested: {new Date(plan.lastTestedAt).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => startTest(plan.id)}
                      disabled={testing === plan.id}
                      className="btn-ghost text-xs"
                    >
                      {testing === plan.id ? 'Testing...' : 'Run Test'}
                    </button>
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
