import { Link } from 'react-router-dom';
import { GradeAlert } from '../../types';

interface Props {
  alerts: GradeAlert[];
}

export function GradeAlertsList({ alerts }: Props) {
  return (
    <div className="card">
      <div className="card-header flex items-center justify-between">
        <h2 className="text-sm font-medium text-gray-900">Grade Alerts</h2>
        <span className={`badge ${alerts.length > 0 ? 'badge-amber' : 'badge-green'}`}>
          {alerts.length}
        </span>
      </div>
      <div className="card-body">
        {alerts.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-2">No grade alerts.</p>
        ) : (
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {alerts.map((alert) => (
              <Link
                key={`${alert.studentId}-${alert.sectionName}`}
                to={`/students/${alert.studentId}`}
                className={`block p-2 rounded-md hover:bg-gray-50 severity-bar-${alert.currentGrade < 60 ? 'red' : 'amber'}`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {alert.firstName} {alert.lastName}
                    </p>
                    <p className="text-xs text-gray-500">{alert.sectionName}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">
                      {alert.currentGrade}%
                      <span className="text-red-500 text-xs ml-1">({alert.delta > 0 ? '+' : ''}{alert.delta}%)</span>
                    </p>
                  </div>
                </div>
                {alert.lowAssignments.length > 0 && (
                  <div className="mt-1 flex gap-1 flex-wrap">
                    {alert.lowAssignments.map((a, i) => (
                      <span key={i} className="text-xs text-red-600">
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
