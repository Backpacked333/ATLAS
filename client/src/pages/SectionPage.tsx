import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../services/api';
import { SectionSummary, SeatInfo } from '../types';

export function SectionPage() {
  const { sectionId } = useParams<{ sectionId: string }>();
  const [section, setSection] = useState<SectionSummary | null>(null);
  const [seats, setSeats] = useState<SeatInfo[]>([]);
  const [tab, setTab] = useState<'overview' | 'assignments' | 'seating'>('overview');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!sectionId) return;

    Promise.all([
      api.get<SectionSummary>(`/sections/${sectionId}`),
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
      <div className="space-y-4">
        <div className="h-6 w-48 bg-gray-200 rounded animate-pulse" />
        <div className="grid grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="card p-4 animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-2/3 mb-2" />
              <div className="h-8 bg-gray-200 rounded w-1/2" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!section) return <p className="text-gray-500">Section not found.</p>;

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          {section.courseName} — {section.period}
        </h1>
        <p className="text-sm text-gray-500">{section.studentCount} students</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="card p-4">
          <p className="text-xs text-gray-500 uppercase">Class Average</p>
          <p className="text-2xl font-bold text-gray-900">{section.classAverageGrade}%</p>
        </div>
        <div className="card p-4">
          <p className="text-xs text-gray-500 uppercase">Attendance</p>
          <p className="text-2xl font-bold text-gray-900">{section.classAverageAttendance}%</p>
        </div>
        <div className="card p-4">
          <p className="text-xs text-gray-500 uppercase">Failing</p>
          <p className={`text-2xl font-bold ${section.failingCount > 0 ? 'text-red-600' : 'text-gray-900'}`}>
            {section.failingCount}
          </p>
        </div>
        <div className="card p-4">
          <p className="text-xs text-gray-500 uppercase">Missing Work</p>
          <p className={`text-2xl font-bold ${section.missingWorkCount > 0 ? 'text-amber-600' : 'text-gray-900'}`}>
            {section.missingWorkCount}
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-atlas-border">
        <nav className="flex gap-4">
          {(['overview', 'assignments', 'seating'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`pb-2 text-sm font-medium border-b-2 transition-colors ${
                tab === t
                  ? 'border-atlas-primary text-atlas-primary'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {t === 'overview' ? 'Overview' : t === 'assignments' ? 'Assignments' : 'Seating Chart'}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      {tab === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Grade Distribution */}
          <div className="card">
            <div className="card-header">
              <h3 className="text-sm font-medium text-gray-900">Grade Distribution</h3>
            </div>
            <div className="card-body">
              <div className="space-y-2">
                {section.gradeDistribution.map((gd) => (
                  <div key={gd.letter} className="flex items-center gap-3">
                    <span className="w-4 text-sm font-medium text-gray-700">{gd.letter}</span>
                    <div className="flex-1 bg-gray-100 rounded-full h-5">
                      <div
                        className={`h-5 rounded-full ${
                          gd.letter === 'A' || gd.letter === 'B'
                            ? 'bg-green-500'
                            : gd.letter === 'C'
                            ? 'bg-amber-500'
                            : 'bg-red-500'
                        }`}
                        style={{
                          width: `${section.studentCount > 0 ? (gd.count / section.studentCount) * 100 : 0}%`,
                        }}
                      />
                    </div>
                    <span className="w-8 text-sm text-gray-500 text-right">{gd.count}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Accommodation Summary */}
          <div className="card">
            <div className="card-header">
              <h3 className="text-sm font-medium text-gray-900">Section Quick Stats</h3>
            </div>
            <div className="card-body space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Students on track</span>
                <span className="font-medium text-green-600">
                  {section.studentCount - section.failingCount}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Students failing</span>
                <span className="font-medium text-red-600">{section.failingCount}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Total missing assignments</span>
                <span className="font-medium text-amber-600">{section.missingWorkCount}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {tab === 'assignments' && (
        <div className="space-y-3">
          {section.recentAssignments.map((assignment) => (
            <div key={assignment.id} className="card p-4">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-sm font-medium text-gray-900">{assignment.name}</h4>
                <span className="text-xs text-gray-500">Due: {assignment.dueDate}</span>
              </div>
              <div className="flex gap-6 text-sm">
                <div>
                  <span className="text-gray-500">Avg: </span>
                  <span className="font-medium">{assignment.classAverage}%</span>
                </div>
                <div>
                  <span className="text-gray-500">Completion: </span>
                  <span className="font-medium">{assignment.completionRate}%</span>
                </div>
                {assignment.outliers.length > 0 && (
                  <div>
                    <span className="text-gray-500">Below avg: </span>
                    <span className="font-medium text-red-600">{assignment.outliers.length} students</span>
                  </div>
                )}
              </div>
              {assignment.outliers.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1">
                  {assignment.outliers.map((o) => (
                    <Link
                      key={o.studentId}
                      to={`/students/${o.studentId}`}
                      className="badge badge-red text-xs hover:underline"
                    >
                      {o.firstName} {o.lastName} ({o.score}%)
                    </Link>
                  ))}
                </div>
              )}
            </div>
          ))}
          {section.recentAssignments.length === 0 && (
            <p className="text-gray-500 text-sm py-8 text-center">No assignments yet.</p>
          )}
        </div>
      )}

      {tab === 'seating' && (
        <div className="card p-6">
          {seats.length > 0 ? (
            <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${Math.max(...seats.map(s => s.col)) + 1}, 1fr)` }}>
              {seats.map((seat) => (
                <div
                  key={`${seat.row}-${seat.col}`}
                  className={`p-3 rounded-lg border-2 text-center text-xs ${
                    seat.student
                      ? seat.student.riskTier === 'URGENT'
                        ? 'border-red-300 bg-red-50'
                        : seat.student.riskTier === 'NEEDS_SUPPORT'
                        ? 'border-amber-300 bg-amber-50'
                        : 'border-green-300 bg-green-50'
                      : 'border-gray-200 bg-gray-50'
                  }`}
                >
                  {seat.student ? (
                    <Link to={`/students/${seat.student.id}`} className="hover:underline">
                      {seat.student.firstName} {seat.student.lastName[0]}.
                    </Link>
                  ) : (
                    <span className="text-gray-400">Empty</span>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-sm text-center py-8">
              No seating chart configured for this section.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
