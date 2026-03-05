import { clsx } from 'clsx';
import { ArrowUpIcon, ArrowDownIcon, MinusIcon } from '@heroicons/react/16/solid';

interface TrendBadgeProps {
  value: number;
  label?: string;
  suffix?: string;
  inverted?: boolean; // true = negative is good (e.g., absences going down)
}

export function TrendBadge({ value, label, suffix = '%', inverted = false }: TrendBadgeProps) {
  const isPositive = inverted ? value < 0 : value > 0;
  const isNegative = inverted ? value > 0 : value < 0;
  const isNeutral = value === 0;

  return (
    <span
      className={clsx(
        'inline-flex items-center gap-0.5 text-xs font-semibold px-1.5 py-0.5 rounded-badge',
        isPositive && 'text-atlas-emerald-700 bg-atlas-emerald-50',
        isNegative && 'text-atlas-rose-700 bg-atlas-rose-50',
        isNeutral && 'text-atlas-text-tertiary bg-gray-50'
      )}
    >
      {isPositive && <ArrowUpIcon className="h-3 w-3" />}
      {isNegative && <ArrowDownIcon className="h-3 w-3" />}
      {isNeutral && <MinusIcon className="h-3 w-3" />}
      {value > 0 ? '+' : ''}{value}{suffix}
      {label && <span className="font-normal ml-0.5">{label}</span>}
    </span>
  );
}
