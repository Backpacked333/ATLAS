import { useState, useEffect } from 'react';
import { api } from '../services/api';

interface ReportDefinition {
  id: string;
  name: string;
  description: string | null;
  type: string;
  isActive: boolean;
  lastRunAt: string | null;
  createdAt: string;
  createdBy: { firstName: string; lastName: string };
  _count: { snapshots: number };
}

const typeLabel: Record<string, string> = {
  ATTENDANCE_SUMMARY: 'Attendance Summary',
  GRADE_DISTRIBUTION: 'Grade Distribution',
  INTERVENTION_PROGRESS: 'Intervention Progress',
  BEHAVIOR_TRENDS: 'Behavior Trends',
  COMPLIANCE_STATUS: 'Compliance Status',
  STUDENT_RISK: 'Student Risk',
  CUSTOM: 'Custom',
};

export function ReportsPage() {
  const [reports, setReports] = useState<ReportDefinition[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState<string | null>(null);

  useEffect(() => {
    api.get<ReportDefinition[]>('/reports')
      .then(setReports)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  async function generateReport(reportId: string) {
    setGenerating(reportId);
    try {
      await api.post(`/reports/${reportId}/generate`, {});
      // Refresh report list to show updated lastRunAt
      const updated = await api.get<ReportDefinition[]>('/reports');
      setReports(updated);
    } catch {
      // ignore
    } finally {
      setGenerating(null);
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reports & Analytics</h1>
          <p className="text-sm text-gray-500 mt-1">{reports.length} report definition{reports.length !== 1 ? 's' : ''}</p>
        </div>
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
      ) : reports.length === 0 ? (
        <div className="card p-8 text-center">
          <p className="text-gray-500">No report definitions configured.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {reports.map((report) => (
            <div key={report.id} className="card p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="badge badge-blue">{typeLabel[report.type] || report.type}</span>
                    <span className={`badge ${report.isActive ? 'badge-green' : 'badge-gray'}`}>
                      {report.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  <p className="text-sm font-medium text-gray-900 mt-2">{report.name}</p>
                  {report.description && (
                    <p className="text-sm text-gray-500 mt-1">{report.description}</p>
                  )}
                  <div className="flex items-center gap-3 mt-1">
                    <p className="text-xs text-gray-400">
                      By {report.createdBy.firstName} {report.createdBy.lastName}
                    </p>
                    <p className="text-xs text-gray-400">
                      {report._count.snapshots} snapshot{report._count.snapshots !== 1 ? 's' : ''}
                    </p>
                    {report.lastRunAt && (
                      <p className="text-xs text-gray-400">
                        Last run: {new Date(report.lastRunAt).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => generateReport(report.id)}
                  disabled={generating === report.id}
                  className="btn-ghost text-xs"
                >
                  {generating === report.id ? 'Generating...' : 'Generate'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
