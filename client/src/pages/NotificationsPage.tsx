import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';
import { Notification } from '../types';

export function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get<Notification[]>('/notifications')
      .then(setNotifications)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  async function markAllRead() {
    await api.put('/notifications/read-all');
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
  }

  async function markRead(id: string) {
    await api.put(`/notifications/${id}/read`);
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
    );
  }

  const typeIcon: Record<string, string> = {
    ABSENT_STREAK: '!',
    GRADE_DROP: '\u2193',
    INTERVENTION_ASSIGNED: '\u2713',
    INTERVENTION_OVERDUE: '!',
    SST_MEETING_SCHEDULED: '\u2605',
    NEW_STUDENT: '+',
    ACCOMMODATION_REMINDER: '\u2605',
  };

  const typeColor: Record<string, string> = {
    ABSENT_STREAK: 'red',
    GRADE_DROP: 'amber',
    INTERVENTION_ASSIGNED: 'blue',
    INTERVENTION_OVERDUE: 'red',
    SST_MEETING_SCHEDULED: 'blue',
    NEW_STUDENT: 'green',
    ACCOMMODATION_REMINDER: 'purple',
  };

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
        {notifications.some((n) => !n.isRead) && (
          <button onClick={markAllRead} className="btn-ghost text-sm">
            Mark all as read
          </button>
        )}
      </div>

      {loading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="card p-4 animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
              <div className="h-3 bg-gray-200 rounded w-1/2" />
            </div>
          ))}
        </div>
      ) : notifications.length === 0 ? (
        <div className="card p-8 text-center">
          <p className="text-gray-500">No notifications.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {notifications.map((notification) => (
            <div
              key={notification.id}
              className={`card p-4 cursor-pointer transition-colors ${
                !notification.isRead ? 'bg-blue-50/50 border-l-4 border-l-atlas-primary' : ''
              }`}
              onClick={() => !notification.isRead && markRead(notification.id)}
            >
              <div className="flex items-start gap-3">
                <span className={`badge badge-${typeColor[notification.type] || 'gray'} mt-0.5`}>
                  {typeIcon[notification.type] || '?'}
                </span>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm ${!notification.isRead ? 'font-medium text-gray-900' : 'text-gray-700'}`}>
                    {notification.title}
                  </p>
                  <p className="text-sm text-gray-500 mt-0.5">{notification.body}</p>
                  <p className="text-xs text-gray-400 mt-1">
                    {new Date(notification.createdAt).toLocaleDateString()} at{' '}
                    {new Date(notification.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
                {notification.studentId && (
                  <Link
                    to={`/students/${notification.studentId}`}
                    className="btn-ghost text-xs px-2 py-1 shrink-0"
                    onClick={(e) => e.stopPropagation()}
                  >
                    View Student
                  </Link>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
