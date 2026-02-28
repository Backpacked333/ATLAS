import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';
import { Case, CaseStatus, CasePriority } from '../types';

const priorityColor: Record<CasePriority, string> = {
  LOW: 'gray',
  MEDIUM: 'blue',
  HIGH: 'amber',
  URGENT: 'red',
};

const statusLabel: Record<CaseStatus, string> = {
  OPEN: 'Open',
  IN_PROGRESS: 'In Progress',
  PENDING_REVIEW: 'Pending Review',
  ESCALATED: 'Escalated',
  RESOLVED: 'Resolved',
  CLOSED: 'Closed',
};

export function CasesPage() {
  const [cases, setCases] = useState<Case[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('');

  useEffect(() => {
    api.get<Case[]>('/cases')
      .then(setCases)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filteredCases = statusFilter
    ? cases.filter((c) => c.status === statusFilter)
    : cases;

  const openCount = cases.filter((c) => !['RESOLVED', 'CLOSED'].includes(c.status)).length;
  const urgentCount = cases.filter((c) => c.priority === 'URGENT' && !['RESOLVED', 'CLOSED'].includes(c.status)).length;

  return (
    <div className="max-w-4xl mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Case Management</h1>
          <p className="text-sm text-gray-500 mt-1">
            {openCount} open case{openCount !== 1 ? 's' : ''}
            {urgentCount > 0 && <span className="text-red-600 ml-2">{urgentCount} urgent</span>}
          </p>
        </div>
      </div>

      <div className="flex gap-2 flex-wrap">
        <button
          className={`btn-ghost text-sm ${!statusFilter ? 'bg-atlas-primary text-white' : ''}`}
          onClick={() => setStatusFilter('')}
        >
          All
        </button>
        {Object.entries(statusLabel).map(([key, label]) => (
          <button
            key={key}
            className={`btn-ghost text-sm ${statusFilter === key ? 'bg-atlas-primary text-white' : ''}`}
            onClick={() => setStatusFilter(key)}
          >
            {label}
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
      ) : filteredCases.length === 0 ? (
        <div className="card p-8 text-center">
          <p className="text-gray-500">No cases found.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filteredCases.map((c) => (
            <div key={c.id} className="card p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className={`badge badge-${priorityColor[c.priority]}`}>{c.priority}</span>
                    <span className="badge badge-gray">{c.type}</span>
                    <span className="badge badge-blue">{statusLabel[c.status]}</span>
                  </div>
                  <p className="text-sm font-medium text-gray-900 mt-2">{c.title}</p>
                  <p className="text-sm text-gray-500 mt-1">
                    Student: {c.student.firstName} {c.student.lastName}
                    {c.assignedTo && <span> | Assigned to: {c.assignedTo.firstName} {c.assignedTo.lastName}</span>}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    Created {new Date(c.createdAt).toLocaleDateString()}
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
