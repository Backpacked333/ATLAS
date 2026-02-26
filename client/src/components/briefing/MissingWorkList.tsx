import { Link } from 'react-router-dom';
import { MissingWorkItem } from '../../types';
import { ActionButton } from '../actions/ActionButton';

interface Props {
  items: MissingWorkItem[];
}

export function MissingWorkList({ items }: Props) {
  return (
    <div className="card">
      <div className="card-header flex items-center justify-between">
        <h2 className="text-sm font-medium text-gray-900">Missing Work</h2>
        <span className={`badge ${items.length > 0 ? 'badge-amber' : 'badge-green'}`}>
          {items.length}
        </span>
      </div>
      <div className="card-body">
        {items.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-2">All work submitted!</p>
        ) : (
          <div className="space-y-2 max-h-80 overflow-y-auto">
            {items.map((item, i) => (
              <div key={i} className="p-2 rounded-md hover:bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <Link to={`/students/${item.studentId}`} className="text-sm font-medium text-atlas-primary hover:underline">
                      {item.firstName} {item.lastName}
                    </Link>
                    <p className="text-xs text-gray-500 truncate">{item.assignmentName} — {item.sectionName}</p>
                  </div>
                  <span className={`badge badge-${item.daysOverdue > 7 ? 'red' : 'amber'} ml-2 shrink-0`}>
                    {item.daysOverdue}d overdue
                  </span>
                </div>
                {item.daysOverdue >= 3 && (
                  <ActionButton
                    suggestion={{
                      studentId: item.studentId,
                      triggerType: 'MISSING_WORK',
                      triggerRef: item.assignmentName,
                      title: `Follow up on ${item.firstName}'s missing ${item.assignmentName}`,
                      suggestedAction: item.daysOverdue >= 7 ? 'Urgently follow up on missing work' : 'Follow up on missing work',
                      actionOptions: [
                        { value: 'student_reminder', label: 'Reminded student in class' },
                        { value: 'new_deadline', label: 'Set new deadline' },
                        { value: 'parent_contact', label: 'Contacted parent/guardian' },
                        { value: 'lunch_makeup', label: 'Scheduled lunch/after-school makeup' },
                        { value: 'excused', label: 'Excused the assignment' },
                        { value: 'other', label: 'Other' },
                      ],
                    }}
                  />
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
