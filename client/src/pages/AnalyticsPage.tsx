import { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useTheme } from '../contexts/ThemeContext';
import {
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
  BarChart, Bar, PieChart, Pie, Cell, Legend, AreaChart, Area,
} from 'recharts';

interface AnalyticsData {
  riskBreakdown: { name: string; value: number; color: string }[];
  gradeTrends: { week: string; avgGrade: number }[];
  attendanceTrends: { week: string; rate: number }[];
  sectionComparison: { name: string; avgGrade: number; attendance: number }[];
  interventionEffectiveness: { type: string; before: number; after: number }[];
  flagDistribution: { flag: string; count: number }[];
}

export function AnalyticsPage() {
  const { isDark } = useTheme();
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('30d');

  useEffect(() => {
    api.get<AnalyticsData>('/dashboard/analytics').then(setData).catch(() => {
      // Generate mock analytics if endpoint doesn't exist yet
      setData({
        riskBreakdown: [
          { name: 'On Track', value: 18, color: isDark ? '#34d399' : '#10b981' },
          { name: 'Needs Support', value: 7, color: isDark ? '#fbbf24' : '#f59e0b' },
          { name: 'Urgent', value: 3, color: isDark ? '#f87171' : '#ef4444' },
        ],
        gradeTrends: Array.from({ length: 12 }, (_, i) => ({
          week: `W${i + 1}`,
          avgGrade: 72 + Math.sin(i / 2) * 5 + Math.random() * 3,
        })),
        attendanceTrends: Array.from({ length: 12 }, (_, i) => ({
          week: `W${i + 1}`,
          rate: 88 + Math.sin(i / 3) * 4 + Math.random() * 2,
        })),
        sectionComparison: [
          { name: 'Algebra I P3', avgGrade: 76.4, attendance: 92.1 },
          { name: 'Algebra I P5', avgGrade: 71.2, attendance: 89.5 },
          { name: 'Geometry P1', avgGrade: 82.8, attendance: 94.3 },
        ],
        interventionEffectiveness: [
          { type: 'Daily Check-In', before: 62, after: 78 },
          { type: 'Tutoring', before: 55, after: 72 },
          { type: 'Parent Meeting', before: 58, after: 68 },
          { type: 'Behavior Plan', before: 45, after: 64 },
        ],
        flagDistribution: [
          { flag: 'ELL', count: 5 },
          { flag: 'IEP', count: 4 },
          { flag: '504', count: 3 },
          { flag: 'Tier 2', count: 7 },
          { flag: 'Tier 3', count: 3 },
        ],
      });
    }).finally(() => setLoading(false));
  }, []);

  const chartStyle = {
    backgroundColor: isDark ? '#1e2235' : '#fff',
    border: `1px solid ${isDark ? '#2a2f45' : '#e2e8f0'}`,
    borderRadius: '8px',
    fontSize: '12px',
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="skeleton h-10 w-48" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[...Array(4)].map((_, i) => <div key={i} className="skeleton h-72" />)}
        </div>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">Analytics & Reporting</h1>
          <p className="text-sm text-gray-500 dark:text-dark-muted mt-0.5">Performance insights across your classes</p>
        </div>
        <div className="flex items-center gap-1 bg-gray-100 dark:bg-dark-surface rounded-lg p-1">
          {(['7d', '30d', '90d'] as const).map(r => (
            <button
              key={r}
              onClick={() => setTimeRange(r)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                timeRange === r
                  ? 'bg-white dark:bg-dark-card text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-500 dark:text-dark-muted hover:text-gray-700 dark:hover:text-dark-text'
              }`}
            >
              {r === '7d' ? '7 Days' : r === '30d' ? '30 Days' : '90 Days'}
            </button>
          ))}
        </div>
      </div>

      {/* Top Row: Grade Trends + Attendance Trends */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <div className="card-header">
            <h2 className="text-sm font-semibold text-gray-900 dark:text-white">Grade Trend (Class Average)</h2>
          </div>
          <div className="card-body">
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={data.gradeTrends}>
                <defs>
                  <linearGradient id="gradeGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={isDark ? '#8b5cf6' : '#7c3aed'} stopOpacity={0.3} />
                    <stop offset="95%" stopColor={isDark ? '#8b5cf6' : '#7c3aed'} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#2a2f45' : '#e2e8f0'} />
                <XAxis dataKey="week" tick={{ fontSize: 11 }} stroke={isDark ? '#8b95a5' : '#6b7280'} />
                <YAxis domain={[60, 100]} tick={{ fontSize: 11 }} stroke={isDark ? '#8b95a5' : '#6b7280'} />
                <Tooltip contentStyle={chartStyle} formatter={(v: number | undefined) => [`${(v ?? 0).toFixed(1)}%`, 'Avg Grade']} />
                <Area type="monotone" dataKey="avgGrade" stroke={isDark ? '#8b5cf6' : '#7c3aed'} fill="url(#gradeGrad)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h2 className="text-sm font-semibold text-gray-900 dark:text-white">Attendance Trend</h2>
          </div>
          <div className="card-body">
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={data.attendanceTrends}>
                <defs>
                  <linearGradient id="attendGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={isDark ? '#3b82f6' : '#1e40af'} stopOpacity={0.3} />
                    <stop offset="95%" stopColor={isDark ? '#3b82f6' : '#1e40af'} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#2a2f45' : '#e2e8f0'} />
                <XAxis dataKey="week" tick={{ fontSize: 11 }} stroke={isDark ? '#8b95a5' : '#6b7280'} />
                <YAxis domain={[80, 100]} tick={{ fontSize: 11 }} stroke={isDark ? '#8b95a5' : '#6b7280'} />
                <Tooltip contentStyle={chartStyle} formatter={(v: number | undefined) => [`${(v ?? 0).toFixed(1)}%`, 'Attendance']} />
                <Area type="monotone" dataKey="rate" stroke={isDark ? '#3b82f6' : '#1e40af'} fill="url(#attendGrad)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Section Comparison + Intervention Effectiveness */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <div className="card-header">
            <h2 className="text-sm font-semibold text-gray-900 dark:text-white">Section Comparison</h2>
          </div>
          <div className="card-body">
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={data.sectionComparison}>
                <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#2a2f45' : '#e2e8f0'} />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} stroke={isDark ? '#8b95a5' : '#6b7280'} />
                <YAxis tick={{ fontSize: 11 }} stroke={isDark ? '#8b95a5' : '#6b7280'} />
                <Tooltip contentStyle={chartStyle} />
                <Legend wrapperStyle={{ fontSize: '12px' }} />
                <Bar dataKey="avgGrade" name="Avg Grade %" fill={isDark ? '#8b5cf6' : '#7c3aed'} radius={[4, 4, 0, 0]} />
                <Bar dataKey="attendance" name="Attendance %" fill={isDark ? '#3b82f6' : '#1e40af'} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h2 className="text-sm font-semibold text-gray-900 dark:text-white">Intervention Effectiveness (Before/After)</h2>
          </div>
          <div className="card-body">
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={data.interventionEffectiveness}>
                <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#2a2f45' : '#e2e8f0'} />
                <XAxis dataKey="type" tick={{ fontSize: 10 }} stroke={isDark ? '#8b95a5' : '#6b7280'} />
                <YAxis tick={{ fontSize: 11 }} stroke={isDark ? '#8b95a5' : '#6b7280'} />
                <Tooltip contentStyle={chartStyle} />
                <Legend wrapperStyle={{ fontSize: '12px' }} />
                <Bar dataKey="before" name="Before" fill={isDark ? '#f87171' : '#ef4444'} radius={[4, 4, 0, 0]} />
                <Bar dataKey="after" name="After" fill={isDark ? '#34d399' : '#10b981'} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Bottom Row: Risk + Flags */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <div className="card-header">
            <h2 className="text-sm font-semibold text-gray-900 dark:text-white">Risk Tier Distribution</h2>
          </div>
          <div className="card-body flex justify-center">
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie data={data.riskBreakdown} cx="50%" cy="50%" innerRadius={60} outerRadius={95} paddingAngle={4} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                  {data.riskBreakdown.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip contentStyle={chartStyle} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h2 className="text-sm font-semibold text-gray-900 dark:text-white">Student Flag Distribution</h2>
          </div>
          <div className="card-body">
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={data.flagDistribution} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#2a2f45' : '#e2e8f0'} />
                <XAxis type="number" tick={{ fontSize: 11 }} stroke={isDark ? '#8b95a5' : '#6b7280'} />
                <YAxis dataKey="flag" type="category" tick={{ fontSize: 11 }} width={50} stroke={isDark ? '#8b95a5' : '#6b7280'} />
                <Tooltip contentStyle={chartStyle} />
                <Bar dataKey="count" fill={isDark ? '#60a5fa' : '#3b82f6'} radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
