import { useState, useEffect } from 'react';
import { api } from '../services/api';
import { ComplianceSummary, PolicyRule, ComplianceViolation } from '../types';

const severityColor: Record<string, string> = {
  INFO: 'blue',
  WARNING: 'amber',
  CRITICAL: 'red',
};

export function CompliancePage() {
  const [summary, setSummary] = useState<ComplianceSummary | null>(null);
  const [rules, setRules] = useState<PolicyRule[]>([]);
  const [violations, setViolations] = useState<ComplianceViolation[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'rules' | 'violations'>('overview');

  useEffect(() => {
    Promise.all([
      api.get<ComplianceSummary>('/compliance/summary'),
      api.get<PolicyRule[]>('/compliance/rules'),
      api.get<ComplianceViolation[]>('/compliance/violations'),
    ])
      .then(([summaryData, rulesData, violationsData]) => {
        setSummary(summaryData);
        setRules(rulesData);
        setViolations(violationsData);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="max-w-4xl mx-auto space-y-4">
      <h1 className="text-2xl font-bold text-gray-900">Policy Compliance</h1>

      {summary && (
        <div className="grid grid-cols-4 gap-3">
          <div className="card p-3 text-center">
            <p className="text-2xl font-bold text-gray-900">{summary.activeRules}</p>
            <p className="text-xs text-gray-500">Active Rules</p>
          </div>
          <div className="card p-3 text-center">
            <p className="text-2xl font-bold text-amber-600">{summary.openViolations}</p>
            <p className="text-xs text-gray-500">Open Violations</p>
          </div>
          <div className="card p-3 text-center">
            <p className="text-2xl font-bold text-red-600">{summary.criticalViolations}</p>
            <p className="text-xs text-gray-500">Critical</p>
          </div>
          <div className="card p-3 text-center">
            <p className="text-2xl font-bold text-green-600">{summary.totalRules}</p>
            <p className="text-xs text-gray-500">Total Rules</p>
          </div>
        </div>
      )}

      <div className="flex gap-2">
        <button
          className={`btn-ghost text-sm ${activeTab === 'overview' ? 'bg-atlas-primary text-white' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          Overview
        </button>
        <button
          className={`btn-ghost text-sm ${activeTab === 'rules' ? 'bg-atlas-primary text-white' : ''}`}
          onClick={() => setActiveTab('rules')}
        >
          Policy Rules
        </button>
        <button
          className={`btn-ghost text-sm ${activeTab === 'violations' ? 'bg-atlas-primary text-white' : ''}`}
          onClick={() => setActiveTab('violations')}
        >
          Violations
        </button>
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
      ) : activeTab === 'overview' ? (
        <div className="card p-6 space-y-4">
          <h2 className="text-lg font-semibold text-gray-900">Violations by Severity</h2>
          {summary?.violationsBySeverity.map((v) => (
            <div key={v.severity} className="flex items-center gap-3">
              <span className={`badge badge-${severityColor[v.severity] || 'gray'}`}>{v.severity}</span>
              <div className="flex-1 bg-gray-200 rounded-full h-2">
                <div
                  className={`h-2 rounded-full ${
                    v.severity === 'CRITICAL' ? 'bg-red-500' : v.severity === 'WARNING' ? 'bg-amber-500' : 'bg-blue-500'
                  }`}
                  style={{ width: `${Math.min((v.count / Math.max(summary?.openViolations || 1, 1)) * 100, 100)}%` }}
                />
              </div>
              <span className="text-sm font-medium text-gray-700">{v.count}</span>
            </div>
          ))}
        </div>
      ) : activeTab === 'rules' ? (
        <div className="space-y-2">
          {rules.length === 0 ? (
            <div className="card p-8 text-center">
              <p className="text-gray-500">No policy rules configured.</p>
            </div>
          ) : (
            rules.map((rule) => (
              <div key={rule.id} className="card p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="badge badge-gray">{rule.category}</span>
                      <span className={`badge ${rule.isActive ? 'badge-green' : 'badge-gray'}`}>
                        {rule.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    <p className="text-sm font-medium text-gray-900 mt-2">{rule.name}</p>
                    <p className="text-sm text-gray-500 mt-1">{rule.description}</p>
                  </div>
                  <span className="text-sm text-gray-400">{rule._count.violations} violations</span>
                </div>
              </div>
            ))
          )}
        </div>
      ) : (
        <div className="space-y-2">
          {violations.length === 0 ? (
            <div className="card p-8 text-center">
              <p className="text-gray-500">No violations recorded.</p>
            </div>
          ) : (
            violations.map((v) => (
              <div key={v.id} className="card p-4">
                <div className="flex items-start gap-3">
                  <span className={`badge badge-${severityColor[v.severity] || 'gray'} mt-0.5`}>
                    {v.severity}
                  </span>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="badge badge-gray">{v.policyRule.category}</span>
                      <span className="badge badge-blue">{v.status}</span>
                    </div>
                    <p className="text-sm text-gray-700 mt-1">{v.description}</p>
                    <p className="text-xs text-gray-400 mt-1">
                      Rule: {v.policyRule.name} | {new Date(v.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
