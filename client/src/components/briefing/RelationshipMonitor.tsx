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
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-pink-50 flex items-center justify-center text-pink-500">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z" /></svg>
          </div>
          <h2 className="text-sm font-semibold text-gray-900">Relationship Check-In</h2>
        </div>
        <span className="text-xs text-gray-400">Private</span>
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
