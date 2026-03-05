import { Celebration } from '../../types';
import { Link } from 'react-router-dom';
import { Avatar } from '../ui/Avatar';
import { SparklesIcon } from '@heroicons/react/24/outline';

interface CelebrationsListProps {
  celebrations: Celebration[];
}

export function CelebrationsList({ celebrations }: CelebrationsListProps) {
  if (celebrations.length === 0) return null;

  return (
    <div className="card">
      <div className="card-header flex items-center gap-2">
        <SparklesIcon className="h-4 w-4 text-atlas-amber-500" />
        <h3 className="text-sm font-semibold text-atlas-text-primary">Celebrations</h3>
        <span className="badge badge-emerald ml-auto">{celebrations.length}</span>
      </div>
      <div className="card-body space-y-3">
        {celebrations.slice(0, 5).map((c) => (
          <Link
            key={c.studentId}
            to={`/students/${c.studentId}`}
            className="flex items-center gap-3 p-2 rounded-lg hover:bg-atlas-emerald-50 transition-colors group"
          >
            <Avatar firstName={c.firstName} lastName={c.lastName} size="sm" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-atlas-text-primary group-hover:text-atlas-emerald-700 truncate">
                {c.firstName} {c.lastName}
              </p>
              <p className="text-xs text-atlas-emerald-600 truncate">{c.achievement}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
