import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';
import { MorningBriefing } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { AbsentStudentsList } from '../components/briefing/AbsentStudentsList';
import { GradeAlertsList } from '../components/briefing/GradeAlertsList';
import { MissingWorkList } from '../components/briefing/MissingWorkList';
import { InterventionTasksList } from '../components/briefing/InterventionTasksList';
import { AccommodationAlertsList } from '../components/briefing/AccommodationAlertsList';
import { NewStudentsList } from '../components/briefing/NewStudentsList';

export function BriefingPage() {
  const { teacher } = useAuth();
  const [briefing, setBriefing] = useState<MorningBriefing | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    setLoading(true);
    api.get<MorningBriefing>('/briefing')
      .then(setBriefing)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold text-gray-900">Morning Briefing</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="card animate-pulse">
              <div className="card-header">
                <div className="h-4 bg-gray-200 rounded w-1/3" />
              </div>
              <div className="card-body space-y-3">
                <div className="h-3 bg-gray-200 rounded" />
                <div className="h-3 bg-gray-200 rounded w-2/3" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-atlas-danger">{error}</p>
        <button onClick={() => window.location.reload()} className="btn-secondary mt-4">
          Retry
        </button>
      </div>
    );
  }

  if (!briefing) return null;

  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const totalAlerts =
    briefing.absentToday.length +
    briefing.gradeAlerts.length +
    briefing.missingWorkQueue.length +
    briefing.interventionTasks.filter((t) => !t.completedToday).length;

  return (
    <div className="space-y-4">
      {/* Header with greeting */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Good morning{teacher?.firstName ? `, ${teacher.firstName}` : ''}
          </h1>
          <p className="text-sm text-gray-500">{today}</p>
        </div>
        <div className="flex items-center gap-3">
          {totalAlerts > 0 && (
            <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-lg px-3 py-1.5">
              <svg className="h-4 w-4 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <span className="text-sm font-medium text-amber-800">{totalAlerts} items need attention</span>
            </div>
          )}
          <Link to="/roster" className="btn-secondary text-sm">
            View Roster
          </Link>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="card p-3">
          <p className="text-xs text-gray-500 uppercase font-medium">Absent</p>
          <p className={`text-2xl font-bold ${briefing.absentToday.length > 0 ? 'text-red-600' : 'text-green-600'}`}>
            {briefing.absentToday.length}
          </p>
        </div>
        <div className="card p-3">
          <p className="text-xs text-gray-500 uppercase font-medium">Grade Alerts</p>
          <p className={`text-2xl font-bold ${briefing.gradeAlerts.length > 0 ? 'text-amber-600' : 'text-green-600'}`}>
            {briefing.gradeAlerts.length}
          </p>
        </div>
        <div className="card p-3">
          <p className="text-xs text-gray-500 uppercase font-medium">Missing Work</p>
          <p className={`text-2xl font-bold ${briefing.missingWorkQueue.length > 0 ? 'text-amber-600' : 'text-green-600'}`}>
            {briefing.missingWorkQueue.length}
          </p>
        </div>
        <div className="card p-3">
          <p className="text-xs text-gray-500 uppercase font-medium">Interventions</p>
          <p className="text-2xl font-bold text-atlas-primary">
            {briefing.interventionTasks.filter((t) => !t.completedToday).length}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <AbsentStudentsList students={briefing.absentToday} />
        <GradeAlertsList alerts={briefing.gradeAlerts} />
        <MissingWorkList items={briefing.missingWorkQueue} />
        <InterventionTasksList tasks={briefing.interventionTasks} />
        <AccommodationAlertsList alerts={briefing.accommodationAlerts} />
        <NewStudentsList students={briefing.newStudents} />
      </div>
    </div>
  );
}
