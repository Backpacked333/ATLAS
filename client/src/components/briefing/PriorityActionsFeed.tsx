import { PriorityAction } from '../../types';
import { ActionBanner } from '../ui/ActionBanner';
import { Avatar } from '../ui/Avatar';
import {
  ExclamationCircleIcon,
  AcademicCapIcon,
  ClipboardDocumentListIcon,
  ShieldCheckIcon,
} from '@heroicons/react/24/outline';

interface PriorityActionsFeedProps {
  actions: PriorityAction[];
}

const categoryIcons: Record<string, React.ReactNode> = {
  attendance: <ExclamationCircleIcon className="h-5 w-5 text-atlas-rose-500" />,
  academic: <AcademicCapIcon className="h-5 w-5 text-atlas-amber-500" />,
  intervention: <ClipboardDocumentListIcon className="h-5 w-5 text-atlas-sky-500" />,
  accommodation: <ShieldCheckIcon className="h-5 w-5 text-atlas-violet-500" />,
};

const urgencyToSeverity: Record<string, 'critical' | 'warning' | 'info'> = {
  critical: 'critical',
  high: 'warning',
  medium: 'info',
};

export function PriorityActionsFeed({ actions }: PriorityActionsFeedProps) {
  if (actions.length === 0) {
    return (
      <div className="card p-6 text-center">
        <p className="text-sm text-atlas-text-secondary">No urgent actions today. Great work!</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <h2 className="section-title">Priority Actions</h2>
      {actions.slice(0, 10).map((action, index) => (
        <div
          key={action.id}
          className="animate-slide-up"
          style={{ animationDelay: `${index * 50}ms` }}
        >
          <ActionBanner
            severity={urgencyToSeverity[action.urgency] || 'info'}
            icon={
              <div className="flex items-center gap-2">
                {categoryIcons[action.category]}
                <Avatar
                  firstName={action.firstName}
                  lastName={action.lastName}
                  size="sm"
                />
              </div>
            }
            title={action.title}
            subtitle={action.subtitle}
            actionLabel={action.actionLabel}
            actionUrl={action.actionUrl}
          />
        </div>
      ))}
    </div>
  );
}
