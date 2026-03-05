import { ActionBanner } from '../ui/ActionBanner';
import {
  PhoneIcon,
  EyeIcon,
  ClipboardDocumentListIcon,
  DocumentTextIcon,
  SparklesIcon,
} from '@heroicons/react/24/outline';

interface RecommendedAction {
  priority: number;
  action: string;
  reason: string;
  actionType: 'contact' | 'observation' | 'intervention' | 'referral' | 'celebrate';
}

interface RecommendedActionsProps {
  actions: RecommendedAction[];
  studentId: string;
}

const actionIcons: Record<string, React.ReactNode> = {
  contact: <PhoneIcon className="h-5 w-5 text-atlas-rose-500" />,
  observation: <EyeIcon className="h-5 w-5 text-atlas-sky-500" />,
  intervention: <ClipboardDocumentListIcon className="h-5 w-5 text-atlas-amber-500" />,
  referral: <DocumentTextIcon className="h-5 w-5 text-atlas-violet-500" />,
  celebrate: <SparklesIcon className="h-5 w-5 text-atlas-emerald-500" />,
};

const actionSeverity: Record<string, 'critical' | 'warning' | 'info' | 'success'> = {
  contact: 'critical',
  observation: 'info',
  intervention: 'warning',
  referral: 'warning',
  celebrate: 'success',
};

export function RecommendedActions({ actions, studentId }: RecommendedActionsProps) {
  if (actions.length === 0) return null;

  return (
    <div className="space-y-2">
      <h3 className="section-title">Recommended Actions</h3>
      {actions.slice(0, 3).map((action, i) => (
        <ActionBanner
          key={i}
          severity={actionSeverity[action.actionType] || 'info'}
          icon={actionIcons[action.actionType]}
          title={action.action}
          subtitle={action.reason}
          actionLabel={action.actionType === 'referral' ? 'Refer' : action.actionType === 'contact' ? 'Contact' : 'View'}
          actionUrl={action.actionType === 'referral' ? `/referrals/new/${studentId}` : `/students/${studentId}`}
        />
      ))}
    </div>
  );
}
