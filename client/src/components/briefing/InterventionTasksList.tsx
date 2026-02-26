import { useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../services/api';
import { InterventionTask } from '../../types';

interface Props {
  tasks: InterventionTask[];
}

export function InterventionTasksList({ tasks }: Props) {
  const [completedIds, setCompletedIds] = useState<Set<string>>(
    new Set(tasks.filter((t) => t.completedToday).map((t) => t.interventionId))
  );

  async function markComplete(interventionId: string) {
    try {
      await api.post('/interventions/log', {
        interventionId,
        completionStatus: 'COMPLETED',
      });
      setCompletedIds((prev) => new Set([...prev, interventionId]));
    } catch {
      // silently fail, user can retry
    }
  }

  const overdueTasks = tasks.filter((t) => t.isOverdue && !completedIds.has(t.interventionId));
  const todayTasks = tasks.filter((t) => !t.isOverdue);

  return (
    <div className="card">
      <div className="card-header flex items-center justify-between">
        <h2 className="text-sm font-medium text-gray-900">Intervention Tasks</h2>
        <span className={`badge ${overdueTasks.length > 0 ? 'badge-red' : tasks.length > 0 ? 'badge-blue' : 'badge-green'}`}>
          {tasks.length}
        </span>
      </div>
      <div className="card-body">
        {tasks.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-2">No intervention tasks today.</p>
        ) : (
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {overdueTasks.length > 0 && (
              <p className="text-xs font-medium text-amber-600 uppercase">Overdue from yesterday</p>
            )}
            {overdueTasks.map((task) => (
              <TaskItem
                key={task.interventionId}
                task={task}
                isCompleted={completedIds.has(task.interventionId)}
                onComplete={() => markComplete(task.interventionId)}
                isOverdue
              />
            ))}
            {overdueTasks.length > 0 && todayTasks.length > 0 && (
              <p className="text-xs font-medium text-gray-500 uppercase pt-2">Today</p>
            )}
            {todayTasks.map((task) => (
              <TaskItem
                key={task.interventionId}
                task={task}
                isCompleted={completedIds.has(task.interventionId)}
                onComplete={() => markComplete(task.interventionId)}
                isOverdue={false}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function TaskItem({
  task,
  isCompleted,
  onComplete,
  isOverdue,
}: {
  task: InterventionTask;
  isCompleted: boolean;
  onComplete: () => void;
  isOverdue: boolean;
}) {
  return (
    <div className={`flex items-center gap-3 p-2 rounded-md ${isOverdue ? 'bg-amber-50' : ''}`}>
      <button
        onClick={onComplete}
        disabled={isCompleted}
        className={`h-5 w-5 rounded border-2 flex items-center justify-center shrink-0 ${
          isCompleted
            ? 'bg-green-500 border-green-500 text-white'
            : 'border-gray-300 hover:border-atlas-primary'
        }`}
      >
        {isCompleted && <span className="text-xs">{'\u2713'}</span>}
      </button>
      <div className="flex-1 min-w-0">
        <Link to={`/students/${task.studentId}`} className="text-sm font-medium text-gray-900 hover:underline">
          {task.firstName} {task.lastName}
        </Link>
        <p className="text-xs text-gray-500 truncate">
          {task.type}{task.teacherRole ? ` — ${task.teacherRole}` : ''}
        </p>
      </div>
    </div>
  );
}
