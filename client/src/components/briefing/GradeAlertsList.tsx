import { Link } from 'react-router-dom';
import { GradeAlert } from '../../types';
import { ActionButton } from '../actions/ActionButton';

interface Props {
  alerts: GradeAlert[];
}

export function GradeAlertsList({ alerts }: Props) {
  return (
    <div className="card">
      <div className="card-header flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-amber-50 flex items-center justify-center text-amber-500">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6 9 12.75l4.286-4.286a11.948 11.948 0 0 1 4.306 6.43l.776 2.898m0 0 3.182-5.511m-3.182 5.51-5.511-3.181" /></svg>
          </div>
          <h2 className="text-sm font-semibold text-gray-900">Grade Alerts</h2>
        </div>
        <span className={`badge ${alerts.length > 0 ? 'badge-amber' : 'badge-green'}`}>
          {alerts.length}
        </span>
      </div>
      <div className="card-body">
        {alerts.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-2">No grade alerts.</p>
        ) : (
          <div className="space-y-2 max-h-80 overflow-y-auto">
            {alerts.map((alert) => (
              <div
                key={`${alert.studentId}-${alert.sectionName}`}
                className={`p-2 rounded-md severity-bar-${alert.currentGrade < 60 ? 'red' : 'amber'}`}
              >
                <Link
                  to={`/students/${alert.studentId}`}
                  className="block hover:bg-gray-50 rounded"
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
                <ActionButton
                  suggestion={{
                    studentId: alert.studentId,
                    triggerType: 'GRADE_ALERT',
                    title: `Address ${alert.firstName}'s grade drop in ${alert.sectionName} (${alert.currentGrade}%)`,
                    suggestedAction: alert.currentGrade < 60 ? 'Intervene on failing grade' : 'Check in on grade drop',
                    actionOptions: [
                      { value: '1on1_conference', label: 'Had 1-on-1 conference with student' },
                      { value: 'makeup_plan', label: 'Created makeup work plan' },
                      { value: 'tutoring_referral', label: 'Referred to tutoring' },
                      { value: 'parent_contact', label: 'Contacted parent/guardian' },
                      { value: 'modified_assignment', label: 'Modified upcoming assignments' },
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
