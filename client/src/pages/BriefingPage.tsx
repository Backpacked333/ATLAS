import { useState, useEffect } from 'react';
import { api } from '../services/api';
import { MorningBriefing } from '../types';
import { AbsentStudentsList } from '../components/briefing/AbsentStudentsList';
import { GradeAlertsList } from '../components/briefing/GradeAlertsList';
import { MissingWorkList } from '../components/briefing/MissingWorkList';
import { InterventionTasksList } from '../components/briefing/InterventionTasksList';
import { AccommodationAlertsList } from '../components/briefing/AccommodationAlertsList';
import { NewStudentsList } from '../components/briefing/NewStudentsList';
import { RelationshipMonitor } from '../components/briefing/RelationshipMonitor';

export function BriefingPage() {
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

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Morning Briefing</h1>
        <p className="text-sm text-gray-500">{today}</p>
      </div>

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
