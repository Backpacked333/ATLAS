import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../services/api';
import { StudentProfile } from '../types';
import { QuickObservationModal } from '../components/observations/QuickObservationModal';
import { AIAssistantPanel } from '../components/ai/AIAssistantPanel';

export function StudentProfilePage() {
  const { studentId } = useParams<{ studentId: string }>();
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'academic' | 'attendance' | 'accommodations' | 'observations' | 'interventions'>('academic');
  const [showObservation, setShowObservation] = useState(false);
  const [showAI, setShowAI] = useState(false);

  useEffect(() => {
    if (!studentId) return;
    api.get<StudentProfile>(`/students/${studentId}`)
      .then(setProfile)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [studentId]);

  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="flex gap-4">
          <div className="h-16 w-16 bg-gray-200 rounded-full" />
          <div className="space-y-2">
            <div className="h-6 bg-gray-200 rounded w-48" />
            <div className="h-4 bg-gray-200 rounded w-32" />
          </div>
        </div>
      </div>
    );
  }

  if (!profile) return <p className="text-gray-500">Student not found.</p>;

  const riskColor = profile.riskTier === 'NEEDS_SUPPORT' ? 'red' : profile.riskTier === 'WATCH' ? 'amber' : 'green';

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="card p-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-lg font-bold text-white shadow-lg shadow-blue-500/20">
              {profile.firstName[0]}{profile.lastName[0]}
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">
                {profile.firstName} {profile.lastName}
              </h1>
              <p className="text-sm text-gray-500">Grade {profile.gradeLevel}</p>
              <div className="flex gap-2 mt-1">
                <span className={`badge badge-${riskColor}`}>
                  {profile.riskTier === 'ON_TRACK' ? 'On Track' : profile.riskTier === 'WATCH' ? 'Watch' : 'Needs Support'}
                </span>
                {profile.ellStatus && <span className="badge badge-blue">ELL</span>}
                {profile.iepActive && <span className="badge badge-purple">IEP</span>}
                {profile.has504 && <span className="badge badge-purple">504</span>}
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setShowObservation(true)} className="btn-secondary text-sm">
              Add Observation
            </button>
            <Link to={`/referrals/new/${profile.id}`} className="btn-secondary text-sm">
              Refer to SST
            </Link>
            <button onClick={() => setShowAI(!showAI)} className="btn-ghost text-sm">
              AI Assistant
            </button>
          </div>
        </div>

        {/* Parent Contact */}
        {profile.guardians.length > 0 && (
          <div className="mt-3 pt-3 border-t border-atlas-border">
            <p className="text-xs text-gray-500 mb-1">Parent/Guardian Contact</p>
            <div className="flex gap-4 flex-wrap">
              {profile.guardians.map((g) => (
                <div key={g.id} className="text-sm">
                  <span className="font-medium">{g.firstName} {g.lastName}</span>
                  <span className="text-gray-500"> ({g.relation})</span>
                  {g.email && <span className="text-atlas-primary ml-2">{g.email}</span>}
                  {g.phone && <span className="text-gray-600 ml-2">{g.phone}</span>}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="border-b border-atlas-border">
        <nav className="flex gap-4">
          {([
            ['academic', 'Academic'],
            ['attendance', 'Attendance'],
            ['accommodations', 'Accommodations'],
            ['observations', 'Observations'],
            ['interventions', 'Interventions'],
          ] as const).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`pb-2 text-sm font-medium border-b-2 transition-colors ${
                tab === key
                  ? 'border-atlas-primary text-atlas-primary'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {label}
              {key === 'observations' && profile.observations.length > 0 && (
                <span className="ml-1 text-xs text-gray-400">({profile.observations.length})</span>
              )}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className={showAI ? 'lg:col-span-2' : 'lg:col-span-3'}>
          {tab === 'academic' && (
            <div className="space-y-4">
              {/* Per-class performance */}
              {profile.myClassPerformance.map((perf) => (
                <div key={perf.sectionName} className="card">
                  <div className="card-header flex items-center justify-between">
                    <h3 className="text-sm font-medium text-gray-900">{perf.sectionName}</h3>
                    <span className={`badge badge-${perf.currentGradePercent >= 73 ? 'green' : perf.currentGradePercent >= 60 ? 'amber' : 'red'}`}>
                      {perf.letterGrade} ({perf.currentGradePercent}%)
                    </span>
                  </div>
                  <div className="card-body">
                    <div className="flex gap-6 text-sm mb-3">
                      <div>
                        <span className="text-gray-500">Missing: </span>
                        <span className={perf.missingCount > 0 ? 'text-red-600 font-medium' : 'text-gray-700'}>{perf.missingCount}</span>
                      </div>
                    </div>
                    {/* Grade trend */}
                    <div className="flex items-end gap-1 h-12 mb-3">
                      {perf.trendData.map((point, i) => (
                        <div
                          key={i}
                          className={`flex-1 rounded-t ${point.grade >= 73 ? 'bg-green-400' : point.grade >= 60 ? 'bg-amber-400' : 'bg-red-400'}`}
                          style={{ height: `${Math.max(4, (point.grade / 100) * 48)}px` }}
                          title={`${point.week}: ${point.grade}%`}
                        />
                      ))}
                    </div>
                    {/* Recent grades */}
                    <div className="space-y-1">
                      {perf.recentGrades.map((g, i) => (
                        <div key={i} className="flex justify-between text-xs text-gray-600">
                          <span>{g.assignmentName}</span>
                          <span className={g.score / g.possible < 0.6 ? 'text-red-600 font-medium' : ''}>
                            {g.score}/{g.possible}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}

              {/* Overall snapshot */}
              <div className="card">
                <div className="card-header">
                  <h3 className="text-sm font-medium text-gray-900">Overall Academic Snapshot</h3>
                </div>
                <div className="card-body space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Cumulative GPA</span>
                    <span className="font-medium">{profile.overallAcademicSnapshot.cumulativeGpa?.toFixed(2) || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Failing courses</span>
                    <span className={`font-medium ${profile.overallAcademicSnapshot.failingCourseCount > 0 ? 'text-red-600' : ''}`}>
                      {profile.overallAcademicSnapshot.failingCourseCount}
                    </span>
                  </div>
                  {profile.overallAcademicSnapshot.totalCredits !== null && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Credits</span>
                      <span className="font-medium">
                        {profile.overallAcademicSnapshot.totalCredits} / {profile.overallAcademicSnapshot.creditsRequired || '?'}
                      </span>
                    </div>
                  )}
                  {profile.overallAcademicSnapshot.assessmentScores.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-atlas-border">
                      <p className="text-xs text-gray-500 mb-2">Assessment Scores</p>
                      {profile.overallAcademicSnapshot.assessmentScores.map((score, i) => (
                        <div key={i} className="flex justify-between text-xs text-gray-600">
                          <span>{score.name} ({score.subject})</span>
                          <span className="font-medium">
                            {score.score}{score.percentile ? ` (${score.percentile}th pct)` : ''}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {tab === 'attendance' && (
            <div className="card">
              <div className="card-header">
                <h3 className="text-sm font-medium text-gray-900">Attendance</h3>
              </div>
              <div className="card-body space-y-3">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <p className="text-xs text-gray-500">Overall Rate</p>
                    <p className={`text-xl font-bold ${profile.attendance.overallRate >= 95 ? 'text-green-600' : profile.attendance.overallRate >= 90 ? 'text-amber-600' : 'text-red-600'}`}>
                      {profile.attendance.overallRate}%
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Absent This Month</p>
                    <p className="text-xl font-bold text-gray-900">{profile.attendance.daysAbsentThisMonth}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Consecutive Absences</p>
                    <p className={`text-xl font-bold ${profile.attendance.consecutiveAbsenceStreak >= 3 ? 'text-red-600' : 'text-gray-900'}`}>
                      {profile.attendance.consecutiveAbsenceStreak}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Tardies</p>
                    <p className="text-xl font-bold text-gray-900">{profile.attendance.tardyCount}</p>
                  </div>
                </div>

                {profile.attendance.periodRates.length > 0 && (
                  <div className="pt-3 border-t border-atlas-border">
                    <p className="text-xs text-gray-500 mb-2">Per-Period Attendance</p>
                    {profile.attendance.periodRates.map((pr) => (
                      <div key={pr.period} className="flex justify-between text-sm">
                        <span className="text-gray-600">{pr.period}</span>
                        <span className={`font-medium ${pr.rate >= 95 ? 'text-green-600' : pr.rate >= 90 ? 'text-amber-600' : 'text-red-600'}`}>
                          {pr.rate}%
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {tab === 'accommodations' && (
            <div className="card">
              <div className="card-header">
                <h3 className="text-sm font-medium text-gray-900">Accommodations</h3>
              </div>
              <div className="card-body">
                {profile.accommodations.length > 0 ? (
                  <div className="space-y-3">
                    {profile.accommodations.map((acc, i) => (
                      <div key={i} className="flex items-start gap-3 p-3 bg-purple-50 rounded-lg">
                        <span className="badge badge-purple">{acc.type}</span>
                        <div>
                          <p className="text-sm text-gray-900">{acc.description}</p>
                          <p className="text-xs text-gray-500 mt-1">Category: {acc.category}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500 text-center py-4">No active accommodations.</p>
                )}
              </div>
            </div>
          )}

          {tab === 'observations' && (
            <div className="space-y-3">
              <button onClick={() => setShowObservation(true)} className="btn-primary text-sm">
                Add Observation
              </button>
              {profile.observations.length > 0 ? (
                profile.observations.map((obs) => (
                  <div
                    key={obs.id}
                    className={`card p-4 severity-bar-${obs.severity === 'URGENT' ? 'red' : obs.severity === 'CONCERN' ? 'amber' : 'green'}`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`badge badge-${obs.severity === 'POSITIVE' ? 'green' : obs.severity === 'CONCERN' ? 'amber' : 'red'}`}>
                        {obs.severity}
                      </span>
                      <span className="badge badge-gray">{obs.category}</span>
                      <span className="text-xs text-gray-500 ml-auto">
                        {new Date(obs.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-sm text-gray-700">{obs.content}</p>
                    {obs.isEditable && (
                      <p className="text-xs text-gray-400 mt-1">Editable for 24 hours</p>
                    )}
                  </div>
                ))
              ) : (
                <p className="text-sm text-gray-500 text-center py-4">No observations logged yet.</p>
              )}
            </div>
          )}

          {tab === 'interventions' && (
            <div className="space-y-3">
              {profile.activeInterventions.length > 0 ? (
                profile.activeInterventions.map((intervention) => (
                  <div key={intervention.id} className="card p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="badge badge-blue">{intervention.tier}</span>
                      <h4 className="text-sm font-medium text-gray-900">{intervention.type}</h4>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{intervention.description}</p>
                    {intervention.teacherRole && (
                      <div className="bg-blue-50 rounded p-2 text-sm text-blue-800 mb-2">
                        <strong>Your role:</strong> {intervention.teacherRole}
                      </div>
                    )}
                    {intervention.logs.length > 0 && (
                      <div className="space-y-1">
                        <p className="text-xs text-gray-500">Recent logs:</p>
                        {intervention.logs.map((log, i) => (
                          <div key={i} className="flex justify-between text-xs text-gray-600">
                            <span>{log.date}</span>
                            <span className={`badge badge-${log.status === 'COMPLETED' ? 'green' : log.status === 'PARTIALLY_COMPLETED' ? 'amber' : 'red'} text-xs`}>
                              {log.status.replace(/_/g, ' ')}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <p className="text-sm text-gray-500 text-center py-4">No active interventions.</p>
              )}
            </div>
          )}
        </div>

        {showAI && (
          <div className="lg:col-span-1">
            <AIAssistantPanel
              studentId={profile.id}
              studentName={`${profile.firstName} ${profile.lastName}`}
              onClose={() => setShowAI(false)}
            />
          </div>
        )}
      </div>

      {showObservation && (
        <QuickObservationModal
          studentId={profile.id}
          studentName={`${profile.firstName} ${profile.lastName}`}
          onClose={() => setShowObservation(false)}
          onSaved={() => {
            setShowObservation(false);
            // Refresh profile
            if (studentId) {
              api.get<StudentProfile>(`/students/${studentId}`).then(setProfile);
            }
          }}
        />
      )}
    </div>
  );
}
