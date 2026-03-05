import { clsx } from 'clsx';

interface ProgressRingProps {
  value: number; // 0-100
  size?: number;
  strokeWidth?: number;
  color?: 'emerald' | 'amber' | 'rose' | 'indigo' | 'auto';
  label?: string;
  showValue?: boolean;
}

function getAutoColor(value: number): string {
  if (value >= 90) return '#059669'; // emerald-600
  if (value >= 80) return '#d97706'; // amber-600
  return '#e11d48'; // rose-600
}

const colorMap: Record<string, string> = {
  emerald: '#059669',
  amber: '#d97706',
  rose: '#e11d48',
  indigo: '#4f46e5',
};

export function ProgressRing({ value, size = 48, strokeWidth = 4, color = 'auto', label, showValue = true }: ProgressRingProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (Math.min(value, 100) / 100) * circumference;
  const strokeColor = color === 'auto' ? getAutoColor(value) : colorMap[color];

  return (
    <div className="inline-flex flex-col items-center gap-1">
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#f1f5f9"
          strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={strokeColor}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-700 ease-out"
        />
      </svg>
      {showValue && (
        <span className={clsx('text-xs font-semibold', 'text-atlas-text-primary')}>
          {Math.round(value)}%
        </span>
      )}
      {label && <span className="text-[10px] text-atlas-text-tertiary">{label}</span>}
    </div>
  );
}
