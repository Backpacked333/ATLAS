import { Link } from 'react-router-dom';
import { GradeAlert } from '../../types';
import { Avatar } from '../ui/Avatar';
import { TrendBadge } from '../ui/TrendBadge';

interface Props {
  alerts: GradeAlert[];
}

export function GradeAlertsList({ alerts }: Props) {
  return (
    <div className="card">
      <div className="card-header flex items-center justify-between">
        <h2 className="text-sm font-medium text-atlas-text-primary">Grade Alerts</h2>
        <span className={`badge ${alerts.length > 0 ? 'badge-amber' : 'badge-emerald'}`}>
          {alerts.length}
        </span>
      </div>
      <div className="card-body">
        {alerts.length === 0 ? (
          <p className="text-sm text-atlas-text-secondary text-center py-2">No grade alerts.</p>
        ) : (
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {alerts.map((alert) => (
              <Link
                key={`${alert.studentId}-${alert.sectionName}`}
                to={`/students/${alert.studentId}`}
                className={`block p-2 rounded-lg hover:bg-gray-50/50 transition-colors severity-bar-${alert.currentGrade < 60 ? 'red' : 'amber'}`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Avatar
                      name={`${alert.firstName} ${alert.lastName}`}
                      size="sm"
                    />
                    <div>
                      <p className="text-sm font-medium text-atlas-text-primary">
                        {alert.firstName} {alert.lastName}
                      </p>
                      <p className="text-xs text-atlas-text-secondary">{alert.sectionName}</p>
                    </div>
                  </div>
                  <div className="text-right flex items-center gap-2">
                    <span className="text-sm font-semibold text-atlas-text-primary">
                      {alert.currentGrade}%
                    </span>
                    <TrendBadge value={alert.delta} suffix="%" />
                  </div>
                </div>
                {alert.lowAssignments.length > 0 && (
                  <div className="mt-1 flex gap-1 flex-wrap">
                    {alert.lowAssignments.map((a, i) => (
                      <span key={i} className="text-xs text-atlas-rose-600">
                        {a.name}: {a.score}/{a.possible}
                      </span>
                    ))}
                  </div>
                )}
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
