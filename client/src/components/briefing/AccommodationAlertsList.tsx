import { Link } from 'react-router-dom';
import { AccommodationAlert } from '../../types';
import { ActionButton } from '../actions/ActionButton';

interface Props {
  alerts: AccommodationAlert[];
}

export function AccommodationAlertsList({ alerts }: Props) {
  return (
    <div className="card">
      <div className="card-header flex items-center justify-between">
        <h2 className="text-sm font-medium text-gray-900">Accommodation Reminders</h2>
        <span className={`badge ${alerts.length > 0 ? 'badge-purple' : 'badge-green'}`}>
          {alerts.length}
        </span>
      </div>
      <div className="card-body">
        {alerts.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-2">No accommodation reminders this week.</p>
        ) : (
          <div className="space-y-2 max-h-80 overflow-y-auto">
            {alerts.map((alert, i) => (
              <div key={i} className="p-2 rounded-md severity-bar-amber">
                <Link
                  to={`/students/${alert.studentId}`}
                  className="block hover:bg-gray-50 rounded"
                >
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-sm font-medium text-gray-900">
                      {alert.firstName} {alert.lastName}
                    </p>
                    <span className="text-xs text-gray-500">{alert.assessmentDate}</span>
                  </div>
                  <p className="text-xs text-gray-600 mb-1">{alert.upcomingAssessment}</p>
                  <div className="flex gap-1 flex-wrap">
                    {alert.accommodations.map((acc, j) => (
                      <span key={j} className="badge badge-purple text-xs">{acc}</span>
                    ))}
                  </div>
                </Link>
                <ActionButton
                  suggestion={{
                    studentId: alert.studentId,
                    triggerType: 'ACCOMMODATION',
                    triggerRef: alert.upcomingAssessment,
                    title: `Prepare accommodations for ${alert.firstName}'s ${alert.upcomingAssessment}`,
                    suggestedAction: 'Confirm accommodations are ready',
                    actionOptions: [
                      { value: 'test_modified', label: 'Modified test prepared' },
                      { value: 'extra_time_set', label: 'Extended time arranged' },
                      { value: 'seating_confirmed', label: 'Seating/environment confirmed' },
                      { value: 'aide_notified', label: 'Aide/support staff notified' },
                      { value: 'all_ready', label: 'All accommodations ready' },
                      { value: 'other', label: 'Other' },
                    ],
                  }}
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
