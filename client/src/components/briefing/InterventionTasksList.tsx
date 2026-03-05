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
        <h2 className="text-sm font-medium text-atlas-text-primary">Intervention Tasks</h2>
        <span className={`badge ${overdueTasks.length > 0 ? 'badge-rose' : tasks.length > 0 ? 'badge-indigo' : 'badge-emerald'}`}>
          {tasks.length}
        </span>
      </div>
      <div className="card-body">
        {tasks.length === 0 ? (
          <p className="text-sm text-atlas-text-secondary text-center py-2">No intervention tasks today.</p>
        ) : (
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {overdueTasks.length > 0 && (
              <p className="text-xs font-medium text-atlas-amber-600 uppercase">Overdue from yesterday</p>
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
              <p className="text-xs font-medium text-atlas-text-tertiary uppercase pt-2">Today</p>
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
    <div className={`flex items-center gap-3 p-2 rounded-lg transition-colors ${isOverdue ? 'bg-atlas-amber-50' : ''}`}>
      <button
        onClick={onComplete}
        disabled={isCompleted}
        className={`h-5 w-5 rounded border-2 flex items-center justify-center shrink-0 transition-colors ${
          isCompleted
            ? 'bg-atlas-emerald-500 border-atlas-emerald-500 text-white'
            : 'border-atlas-border hover:border-atlas-indigo-500'
        }`}
      >
        {isCompleted && <span className="text-xs">{'\u2713'}</span>}
      </button>
      <div className="flex-1 min-w-0">
        <Link to={`/students/${task.studentId}`} className="text-sm font-medium text-atlas-text-primary hover:underline">
          {task.firstName} {task.lastName}
        </Link>
        <p className="text-xs text-atlas-text-secondary truncate">
          {task.type}{task.teacherRole ? ` — ${task.teacherRole}` : ''}
        </p>
      </div>
    </div>
  );
}
