import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { CreateReferralInput, ConcernType, ReferralUrgency } from '../types';

interface PrePopulatedData {
  student: {
    id: string;
    firstName: string;
    lastName: string;
    studentIdNo: string;
    gradeLevel: number;
    ellStatus: boolean;
    iepActive: boolean;
    has504: boolean;
    cumulativeGpa: number | null;
  };
  sectionGrades: { sectionName: string; gradePercent: number }[];
  overallAttendanceRate: number;
  missingAssignmentCount: number;
  failingCourseCount: number;
  assessmentScores: { name: string; subject: string; score: number; date: string }[];
}

const STRATEGIES = [
  'Modified seating',
  'Parent contact',
  'Extra tutoring',
  'Modified assignments',
  'Behavior contract',
  'One-on-one check-ins',
  'Peer mentoring',
  'Other',
];

export function ReferralPage() {
  const { studentId } = useParams<{ studentId: string }>();
  const navigate = useNavigate();
  const [prePopData, setPrePopData] = useState<PrePopulatedData | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const [primaryConcern, setPrimaryConcern] = useState<ConcernType>('ACADEMIC');
  const [narrative, setNarrative] = useState('');
  const [selectedStrategies, setSelectedStrategies] = useState<{ strategy: string; date: string }[]>([]);
  const [urgency, setUrgency] = useState<ReferralUrgency>('STANDARD');

  useEffect(() => {
    if (!studentId) return;
    api.get<PrePopulatedData>(`/referrals/prepopulate/${studentId}`)
      .then(setPrePopData)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [studentId]);

  function toggleStrategy(strategy: string) {
    setSelectedStrategies((prev) => {
      const exists = prev.find((s) => s.strategy === strategy);
      if (exists) {
        return prev.filter((s) => s.strategy !== strategy);
      }
      return [...prev, { strategy, date: new Date().toISOString().split('T')[0] }];
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!studentId) return;

    setError('');
    setSubmitting(true);

    try {
      const input: CreateReferralInput = {
        studentId,
        primaryConcern,
        narrative,
        strategiesAttempted: selectedStrategies,
        urgency,
      };

      await api.post('/referrals', input);
      navigate(`/students/${studentId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit referral');
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto space-y-4 animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-1/2" />
        <div className="card p-4 space-y-3">
          <div className="h-4 bg-gray-200 rounded" />
          <div className="h-4 bg-gray-200 rounded w-2/3" />
        </div>
      </div>
    );
  }

  if (!prePopData) return <p className="text-gray-500">Student data not available.</p>;

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <h1 className="text-2xl font-bold text-gray-900">SST Referral</h1>
      <p className="text-sm text-gray-500">
        Refer {prePopData.student.firstName} {prePopData.student.lastName} for Student Study Team review.
        The form below is pre-populated with available data.
      </p>

      {/* Auto-populated section */}
      <div className="card">
        <div className="card-header">
          <h2 className="text-sm font-medium text-gray-900">Student Information (Auto-Populated)</h2>
        </div>
        <div className="card-body space-y-2 text-sm">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <span className="text-gray-500">Student: </span>
              <span className="font-medium">{prePopData.student.firstName} {prePopData.student.lastName}</span>
            </div>
            <div>
              <span className="text-gray-500">ID: </span>
              <span className="font-medium">{prePopData.student.studentIdNo}</span>
            </div>
            <div>
              <span className="text-gray-500">Grade: </span>
              <span className="font-medium">{prePopData.student.gradeLevel}</span>
            </div>
            <div>
              <span className="text-gray-500">GPA: </span>
              <span className="font-medium">{prePopData.student.cumulativeGpa?.toFixed(2) || 'N/A'}</span>
            </div>
            <div>
              <span className="text-gray-500">Attendance: </span>
              <span className="font-medium">{prePopData.overallAttendanceRate}%</span>
            </div>
            <div>
              <span className="text-gray-500">Missing Work: </span>
              <span className="font-medium">{prePopData.missingAssignmentCount}</span>
            </div>
          </div>

          <div className="flex gap-2 mt-2">
            {prePopData.student.ellStatus && <span className="badge badge-blue">ELL</span>}
            {prePopData.student.iepActive && <span className="badge badge-purple">IEP Active</span>}
            {prePopData.student.has504 && <span className="badge badge-purple">504</span>}
          </div>

          {prePopData.sectionGrades.length > 0 && (
            <div className="mt-2 pt-2 border-t border-atlas-border">
              <p className="text-xs text-gray-500 mb-1">Grades in Your Courses</p>
              {prePopData.sectionGrades.map((sg) => (
                <div key={sg.sectionName} className="flex justify-between">
                  <span className="text-gray-600">{sg.sectionName}</span>
                  <span className={`font-medium ${sg.gradePercent < 60 ? 'text-red-600' : ''}`}>{sg.gradePercent}%</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Teacher input section */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="card">
          <div className="card-header">
            <h2 className="text-sm font-medium text-gray-900">Your Input</h2>
          </div>
          <div className="card-body space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Primary Concern</label>
              <select
                value={primaryConcern}
                onChange={(e) => setPrimaryConcern(e.target.value as ConcernType)}
                className="input"
              >
                <option value="ACADEMIC">Academic</option>
                <option value="BEHAVIORAL">Behavioral</option>
                <option value="ATTENDANCE">Attendance</option>
                <option value="SOCIAL_EMOTIONAL">Social-Emotional</option>
                <option value="OTHER">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                What specifically are you seeing? (2-3 sentences minimum)
              </label>
              <textarea
                value={narrative}
                onChange={(e) => setNarrative(e.target.value)}
                className="input min-h-[100px]"
                placeholder="Describe the specific behaviors, patterns, or concerns you've observed..."
                maxLength={3000}
                required
              />
              <p className="text-xs text-gray-400 mt-1">{narrative.length}/3000 characters</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Strategies Already Attempted
              </label>
              <div className="grid grid-cols-2 gap-2">
                {STRATEGIES.map((strategy) => {
                  const selected = selectedStrategies.some((s) => s.strategy === strategy);
                  return (
                    <button
                      key={strategy}
                      type="button"
                      onClick={() => toggleStrategy(strategy)}
                      className={`text-left px-3 py-2 rounded-md text-sm border transition-colors ${
                        selected
                          ? 'border-atlas-primary bg-blue-50 text-atlas-primary'
                          : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      {selected ? '\u2713 ' : ''}{strategy}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Urgency</label>
              <div className="flex gap-3">
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="urgency"
                    value="STANDARD"
                    checked={urgency === 'STANDARD'}
                    onChange={() => setUrgency('STANDARD')}
                  />
                  <span className="text-sm">Standard (review within 5 school days)</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="urgency"
                    value="URGENT"
                    checked={urgency === 'URGENT'}
                    onChange={() => setUrgency('URGENT')}
                  />
                  <span className="text-sm text-red-600">Urgent (review within 24 hours)</span>
                </label>
              </div>
            </div>
          </div>
        </div>

        {error && <p className="text-sm text-atlas-danger">{error}</p>}

        <div className="flex gap-3 justify-end">
          <button type="button" onClick={() => navigate(-1)} className="btn-secondary">
            Cancel
          </button>
          <button type="submit" disabled={submitting || narrative.length < 20} className="btn-primary">
            {submitting ? 'Submitting...' : 'Submit Referral'}
          </button>
        </div>
      </form>
    </div>
  );
}
