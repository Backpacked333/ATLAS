import { clsx } from 'clsx';
import { Link } from 'react-router-dom';

interface ActionBannerProps {
  severity: 'critical' | 'warning' | 'info' | 'success';
  icon?: React.ReactNode;
  title: string;
  subtitle?: string;
  actionLabel?: string;
  actionUrl?: string;
  onAction?: () => void;
  children?: React.ReactNode;
}

const severityStyles: Record<string, { card: string; btn: string }> = {
  critical: {
    card: 'action-card-critical',
    btn: 'bg-atlas-rose-600 hover:bg-atlas-rose-700 text-white',
  },
  warning: {
    card: 'action-card-warning',
    btn: 'bg-atlas-amber-600 hover:bg-atlas-amber-700 text-white',
  },
  info: {
    card: 'action-card-info',
    btn: 'bg-atlas-sky-600 hover:bg-atlas-sky-700 text-white',
  },
  success: {
    card: 'action-card-success',
    btn: 'bg-atlas-emerald-600 hover:bg-atlas-emerald-700 text-white',
  },
};

export function ActionBanner({ severity, icon, title, subtitle, actionLabel, actionUrl, onAction, children }: ActionBannerProps) {
  const styles = severityStyles[severity];

  return (
    <div className={styles.card}>
      {icon && <span className="mt-0.5 flex-shrink-0">{icon}</span>}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-atlas-text-primary">{title}</p>
        {subtitle && <p className="text-xs text-atlas-text-secondary mt-0.5">{subtitle}</p>}
        {children}
      </div>
      {actionLabel && (
        actionUrl ? (
          <Link
            to={actionUrl}
            className={clsx('flex-shrink-0 px-3 py-1.5 rounded-button text-xs font-medium transition-colors', styles.btn)}
          >
            {actionLabel}
          </Link>
        ) : (
          <button
            onClick={onAction}
            className={clsx('flex-shrink-0 px-3 py-1.5 rounded-button text-xs font-medium transition-colors', styles.btn)}
          >
            {actionLabel}
          </button>
        )
      )}
    </div>
  );
}
