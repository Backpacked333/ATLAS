import { clsx } from 'clsx';

interface ProgressBarProps {
  value: number; // 0-100
  color?: 'emerald' | 'amber' | 'rose' | 'indigo' | 'auto';
  size?: 'sm' | 'md';
  showLabel?: boolean;
}

function getAutoColor(value: number): string {
  if (value >= 90) return 'bg-atlas-emerald-500';
  if (value >= 70) return 'bg-atlas-amber-500';
  return 'bg-atlas-rose-500';
}

const colorMap: Record<string, string> = {
  emerald: 'bg-atlas-emerald-500',
  amber: 'bg-atlas-amber-500',
  rose: 'bg-atlas-rose-500',
  indigo: 'bg-atlas-indigo-500',
};

export function ProgressBar({ value, color = 'auto', size = 'md', showLabel = false }: ProgressBarProps) {
  const barColor = color === 'auto' ? getAutoColor(value) : colorMap[color];

  return (
    <div className="flex items-center gap-2">
      <div className={clsx('progress-bar', size === 'sm' ? 'h-1.5' : 'h-2')}>
        <div
          className={clsx('progress-bar-fill', barColor)}
          style={{ width: `${Math.min(value, 100)}%` }}
        />
      </div>
      {showLabel && (
        <span className="text-xs font-medium text-atlas-text-secondary whitespace-nowrap">
          {Math.round(value)}%
        </span>
      )}
    </div>
  );
}
