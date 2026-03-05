import { Link } from 'react-router-dom';
import { AbsentStudent } from '../../types';
import { Avatar } from '../ui/Avatar';

interface Props {
  students: AbsentStudent[];
}

export function AbsentStudentsList({ students }: Props) {
  return (
    <div className="card">
      <div className="card-header flex items-center justify-between">
        <h2 className="text-sm font-medium text-atlas-text-primary">Absent Today</h2>
        <span className={`badge ${students.length > 0 ? 'badge-rose' : 'badge-emerald'}`}>
          {students.length}
        </span>
      </div>
      <div className="card-body">
        {students.length === 0 ? (
          <p className="text-sm text-atlas-text-secondary text-center py-2">All students present!</p>
        ) : (
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {students.map((student) => (
              <Link
                key={student.studentId}
                to={`/students/${student.studentId}`}
                className={`block p-2 rounded-lg hover:bg-gray-50/50 transition-colors severity-bar-${student.severity}`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Avatar
                      name={`${student.firstName} ${student.lastName}`}
                      size="sm"
                    />
                    <div>
                      <p className="text-sm font-medium text-atlas-text-primary">
                        {student.firstName} {student.lastName}
                      </p>
                      <p className="text-xs text-atlas-text-secondary">{student.periods.join(', ')}</p>
                    </div>
                  </div>
                  <span className={`badge badge-${student.severity === 'red' ? 'rose' : student.severity === 'amber' ? 'amber' : 'sky'}`}>
                    {student.consecutiveDays} day{student.consecutiveDays !== 1 ? 's' : ''}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
