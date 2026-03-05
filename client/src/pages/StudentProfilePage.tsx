import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../services/api';
import { EnhancedStudentProfile } from '../types';
import { QuickObservationModal } from '../components/observations/QuickObservationModal';
import { AIAssistantPanel } from '../components/ai/AIAssistantPanel';
import { Avatar } from '../components/ui/Avatar';
import { RiskBadge } from '../components/ui/RiskBadge';
import { MetricCard } from '../components/ui/MetricCard';
import { ProgressRing } from '../components/ui/ProgressRing';
import { NarrativeSummary } from '../components/student/NarrativeSummary';
import { RecommendedActions } from '../components/student/RecommendedActions';
import { AttendanceCalendar } from '../components/student/AttendanceCalendar';
import { Skeleton } from '../components/ui/SkeletonLoader';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine,
} from 'recharts';
import {
  PencilSquareIcon,
  ArrowTopRightOnSquareIcon,
  ChatBubbleLeftRightIcon,
  PhoneIcon,
} from '@heroicons/react/24/outline';

export function StudentProfilePage() {
  const { studentId } = useParams<{ studentId: string }>();
  const [profile, setProfile] = useState<EnhancedStudentProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [showObservation, setShowObservation] = useState(false);
  const [showAI, setShowAI] = useState(false);

  useEffect(() => {
    if (!studentId) return;
    api.get<EnhancedStudentProfile>(`/students/${studentId}/enhanced`)
      .then(setProfile)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [studentId]);

  if (loading) {
    return (
      <div className="space-y-6 max-w-5xl animate-fade-in">
        <div className="card p-6">
          <div className="flex gap-4">
            <Skeleton className="h-20 w-20 rounded-full" />
            <div className="space-y-2 flex-1">
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-6 w-24" />
            </div>
          </div>
        </div>
        <Skeleton className="h-16 w-full rounded-card" />
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-24 rounded-card" />)}
        </div>
      </div>
    );
  }

  if (!profile) return <p className="text-atlas-text-secondary">Student not found.</p>;

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Hero Header */}
      <div className="card p-6">
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <Avatar
              firstName={profile.firstName}
              lastName={profile.lastName}
              photoUrl={profile.photoUrl}
              size="xl"
              riskTier={profile.riskTier}
            />
            <div>
              <h1 className="text-headline text-atlas-text-primary">
                {profile.firstName} {profile.lastName}
              </h1>
              <p className="text-sm text-atlas-text-secondary">Grade {profile.gradeLevel}</p>
              <div className="flex flex-wrap gap-2 mt-2">
                <RiskBadge tier={profile.riskTier} />
                {profile.ellStatus && <span className="badge badge-sky">ELL</span>}
                {profile.iepActive && <span className="badge badge-violet">IEP</span>}
                {profile.has504 && <span className="badge badge-violet">504</span>}
              </div>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <button onClick={() => setShowObservation(true)} className="btn-primary text-sm">
              <PencilSquareIcon className="h-4 w-4 mr-1.5" />
              Observation
            </button>
            <Link to={`/referrals/new/${profile.id}`} className="btn-secondary text-sm">
              <ArrowTopRightOnSquareIcon className="h-4 w-4 mr-1.5" />
              Refer to SST
            </Link>
            <button onClick={() => setShowAI(!showAI)} className="btn-ghost text-sm">
              <ChatBubbleLeftRightIcon className="h-4 w-4 mr-1.5" />
              AI Assistant
            </button>
          </div>
        </div>

        {profile.guardians.length > 0 && (
          <div className="mt-4 pt-4 border-t border-atlas-border">
            <p className="text-xs font-medium text-atlas-text-tertiary uppercase tracking-wider mb-2">Parent/Guardian</p>
            <div className="flex flex-wrap gap-4">
              {profile.guardians.map((g) => (
                <div key={g.id} className="flex items-center gap-2 text-sm">
                  <PhoneIcon className="h-4 w-4 text-atlas-text-tertiary" />
                  <span className="font-medium">{g.firstName} {g.lastName}</span>
                  <span className="text-atlas-text-tertiary">({g.relation})</span>
                  {g.email && <a href={`mailto:${g.email}`} className="text-atlas-indigo-600 hover:underline">{g.email}</a>}
                  {g.phone && <span className="text-atlas-text-secondary">{g.phone}</span>}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className={`grid gap-6 ${showAI ? 'grid-cols-1 lg:grid-cols-3' : 'grid-cols-1'}`}>
        <div className={showAI ? 'lg:col-span-2 space-y-6' : 'space-y-6'}>
          {/* Narrative Summary */}
          {profile.narrativeSummary && (
            <NarrativeSummary summary={profile.narrativeSummary} trajectory={profile.riskAnalysis.trajectory} />
          )}

          {/* Recommended Actions */}
          <RecommendedActions actions={profile.recommendedActions} studentId={profile.id} />

          {/* Metrics Row */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            <MetricCard label="GPA" value={profile.overallAcademicSnapshot.cumulativeGpa?.toFixed(2) || 'N/A'} />
            <MetricCard label="Attendance" value={`${profile.attendance.overallRate}%`} variant={profile.attendance.overallRate < 90 ? 'danger' : 'success'}>
              <ProgressRing value={profile.attendance.overallRate} size={32} showValue={false} />
            </MetricCard>
            <MetricCard label="Missing Work" value={profile.myClassPerformance.reduce((sum, c) => sum + c.missingCount, 0)} variant="warning" />
            <MetricCard label="Interventions" value={profile.activeInterventions.length} />
            <MetricCard label="Failing" value={profile.overallAcademicSnapshot.failingCourseCount} variant={profile.overallAcademicSnapshot.failingCourseCount > 0 ? 'danger' : 'success'} />
          </div>

          {/* Academic Performance */}
          <div>
            <h2 className="section-title">Academic Performance</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {profile.myClassPerformance.map((perf) => {
                const trajectory = profile.gradeTrajectory.find((t) => t.sectionName === perf.sectionName);
                const comparison = profile.classComparison.find((c) => c.sectionName === perf.sectionName);

                return (
                  <div key={perf.sectionName} className="card">
                    <div className="card-header flex items-center justify-between">
                      <h3 className="text-sm font-semibold text-atlas-text-primary">{perf.sectionName}</h3>
                      <span className={`badge ${perf.currentGradePercent >= 73 ? 'badge-emerald' : perf.currentGradePercent >= 60 ? 'badge-amber' : 'badge-rose'}`}>
                        {perf.letterGrade} ({perf.currentGradePercent}%)
                      </span>
                    </div>
                    <div className="card-body space-y-3">
                      <ResponsiveContainer width="100%" height={100}>
                        <AreaChart data={perf.trendData}>
                          <defs>
                            <linearGradient id={`g-${perf.sectionName.replace(/[^a-zA-Z]/g, '')}`} x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor="#4f46e5" stopOpacity={0.2} />
                              <stop offset="100%" stopColor="#4f46e5" stopOpacity={0} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                          <XAxis dataKey="week" tick={{ fontSize: 9 }} tickFormatter={(v) => v.slice(5)} />
                          <YAxis domain={[0, 100]} tick={{ fontSize: 9 }} />
                          <Tooltip formatter={(v: any) => [`${v}%`, 'Grade']} />
                          <ReferenceLine y={73} stroke="#d97706" strokeDasharray="4 4" />
                          <Area type="monotone" dataKey="grade" stroke="#4f46e5" strokeWidth={2} fill={`url(#g-${perf.sectionName.replace(/[^a-zA-Z]/g, '')})`} />
                        </AreaChart>
                      </ResponsiveContainer>

                      <div className="flex items-center gap-3 text-xs text-atlas-text-tertiary">
                        {comparison && (
                          <>
                            <span>Class avg: <strong className="text-atlas-text-secondary">{comparison.classAverage}%</strong></span>
                            <span>Rank: <strong className="text-atlas-text-secondary">Top {Math.max(1, 100 - comparison.percentile)}%</strong></span>
                          </>
                        )}
                        {trajectory && (
                          <span>Projected: <strong className="text-atlas-text-secondary">{trajectory.projectedEndOfTerm}%</strong></span>
                        )}
                      </div>

                      {perf.missingCount > 0 && (
                        <p className="text-xs text-atlas-rose-600 font-medium">{perf.missingCount} missing</p>
                      )}

                      <div className="space-y-1">
                        {perf.recentGrades.slice(0, 3).map((g, i) => (
                          <div key={i} className="flex justify-between text-xs text-atlas-text-secondary">
                            <span className="truncate mr-2">{g.assignmentName}</span>
                            <span className={`font-medium ${g.score / g.possible < 0.6 ? 'text-atlas-rose-600' : ''}`}>
                              {g.score}/{g.possible}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Attendance */}
          <div>
            <h2 className="section-title">Attendance</h2>
            <div className="card">
              <div className="card-body space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <p className="text-xs text-atlas-text-tertiary">Overall Rate</p>
                    <p className={`text-2xl font-bold ${profile.attendance.overallRate >= 95 ? 'text-atlas-emerald-600' : profile.attendance.overallRate >= 90 ? 'text-atlas-amber-600' : 'text-atlas-rose-600'}`}>
                      {profile.attendance.overallRate}%
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-atlas-text-tertiary">Absent This Month</p>
                    <p className="text-2xl font-bold text-atlas-text-primary">{profile.attendance.daysAbsentThisMonth}</p>
                  </div>
                  <div>
                    <p className="text-xs text-atlas-text-tertiary">Consecutive</p>
                    <p className={`text-2xl font-bold ${profile.attendance.consecutiveAbsenceStreak >= 3 ? 'text-atlas-rose-600' : 'text-atlas-text-primary'}`}>
                      {profile.attendance.consecutiveAbsenceStreak}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-atlas-text-tertiary">Tardies</p>
                    <p className="text-2xl font-bold text-atlas-text-primary">{profile.attendance.tardyCount}</p>
                  </div>
                </div>

                {profile.attendanceCalendar.length > 0 && (
                  <div className="pt-4 border-t border-atlas-border">
                    <p className="text-xs font-medium text-atlas-text-tertiary mb-2">Last 90 Days</p>
                    <AttendanceCalendar data={profile.attendanceCalendar} />
                  </div>
                )}

                {profile.attendance.periodRates.length > 0 && (
                  <div className="pt-4 border-t border-atlas-border">
                    <p className="text-xs font-medium text-atlas-text-tertiary mb-2">Per-Period</p>
                    <div className="flex flex-wrap gap-4">
                      {profile.attendance.periodRates.map((pr) => (
                        <ProgressRing key={pr.period} value={pr.rate} size={48} strokeWidth={4} label={pr.period} />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Support & Interventions */}
          {(profile.accommodations.length > 0 || profile.activeInterventions.length > 0) && (
            <div>
              <h2 className="section-title">Support & Interventions</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {profile.accommodations.length > 0 && (
                  <div className="card">
                    <div className="card-header"><h3 className="text-sm font-semibold">Accommodations</h3></div>
                    <div className="card-body space-y-2">
                      {profile.accommodations.map((acc, i) => (
                        <div key={i} className="flex items-start gap-2 p-2 bg-atlas-violet-50 rounded-lg">
                          <span className="badge badge-violet text-[10px]">{acc.type}</span>
                          <div>
                            <p className="text-sm">{acc.description}</p>
                            <p className="text-xs text-atlas-text-tertiary">{acc.category}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {profile.activeInterventions.length > 0 && (
                  <div className="card">
                    <div className="card-header"><h3 className="text-sm font-semibold">Active Interventions</h3></div>
                    <div className="card-body space-y-3">
                      {profile.activeInterventions.map((int) => (
                        <div key={int.id} className="p-3 border border-atlas-border rounded-lg">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="badge badge-sky">{int.tier}</span>
                            <h4 className="text-sm font-medium">{int.type}</h4>
                          </div>
                          <p className="text-xs text-atlas-text-secondary">{int.description}</p>
                          {int.teacherRole && (
                            <p className="text-xs bg-atlas-sky-50 text-atlas-sky-800 p-2 rounded mt-2">
                              <strong>Your role:</strong> {int.teacherRole}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Observations */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="section-title mb-0">Observations</h2>
              <button onClick={() => setShowObservation(true)} className="btn-primary text-sm">Add Observation</button>
            </div>
            {profile.observations.length > 0 ? (
              <div className="space-y-2">
                {profile.observations.map((obs) => (
                  <div key={obs.id} className={`card p-4 border-l-4 ${obs.severity === 'URGENT' ? 'border-l-atlas-rose-500' : obs.severity === 'CONCERN' ? 'border-l-atlas-amber-500' : 'border-l-atlas-emerald-500'}`}>
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`badge ${obs.severity === 'POSITIVE' ? 'badge-emerald' : obs.severity === 'CONCERN' ? 'badge-amber' : 'badge-rose'}`}>{obs.severity}</span>
                      <span className="badge badge-gray">{obs.category}</span>
                      <span className="text-xs text-atlas-text-tertiary ml-auto">{new Date(obs.createdAt).toLocaleDateString()}</span>
                    </div>
                    <p className="text-sm text-atlas-text-secondary mt-1">{obs.content}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="card p-8 text-center">
                <p className="text-sm text-atlas-text-tertiary">No observations logged yet.</p>
              </div>
            )}
          </div>

          {/* Assessment Scores */}
          {profile.overallAcademicSnapshot.assessmentScores.length > 0 && (
            <div>
              <h2 className="section-title">Assessment Scores</h2>
              <div className="card">
                <div className="card-body space-y-2">
                  {profile.overallAcademicSnapshot.assessmentScores.map((score, i) => (
                    <div key={i} className="flex items-center justify-between py-2 border-b border-atlas-border last:border-0">
                      <div>
                        <p className="text-sm font-medium">{score.name}</p>
                        <p className="text-xs text-atlas-text-tertiary">{score.subject} · {score.date}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold">{score.score}</p>
                        {score.percentile && <p className="text-xs text-atlas-text-tertiary">{score.percentile}th pct</p>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
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
            if (studentId) {
              api.get<EnhancedStudentProfile>(`/students/${studentId}/enhanced`).then(setProfile);
            }
          }}
        />
      )}
    </div>
  );
}
