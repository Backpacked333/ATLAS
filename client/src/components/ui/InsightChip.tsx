import { clsx } from 'clsx';

interface InsightChipProps {
  severity: 'info' | 'warning' | 'critical' | 'success';
  icon?: React.ReactNode;
  message: string;
}

const styles: Record<string, string> = {
  info: 'insight-banner-info',
  warning: 'insight-banner-warning',
  critical: 'insight-banner-critical',
  success: 'insight-banner-success',
};

export function InsightChip({ severity, icon, message }: InsightChipProps) {
  return (
    <div className={clsx(styles[severity], 'text-sm')}>
      {icon && <span className="flex-shrink-0 mt-0.5">{icon}</span>}
      <p>{message}</p>
    </div>
  );
}
