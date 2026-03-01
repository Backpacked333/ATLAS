import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';
import { RosterStudent, RosterFilters, SectionInfo } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { QuickObservationModal } from '../components/observations/QuickObservationModal';

export function RosterPage() {
  const { teacher } = useAuth();
  const [students, setStudents] = useState<RosterStudent[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState<RosterFilters>({});
  const [sortField, setSortField] = useState<string>('lastName');
  const [sortAsc, setSortAsc] = useState(true);
  const [observeStudent, setObserveStudent] = useState<{ id: string; name: string } | null>(null);

  useEffect(() => {
    const params = new URLSearchParams();
    if (filters.sectionId) params.set('sectionId', filters.sectionId);
    if (filters.gradeStatus && filters.gradeStatus !== 'all') params.set('gradeStatus', filters.gradeStatus);
    if (filters.attendance && filters.attendance !== 'all') params.set('attendance', filters.attendance);
    if (filters.missingWork) params.set('missingWork', filters.missingWork);
    if (filters.flags?.length) params.set('flags', filters.flags.join(','));

    api.get<RosterStudent[]>(`/roster?${params.toString()}`)
      .then(setStudents)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [filters]);

  const filtered = useMemo(() => {
    let result = students;
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (s) =>
          s.firstName.toLowerCase().includes(q) ||
          s.lastName.toLowerCase().includes(q)
      );
    }

    result.sort((a, b) => {
      const aVal = (a as unknown as Record<string, unknown>)[sortField];
      const bVal = (b as unknown as Record<string, unknown>)[sortField];
      if (typeof aVal === 'string' && typeof bVal === 'string') {
        return sortAsc ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
      }
      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return sortAsc ? aVal - bVal : bVal - aVal;
      }
      return 0;
    });

    return result;
  }, [students, search, sortField, sortAsc]);

  function handleSort(field: string) {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(true);
    }
  }

  const SortHeader = ({ field, children }: { field: string; children: React.ReactNode }) => (
    <th
      className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:text-gray-700"
      onClick={() => handleSort(field)}
    >
      <div className="flex items-center gap-1">
        {children}
        {sortField === field && (
          <span className="text-atlas-primary">{sortAsc ? '\u2191' : '\u2193'}</span>
        )}
      </div>
    </th>
  );

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">My Students</h1>
        <span className="text-sm text-gray-500">{filtered.length} students</span>
      </div>

      {/* Filters */}
      <div className="card p-3">
        <div className="flex flex-wrap gap-3">
          <input
            type="text"
            placeholder="Search by name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input w-48"
          />

          <select
            value={filters.sectionId || ''}
            onChange={(e) => setFilters({ ...filters, sectionId: e.target.value || undefined })}
            className="input w-auto"
          >
            <option value="">All Sections</option>
            {teacher?.sections?.map((s: SectionInfo) => (
              <option key={s.id} value={s.id}>
                {s.courseName} - {s.period}
              </option>
            ))}
          </select>

          <select
            value={filters.gradeStatus || 'all'}
            onChange={(e) => setFilters({ ...filters, gradeStatus: e.target.value as RosterFilters['gradeStatus'] })}
            className="input w-auto"
          >
            <option value="all">All Grades</option>
            <option value="passing">Passing</option>
            <option value="failing">Failing</option>
            <option value="declining">Declining</option>
          </select>

          <select
            value={filters.attendance || 'all'}
            onChange={(e) => setFilters({ ...filters, attendance: e.target.value as RosterFilters['attendance'] })}
            className="input w-auto"
          >
            <option value="all">All Attendance</option>
            <option value="at-risk">At-Risk (&lt;95%)</option>
            <option value="chronic">Chronic (&lt;90%)</option>
          </select>

          <select
            value={filters.missingWork || ''}
            onChange={(e) => setFilters({ ...filters, missingWork: e.target.value || undefined })}
            className="input w-auto"
          >
            <option value="">Missing Work</option>
            <option value="any">Any Missing</option>
            <option value="3+">3+ Missing</option>
            <option value="5+">5+ Missing</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-atlas-border">
            <thead className="bg-gray-50">
              <tr>
                <SortHeader field="lastName">Student</SortHeader>
                <SortHeader field="sectionName">Section</SortHeader>
                <SortHeader field="gradePercent">Grade</SortHeader>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">Trend</th>
                <SortHeader field="missingCount">Missing</SortHeader>
                <SortHeader field="attendanceRate">Attendance</SortHeader>
                <SortHeader field="cumulativeGpa">GPA</SortHeader>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">Flags</th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">Last Note</th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-atlas-border bg-white">
              {loading ? (
                [...Array(10)].map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    {[...Array(10)].map((_, j) => (
                      <td key={j} className="px-3 py-3">
                        <div className="h-3 bg-gray-200 rounded" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-3 py-8 text-center text-gray-500">
                    No students match the current filters.
                  </td>
                </tr>
              ) : (
                filtered.map((student) => (
                  <tr key={`${student.id}-${student.sectionId}`} className="hover:bg-gray-50">
                    <td className="px-3 py-3">
                      <Link to={`/students/${student.id}`} className="flex items-center gap-2 hover:underline">
                        <div className="h-8 w-8 rounded-full bg-atlas-accent/20 flex items-center justify-center text-xs font-medium text-atlas-primary">
                          {student.firstName[0]}{student.lastName[0]}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {student.lastName}, {student.firstName}
                          </p>
                        </div>
                      </Link>
                    </td>
                    <td className="px-3 py-3 text-sm text-gray-600">{student.sectionName}</td>
                    <td className="px-3 py-3">
                      <span className={`badge badge-${student.gradeColor}`}>
                        {student.letterGrade} ({student.gradePercent}%)
                      </span>
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex items-end gap-px h-4">
                        {student.trendData.slice(-8).map((val, i) => (
                          <div
                            key={i}
                            className={`w-1 rounded-t ${val >= 73 ? 'bg-green-400' : val >= 60 ? 'bg-amber-400' : 'bg-red-400'}`}
                            style={{ height: `${Math.max(2, (val / 100) * 16)}px` }}
                          />
                        ))}
                      </div>
                    </td>
                    <td className="px-3 py-3">
                      <span className={`text-sm ${student.missingCount >= 3 ? 'text-red-600 font-medium' : 'text-gray-600'}`}>
                        {student.missingCount === 0 ? '\u2713' : student.missingCount}
                      </span>
                    </td>
                    <td className="px-3 py-3">
                      <span className={`badge badge-${student.attendanceColor}`}>
                        {student.attendanceRate}%
                      </span>
                    </td>
                    <td className="px-3 py-3 text-sm text-gray-600">
                      {student.cumulativeGpa?.toFixed(1) || '--'}
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex gap-1 flex-wrap">
                        {student.flags.map((flag) => (
                          <span key={flag} className="badge badge-purple text-xs">{flag}</span>
                        ))}
                      </div>
                    </td>
                    <td className="px-3 py-3 text-sm">
                      {student.lastNoteDate ? (
                        <span className={student.daysSinceLastNote && student.daysSinceLastNote > 14 && student.gradePercent < 73 ? 'text-red-500' : 'text-gray-500'}>
                          {student.lastNoteDate}
                        </span>
                      ) : (
                        <span className="text-gray-300">--</span>
                      )}
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex gap-1">
                        <button
                          onClick={() => setObserveStudent({ id: student.id, name: `${student.firstName} ${student.lastName}` })}
                          className="btn-ghost text-xs px-2 py-1"
                          title="Add observation"
                        >
                          Note
                        </button>
                        <Link
                          to={`/referrals/new/${student.id}`}
                          className="btn-ghost text-xs px-2 py-1"
                          title="SST Referral"
                        >
                          Refer
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {observeStudent && (
        <QuickObservationModal
          studentId={observeStudent.id}
          studentName={observeStudent.name}
          onClose={() => setObserveStudent(null)}
          onSaved={() => {
            setObserveStudent(null);
          }}
        />
      )}
    </div>
  );
}
