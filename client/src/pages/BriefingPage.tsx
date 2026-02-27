import { useState, useEffect } from 'react';
import { api } from '../services/api';
import { MorningBriefing } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { AbsentStudentsList } from '../components/briefing/AbsentStudentsList';
import { GradeAlertsList } from '../components/briefing/GradeAlertsList';
import { MissingWorkList } from '../components/briefing/MissingWorkList';
import { InterventionTasksList } from '../components/briefing/InterventionTasksList';
import { AccommodationAlertsList } from '../components/briefing/AccommodationAlertsList';
import { NewStudentsList } from '../components/briefing/NewStudentsList';
import { RelationshipMonitor } from '../components/briefing/RelationshipMonitor';

export function BriefingPage() {
  const { teacher } = useAuth();
  const [briefing, setBriefing] = useState<MorningBriefing | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get<MorningBriefing>('/briefing')
      .then(setBriefing)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-7 bg-gray-200 rounded-lg w-64 mb-2" />
          <div className="h-4 bg-gray-200 rounded w-48" />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="card animate-pulse">
              <div className="card-body">
                <div className="h-8 bg-gray-200 rounded w-12 mb-2" />
                <div className="h-3 bg-gray-200 rounded w-20" />
              </div>
            </div>
          ))}
        </div>
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

  const urgentCount = briefing.absentToday.filter(a => a.severity === 'red').length
    + briefing.gradeAlerts.filter(a => a.currentGrade < 60).length;
  const totalAlerts = briefing.absentToday.length + briefing.gradeAlerts.length
    + briefing.missingWorkQueue.length;

  return (
    <div className="space-y-6">
      {/* Welcome header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Good morning, {teacher?.firstName}
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">{today}</p>
        </div>
        {urgentCount > 0 && (
          <div className="flex items-center gap-2 bg-red-50 text-red-700 px-3 py-1.5 rounded-lg text-sm font-medium ring-1 ring-inset ring-red-600/20">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            {urgentCount} urgent
          </div>
        )}
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="card overflow-hidden">
          <div className="card-body flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center text-red-600 flex-shrink-0">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 0 0 3.741-.479 3 3 0 0 0-4.682-2.72m.94 3.198.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0 1 12 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 0 1 6 18.719m12 0a5.971 5.971 0 0 0-.941-3.197m0 0A5.995 5.995 0 0 0 12 12.75a5.995 5.995 0 0 0-5.058 2.772m0 0a3 3 0 0 0-4.681 2.72 8.986 8.986 0 0 0 3.74.477m.94-3.197a5.971 5.971 0 0 0-.94 3.197M15 6.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm6 3a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Zm-13.5 0a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Z" />
              </svg>
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{briefing.absentToday.length}</p>
              <p className="text-xs text-gray-500">Absent today</p>
            </div>
          </div>
        </div>

        <div className="card overflow-hidden">
          <div className="card-body flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600 flex-shrink-0">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6 9 12.75l4.286-4.286a11.948 11.948 0 0 1 4.306 6.43l.776 2.898m0 0 3.182-5.511m-3.182 5.51-5.511-3.181" />
              </svg>
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{briefing.gradeAlerts.length}</p>
              <p className="text-xs text-gray-500">Grade alerts</p>
            </div>
          </div>
        </div>

        <div className="card overflow-hidden">
          <div className="card-body flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center text-orange-600 flex-shrink-0">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
              </svg>
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{briefing.missingWorkQueue.length}</p>
              <p className="text-xs text-gray-500">Missing work</p>
            </div>
          </div>
        </div>

        <div className="card overflow-hidden">
          <div className="card-body flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 flex-shrink-0">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
              </svg>
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{totalAlerts}</p>
              <p className="text-xs text-gray-500">Total alerts</p>
            </div>
          </div>
        </div>
      </div>

      {/* Alert cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <AbsentStudentsList students={briefing.absentToday} />
        <GradeAlertsList alerts={briefing.gradeAlerts} />
        <MissingWorkList items={briefing.missingWorkQueue} />
        <InterventionTasksList tasks={briefing.interventionTasks} />
        <AccommodationAlertsList alerts={briefing.accommodationAlerts} />
        <NewStudentsList students={briefing.newStudents} />
        {briefing.relationshipMonitor.length > 0 && (
          <RelationshipMonitor entries={briefing.relationshipMonitor} />
        )}
      </div>
    </div>
  );
}
