import { Link } from 'react-router-dom';
import { NewStudent } from '../../types';
import { ActionButton } from '../actions/ActionButton';

interface Props {
  students: NewStudent[];
}

export function NewStudentsList({ students }: Props) {
  return (
    <div className="card">
      <div className="card-header flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-500">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M18 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0ZM3 19.235v-.11a6.375 6.375 0 0 1 12.75 0v.109A12.318 12.318 0 0 1 9.374 21c-2.331 0-4.512-.645-6.374-1.766Z" /></svg>
          </div>
          <h2 className="text-sm font-semibold text-gray-900">New Students</h2>
        </div>
        <span className={`badge ${students.length > 0 ? 'badge-blue' : 'badge-gray'}`}>
          {students.length}
        </span>
      </div>
      <div className="card-body">
        {students.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-2">No new students this week.</p>
        ) : (
          <div className="space-y-2 max-h-80 overflow-y-auto">
            {students.map((student) => (
              <div key={student.studentId} className="p-2 rounded-md">
                <Link
                  to={`/students/${student.studentId}`}
                  className="block hover:bg-gray-50 rounded"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="h-7 w-7 rounded-full bg-blue-100 flex items-center justify-center text-xs font-medium text-blue-700">
                        {student.firstName[0]}{student.lastName[0]}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {student.firstName} {student.lastName}
                        </p>
                        <p className="text-xs text-gray-500">
                          Grade {student.gradeLevel}
                          {student.priorGpa !== null && ` | GPA: ${student.priorGpa.toFixed(1)}`}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      {student.ellStatus && <span className="badge badge-blue text-xs">ELL</span>}
                      {student.iepActive && <span className="badge badge-purple text-xs">IEP</span>}
                      {student.has504 && <span className="badge badge-purple text-xs">504</span>}
                    </div>
                  </div>
                </Link>
                <ActionButton
                  suggestion={{
                    studentId: student.studentId,
                    triggerType: 'NEW_STUDENT',
                    title: `Welcome ${student.firstName} ${student.lastName} to class`,
                    suggestedAction: 'Welcome and onboard new student',
                    actionOptions: [
                      { value: 'intro_conversation', label: 'Had intro conversation' },
                      { value: 'buddy_assigned', label: 'Assigned a buddy/mentor' },
                      { value: 'reviewed_records', label: 'Reviewed academic records' },
                      { value: 'parent_welcome', label: 'Sent welcome note to parent' },
                      { value: 'seating_assigned', label: 'Assigned seating' },
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
