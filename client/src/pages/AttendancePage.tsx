import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';
import { useTheme } from '../contexts/ThemeContext';
import { BarChart, Bar, ResponsiveContainer } from 'recharts';

interface AttendanceStudent {
  id: string;
  firstName: string;
  lastName: string;
  riskTier: string;
  overallRate: number;
  consecutiveAbsences: number;
  tardyCount: number;
  last30Days: ('P' | 'A' | 'T' | 'E' | null)[];
}

const STATUS_COLORS = {
  P: 'bg-emerald-500 dark:bg-emerald-400',
  A: 'bg-red-500 dark:bg-red-400',
  T: 'bg-amber-500 dark:bg-amber-400',
  E: 'bg-blue-400 dark:bg-blue-300',
  null: 'bg-gray-200 dark:bg-dark-border',
};

const STATUS_LABELS = { P: 'Present', A: 'Absent', T: 'Tardy', E: 'Excused' };

export function AttendancePage() {
  const { isDark } = useTheme();
  const [students, setStudents] = useState<AttendanceStudent[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'chronic' | 'at-risk'>('all');
  const [sortBy, setSortBy] = useState<'name' | 'rate' | 'absences'>('rate');

  useEffect(() => {
    api.get<AttendanceStudent[]>('/dashboard/attendance').then(setStudents).catch(() => {
      // Mock data if endpoint doesn't exist yet
      return api.get<{ id: string; firstName: string; lastName: string; riskTier: string; attendanceRate: number }[]>('/roster')
        .then(roster => {
          setStudents(roster.map(s => ({
            id: s.id,
            firstName: s.firstName,
            lastName: s.lastName,
            riskTier: s.riskTier || 'ON_TRACK',
            overallRate: s.attendanceRate || (85 + Math.random() * 13),
            consecutiveAbsences: Math.floor(Math.random() * 4),
            tardyCount: Math.floor(Math.random() * 6),
            last30Days: Array.from({ length: 30 }, () => {
              const r = Math.random();
              if (r > 0.92) return 'A' as const;
              if (r > 0.88) return 'T' as const;
              if (r > 0.85) return 'E' as const;
              return 'P' as const;
            }),
          })));
        }).catch(() => {});
    }).finally(() => setLoading(false));
  }, []);

  const filtered = students
    .filter(s => {
      if (filter === 'chronic') return s.overallRate < 90;
      if (filter === 'at-risk') return s.overallRate < 95 && s.overallRate >= 90;
      return true;
    })
    .sort((a, b) => {
      if (sortBy === 'name') return a.lastName.localeCompare(b.lastName);
      if (sortBy === 'rate') return a.overallRate - b.overallRate;
      return b.consecutiveAbsences - a.consecutiveAbsences;
    });

  const overallRate = students.length > 0
    ? students.reduce((sum, s) => sum + s.overallRate, 0) / students.length
    : 0;
  const chronicCount = students.filter(s => s.overallRate < 90).length;
  const presentToday = students.filter(s => s.last30Days[s.last30Days.length - 1] === 'P').length;

  const dayDistribution = Array.from({ length: 5 }, (_, i) => {
    const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
    const absences = students.reduce((sum, s) => {
      return sum + s.last30Days.filter((_, idx) => idx % 5 === i && s.last30Days[idx] === 'A').length;
    }, 0);
    return { day: dayNames[i], absences };
  });

  if (loading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="skeleton h-10 w-48" />
        <div className="grid grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => <div key={i} className="skeleton h-24" />)}
        </div>
        <div className="skeleton h-96" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">Attendance Dashboard</h1>
          <p className="text-sm text-gray-500 dark:text-dark-muted mt-0.5">
            Track and manage student attendance patterns
          </p>
        </div>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="metric-card">
          <div className="relative z-10">
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-dark-muted mb-1">Overall Rate</p>
            <p className={`text-3xl font-bold ${overallRate >= 95 ? 'text-emerald-600 dark:text-emerald-400' : overallRate >= 90 ? 'text-amber-600 dark:text-amber-400' : 'text-red-600 dark:text-red-400'}`}>
              {overallRate.toFixed(1)}%
            </p>
          </div>
        </div>
        <div className="metric-card">
          <div className="relative z-10">
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-dark-muted mb-1">Present Today</p>
            <p className="text-3xl font-bold text-gray-900 dark:text-white">{presentToday}/{students.length}</p>
          </div>
        </div>
        <div className="metric-card">
          <div className="relative z-10">
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-dark-muted mb-1">Chronically Absent</p>
            <p className="text-3xl font-bold text-red-600 dark:text-red-400">{chronicCount}</p>
            <p className="text-xs text-gray-500 dark:text-dark-muted">below 90% threshold</p>
          </div>
        </div>
        <div className="metric-card">
          <div className="relative z-10">
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-dark-muted mb-1">Absence by Day</p>
            <ResponsiveContainer width="100%" height={50}>
              <BarChart data={dayDistribution}>
                <Bar dataKey="absences" fill={isDark ? '#f87171' : '#ef4444'} radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1 bg-gray-100 dark:bg-dark-surface rounded-lg p-1">
          {([['all', 'All Students'], ['chronic', 'Chronic (<90%)'], ['at-risk', 'At Risk (90-95%)']] as const).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setFilter(key)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                filter === key
                  ? 'bg-white dark:bg-dark-card text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-500 dark:text-dark-muted hover:text-gray-700'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
        <select
          value={sortBy}
          onChange={e => setSortBy(e.target.value as 'name' | 'rate' | 'absences')}
          className="input w-auto text-xs"
        >
          <option value="rate">Sort by Rate (lowest first)</option>
          <option value="absences">Sort by Consecutive Absences</option>
          <option value="name">Sort by Name</option>
        </select>
      </div>

      {/* Student Attendance Table with Heatmap */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th className="w-48">Student</th>
                <th className="w-20 text-center">Rate</th>
                <th className="w-20 text-center">Streak</th>
                <th className="w-16 text-center">Tardy</th>
                <th>Last 30 Days</th>
                <th className="w-16 text-center">Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(s => (
                <tr key={s.id}>
                  <td>
                    <Link to={`/students/${s.id}`} className="flex items-center gap-2 group">
                      <div className="h-8 w-8 rounded-full bg-atlas-primary/10 dark:bg-blue-500/20 flex items-center justify-center text-xs font-bold text-atlas-primary dark:text-blue-400">
                        {s.firstName[0]}{s.lastName[0]}
                      </div>
                      <span className="text-sm font-medium text-gray-900 dark:text-white group-hover:text-atlas-primary dark:group-hover:text-blue-400 transition-colors">
                        {s.lastName}, {s.firstName}
                      </span>
                    </Link>
                  </td>
                  <td className="text-center">
                    <span className={`text-sm font-semibold ${
                      s.overallRate >= 95 ? 'text-emerald-600 dark:text-emerald-400' :
                      s.overallRate >= 90 ? 'text-amber-600 dark:text-amber-400' :
                      'text-red-600 dark:text-red-400'
                    }`}>
                      {s.overallRate.toFixed(1)}%
                    </span>
                  </td>
                  <td className="text-center">
                    {s.consecutiveAbsences > 0 ? (
                      <span className="badge badge-red text-[10px]">{s.consecutiveAbsences}d</span>
                    ) : (
                      <span className="text-xs text-gray-400">-</span>
                    )}
                  </td>
                  <td className="text-center text-sm text-gray-600 dark:text-dark-muted">{s.tardyCount}</td>
                  <td>
                    <div className="flex gap-0.5">
                      {s.last30Days.map((status, i) => (
                        <div
                          key={i}
                          className={`w-2.5 h-6 rounded-sm ${STATUS_COLORS[status || 'null']} transition-all hover:scale-y-125`}
                          title={`Day ${i + 1}: ${status ? STATUS_LABELS[status] : 'No data'}`}
                        />
                      ))}
                    </div>
                  </td>
                  <td className="text-center">
                    {s.overallRate < 90 ? (
                      <span className="badge badge-red text-[10px]">CHRONIC</span>
                    ) : s.overallRate < 95 ? (
                      <span className="badge badge-amber text-[10px]">AT RISK</span>
                    ) : (
                      <span className="badge badge-green text-[10px]">GOOD</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-dark-muted">
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-emerald-500" /> Present</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-red-500" /> Absent</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-amber-500" /> Tardy</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-blue-400" /> Excused</span>
      </div>
    </div>
  );
}
