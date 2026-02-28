import { useState, useEffect } from 'react';
import { api } from '../services/api';
import { Task, TaskSummary, TaskStatus, TaskPriority } from '../types';

const priorityColor: Record<TaskPriority, string> = {
  LOW: 'gray',
  MEDIUM: 'blue',
  HIGH: 'amber',
  URGENT: 'red',
};

const statusLabel: Record<TaskStatus, string> = {
  PENDING: 'Pending',
  IN_PROGRESS: 'In Progress',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled',
  OVERDUE: 'Overdue',
};

export function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [summary, setSummary] = useState<TaskSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('');

  useEffect(() => {
    Promise.all([
      api.get<Task[]>('/tasks'),
      api.get<TaskSummary>('/tasks/summary'),
    ])
      .then(([taskData, summaryData]) => {
        setTasks(taskData);
        setSummary(summaryData);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  async function updateStatus(taskId: string, status: string) {
    try {
      const updated = await api.put<Task>(`/tasks/${taskId}/status`, { status });
      setTasks((prev) => prev.map((t) => (t.id === taskId ? updated : t)));
    } catch {
      // ignore
    }
  }

  const filteredTasks = statusFilter
    ? tasks.filter((t) => t.status === statusFilter)
    : tasks;

  return (
    <div className="max-w-4xl mx-auto space-y-4">
      <h1 className="text-2xl font-bold text-gray-900">Tasks</h1>

      {summary && (
        <div className="grid grid-cols-4 gap-3">
          <div className="card p-3 text-center">
            <p className="text-2xl font-bold text-gray-900">{summary.pending}</p>
            <p className="text-xs text-gray-500">Pending</p>
          </div>
          <div className="card p-3 text-center">
            <p className="text-2xl font-bold text-blue-600">{summary.inProgress}</p>
            <p className="text-xs text-gray-500">In Progress</p>
          </div>
          <div className="card p-3 text-center">
            <p className="text-2xl font-bold text-red-600">{summary.overdue}</p>
            <p className="text-xs text-gray-500">Overdue</p>
          </div>
          <div className="card p-3 text-center">
            <p className="text-2xl font-bold text-green-600">{summary.completedThisWeek}</p>
            <p className="text-xs text-gray-500">Done This Week</p>
          </div>
        </div>
      )}

      <div className="flex gap-2 flex-wrap">
        <button
          className={`btn-ghost text-sm ${!statusFilter ? 'bg-atlas-primary text-white' : ''}`}
          onClick={() => setStatusFilter('')}
        >
          All
        </button>
        {Object.entries(statusLabel).map(([key, label]) => (
          <button
            key={key}
            className={`btn-ghost text-sm ${statusFilter === key ? 'bg-atlas-primary text-white' : ''}`}
            onClick={() => setStatusFilter(key)}
          >
            {label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="card p-4 animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
              <div className="h-3 bg-gray-200 rounded w-1/2" />
            </div>
          ))}
        </div>
      ) : filteredTasks.length === 0 ? (
        <div className="card p-8 text-center">
          <p className="text-gray-500">No tasks found.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filteredTasks.map((task) => (
            <div key={task.id} className="card p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className={`badge badge-${priorityColor[task.priority]}`}>{task.priority}</span>
                    <span className="badge badge-gray">{task.category}</span>
                    <span className="badge badge-blue">{statusLabel[task.status]}</span>
                  </div>
                  <p className="text-sm font-medium text-gray-900 mt-2">{task.title}</p>
                  {task.description && <p className="text-sm text-gray-500 mt-1">{task.description}</p>}
                  <div className="flex items-center gap-3 mt-1">
                    {task.dueDate && (
                      <p className="text-xs text-gray-400">Due: {new Date(task.dueDate).toLocaleDateString()}</p>
                    )}
                    {task.assignedTo && (
                      <p className="text-xs text-gray-400">Assigned: {task.assignedTo.firstName} {task.assignedTo.lastName}</p>
                    )}
                  </div>
                </div>
                <div className="flex gap-1">
                  {task.status === 'PENDING' && (
                    <button onClick={() => updateStatus(task.id, 'IN_PROGRESS')} className="btn-ghost text-xs">
                      Start
                    </button>
                  )}
                  {task.status === 'IN_PROGRESS' && (
                    <button onClick={() => updateStatus(task.id, 'COMPLETED')} className="btn-ghost text-xs">
                      Complete
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
