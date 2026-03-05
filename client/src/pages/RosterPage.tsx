import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';
import { RosterStudent, RosterFilters, SectionInfo } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { PageHeader } from '../components/ui/PageHeader';
import { MetricCard } from '../components/ui/MetricCard';
import { FilterBar } from '../components/ui/FilterBar';
import { Avatar } from '../components/ui/Avatar';
import { RiskBadge } from '../components/ui/RiskBadge';
import { SparklineChart } from '../components/ui/SparklineChart';
import { ProgressRing } from '../components/ui/ProgressRing';
import { EmptyState } from '../components/ui/EmptyState';
import { TableRowSkeleton } from '../components/ui/SkeletonLoader';
import {
  UsersIcon,
  ExclamationTriangleIcon,
  AcademicCapIcon,
  Squares2X2Icon,
  ListBulletIcon,
} from '@heroicons/react/24/outline';

type ViewMode = 'table' | 'grid';

export function RosterPage() {
  const { teacher } = useAuth();
  const [students, setStudents] = useState<RosterStudent[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<RosterFilters>({});
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<string>('lastName');
  const [sortAsc, setSortAsc] = useState(true);
  const [smartFilter, setSmartFilter] = useState('all');
  const [viewMode, setViewMode] = useState<ViewMode>('table');

  useEffect(() => {
    const params = new URLSearchParams();
    if (filters.sectionId) params.set('sectionId', filters.sectionId);
    if (filters.gradeStatus && filters.gradeStatus !== 'all') params.set('gradeStatus', filters.gradeStatus);
    if (filters.attendance && filters.attendance !== 'all') params.set('attendance', filters.attendance);

    api.get<RosterStudent[]>(`/roster?${params}`)
      .then(setStudents)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [filters]);

  const filteredStudents = useMemo(() => {
    let result = students;

    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (s) => s.firstName.toLowerCase().includes(q) || s.lastName.toLowerCase().includes(q)
      );
    }

    switch (smartFilter) {
      case 'needs-attention':
        result = result.filter((s) => s.gradePercent < 60 || s.attendanceRate < 90);
        break;
      case 'missing-work':
        result = result.filter((s) => s.missingCount > 0);
        break;
      case 'no-recent-notes':
        result = result.filter((s) => s.daysSinceLastNote === null || s.daysSinceLastNote > 14);
        break;
    }

    result.sort((a, b) => {
      const aVal = (a as unknown as Record<string, unknown>)[sortBy];
      const bVal = (b as unknown as Record<string, unknown>)[sortBy];
      if (typeof aVal === 'string' && typeof bVal === 'string') {
        return sortAsc ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
      }
      return sortAsc ? Number(aVal || 0) - Number(bVal || 0) : Number(bVal || 0) - Number(aVal || 0);
    });

    return result;
  }, [students, search, sortBy, sortAsc, smartFilter]);

  const stats = useMemo(() => {
    const total = students.length;
    const atRisk = students.filter((s) => s.gradePercent < 60 || s.attendanceRate < 90).length;
    const avgGrade = total > 0 ? Math.round(students.reduce((sum, s) => sum + s.gradePercent, 0) / total * 10) / 10 : 0;
    const avgAttendance = total > 0 ? Math.round(students.reduce((sum, s) => sum + s.attendanceRate, 0) / total * 10) / 10 : 0;
    return { total, atRisk, avgGrade, avgAttendance };
  }, [students]);

  const handleSort = (field: string) => {
    if (sortBy === field) setSortAsc(!sortAsc);
    else { setSortBy(field); setSortAsc(true); }
  };

  const smartFilters = [
    { key: 'all', label: 'All Students', count: students.length },
    { key: 'needs-attention', label: 'Needs Attention', count: students.filter((s) => s.gradePercent < 60 || s.attendanceRate < 90).length },
    { key: 'missing-work', label: 'Missing Work', count: students.filter((s) => s.missingCount > 0).length },
    { key: 'no-recent-notes', label: 'No Recent Notes', count: students.filter((s) => s.daysSinceLastNote === null || s.daysSinceLastNote > 14).length },
  ];

  const riskTierForStudent = (s: RosterStudent) => {
    if (s.gradePercent < 60 || s.attendanceRate < 85) return 'URGENT';
    if (s.gradePercent < 73 || s.attendanceRate < 90) return 'NEEDS_SUPPORT';
    return 'ON_TRACK';
  };

  return (
    <div className="space-y-6 max-w-7xl">
      <PageHeader title="My Students" subtitle={`${students.length} students across your sections`} />

      {/* Stats Row */}
      {!loading && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <MetricCard label="Total Students" value={stats.total} icon={<UsersIcon className="h-5 w-5" />} />
          <MetricCard label="At Risk" value={stats.atRisk} variant={stats.atRisk > 0 ? 'danger' : 'success'} icon={<ExclamationTriangleIcon className="h-5 w-5" />} />
          <MetricCard label="Avg Grade" value={`${stats.avgGrade}%`} icon={<AcademicCapIcon className="h-5 w-5" />} />
          <MetricCard label="Avg Attendance" value={`${stats.avgAttendance}%`} />
        </div>
      )}

      {/* Controls Row */}
      <div className="flex flex-col md:flex-row gap-3 items-start md:items-center justify-between">
        <FilterBar filters={smartFilters} activeFilter={smartFilter} onChange={setSmartFilter} />
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search students..."
            className="input w-48"
          />
          <select
            value={filters.sectionId || ''}
            onChange={(e) => setFilters({ ...filters, sectionId: e.target.value || undefined })}
            className="input w-40"
          >
            <option value="">All Sections</option>
            {teacher?.sections?.map((s: SectionInfo) => (
              <option key={s.id} value={s.id}>{s.courseName} ({s.period})</option>
            ))}
          </select>
          <div className="flex border border-atlas-border rounded-button overflow-hidden">
            <button
              onClick={() => setViewMode('table')}
              className={`p-2 ${viewMode === 'table' ? 'bg-atlas-indigo-50 text-atlas-indigo-700' : 'text-atlas-text-tertiary hover:bg-gray-50'}`}
            >
              <ListBulletIcon className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 ${viewMode === 'grid' ? 'bg-atlas-indigo-50 text-atlas-indigo-700' : 'text-atlas-text-tertiary hover:bg-gray-50'}`}
            >
              <Squares2X2Icon className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="card overflow-hidden">
          <table className="w-full">
            <tbody>
              {[...Array(8)].map((_, i) => <TableRowSkeleton key={i} cols={7} />)}
            </tbody>
          </table>
        </div>
      ) : filteredStudents.length === 0 ? (
        <EmptyState title="No students found" description="Try adjusting your filters or search." />
      ) : viewMode === 'table' ? (
        <div className="card overflow-hidden overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-atlas-border bg-gray-50/50">
                {[
                  { key: 'lastName', label: 'Student' },
                  { key: 'sectionName', label: 'Section' },
                  { key: 'gradePercent', label: 'Grade' },
                  { key: 'trendData', label: 'Trend' },
                  { key: 'attendanceRate', label: 'Attendance' },
                  { key: 'missingCount', label: 'Missing' },
                  { key: 'riskTier', label: 'Risk' },
                ].map((col) => (
                  <th
                    key={col.key}
                    onClick={() => col.key !== 'trendData' && handleSort(col.key)}
                    className="px-4 py-3 text-left text-xs font-semibold text-atlas-text-tertiary uppercase tracking-wider cursor-pointer hover:text-atlas-text-secondary"
                  >
                    {col.label}
                    {sortBy === col.key && (
                      <span className="ml-1">{sortAsc ? '↑' : '↓'}</span>
                    )}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-atlas-border">
              {filteredStudents.map((student) => {
                const risk = riskTierForStudent(student);
                return (
                  <tr
                    key={`${student.id}-${student.sectionId}`}
                    className={`hover:bg-gray-50/50 transition-colors ${
                      risk === 'URGENT' ? 'bg-atlas-rose-50/30' : risk === 'NEEDS_SUPPORT' ? 'bg-atlas-amber-50/20' : ''
                    }`}
                  >
                    <td className="px-4 py-3">
                      <Link to={`/students/${student.id}`} className="flex items-center gap-3 group">
                        <Avatar firstName={student.firstName} lastName={student.lastName} photoUrl={student.photoUrl} size="sm" riskTier={risk} />
                        <div>
                          <p className="text-sm font-medium text-atlas-text-primary group-hover:text-atlas-indigo-700">
                            {student.lastName}, {student.firstName}
                          </p>
                          <div className="flex gap-1 mt-0.5">
                            {student.flags.map((f) => (
                              <span key={f} className="badge badge-violet text-[10px] px-1.5 py-0">{f}</span>
                            ))}
                          </div>
                        </div>
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-sm text-atlas-text-secondary">{student.sectionName}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className={`text-sm font-semibold ${student.gradePercent >= 73 ? 'text-atlas-emerald-700' : student.gradePercent >= 60 ? 'text-atlas-amber-700' : 'text-atlas-rose-700'}`}>
                          {student.letterGrade} ({student.gradePercent}%)
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <SparklineChart
                        data={student.trendData}
                        color={student.gradePercent >= 73 ? '#059669' : student.gradePercent >= 60 ? '#d97706' : '#e11d48'}
                        height={24}
                        width={80}
                      />
                    </td>
                    <td className="px-4 py-3">
                      <ProgressRing value={student.attendanceRate} size={36} strokeWidth={3} />
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-sm font-medium ${student.missingCount > 0 ? 'text-atlas-rose-600' : 'text-atlas-text-secondary'}`}>
                        {student.missingCount}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <RiskBadge tier={risk} size="sm" />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        /* Card Grid View */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredStudents.map((student) => {
            const risk = riskTierForStudent(student);
            return (
              <Link
                key={`${student.id}-${student.sectionId}`}
                to={`/students/${student.id}`}
                className="card p-4 hover:shadow-elevated transition-all group"
              >
                <div className="flex items-center gap-3 mb-3">
                  <Avatar firstName={student.firstName} lastName={student.lastName} photoUrl={student.photoUrl} size="md" riskTier={risk} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-atlas-text-primary group-hover:text-atlas-indigo-700 truncate">
                      {student.firstName} {student.lastName}
                    </p>
                    <p className="text-xs text-atlas-text-tertiary truncate">{student.sectionName}</p>
                  </div>
                </div>
                <div className="flex items-center justify-between mb-3">
                  <ProgressRing value={student.gradePercent} size={44} strokeWidth={3} label="Grade" />
                  <ProgressRing value={student.attendanceRate} size={44} strokeWidth={3} label="Attend." />
                  <div className="text-center">
                    <p className={`text-lg font-bold ${student.missingCount > 0 ? 'text-atlas-rose-600' : 'text-atlas-text-secondary'}`}>
                      {student.missingCount}
                    </p>
                    <p className="text-[10px] text-atlas-text-tertiary">Missing</p>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <RiskBadge tier={risk} size="sm" />
                  <SparklineChart data={student.trendData} color={student.gradePercent >= 73 ? '#059669' : '#e11d48'} height={20} width={60} />
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
