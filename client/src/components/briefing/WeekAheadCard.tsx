import { WeekAhead } from '../../types';
import { CalendarDaysIcon } from '@heroicons/react/24/outline';

interface WeekAheadCardProps {
  weekAhead: WeekAhead;
}

export function WeekAheadCard({ weekAhead }: WeekAheadCardProps) {
  return (
    <div className="card">
      <div className="card-header flex items-center gap-2">
        <CalendarDaysIcon className="h-4 w-4 text-atlas-indigo-500" />
        <h3 className="text-sm font-semibold text-atlas-text-primary">Week Ahead</h3>
      </div>
      <div className="card-body space-y-3">
        <div className="flex justify-between text-sm">
          <span className="text-atlas-text-secondary">Upcoming assessments</span>
          <span className="font-semibold text-atlas-text-primary">{weekAhead.assessmentsCount}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-atlas-text-secondary">Students w/ accommodations</span>
          <span className="font-semibold text-atlas-text-primary">{weekAhead.studentsWithAccommodations}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-atlas-text-secondary">Intervention check-ins</span>
          <span className="font-semibold text-atlas-text-primary">{weekAhead.interventionCheckIns}</span>
        </div>
      </div>
    </div>
  );
}
