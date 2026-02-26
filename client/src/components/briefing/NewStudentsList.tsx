import { Link } from 'react-router-dom';
import { NewStudent } from '../../types';

interface Props {
  students: NewStudent[];
}

export function NewStudentsList({ students }: Props) {
  return (
    <div className="card">
      <div className="card-header flex items-center justify-between">
        <h2 className="text-sm font-medium text-gray-900">New Students</h2>
        <span className={`badge ${students.length > 0 ? 'badge-blue' : 'badge-gray'}`}>
          {students.length}
        </span>
      </div>
      <div className="card-body">
        {students.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-2">No new students this week.</p>
        ) : (
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {students.map((student) => (
              <Link
                key={student.studentId}
                to={`/students/${student.studentId}`}
                className="block p-2 rounded-md hover:bg-gray-50"
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
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
