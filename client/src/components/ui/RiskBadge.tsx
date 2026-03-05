import { clsx } from 'clsx';

interface RiskBadgeProps {
  tier: string;
  size?: 'sm' | 'md';
}

const tierConfig: Record<string, { label: string; classes: string; dotClass: string }> = {
  ON_TRACK: {
    label: 'On Track',
    classes: 'bg-atlas-emerald-50 text-atlas-emerald-700 ring-1 ring-atlas-emerald-200',
    dotClass: 'bg-atlas-emerald-500',
  },
  NEEDS_SUPPORT: {
    label: 'Needs Support',
    classes: 'bg-atlas-amber-50 text-atlas-amber-700 ring-1 ring-atlas-amber-200',
    dotClass: 'bg-atlas-amber-500',
  },
  URGENT: {
    label: 'Urgent',
    classes: 'bg-atlas-rose-50 text-atlas-rose-700 ring-1 ring-atlas-rose-200',
    dotClass: 'bg-atlas-rose-500 animate-pulse-subtle',
  },
};

export function RiskBadge({ tier, size = 'md' }: RiskBadgeProps) {
  const config = tierConfig[tier] || tierConfig.ON_TRACK;

  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1.5 rounded-badge font-semibold',
        config.classes,
        size === 'sm' ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-1 text-xs'
      )}
    >
      <span className={clsx('rounded-full', config.dotClass, size === 'sm' ? 'h-1.5 w-1.5' : 'h-2 w-2')} />
      {config.label}
    </span>
  );
}
