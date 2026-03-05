import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../services/api';
import { ScoreboardResponse, SchoolScoreboardEntry } from '../../types/command';

type SortKey = keyof SchoolScoreboardEntry;

export function ScoreboardPage() {
  const [data, setData] = useState<ScoreboardResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('schoolName');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');

  useEffect(() => {
    api.get<ScoreboardResponse>('/command/scoreboard')
      .then(setData)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent" />
      </div>
    );
  }

  if (error) {
    return <div className="text-red-600 bg-red-50 p-4 rounded-lg">{error}</div>;
  }

  if (!data) return null;

  const sorted = [...data.schools].sort((a, b) => {
    const aVal = a[sortKey];
    const bVal = b[sortKey];
    if (aVal === null || aVal === undefined) return 1;
    if (bVal === null || bVal === undefined) return -1;
    if (typeof aVal === 'string') {
      return sortDir === 'asc' ? aVal.localeCompare(bVal as string) : (bVal as string).localeCompare(aVal);
    }
    return sortDir === 'asc' ? (aVal as number) - (bVal as number) : (bVal as number) - (aVal as number);
  });

  const metricColor = (value: number, good: number, warning: number, inverse = false) => {
    if (inverse) {
      if (value <= good) return 'text-green-700 bg-green-50';
      if (value <= warning) return 'text-amber-700 bg-amber-50';
      return 'text-red-700 bg-red-50';
    }
    if (value >= good) return 'text-green-700 bg-green-50';
    if (value >= warning) return 'text-amber-700 bg-amber-50';
    return 'text-red-700 bg-red-50';
  };

  const SortHeader = ({ label, field }: { label: string; field: SortKey }) => (
    <th
      className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 whitespace-nowrap"
      onClick={() => handleSort(field)}
    >
      {label} {sortKey === field ? (sortDir === 'asc' ? '\u2191' : '\u2193') : ''}
    </th>
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">School Health Scoreboard</h1>
        <p className="text-sm text-gray-500 mt-1">
          {data.districtTotals.totalEnrollment.toLocaleString()} students across {data.schools.length} schools
          {' \u2022 '}Updated {new Date(data.generatedAt).toLocaleString()}
        </p>
      </div>

      {/* District Totals Summary */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <SummaryCard label="Total Enrollment" value={data.districtTotals.totalEnrollment.toLocaleString()} />
        <SummaryCard label="Avg Attendance" value={`${data.districtTotals.avgAttendanceRate}%`} color={data.districtTotals.avgAttendanceRate >= 95 ? 'green' : data.districtTotals.avgAttendanceRate >= 90 ? 'amber' : 'red'} />
        <SummaryCard label="Total At-Risk" value={data.districtTotals.totalAtRisk.toLocaleString()} color="amber" />
        <SummaryCard label="SST Backlog" value={data.districtTotals.totalSstBacklog.toString()} color={data.districtTotals.totalSstBacklog > 10 ? 'red' : 'green'} />
        <SummaryCard label="Avg IEP Compliance" value={`${data.districtTotals.avgIepComplianceRate}%`} color={data.districtTotals.avgIepComplianceRate >= 95 ? 'green' : 'red'} />
      </div>

      {/* Scoreboard Table */}
      <div className="bg-white rounded-lg shadow overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <SortHeader label="School" field="schoolName" />
              <SortHeader label="Grades" field="gradeSpan" />
              <SortHeader label="Enrollment" field="enrollmentCount" />
              <SortHeader label="Attendance %" field="attendanceRate" />
              <SortHeader label="Chronic Abs %" field="chronicAbsenceRate" />
              <SortHeader label="At-Risk #" field="atRiskCount" />
              <SortHeader label="At-Risk %" field="atRiskPercent" />
              <SortHeader label="Intv Fidelity" field="interventionFidelity" />
              <SortHeader label="Intv Success" field="interventionSuccessRate" />
              <SortHeader label="SST Backlog" field="sstBacklog" />
              <SortHeader label="Susp Rate" field="suspensionRate" />
              <SortHeader label="Disprop Idx" field="disproportionalityIndex" />
              <SortHeader label="IEP Compl %" field="iepComplianceRate" />
              <SortHeader label="Counselor Load" field="counselorWorkload" />
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {sorted.map((school) => (
              <tr key={school.schoolId} className="hover:bg-gray-50">
                <td className="px-3 py-2 text-sm font-medium">
                  <Link to={`/command/schools/${school.schoolId}`} className="text-indigo-600 hover:text-indigo-800">
                    {school.schoolName}
                  </Link>
                </td>
                <td className="px-3 py-2 text-sm text-gray-600">{school.gradeSpan}</td>
                <td className="px-3 py-2 text-sm text-gray-900">{school.enrollmentCount.toLocaleString()}</td>
                <td className="px-3 py-2 text-sm">
                  <span className={`inline-block px-2 py-0.5 rounded ${metricColor(school.attendanceRate, 95, 90)}`}>
                    {school.attendanceRate}%
                  </span>
                </td>
                <td className="px-3 py-2 text-sm">
                  <span className={`inline-block px-2 py-0.5 rounded ${metricColor(school.chronicAbsenceRate, 5, 10, true)}`}>
                    {school.chronicAbsenceRate}%
                  </span>
                </td>
                <td className="px-3 py-2 text-sm text-gray-900">{school.atRiskCount}</td>
                <td className="px-3 py-2 text-sm">
                  <span className={`inline-block px-2 py-0.5 rounded ${metricColor(school.atRiskPercent, 10, 20, true)}`}>
                    {school.atRiskPercent}%
                  </span>
                </td>
                <td className="px-3 py-2 text-sm">
                  <span className={`inline-block px-2 py-0.5 rounded ${metricColor(school.interventionFidelity, 80, 60)}`}>
                    {school.interventionFidelity}%
                  </span>
                </td>
                <td className="px-3 py-2 text-sm">
                  <span className={`inline-block px-2 py-0.5 rounded ${metricColor(school.interventionSuccessRate, 60, 40)}`}>
                    {school.interventionSuccessRate}%
                  </span>
                </td>
                <td className="px-3 py-2 text-sm">
                  <span className={`inline-block px-2 py-0.5 rounded ${metricColor(school.sstBacklog, 0, 5, true)}`}>
                    {school.sstBacklog}
                  </span>
                </td>
                <td className="px-3 py-2 text-sm">
                  <span className={`inline-block px-2 py-0.5 rounded ${metricColor(school.suspensionRate, 2, 5, true)}`}>
                    {school.suspensionRate}%
                  </span>
                </td>
                <td className="px-3 py-2 text-sm">
                  <span className={`inline-block px-2 py-0.5 rounded ${metricColor(school.disproportionalityIndex, 1.5, 2.0, true)}`}>
                    {school.disproportionalityIndex.toFixed(1)}
                  </span>
                </td>
                <td className="px-3 py-2 text-sm">
                  <span className={`inline-block px-2 py-0.5 rounded ${metricColor(school.iepComplianceRate, 95, 85)}`}>
                    {school.iepComplianceRate}%
                  </span>
                </td>
                <td className="px-3 py-2 text-sm">
                  <span className={`inline-block px-2 py-0.5 rounded ${metricColor(school.counselorWorkload, 25, 40, true)}`}>
                    {school.counselorWorkload}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function SummaryCard({ label, value, color }: { label: string; value: string; color?: string }) {
  const bg = color === 'green' ? 'bg-green-50 border-green-200' : color === 'red' ? 'bg-red-50 border-red-200' : color === 'amber' ? 'bg-amber-50 border-amber-200' : 'bg-white border-gray-200';
  const textColor = color === 'green' ? 'text-green-700' : color === 'red' ? 'text-red-700' : color === 'amber' ? 'text-amber-700' : 'text-gray-900';

  return (
    <div className={`rounded-lg border p-4 ${bg}`}>
      <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">{label}</p>
      <p className={`text-2xl font-bold mt-1 ${textColor}`}>{value}</p>
    </div>
  );
}
