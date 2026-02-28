import { useState, useEffect } from 'react';
import { api } from '../services/api';

interface Role {
  id: string;
  name: string;
  description: string | null;
  isSystem: boolean;
  permissions: { permission: { id: string; resource: string; action: string } }[];
  _count: { assignments: number };
}

export function AccessControlPage() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get<Role[]>('/access-control/roles')
      .then(setRoles)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="max-w-4xl mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Access Control</h1>
          <p className="text-sm text-gray-500 mt-1">Manage roles and permissions</p>
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="card p-4 animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
              <div className="h-3 bg-gray-200 rounded w-1/2" />
            </div>
          ))}
        </div>
      ) : roles.length === 0 ? (
        <div className="card p-8 text-center">
          <p className="text-gray-500">No roles configured.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {roles.map((role) => (
            <div key={role.id} className="card p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-gray-900">{role.name}</p>
                    {role.isSystem && <span className="badge badge-blue">System</span>}
                  </div>
                  {role.description && (
                    <p className="text-sm text-gray-500 mt-1">{role.description}</p>
                  )}
                  <div className="flex items-center gap-4 mt-2">
                    <span className="text-xs text-gray-400">
                      {role.permissions.length} permission{role.permissions.length !== 1 ? 's' : ''}
                    </span>
                    <span className="text-xs text-gray-400">
                      {role._count.assignments} user{role._count.assignments !== 1 ? 's' : ''}
                    </span>
                  </div>
                  {role.permissions.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {role.permissions.slice(0, 6).map((p) => (
                        <span key={p.permission.id} className="badge badge-gray text-xs">
                          {p.permission.resource}:{p.permission.action}
                        </span>
                      ))}
                      {role.permissions.length > 6 && (
                        <span className="badge badge-gray text-xs">+{role.permissions.length - 6} more</span>
                      )}
                    </div>
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
