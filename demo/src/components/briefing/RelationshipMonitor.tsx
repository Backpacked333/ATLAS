import { Link } from 'react-router-dom';
import { RelationshipMonitorEntry } from '../../types';
import { ActionButton } from '../actions/ActionButton';

interface Props {
  entries: RelationshipMonitorEntry[];
}

/**
 * Student Relationship Monitor (Section 4.1.6)
 * A quiet indicator showing students the teacher hasn't had a documented
 * positive interaction with in 14+ days. Private, non-evaluative nudge.
 */
export function RelationshipMonitor({ entries }: Props) {
  if (entries.length === 0) return null;

  return (
    <div className="card md:col-span-2">
      <div className="card-header flex items-center justify-between">
        <h2 className="text-sm font-medium text-gray-900">Relationship Check-In</h2>
        <span className="text-xs text-gray-400">Private — only visible to you</span>
      </div>
      <div className="card-body">
        <p className="text-sm text-gray-500 mb-3">
          {entries.length} student{entries.length !== 1 ? 's' : ''} haven't heard from you recently.
          A quick positive interaction can make a big difference.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {entries.map((entry) => (
            <div key={entry.studentId} className="px-3 py-2 rounded-lg bg-gray-50">
              <Link
                to={`/students/${entry.studentId}`}
                className="flex items-center gap-2 hover:bg-blue-50 rounded transition-colors"
              >
                <div className="h-7 w-7 rounded-full bg-gray-200 flex items-center justify-center text-xs font-medium">
                  {entry.firstName[0]}{entry.lastName[0]}
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {entry.firstName} {entry.lastName}
                  </p>
                  <p className="text-xs text-gray-500">
                    {entry.daysSincePositiveInteraction >= 999
                      ? 'No positive interactions logged'
                      : `${entry.daysSincePositiveInteraction} days`}
                  </p>
                </div>
              </Link>
              <ActionButton
                suggestion={{
                  studentId: entry.studentId,
                  triggerType: 'RELATIONSHIP',
                  title: `Reconnect with ${entry.firstName} (${entry.daysSincePositiveInteraction >= 999 ? 'no recent contact' : entry.daysSincePositiveInteraction + ' days'})`,
                  suggestedAction: 'Have a positive interaction',
                  actionOptions: [
                    { value: 'positive_comment', label: 'Made a positive comment in class' },
                    { value: 'check_in_chat', label: 'Had a quick check-in chat' },
                    { value: 'positive_note_home', label: 'Sent positive note home' },
                    { value: 'lunch_visit', label: 'Invited to lunch/office hours' },
                    { value: 'public_praise', label: 'Gave public recognition' },
                    { value: 'other', label: 'Other' },
                  ],
                }}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
