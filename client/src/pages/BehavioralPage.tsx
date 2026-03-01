import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';
import { useTheme } from '../contexts/ThemeContext';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, PieChart, Pie, Cell } from 'recharts';

interface BehavioralRecord {
  id: string;
  studentId: string;
  studentName: string;
  category: string;
  severity: string;
  content: string;
  createdAt: string;
}

export function BehavioralPage() {
  const { isDark } = useTheme();
  const [records, setRecords] = useState<BehavioralRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterSeverity, setFilterSeverity] = useState<string>('all');

  useEffect(() => {
    api.get<BehavioralRecord[]>('/dashboard/behavioral').then(setRecords).catch(() => {
      // Mock data from observations
      setRecords([
        { id: '1', studentId: 's1', studentName: 'Marcus Williams', category: 'BEHAVIORAL', severity: 'CONCERN', content: 'Disrupted class by talking during instruction. Third incident this week.', createdAt: new Date(Date.now() - 86400000).toISOString() },
        { id: '2', studentId: 's2', studentName: 'Jaylen Carter', category: 'BEHAVIORAL', severity: 'URGENT', content: 'Verbal altercation with another student in the hallway before class.', createdAt: new Date(Date.now() - 172800000).toISOString() },
        { id: '3', studentId: 's3', studentName: 'Sofia Hernandez', category: 'SOCIAL_EMOTIONAL', severity: 'CONCERN', content: 'Appears withdrawn and not participating in group activities. Check in needed.', createdAt: new Date(Date.now() - 259200000).toISOString() },
        { id: '4', studentId: 's4', studentName: 'Aiden Johnson', category: 'BEHAVIORAL', severity: 'POSITIVE', content: 'Helped a struggling peer during group work. Excellent peer mentoring.', createdAt: new Date(Date.now() - 345600000).toISOString() },
        { id: '5', studentId: 's5', studentName: 'Emma Chen', category: 'ACADEMIC', severity: 'POSITIVE', content: 'Outstanding presentation on quadratic equations. Class engaged.', createdAt: new Date(Date.now() - 432000000).toISOString() },
        { id: '6', studentId: 's6', studentName: 'James Washington', category: 'ATTENDANCE', severity: 'URGENT', content: 'Third consecutive day absent. Guardian contact attempted — no response.', createdAt: new Date(Date.now() - 518400000).toISOString() },
        { id: '7', studentId: 's7', studentName: 'Destiny Okafor', category: 'BEHAVIORAL', severity: 'CONCERN', content: 'Using phone repeatedly during class despite reminders.', createdAt: new Date(Date.now() - 604800000).toISOString() },
        { id: '8', studentId: 's8', studentName: 'Tyler Brooks', category: 'SOCIAL_EMOTIONAL', severity: 'POSITIVE', content: 'Showed great improvement in class participation this week.', createdAt: new Date(Date.now() - 691200000).toISOString() },
      ]);
    }).finally(() => setLoading(false));
  }, []);

  const filtered = records.filter(r => {
    if (filterCategory !== 'all' && r.category !== filterCategory) return false;
    if (filterSeverity !== 'all' && r.severity !== filterSeverity) return false;
    return true;
  });

  const severityColors = {
    POSITIVE: isDark ? '#34d399' : '#10b981',
    CONCERN: isDark ? '#fbbf24' : '#f59e0b',
    URGENT: isDark ? '#f87171' : '#ef4444',
  };

  const categoryCounts = [
    { name: 'Behavioral', count: records.filter(r => r.category === 'BEHAVIORAL').length },
    { name: 'Social/Emotional', count: records.filter(r => r.category === 'SOCIAL_EMOTIONAL').length },
    { name: 'Academic', count: records.filter(r => r.category === 'ACADEMIC').length },
    { name: 'Attendance', count: records.filter(r => r.category === 'ATTENDANCE').length },
  ];

  const severityCounts = [
    { name: 'Positive', value: records.filter(r => r.severity === 'POSITIVE').length, color: severityColors.POSITIVE },
    { name: 'Concern', value: records.filter(r => r.severity === 'CONCERN').length, color: severityColors.CONCERN },
    { name: 'Urgent', value: records.filter(r => r.severity === 'URGENT').length, color: severityColors.URGENT },
  ];

  const chartStyle = {
    backgroundColor: isDark ? '#1e2235' : '#fff',
    border: `1px solid ${isDark ? '#2a2f45' : '#e2e8f0'}`,
    borderRadius: '8px',
    fontSize: '12px',
  };

  const severityBadge = (severity: string) => {
    switch (severity) {
      case 'POSITIVE': return 'badge-green';
      case 'CONCERN': return 'badge-amber';
      case 'URGENT': return 'badge-red';
      default: return 'badge-gray';
    }
  };

  const categoryIcon = (category: string) => {
    switch (category) {
      case 'BEHAVIORAL': return '⚡';
      case 'SOCIAL_EMOTIONAL': return '💭';
      case 'ACADEMIC': return '📚';
      case 'ATTENDANCE': return '📋';
      default: return '📝';
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="skeleton h-10 w-48" />
        <div className="grid grid-cols-2 gap-4">
          {[...Array(2)].map((_, i) => <div key={i} className="skeleton h-56" />)}
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
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">Behavioral Tracking</h1>
          <p className="text-sm text-gray-500 dark:text-dark-muted mt-0.5">
            Observations, incidents, and behavioral patterns &middot; {records.length} records
          </p>
        </div>
      </div>

      {/* Summary Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <div className="card-header">
            <h2 className="text-sm font-semibold text-gray-900 dark:text-white">By Category</h2>
          </div>
          <div className="card-body">
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={categoryCounts}>
                <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#2a2f45' : '#e2e8f0'} />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} stroke={isDark ? '#8b95a5' : '#6b7280'} />
                <YAxis tick={{ fontSize: 11 }} stroke={isDark ? '#8b95a5' : '#6b7280'} />
                <Tooltip contentStyle={chartStyle} />
                <Bar dataKey="count" fill={isDark ? '#60a5fa' : '#3b82f6'} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="card">
          <div className="card-header">
            <h2 className="text-sm font-semibold text-gray-900 dark:text-white">By Severity</h2>
          </div>
          <div className="card-body flex justify-center">
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={severityCounts} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={4} dataKey="value">
                  {severityCounts.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                </Pie>
                <Tooltip contentStyle={chartStyle} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <select value={filterCategory} onChange={e => setFilterCategory(e.target.value)} className="input w-auto text-xs">
          <option value="all">All Categories</option>
          <option value="BEHAVIORAL">Behavioral</option>
          <option value="SOCIAL_EMOTIONAL">Social/Emotional</option>
          <option value="ACADEMIC">Academic</option>
          <option value="ATTENDANCE">Attendance</option>
        </select>
        <select value={filterSeverity} onChange={e => setFilterSeverity(e.target.value)} className="input w-auto text-xs">
          <option value="all">All Severities</option>
          <option value="POSITIVE">Positive</option>
          <option value="CONCERN">Concern</option>
          <option value="URGENT">Urgent</option>
        </select>
        <span className="text-xs text-gray-500 dark:text-dark-muted">{filtered.length} records</span>
      </div>

      {/* Observation Feed */}
      <div className="space-y-3">
        {filtered.map(r => (
          <div key={r.id} className={`card ${r.severity === 'URGENT' ? 'severity-bar-red' : r.severity === 'CONCERN' ? 'severity-bar-amber' : 'severity-bar-green'}`}>
            <div className="px-5 py-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3 flex-1">
                  <span className="text-lg mt-0.5">{categoryIcon(r.category)}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Link to={`/students/${r.studentId}`} className="text-sm font-semibold text-gray-900 dark:text-white hover:text-atlas-primary dark:hover:text-blue-400 transition-colors">
                        {r.studentName}
                      </Link>
                      <span className={`badge ${severityBadge(r.severity)} text-[10px]`}>{r.severity}</span>
                      <span className="badge badge-gray text-[10px]">{r.category.replace('_', '/')}</span>
                    </div>
                    <p className="text-sm text-gray-700 dark:text-dark-text/80">{r.content}</p>
                  </div>
                </div>
                <span className="text-xs text-gray-400 dark:text-dark-muted whitespace-nowrap">
                  {new Date(r.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
