import { clsx } from 'clsx';
import { TrendBadge } from './TrendBadge';

interface MetricCardProps {
  label: string;
  value: string | number;
  icon?: React.ReactNode;
  delta?: number;
  deltaLabel?: string;
  variant?: 'default' | 'success' | 'warning' | 'danger';
  children?: React.ReactNode;
}

export function MetricCard({ label, value, icon, delta, deltaLabel, variant = 'default', children }: MetricCardProps) {
  const accentColors = {
    default: 'border-t-atlas-indigo-500',
    success: 'border-t-atlas-emerald-500',
    warning: 'border-t-atlas-amber-500',
    danger: 'border-t-atlas-rose-500',
  };

  return (
    <div className={clsx('metric-card border-t-2', accentColors[variant])}>
      <div className="flex items-center justify-between">
        <span className="metric-card-label">{label}</span>
        {icon && <span className="text-atlas-text-tertiary">{icon}</span>}
      </div>
      <div className="flex items-end gap-2">
        <span className="metric-card-value">{value}</span>
        {delta !== undefined && <TrendBadge value={delta} label={deltaLabel} />}
      </div>
      {children && <div className="mt-2">{children}</div>}
    </div>
  );
}
