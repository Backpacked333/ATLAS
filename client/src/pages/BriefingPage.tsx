import { useState, useEffect } from 'react';
import { api } from '../services/api';
import { EnhancedMorningBriefing } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { PageHeader } from '../components/ui/PageHeader';
import { TodayStatsBar } from '../components/briefing/TodayStatsBar';
import { PriorityActionsFeed } from '../components/briefing/PriorityActionsFeed';
import { CelebrationsList } from '../components/briefing/CelebrationsList';
import { WeekAheadCard } from '../components/briefing/WeekAheadCard';
import { AbsentStudentsList } from '../components/briefing/AbsentStudentsList';
import { GradeAlertsList } from '../components/briefing/GradeAlertsList';
import { MissingWorkList } from '../components/briefing/MissingWorkList';
import { InterventionTasksList } from '../components/briefing/InterventionTasksList';
import { MetricCardSkeleton, CardSkeleton } from '../components/ui/SkeletonLoader';

export function BriefingPage() {
  const { teacher } = useAuth();
  const [briefing, setBriefing] = useState<EnhancedMorningBriefing | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get<EnhancedMorningBriefing>('/briefing/enhanced')
      .then(setBriefing)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const greeting = (() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  })();

  if (loading) {
    return (
      <div className="space-y-6">
        <PageHeader title={`${greeting}, ${teacher?.firstName || ''}`} subtitle={today} />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[...Array(4)].map((_, i) => <MetricCardSkeleton key={i} />)}
        </div>
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => <CardSkeleton key={i} />)}
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

  return (
    <div className="space-y-6 max-w-6xl">
      <PageHeader
        title={`${greeting}, ${teacher?.firstName || ''}`}
        subtitle={today}
      />

      <TodayStatsBar stats={briefing.todayStats} />

      <PriorityActionsFeed actions={briefing.priorityActions} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="space-y-4">
          <AbsentStudentsList students={briefing.absentToday} />
          <MissingWorkList items={briefing.missingWorkQueue} />
        </div>
        <div className="space-y-4">
          <GradeAlertsList alerts={briefing.gradeAlerts} />
          <CelebrationsList celebrations={briefing.celebrations} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <InterventionTasksList tasks={briefing.interventionTasks} />
        <WeekAheadCard weekAhead={briefing.weekAhead} />
      </div>
    </div>
  );
}
