import { Link } from 'react-router-dom';
import { AbsentStudent } from '../../types';
import { ActionButton } from '../actions/ActionButton';

interface Props {
  students: AbsentStudent[];
}

export function AbsentStudentsList({ students }: Props) {
  return (
    <div className="card">
      <div className="card-header flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-red-50 flex items-center justify-center text-red-500">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M22 10.5h-6m-2.25-4.125a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0ZM4 19.235v-.11a6.375 6.375 0 0 1 12.75 0v.109A12.318 12.318 0 0 1 10.374 21c-2.331 0-4.512-.645-6.374-1.766Z" /></svg>
          </div>
          <h2 className="text-sm font-semibold text-gray-900">Absent Today</h2>
        </div>
        <span className={`badge ${students.length > 0 ? 'badge-red' : 'badge-green'}`}>
          {students.length}
        </span>
      </div>
      <div className="card-body">
        {students.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-2">All students present!</p>
        ) : (
          <div className="space-y-2 max-h-80 overflow-y-auto">
            {students.map((student) => (
              <div key={student.studentId} className={`p-2 rounded-md severity-bar-${student.severity}`}>
                <Link
                  to={`/students/${student.studentId}`}
                  className="block hover:bg-gray-50 rounded"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="h-7 w-7 rounded-full bg-gray-200 flex items-center justify-center text-xs font-medium">
                        {student.firstName[0]}{student.lastName[0]}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {student.firstName} {student.lastName}
                        </p>
                        <p className="text-xs text-gray-500">{student.periods.join(', ')}</p>
                      </div>
                    </div>
                    <span className={`badge badge-${student.severity === 'red' ? 'red' : student.severity === 'amber' ? 'amber' : 'gray'}`}>
                      {student.consecutiveDays} day{student.consecutiveDays !== 1 ? 's' : ''}
                    </span>
                  </div>
                </Link>
                {student.consecutiveDays >= 2 && (
                  <ActionButton
                    suggestion={{
                      studentId: student.studentId,
                      triggerType: 'ABSENT',
                      title: `Check in on ${student.firstName}'s absences (${student.consecutiveDays} days)`,
                      suggestedAction: 'Reach out about absences',
                      actionOptions: [
                        { value: 'called_home', label: 'Called home' },
                        { value: 'emailed_parent', label: 'Emailed parent/guardian' },
                        { value: 'talked_to_counselor', label: 'Talked to counselor' },
                        { value: 'sent_work_home', label: 'Sent makeup work home' },
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
