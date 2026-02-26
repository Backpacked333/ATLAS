import { Link } from 'react-router-dom';
import { MissingWorkItem } from '../../types';

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
          <div className="overflow-x-auto max-h-64 overflow-y-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-xs text-gray-500 uppercase">
                  <th className="text-left py-1">Student</th>
                  <th className="text-left py-1">Assignment</th>
                  <th className="text-right py-1">Overdue</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {items.map((item, i) => (
                  <tr key={i} className="hover:bg-gray-50">
                    <td className="py-1.5">
                      <Link to={`/students/${item.studentId}`} className="text-atlas-primary hover:underline">
                        {item.firstName} {item.lastName}
                      </Link>
                    </td>
                    <td className="py-1.5 text-gray-600">{item.assignmentName}</td>
                    <td className="py-1.5 text-right">
                      <span className={`badge badge-${item.daysOverdue > 7 ? 'red' : 'amber'}`}>
                        {item.daysOverdue}d
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
