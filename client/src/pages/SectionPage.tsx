import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../services/api';
import { SectionSummary, SeatInfo, SmartGroup, SubstituteBrief } from '../types';

export function SectionPage() {
  const { sectionId } = useParams<{ sectionId: string }>();
  const [section, setSection] = useState<SectionSummary | null>(null);
  const [seats, setSeats] = useState<SeatInfo[]>([]);
  const [groups, setGroups] = useState<SmartGroup[]>([]);
  const [subBrief, setSubBrief] = useState<SubstituteBrief | null>(null);
  const [tab, setTab] = useState<'overview' | 'assignments' | 'seating' | 'grouping' | 'substitute'>('overview');
  const [loading, setLoading] = useState(true);
  const [groupsError, setGroupsError] = useState<string | null>(null);
  const [subBriefError, setSubBriefError] = useState<string | null>(null);

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
        <nav className="flex gap-4 overflow-x-auto">
          {([
            ['overview', 'Overview'],
            ['assignments', 'Assignments'],
            ['grouping', 'Smart Groups'],
            ['seating', 'Seating Chart'],
            ['substitute', 'Sub Brief'],
          ] as const).map(([t, label]) => (
            <button
              key={t}
              onClick={() => {
                setTab(t);
                if (t === 'grouping' && groups.length === 0 && sectionId) {
                  setGroupsError(null);
                  api.get<SmartGroup[]>(`/sections/${sectionId}/groups`)
                    .then(setGroups)
                    .catch((error) => {
                      setGroupsError(error instanceof Error ? error.message : 'Failed to load smart groups');
                    });
                }
                if (t === 'substitute' && !subBrief && sectionId) {
                  setSubBriefError(null);
                  api.get<SubstituteBrief>(`/substitute/${sectionId}`)
                    .then(setSubBrief)
                    .catch((error) => {
                      setSubBriefError(error instanceof Error ? error.message : 'Failed to load substitute brief');
                    });
                }
              }}
              className={`pb-2 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                tab === t
                  ? 'border-atlas-primary text-atlas-primary'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {label}
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

      {tab === 'grouping' && (
        <div className="space-y-4">
          {groupsError && (
            <div className="card p-4 bg-red-50 border-red-200">
              <p className="text-sm text-red-700">{groupsError}</p>
            </div>
          )}
          {groups.length === 0 && !groupsError ? (
            <div className="card p-8 text-center">
              <p className="text-gray-500">Not enough assignment data to generate groups yet.</p>
            </div>
          ) : (
            <>
              <div className="card p-3 bg-blue-50 border-blue-200">
                <p className="text-xs text-blue-700">
                  These groupings are based on recent assignment performance. They are private to you
                  and regenerated daily as new data comes in.
                </p>
              </div>
              {groups.map((group) => (
                <div key={group.label} className="card">
                  <div className="card-header">
                    <h3 className="text-sm font-medium text-gray-900">{group.label}</h3>
                  </div>
                  <div className="card-body">
                    <p className="text-sm text-gray-600 mb-3">{group.recommendation}</p>
                    <div className="flex flex-wrap gap-2">
                      {group.students.map((s) => (
                        <Link
                          key={s.studentId}
                          to={`/students/${s.studentId}`}
                          className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 rounded-lg hover:bg-blue-50 text-sm"
                        >
                          <span className="font-medium">{s.firstName} {s.lastName}</span>
                          <span className={`text-xs ${s.avgScore < 50 ? 'text-red-500' : s.avgScore < 75 ? 'text-amber-500' : 'text-green-500'}`}>
                            {s.avgScore}%
                          </span>
                        </Link>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </>
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
                      ? seat.student.riskTier === 'NEEDS_SUPPORT'
                        ? 'border-red-300 bg-red-50'
                        : seat.student.riskTier === 'WATCH'
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

      {tab === 'substitute' && (
        <div className="space-y-4">
          {subBriefError && (
            <div className="card p-4 bg-red-50 border-red-200">
              <p className="text-sm text-red-700">{subBriefError}</p>
            </div>
          )}
          {!subBrief && !subBriefError ? (
            <div className="card p-8 text-center">
              <p className="text-gray-500">Loading substitute brief...</p>
            </div>
          ) : !subBrief && subBriefError ? null : subBrief ? (
            <>
              <div className="card p-3 bg-amber-50 border-amber-200">
                <p className="text-xs text-amber-700">
                  This brief contains only the operational minimum a substitute needs.
                  No grades, risk scores, attendance data, or parent information is included.
                </p>
              </div>
              <div className="card">
                <div className="card-header flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-medium text-gray-900">
                      {subBrief.section.courseName} — {subBrief.section.period}
                    </h3>
                    {subBrief.section.room && (
                      <p className="text-xs text-gray-500">Room {subBrief.section.room}</p>
                    )}
                  </div>
                  <button
                    onClick={() => window.print()}
                    className="btn-secondary text-xs"
                  >
                    Print
                  </button>
                </div>
                <div className="card-body">
                  <table className="min-w-full text-sm">
                    <thead>
                      <tr className="text-xs text-gray-500 uppercase">
                        <th className="text-left py-2">Student</th>
                        <th className="text-left py-2">Seat</th>
                        <th className="text-left py-2">Accommodations</th>
                        <th className="text-left py-2">Interventions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {subBrief.students.map((s, i) => (
                        <tr key={i}>
                          <td className="py-2 font-medium text-gray-900">
                            {s.firstName} {s.lastName}
                          </td>
                          <td className="py-2 text-gray-600">{s.seatLabel || '--'}</td>
                          <td className="py-2">
                            {s.accommodationNotes ? (
                              <span className="text-purple-700 text-xs">{s.accommodationNotes}</span>
                            ) : (
                              <span className="text-gray-300">--</span>
                            )}
                          </td>
                          <td className="py-2">
                            {s.interventionNotes ? (
                              <span className="text-blue-700 text-xs">{s.interventionNotes}</span>
                            ) : (
                              <span className="text-gray-300">--</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          ) : (
            <div className="card p-8 text-center">
              <p className="text-gray-500">Unable to load substitute brief.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
