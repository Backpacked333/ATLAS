interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      {icon && <div className="text-atlas-text-tertiary mb-3">{icon}</div>}
      <h3 className="text-sm font-medium text-atlas-text-primary">{title}</h3>
      {description && <p className="text-sm text-atlas-text-secondary mt-1 max-w-sm">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
