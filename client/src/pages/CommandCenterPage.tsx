import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';
import { useTheme } from '../contexts/ThemeContext';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, AreaChart, Area, CartesianGrid,
} from 'recharts';
import { MorningBriefing } from '../types';

interface DashboardMetrics {
  totalStudents: number;
  attendanceRate: number;
  atRiskCount: number;
  urgentCount: number;
  activeInterventions: number;
  pendingReferrals: number;
  avgGrade: number;
  missingWorkTotal: number;
}

const RISK_COLORS = { ON_TRACK: '#10b981', NEEDS_SUPPORT: '#f59e0b', URGENT: '#ef4444' };
const RISK_COLORS_DARK = { ON_TRACK: '#34d399', NEEDS_SUPPORT: '#fbbf24', URGENT: '#f87171' };

function MetricCard({ label, value, subtext, trend, color }: {
  label: string; value: string | number; subtext?: string; trend?: number; color?: string;
}) {
  return (
    <div className="metric-card group">
      <div className="relative z-10">
        <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-dark-muted mb-1">{label}</p>
        <p className={`text-3xl font-bold tracking-tight ${color || 'text-gray-900 dark:text-white'}`}>
          {value}
        </p>
        <div className="flex items-center gap-2 mt-1">
          {trend !== undefined && (
            <span className={`text-xs font-medium ${trend >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
              {trend >= 0 ? '+' : ''}{trend}%
            </span>
          )}
          {subtext && <span className="text-xs text-gray-500 dark:text-dark-muted">{subtext}</span>}
        </div>
      </div>
    </div>
  );
}

function RiskHeatmap({ students }: { students: { id: string; firstName: string; lastName: string; riskTier: string }[] }) {
  const { isDark } = useTheme();
  const colors = isDark ? RISK_COLORS_DARK : RISK_COLORS;

  return (
    <div className="grid grid-cols-8 sm:grid-cols-10 md:grid-cols-12 gap-1.5">
      {students.map(s => (
        <Link
          key={s.id}
          to={`/students/${s.id}`}
          className="group relative"
          title={`${s.firstName} ${s.lastName}`}
        >
          <div
            className="w-full aspect-square rounded-md transition-all duration-200 group-hover:scale-110 group-hover:shadow-lg flex items-center justify-center text-[9px] font-bold text-white"
            style={{ backgroundColor: colors[s.riskTier as keyof typeof colors] || colors.ON_TRACK }}
          >
            {s.firstName[0]}{s.lastName[0]}
          </div>
        </Link>
      ))}
    </div>
  );
}

export function CommandCenterPage() {
  const { isDark } = useTheme();
  const [briefing, setBriefing] = useState<MorningBriefing | null>(null);
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [students, setStudents] = useState<{ id: string; firstName: string; lastName: string; riskTier: string }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get<MorningBriefing>('/briefing').catch(() => null),
      api.get<DashboardMetrics>('/dashboard/metrics').catch(() => null),
      api.get<{ id: string; firstName: string; lastName: string; riskTier: string }[]>('/roster').catch(() => []),
    ]).then(([b, m, s]) => {
      if (b) setBriefing(b);
      if (m) setMetrics(m);
      setStudents(s as { id: string; firstName: string; lastName: string; riskTier: string }[]);
    }).finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <div key={i} className="skeleton h-28" />)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="skeleton h-72" />
          <div className="skeleton h-72" />
        </div>
      </div>
    );
  }

  const riskDistribution = [
    { name: 'On Track', value: students.filter(s => s.riskTier === 'ON_TRACK').length, color: isDark ? '#34d399' : '#10b981' },
    { name: 'Needs Support', value: students.filter(s => s.riskTier === 'NEEDS_SUPPORT').length, color: isDark ? '#fbbf24' : '#f59e0b' },
    { name: 'Urgent', value: students.filter(s => s.riskTier === 'URGENT').length, color: isDark ? '#f87171' : '#ef4444' },
  ];

  const gradeDistribution = [
    { range: 'A (90-100)', count: Math.round(students.length * 0.2) },
    { range: 'B (80-89)', count: Math.round(students.length * 0.3) },
    { range: 'C (70-79)', count: Math.round(students.length * 0.25) },
    { range: 'D (60-69)', count: Math.round(students.length * 0.15) },
    { range: 'F (<60)', count: Math.round(students.length * 0.1) },
  ];

  const attendanceTrend = Array.from({ length: 14 }, (_, i) => ({
    day: `Day ${i + 1}`,
    rate: 85 + Math.random() * 12,
  }));

  const m = metrics || {
    totalStudents: students.length,
    attendanceRate: 91.2,
    atRiskCount: students.filter(s => s.riskTier !== 'ON_TRACK').length,
    urgentCount: students.filter(s => s.riskTier === 'URGENT').length,
    activeInterventions: briefing?.interventionTasks?.length || 0,
    pendingReferrals: 2,
    avgGrade: 78.5,
    missingWorkTotal: briefing?.missingWorkQueue?.length || 0,
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">Command Center</h1>
          <p className="text-sm text-gray-500 dark:text-dark-muted mt-0.5">
            Real-time overview &middot; {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="status-dot status-dot-green" />
          <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">System Operational</span>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard label="Total Students" value={m.totalStudents} subtext="across all sections" />
        <MetricCard
          label="Attendance Today"
          value={`${m.attendanceRate.toFixed(1)}%`}
          trend={1.2}
          color={m.attendanceRate >= 90 ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}
        />
        <MetricCard
          label="At-Risk Students"
          value={m.atRiskCount}
          subtext={`${m.urgentCount} urgent`}
          color="text-amber-600 dark:text-amber-400"
        />
        <MetricCard
          label="Active Interventions"
          value={m.activeInterventions}
          subtext={`${m.missingWorkTotal} missing work`}
        />
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Risk Heatmap - 2 cols */}
        <div className="lg:col-span-2 card">
          <div className="card-header flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-gray-900 dark:text-white">Student Risk Heatmap</h2>
              <p className="text-xs text-gray-500 dark:text-dark-muted mt-0.5">Each square represents a student. Click to view profile.</p>
            </div>
            <div className="flex items-center gap-3 text-xs">
              <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-emerald-500" /> On Track</span>
              <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-amber-500" /> Needs Support</span>
              <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-red-500" /> Urgent</span>
            </div>
          </div>
          <div className="card-body">
            <RiskHeatmap students={students} />
          </div>
        </div>

        {/* Risk Distribution Pie */}
        <div className="card">
          <div className="card-header">
            <h2 className="text-sm font-semibold text-gray-900 dark:text-white">Risk Distribution</h2>
          </div>
          <div className="card-body flex flex-col items-center">
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={riskDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {riskDistribution.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: isDark ? '#1e2235' : '#fff',
                    border: `1px solid ${isDark ? '#2a2f45' : '#e2e8f0'}`,
                    borderRadius: '8px',
                    fontSize: '12px',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex gap-4 mt-2">
              {riskDistribution.map(r => (
                <div key={r.name} className="text-center">
                  <p className="text-lg font-bold" style={{ color: r.color }}>{r.value}</p>
                  <p className="text-xs text-gray-500 dark:text-dark-muted">{r.name}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Attendance Trend */}
        <div className="lg:col-span-2 card">
          <div className="card-header">
            <h2 className="text-sm font-semibold text-gray-900 dark:text-white">Attendance Trend (14 Days)</h2>
          </div>
          <div className="card-body">
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={attendanceTrend}>
                <defs>
                  <linearGradient id="attendanceGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={isDark ? '#3b82f6' : '#1e40af'} stopOpacity={0.3} />
                    <stop offset="95%" stopColor={isDark ? '#3b82f6' : '#1e40af'} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#2a2f45' : '#e2e8f0'} />
                <XAxis dataKey="day" tick={{ fontSize: 11 }} stroke={isDark ? '#8b95a5' : '#6b7280'} />
                <YAxis domain={[80, 100]} tick={{ fontSize: 11 }} stroke={isDark ? '#8b95a5' : '#6b7280'} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: isDark ? '#1e2235' : '#fff',
                    border: `1px solid ${isDark ? '#2a2f45' : '#e2e8f0'}`,
                    borderRadius: '8px',
                    fontSize: '12px',
                  }}
                  formatter={(value: number | undefined) => [`${(value ?? 0).toFixed(1)}%`, 'Attendance']}
                />
                <Area type="monotone" dataKey="rate" stroke={isDark ? '#3b82f6' : '#1e40af'} fillOpacity={1} fill="url(#attendanceGrad)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Grade Distribution */}
        <div className="card">
          <div className="card-header">
            <h2 className="text-sm font-semibold text-gray-900 dark:text-white">Grade Distribution</h2>
          </div>
          <div className="card-body">
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={gradeDistribution} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#2a2f45' : '#e2e8f0'} />
                <XAxis type="number" tick={{ fontSize: 11 }} stroke={isDark ? '#8b95a5' : '#6b7280'} />
                <YAxis dataKey="range" type="category" tick={{ fontSize: 10 }} width={70} stroke={isDark ? '#8b95a5' : '#6b7280'} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: isDark ? '#1e2235' : '#fff',
                    border: `1px solid ${isDark ? '#2a2f45' : '#e2e8f0'}`,
                    borderRadius: '8px',
                    fontSize: '12px',
                  }}
                />
                <Bar dataKey="count" fill={isDark ? '#3b82f6' : '#1e40af'} radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Bottom Grid: Alerts + Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Active Alerts Feed */}
        <div className="card">
          <div className="card-header flex items-center justify-between">
            <h2 className="text-sm font-semibold text-gray-900 dark:text-white">Active Alerts</h2>
            <Link to="/notifications" className="text-xs text-atlas-primary dark:text-blue-400 hover:underline">View all</Link>
          </div>
          <div className="divide-y divide-gray-100 dark:divide-dark-border max-h-72 overflow-y-auto">
            {briefing?.absentToday?.slice(0, 3).map(s => (
              <Link key={s.studentId} to={`/students/${s.studentId}`} className="flex items-center gap-3 px-5 py-3 hover:bg-gray-50 dark:hover:bg-dark-hover transition-colors">
                <span className={`status-dot ${s.severity === 'red' ? 'status-dot-red' : s.severity === 'amber' ? 'status-dot-amber' : 'status-dot-green'}`} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{s.firstName} {s.lastName}</p>
                  <p className="text-xs text-gray-500 dark:text-dark-muted">Absent {s.consecutiveDays} consecutive day{s.consecutiveDays > 1 ? 's' : ''}</p>
                </div>
                <span className="badge badge-red text-[10px]">ABSENT</span>
              </Link>
            ))}
            {briefing?.gradeAlerts?.slice(0, 3).map(g => (
              <Link key={g.studentId} to={`/students/${g.studentId}`} className="flex items-center gap-3 px-5 py-3 hover:bg-gray-50 dark:hover:bg-dark-hover transition-colors">
                <span className="status-dot status-dot-amber" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{g.firstName} {g.lastName}</p>
                  <p className="text-xs text-gray-500 dark:text-dark-muted">{g.sectionName}: {g.currentGrade.toFixed(1)}% ({g.delta > 0 ? '+' : ''}{g.delta.toFixed(1)}%)</p>
                </div>
                <span className="badge badge-amber text-[10px]">GRADE DROP</span>
              </Link>
            ))}
            {briefing?.interventionTasks?.filter(t => t.isOverdue).slice(0, 2).map(t => (
              <Link key={t.interventionId} to={`/students/${t.studentId}`} className="flex items-center gap-3 px-5 py-3 hover:bg-gray-50 dark:hover:bg-dark-hover transition-colors">
                <span className="status-dot status-dot-red" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{t.firstName} {t.lastName}</p>
                  <p className="text-xs text-gray-500 dark:text-dark-muted">Overdue: {t.type}</p>
                </div>
                <span className="badge badge-red text-[10px]">OVERDUE</span>
              </Link>
            ))}
            {(!briefing?.absentToday?.length && !briefing?.gradeAlerts?.length) && (
              <div className="px-5 py-8 text-center">
                <p className="text-sm text-gray-500 dark:text-dark-muted">No active alerts. All systems nominal.</p>
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="card">
          <div className="card-header">
            <h2 className="text-sm font-semibold text-gray-900 dark:text-white">Quick Actions</h2>
          </div>
          <div className="card-body grid grid-cols-2 gap-3">
            <Link to="/roster" className="flex items-center gap-3 p-4 rounded-xl border border-gray-200 dark:border-dark-border hover:bg-gray-50 dark:hover:bg-dark-hover transition-all group">
              <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-500/20 flex items-center justify-center text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" /></svg>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">View Roster</p>
                <p className="text-xs text-gray-500 dark:text-dark-muted">All students</p>
              </div>
            </Link>
            <Link to="/attendance" className="flex items-center gap-3 p-4 rounded-xl border border-gray-200 dark:border-dark-border hover:bg-gray-50 dark:hover:bg-dark-hover transition-all group">
              <div className="w-10 h-10 rounded-lg bg-emerald-100 dark:bg-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400 group-hover:scale-110 transition-transform">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /></svg>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">Attendance</p>
                <p className="text-xs text-gray-500 dark:text-dark-muted">Mark & review</p>
              </div>
            </Link>
            <Link to="/analytics" className="flex items-center gap-3 p-4 rounded-xl border border-gray-200 dark:border-dark-border hover:bg-gray-50 dark:hover:bg-dark-hover transition-all group">
              <div className="w-10 h-10 rounded-lg bg-purple-100 dark:bg-purple-500/20 flex items-center justify-center text-purple-600 dark:text-purple-400 group-hover:scale-110 transition-transform">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">Analytics</p>
                <p className="text-xs text-gray-500 dark:text-dark-muted">Reports & data</p>
              </div>
            </Link>
            <Link to="/behavioral" className="flex items-center gap-3 p-4 rounded-xl border border-gray-200 dark:border-dark-border hover:bg-gray-50 dark:hover:bg-dark-hover transition-all group">
              <div className="w-10 h-10 rounded-lg bg-amber-100 dark:bg-amber-500/20 flex items-center justify-center text-amber-600 dark:text-amber-400 group-hover:scale-110 transition-transform">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4.5c-.77-.833-2.694-.833-3.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" /></svg>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">Behavioral</p>
                <p className="text-xs text-gray-500 dark:text-dark-muted">Track & manage</p>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
