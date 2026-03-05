import { TodayStats } from '../../types';
import { MetricCard } from '../ui/MetricCard';
import { ProgressRing } from '../ui/ProgressRing';
import {
  UsersIcon,
  ExclamationTriangleIcon,
  ClipboardDocumentCheckIcon,
  BellAlertIcon,
} from '@heroicons/react/24/outline';

interface TodayStatsBarProps {
  stats: TodayStats;
}

export function TodayStatsBar({ stats }: TodayStatsBarProps) {
  const interventionPct = stats.interventionsDue > 0
    ? Math.round((stats.interventionsCompleted / stats.interventionsDue) * 100)
    : 100;

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      <MetricCard
        label="Total Students"
        value={stats.totalStudents}
        icon={<UsersIcon className="h-5 w-5" />}
      />
      <MetricCard
        label="Absent Today"
        value={stats.absentCount}
        variant={stats.absentCount > 5 ? 'danger' : 'default'}
        icon={<ExclamationTriangleIcon className="h-5 w-5" />}
      >
        <span className="text-xs text-atlas-text-tertiary">
          {stats.absentRate.toFixed(1)}% absence rate
        </span>
      </MetricCard>
      <MetricCard
        label="Interventions"
        value={`${stats.interventionsCompleted}/${stats.interventionsDue}`}
        variant={interventionPct < 80 ? 'warning' : 'success'}
        icon={<ClipboardDocumentCheckIcon className="h-5 w-5" />}
      >
        <ProgressRing value={interventionPct} size={32} color="auto" showValue={false} />
      </MetricCard>
      <MetricCard
        label="Urgent Alerts"
        value={stats.urgentAlerts}
        variant={stats.urgentAlerts > 0 ? 'danger' : 'success'}
        icon={<BellAlertIcon className="h-5 w-5" />}
      />
    </div>
  );
}
