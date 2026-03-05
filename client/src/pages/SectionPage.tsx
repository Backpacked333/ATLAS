import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../services/api';
import { EnhancedSectionSummary, SeatInfo } from '../types';
import { PageHeader } from '../components/ui/PageHeader';
import { MetricCard } from '../components/ui/MetricCard';
import { TrendBadge } from '../components/ui/TrendBadge';
import { TabNav } from '../components/ui/TabNav';
import { RiskBadge } from '../components/ui/RiskBadge';
import { Avatar } from '../components/ui/Avatar';
import { InsightChip } from '../components/ui/InsightChip';
import { ProgressBar } from '../components/ui/ProgressBar';
import { EmptyState } from '../components/ui/EmptyState';
import { MetricCardSkeleton, CardSkeleton } from '../components/ui/SkeletonLoader';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine,
  PieChart, Pie, Cell,
} from 'recharts';
import {
  AcademicCapIcon,
  UsersIcon,
  ExclamationTriangleIcon,
  DocumentTextIcon,
  LightBulbIcon,
} from '@heroicons/react/24/outline';

const GRADE_COLORS = { A: '#059669', B: '#10b981', C: '#d97706', D: '#f59e0b', F: '#e11d48' };

export function SectionPage() {
  const { sectionId } = useParams<{ sectionId: string }>();
  const [section, setSection] = useState<EnhancedSectionSummary | null>(null);
  const [seats, setSeats] = useState<SeatInfo[]>([]);
  const [tab, setTab] = useState('overview');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!sectionId) return;
    Promise.all([
      api.get<EnhancedSectionSummary>(`/sections/${sectionId}/enhanced`),
      api.get<SeatInfo[]>(`/sections/${sectionId}/seats`).catch(() => []),
    ])
      .then(([sectionData, seatsData]) => {
        setSection(sectionData);
        setSeats(seatsData);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [sectionId]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-64 skeleton" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[...Array(4)].map((_, i) => <MetricCardSkeleton key={i} />)}
        </div>
        <CardSkeleton lines={5} />
      </div>
    );
  }

  if (!section) return <EmptyState title="Section not found" />;

  const tabs = [
    { key: 'overview', label: 'Overview' },
    { key: 'assignments', label: 'Assignments', count: section.recentAssignments.length },
    { key: 'students', label: 'Students', count: section.studentCount },
    { key: 'seating', label: 'Seating' },
  ];

  return (
    <div className="space-y-6 max-w-7xl">
      <PageHeader
        title={`${section.courseName} — ${section.period}`}
        subtitle={`${section.studentCount} students`}
        actions={
          <TrendBadge value={section.weekOverWeekGradeChange} label="WoW" />
        }
      />

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <MetricCard
          label="Class Average"
          value={`${section.classAverageGrade}%`}
          delta={section.weekOverWeekGradeChange}
          icon={<AcademicCapIcon className="h-5 w-5" />}
        />
        <MetricCard
          label="Attendance"
          value={`${section.classAverageAttendance}%`}
          delta={section.weekOverWeekAttendanceChange}
          icon={<UsersIcon className="h-5 w-5" />}
        />
        <MetricCard
          label="Failing"
          value={section.failingCount}
          variant={section.failingCount > 0 ? 'danger' : 'success'}
          icon={<ExclamationTriangleIcon className="h-5 w-5" />}
        />
        <MetricCard
          label="Missing Work"
          value={section.missingWorkCount}
          variant={section.missingWorkCount > 3 ? 'warning' : 'default'}
          icon={<DocumentTextIcon className="h-5 w-5" />}
        />
      </div>

      <TabNav tabs={tabs} activeTab={tab} onChange={setTab} />

      {/* Overview Tab */}
      {tab === 'overview' && (
        <div className="space-y-6">
          {/* Section Insights */}
          {section.sectionInsights.length > 0 && (
            <div className="space-y-2">
              {section.sectionInsights.map((insight, i) => (
                <InsightChip
                  key={i}
                  severity={insight.severity}
                  icon={<LightBulbIcon className="h-4 w-4" />}
                  message={insight.message}
                />
              ))}
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Grade Trend Chart */}
            <div className="card">
              <div className="card-header">
                <h3 className="text-sm font-semibold text-atlas-text-primary">Grade Trend (8 Weeks)</h3>
              </div>
              <div className="card-body">
                <ResponsiveContainer width="100%" height={200}>
                  <AreaChart data={section.gradeTrend}>
                    <defs>
                      <linearGradient id="gradeGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#4f46e5" stopOpacity={0.2} />
                        <stop offset="100%" stopColor="#4f46e5" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="week" tick={{ fontSize: 10 }} tickFormatter={(v) => v.slice(5)} />
                    <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} />
                    <Tooltip formatter={(v: any) => [`${v}%`, 'Average']} />
                    <ReferenceLine y={73} stroke="#d97706" strokeDasharray="4 4" label={{ value: 'Passing', fontSize: 10, fill: '#d97706' }} />
                    <Area type="monotone" dataKey="avg" stroke="#4f46e5" strokeWidth={2} fill="url(#gradeGrad)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Grade Distribution */}
            <div className="card">
              <div className="card-header">
                <h3 className="text-sm font-semibold text-atlas-text-primary">Grade Distribution</h3>
              </div>
              <div className="card-body flex items-center gap-6">
                <ResponsiveContainer width={120} height={120}>
                  <PieChart>
                    <Pie
                      data={section.gradeDistribution.filter(d => d.count > 0)}
                      dataKey="count"
                      nameKey="letter"
                      cx="50%"
                      cy="50%"
                      innerRadius={30}
                      outerRadius={50}
                      paddingAngle={2}
                    >
                      {section.gradeDistribution.filter(d => d.count > 0).map((entry) => (
                        <Cell key={entry.letter} fill={GRADE_COLORS[entry.letter as keyof typeof GRADE_COLORS] || '#94a3b8'} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                <div className="space-y-2 flex-1">
                  {section.gradeDistribution.map((gd) => (
                    <div key={gd.letter} className="flex items-center gap-2">
                      <span
                        className="w-3 h-3 rounded-full flex-shrink-0"
                        style={{ backgroundColor: GRADE_COLORS[gd.letter as keyof typeof GRADE_COLORS] || '#94a3b8' }}
                      />
                      <span className="text-sm font-medium w-4">{gd.letter}</span>
                      <ProgressBar value={section.studentCount > 0 ? (gd.count / section.studentCount) * 100 : 0} color="indigo" size="sm" />
                      <span className="text-xs text-atlas-text-tertiary w-6 text-right">{gd.count}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Risk Breakdown */}
            <div className="card">
              <div className="card-header">
                <h3 className="text-sm font-semibold text-atlas-text-primary">Risk Breakdown</h3>
              </div>
              <div className="card-body space-y-3">
                {section.riskBreakdown.map((rb) => (
                  <div key={rb.tier} className="flex items-center justify-between">
                    <RiskBadge tier={rb.tier} />
                    <span className="text-sm font-semibold text-atlas-text-primary">{rb.count}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Category Performance */}
            <div className="card">
              <div className="card-header">
                <h3 className="text-sm font-semibold text-atlas-text-primary">Performance by Category</h3>
              </div>
              <div className="card-body">
                {section.categoryPerformance.length > 0 ? (
                  <ResponsiveContainer width="100%" height={160}>
                    <BarChart data={section.categoryPerformance} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 10 }} />
                      <YAxis dataKey="category" type="category" tick={{ fontSize: 10 }} width={80} />
                      <Tooltip formatter={(v: any) => [`${v}%`, 'Average']} />
                      <Bar dataKey="avgScore" fill="#4f46e5" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="text-sm text-atlas-text-tertiary text-center py-4">No category data available</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Assignments Tab */}
      {tab === 'assignments' && (
        <div className="space-y-3">
          {section.recentAssignments.length > 0 ? (
            section.recentAssignments.map((assignment) => (
              <div key={assignment.id} className="card p-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm font-semibold text-atlas-text-primary">{assignment.name}</h4>
                  <span className="text-xs text-atlas-text-tertiary">Due: {assignment.dueDate}</span>
                </div>
                <div className="flex gap-6 items-center text-sm mb-2">
                  <div>
                    <span className="text-atlas-text-tertiary">Avg: </span>
                    <span className="font-semibold">{assignment.classAverage}%</span>
                  </div>
                  <div className="flex-1 max-w-32">
                    <ProgressBar value={assignment.completionRate} showLabel />
                  </div>
                  {assignment.outliers.length > 0 && (
                    <span className="badge badge-rose">{assignment.outliers.length} below avg</span>
                  )}
                </div>
                {assignment.outliers.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {assignment.outliers.map((o) => (
                      <Link key={o.studentId} to={`/students/${o.studentId}`} className="inline-flex items-center gap-1 badge badge-rose hover:bg-atlas-rose-200 transition-colors">
                        <Avatar firstName={o.firstName} lastName={o.lastName} size="sm" />
                        <span>{o.firstName} {o.lastName[0]}. ({o.score}%)</span>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ))
          ) : (
            <EmptyState title="No assignments yet" />
          )}
        </div>
      )}

      {/* Students Tab */}
      {tab === 'students' && (
        <div className="card overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-atlas-border bg-gray-50/50">
                <th className="px-4 py-3 text-left text-xs font-semibold text-atlas-text-tertiary uppercase">Student</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-atlas-text-tertiary uppercase">Grade</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-atlas-text-tertiary uppercase">Change</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-atlas-text-tertiary uppercase">Attendance</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-atlas-text-tertiary uppercase">Missing</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-atlas-text-tertiary uppercase">Risk</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-atlas-border">
              {section.studentRankings.map((s) => (
                <tr key={s.studentId} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-4 py-3">
                    <Link to={`/students/${s.studentId}`} className="flex items-center gap-2 group">
                      <Avatar firstName={s.firstName} lastName={s.lastName} size="sm" riskTier={s.riskTier} />
                      <span className="text-sm font-medium text-atlas-text-primary group-hover:text-atlas-indigo-700">
                        {s.lastName}, {s.firstName}
                      </span>
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-sm font-semibold ${s.gradePercent >= 73 ? 'text-atlas-emerald-700' : s.gradePercent >= 60 ? 'text-atlas-amber-700' : 'text-atlas-rose-700'}`}>
                      {s.gradePercent}%
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <TrendBadge value={s.gradeDelta} />
                  </td>
                  <td className="px-4 py-3">
                    <ProgressBar value={s.attendanceRate} size="sm" showLabel />
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-sm font-medium ${s.missingCount > 0 ? 'text-atlas-rose-600' : 'text-atlas-text-tertiary'}`}>
                      {s.missingCount}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <RiskBadge tier={s.riskTier} size="sm" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Seating Tab */}
      {tab === 'seating' && (
        <div className="card p-6">
          {seats.length > 0 ? (
            <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${Math.max(...seats.map(s => s.col)) + 1}, 1fr)` }}>
              {seats.map((seat) => (
                <div
                  key={`${seat.row}-${seat.col}`}
                  className={`p-3 rounded-card border-2 text-center text-xs transition-all hover:shadow-card-hover ${
                    seat.student
                      ? seat.student.riskTier === 'URGENT'
                        ? 'border-atlas-rose-300 bg-atlas-rose-50'
                        : seat.student.riskTier === 'NEEDS_SUPPORT'
                        ? 'border-atlas-amber-300 bg-atlas-amber-50'
                        : 'border-atlas-emerald-300 bg-atlas-emerald-50'
                      : 'border-atlas-border bg-gray-50'
                  }`}
                >
                  {seat.student ? (
                    <Link to={`/students/${seat.student.id}`} className="hover:underline font-medium">
                      {seat.student.firstName} {seat.student.lastName[0]}.
                    </Link>
                  ) : (
                    <span className="text-atlas-text-tertiary">Empty</span>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <EmptyState title="No seating chart configured" />
          )}
        </div>
      )}
    </div>
  );
}
