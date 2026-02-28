import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../../types';
import { ForbiddenError } from '../../utils/errors';

// ─── Role Definitions ─────────────────────────────────────────────────

export type Role = 'teacher' | 'counselor' | 'admin' | 'district_admin';

export interface Permission {
  resource: string;
  actions: ('create' | 'read' | 'update' | 'delete')[];
  scope?: 'own' | 'school' | 'district';
}

/**
 * Role-based access control permission matrix.
 *
 * Each role maps to a set of permissions defining what resources and actions
 * are allowed, and at what scope.
 */
const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  teacher: [
    { resource: 'student', actions: ['read'], scope: 'own' },
    { resource: 'attendance', actions: ['read', 'create'], scope: 'own' },
    { resource: 'grade', actions: ['read', 'create', 'update'], scope: 'own' },
    { resource: 'observation', actions: ['read', 'create', 'update'], scope: 'own' },
    { resource: 'referral', actions: ['read', 'create'], scope: 'own' },
    { resource: 'intervention', actions: ['read', 'update'], scope: 'own' },
    { resource: 'behavioral_incident', actions: ['read', 'create'], scope: 'own' },
    { resource: 'accommodation', actions: ['read'], scope: 'own' },
    { resource: 'parent_communication', actions: ['read', 'create'], scope: 'own' },
    { resource: 'schedule', actions: ['read'], scope: 'own' },
    { resource: 'report', actions: ['read', 'create'], scope: 'own' },
    { resource: 'briefing', actions: ['read'], scope: 'own' },
  ],
  counselor: [
    { resource: 'student', actions: ['read'], scope: 'school' },
    { resource: 'attendance', actions: ['read'], scope: 'school' },
    { resource: 'grade', actions: ['read'], scope: 'school' },
    { resource: 'observation', actions: ['read'], scope: 'school' },
    { resource: 'referral', actions: ['read', 'update'], scope: 'school' },
    { resource: 'intervention', actions: ['read', 'create', 'update'], scope: 'school' },
    { resource: 'behavioral_incident', actions: ['read', 'update'], scope: 'school' },
    { resource: 'accommodation', actions: ['read', 'create', 'update'], scope: 'school' },
    { resource: 'compliance', actions: ['read', 'create', 'update'], scope: 'school' },
    { resource: 'iep_document', actions: ['read', 'create', 'update'], scope: 'school' },
    { resource: 'parent_communication', actions: ['read', 'create'], scope: 'school' },
    { resource: 'schedule', actions: ['read'], scope: 'school' },
    { resource: 'report', actions: ['read', 'create'], scope: 'school' },
  ],
  admin: [
    { resource: 'student', actions: ['read', 'create', 'update', 'delete'], scope: 'school' },
    { resource: 'attendance', actions: ['read', 'create', 'update'], scope: 'school' },
    { resource: 'grade', actions: ['read', 'create', 'update'], scope: 'school' },
    { resource: 'observation', actions: ['read'], scope: 'school' },
    { resource: 'referral', actions: ['read', 'update'], scope: 'school' },
    { resource: 'intervention', actions: ['read', 'create', 'update'], scope: 'school' },
    { resource: 'behavioral_incident', actions: ['read', 'create', 'update', 'delete'], scope: 'school' },
    { resource: 'accommodation', actions: ['read', 'create', 'update'], scope: 'school' },
    { resource: 'compliance', actions: ['read', 'create', 'update'], scope: 'school' },
    { resource: 'iep_document', actions: ['read', 'create', 'update', 'delete'], scope: 'school' },
    { resource: 'parent_communication', actions: ['read', 'create'], scope: 'school' },
    { resource: 'schedule', actions: ['read', 'create', 'update', 'delete'], scope: 'school' },
    { resource: 'report', actions: ['read', 'create'], scope: 'school' },
    { resource: 'audit_log', actions: ['read'], scope: 'school' },
    { resource: 'staff', actions: ['read', 'create', 'update'], scope: 'school' },
  ],
  district_admin: [
    { resource: 'student', actions: ['read', 'create', 'update', 'delete'], scope: 'district' },
    { resource: 'attendance', actions: ['read'], scope: 'district' },
    { resource: 'grade', actions: ['read'], scope: 'district' },
    { resource: 'compliance', actions: ['read', 'create', 'update'], scope: 'district' },
    { resource: 'report', actions: ['read', 'create'], scope: 'district' },
    { resource: 'audit_log', actions: ['read'], scope: 'district' },
    { resource: 'staff', actions: ['read', 'create', 'update', 'delete'], scope: 'district' },
    { resource: 'schedule', actions: ['read', 'create', 'update', 'delete'], scope: 'district' },
  ],
};

// ─── RBAC Middleware ───────────────────────────────────────────────────

/**
 * Check if the current user has permission for the specified resource and action.
 * Falls back to 'teacher' role for authenticated teachers in the current system.
 */
export function requirePermission(resource: string, action: 'create' | 'read' | 'update' | 'delete') {
  return (req: AuthenticatedRequest, _res: Response, next: NextFunction) => {
    if (!req.teacher) {
      return next(new ForbiddenError('Authentication required'));
    }

    // Current system only has teacher role from JWT; extend as roles are added
    const role: Role = 'teacher';
    const permissions = ROLE_PERMISSIONS[role] || [];

    const hasPermission = permissions.some(
      (p) => p.resource === resource && p.actions.includes(action)
    );

    if (!hasPermission) {
      return next(
        new ForbiddenError(`Insufficient permissions: ${action} on ${resource}`)
      );
    }

    next();
  };
}

/**
 * Check if a given role has a specific permission.
 */
export function hasPermission(
  role: Role,
  resource: string,
  action: 'create' | 'read' | 'update' | 'delete'
): boolean {
  const permissions = ROLE_PERMISSIONS[role] || [];
  return permissions.some(
    (p) => p.resource === resource && p.actions.includes(action)
  );
}

/**
 * Get all permissions for a role.
 */
export function getPermissionsForRole(role: Role): Permission[] {
  return ROLE_PERMISSIONS[role] || [];
}
