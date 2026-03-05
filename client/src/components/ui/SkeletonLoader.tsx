import { clsx } from 'clsx';

interface SkeletonProps {
  className?: string;
  style?: React.CSSProperties;
}

export function Skeleton({ className, style }: SkeletonProps) {
  return <div className={clsx('skeleton', className)} style={style} />;
}

export function MetricCardSkeleton() {
  return (
    <div className="metric-card">
      <Skeleton className="h-3 w-20" />
      <Skeleton className="h-8 w-16 mt-2" />
    </div>
  );
}

export function CardSkeleton({ lines = 3 }: { lines?: number }) {
  return (
    <div className="card animate-fade-in">
      <div className="card-header">
        <Skeleton className="h-4 w-1/3" />
      </div>
      <div className="card-body space-y-3">
        {[...Array(lines)].map((_, i) => (
          <Skeleton key={i} className="h-3" style={{ width: `${80 - i * 15}%` }} />
        ))}
      </div>
    </div>
  );
}

export function TableRowSkeleton({ cols = 5 }: { cols?: number }) {
  return (
    <tr className="animate-fade-in">
      {[...Array(cols)].map((_, i) => (
        <td key={i} className="px-4 py-3">
          <Skeleton className="h-4 w-full" />
        </td>
      ))}
    </tr>
  );
}
