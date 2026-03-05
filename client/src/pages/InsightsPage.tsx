import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';
import { TeacherInsights } from '../types';
import { PageHeader } from '../components/ui/PageHeader';
import { MetricCard } from '../components/ui/MetricCard';
import { Avatar } from '../components/ui/Avatar';
import { RiskBadge } from '../components/ui/RiskBadge';
import { ActionBanner } from '../components/ui/ActionBanner';
import { ProgressBar } from '../components/ui/ProgressBar';
import { MetricCardSkeleton, CardSkeleton } from '../components/ui/SkeletonLoader';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import {
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  ClipboardDocumentCheckIcon,
  PhoneIcon,
  EyeIcon,
  ExclamationTriangleIcon,
  LightBulbIcon,
} from '@heroicons/react/24/outline';

const RISK_COLORS = { ON_TRACK: '#059669', NEEDS_SUPPORT: '#d97706', URGENT: '#e11d48' };
const RISK_LABELS = { ON_TRACK: 'On Track', NEEDS_SUPPORT: 'Needs Support', URGENT: 'Urgent' };

const patternSeverityMap: Record<string, 'critical' | 'warning' | 'info' | 'success'> = {
  attendance_cluster: 'critical',
  grade_decline_cohort: 'warning',
  missing_work_spike: 'warning',
  positive_trend: 'success',
};

export function InsightsPage() {
  const [insights, setInsights] = useState<TeacherInsights | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get<TeacherInsights>('/insights')
      .then(setInsights)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <PageHeader title="Insights" subtitle="Cross-cutting analytics across all your students" />
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {[...Array(5)].map((_, i) => <MetricCardSkeleton key={i} />)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <CardSkeleton lines={6} />
          <CardSkeleton lines={6} />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-atlas-danger">{error}</p>
        <button onClick={() => window.location.reload()} className="btn-secondary mt-4">Retry</button>
      </div>
    );
  }

  if (!insights) return null;

  const { weeklySnapshot, riskDistribution, riskTrend, sectionComparisons, priorityStudents, patterns } = insights;

  return (
    <div className="space-y-8 max-w-7xl">
      <PageHeader title="Insights" subtitle="Cross-cutting analytics across all your students" />

      {/* Weekly Snapshot */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <MetricCard
          label="Students Improved"
          value={weeklySnapshot.studentsImproved}
          variant="success"
          icon={<ArrowTrendingUpIcon className="h-5 w-5" />}
        />
        <MetricCard
          label="Students Declined"
          value={weeklySnapshot.studentsDeclined}
          variant={weeklySnapshot.studentsDeclined > 3 ? 'danger' : 'default'}
          icon={<ArrowTrendingDownIcon className="h-5 w-5" />}
        />
        <MetricCard
          label="Intervention Rate"
          value={`${weeklySnapshot.interventionCompletionRate}%`}
          variant={weeklySnapshot.interventionCompletionRate < 80 ? 'warning' : 'success'}
          icon={<ClipboardDocumentCheckIcon className="h-5 w-5" />}
        />
        <MetricCard
          label="Parent Contacts"
          value={weeklySnapshot.parentContactsMade}
          icon={<PhoneIcon className="h-5 w-5" />}
        />
        <MetricCard
          label="Observations"
          value={weeklySnapshot.observationsLogged}
          icon={<EyeIcon className="h-5 w-5" />}
        />
      </div>

      {/* Risk Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Risk Distribution */}
        <div className="card">
          <div className="card-header">
            <h3 className="text-sm font-semibold text-atlas-text-primary">Risk Distribution</h3>
          </div>
          <div className="card-body flex items-center gap-6">
            <ResponsiveContainer width={140} height={140}>
              <PieChart>
                <Pie
                  data={riskDistribution.filter(d => d.count > 0)}
                  dataKey="count"
                  nameKey="tier"
                  cx="50%"
                  cy="50%"
                  innerRadius={35}
                  outerRadius={60}
                  paddingAngle={3}
                >
                  {riskDistribution.filter(d => d.count > 0).map((entry) => (
                    <Cell key={entry.tier} fill={RISK_COLORS[entry.tier as keyof typeof RISK_COLORS] || '#94a3b8'} />
                  ))}
                </Pie>
                <Tooltip formatter={(v: any, name: any) => [v, RISK_LABELS[name as keyof typeof RISK_LABELS] || name]} />
              </PieChart>
            </ResponsiveContainer>
            <div className="space-y-3 flex-1">
              {riskDistribution.map((rd) => (
                <div key={rd.tier} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: RISK_COLORS[rd.tier as keyof typeof RISK_COLORS] || '#94a3b8' }}
                    />
                    <span className="text-sm text-atlas-text-secondary">
                      {RISK_LABELS[rd.tier as keyof typeof RISK_LABELS] || rd.tier}
                    </span>
                  </div>
                  <span className="text-sm font-semibold text-atlas-text-primary">{rd.count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Risk Trend */}
        <div className="card">
          <div className="card-header">
            <h3 className="text-sm font-semibold text-atlas-text-primary">Risk Trend (8 Weeks)</h3>
          </div>
          <div className="card-body">
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={riskTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="week" tick={{ fontSize: 10 }} tickFormatter={(v) => v.slice(5)} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip />
                <Area type="monotone" dataKey="urgent" stackId="1" stroke="#e11d48" fill="#ffe4e6" name="Urgent" />
                <Area type="monotone" dataKey="needsSupport" stackId="1" stroke="#d97706" fill="#fef3c7" name="Needs Support" />
                <Area type="monotone" dataKey="onTrack" stackId="1" stroke="#059669" fill="#d1fae5" name="On Track" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Priority Students */}
      <div className="card">
        <div className="card-header flex items-center gap-2">
          <ExclamationTriangleIcon className="h-4 w-4 text-atlas-rose-500" />
          <h3 className="text-sm font-semibold text-atlas-text-primary">Priority Students</h3>
          <span className="badge badge-rose ml-auto">{priorityStudents.length}</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-atlas-border bg-gray-50/50">
                <th className="px-4 py-3 text-left text-xs font-semibold text-atlas-text-tertiary uppercase">#</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-atlas-text-tertiary uppercase">Student</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-atlas-text-tertiary uppercase">Risk Score</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-atlas-text-tertiary uppercase">Risk Factors</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-atlas-text-tertiary uppercase">Last Contact</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-atlas-text-tertiary uppercase">Suggested Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-atlas-border">
              {priorityStudents.slice(0, 15).map((student, index) => (
                <tr key={student.studentId} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-4 py-3 text-sm font-medium text-atlas-text-tertiary">{index + 1}</td>
                  <td className="px-4 py-3">
                    <Link to={`/students/${student.studentId}`} className="flex items-center gap-2 group">
                      <Avatar firstName={student.firstName} lastName={student.lastName} photoUrl={student.photoUrl} size="sm" riskTier={student.riskTier} />
                      <div>
                        <p className="text-sm font-medium text-atlas-text-primary group-hover:text-atlas-indigo-700">
                          {student.firstName} {student.lastName}
                        </p>
                        <RiskBadge tier={student.riskTier} size="sm" />
                      </div>
                    </Link>
                  </td>
                  <td className="px-4 py-3 w-32">
                    <div className="flex items-center gap-2">
                      <ProgressBar value={student.riskScore} color={student.riskScore > 70 ? 'rose' : student.riskScore > 40 ? 'amber' : 'emerald'} size="sm" />
                      <span className="text-xs font-semibold text-atlas-text-secondary">{Math.round(student.riskScore)}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {student.riskFactors.slice(0, 2).map((f, i) => (
                        <span key={i} className="badge badge-gray text-[10px]">{f}</span>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-atlas-text-secondary">
                    {student.daysSinceContact !== null ? (
                      <span className={student.daysSinceContact > 14 ? 'text-atlas-rose-600 font-medium' : ''}>
                        {student.daysSinceContact}d ago
                      </span>
                    ) : (
                      <span className="text-atlas-text-tertiary">Never</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {student.suggestedActions[0] && (
                      <span className="text-xs text-atlas-indigo-600 font-medium">{student.suggestedActions[0]}</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Section Comparison */}
      {sectionComparisons.length > 0 && (
        <div className="card">
          <div className="card-header">
            <h3 className="text-sm font-semibold text-atlas-text-primary">Section Comparison</h3>
          </div>
          <div className="card-body">
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={sectionComparisons} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 10 }} />
                <YAxis dataKey="sectionName" type="category" tick={{ fontSize: 10 }} width={150} />
                <Tooltip formatter={(v: any) => [`${v}%`]} />
                <Legend />
                <Bar dataKey="avgGrade" fill="#4f46e5" name="Avg Grade" radius={[0, 4, 4, 0]} />
                <Bar dataKey="avgAttendance" fill="#0ea5e9" name="Attendance" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Pattern Detection */}
      {patterns.length > 0 && (
        <div>
          <h2 className="section-title flex items-center gap-2">
            <LightBulbIcon className="h-4 w-4" />
            Detected Patterns
          </h2>
          <div className="space-y-3">
            {patterns.map((pattern) => (
              <ActionBanner
                key={pattern.id}
                severity={patternSeverityMap[pattern.type] || 'info'}
                title={pattern.title}
                subtitle={pattern.description}
                actionLabel={pattern.suggestedAction}
              >
                {pattern.affectedStudents.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {pattern.affectedStudents.slice(0, 5).map((s) => (
                      <Link key={s.id} to={`/students/${s.id}`} className="badge badge-gray text-[10px] hover:bg-gray-200">
                        {s.firstName} {s.lastName[0]}.
                      </Link>
                    ))}
                    {pattern.affectedStudents.length > 5 && (
                      <span className="badge badge-gray text-[10px]">+{pattern.affectedStudents.length - 5} more</span>
                    )}
                  </div>
                )}
              </ActionBanner>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
