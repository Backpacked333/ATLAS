import { clsx } from 'clsx';

interface FilterOption {
  key: string;
  label: string;
  count?: number;
}

interface FilterBarProps {
  filters: FilterOption[];
  activeFilter: string;
  onChange: (key: string) => void;
}

export function FilterBar({ filters, activeFilter, onChange }: FilterBarProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {filters.map((filter) => (
        <button
          key={filter.key}
          onClick={() => onChange(filter.key)}
          className={clsx(
            'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all',
            activeFilter === filter.key
              ? 'bg-atlas-indigo-100 text-atlas-indigo-700 ring-1 ring-atlas-indigo-300'
              : 'bg-gray-100 text-atlas-text-secondary hover:bg-gray-200'
          )}
        >
          {filter.label}
          {filter.count !== undefined && (
            <span className={clsx(
              'inline-flex items-center justify-center h-4 min-w-[16px] rounded-full px-1 text-[10px] font-semibold',
              activeFilter === filter.key ? 'bg-atlas-indigo-600 text-white' : 'bg-gray-300 text-gray-700'
            )}>
              {filter.count}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}
