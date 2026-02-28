/**
 * Module 23: Authentication Authorization System
 *
 * Extends the core authentication middleware with role-based access control (RBAC),
 * session management, and comprehensive auth audit logging.
 *
 * Cross-References:
 *   - Attendance Tracking Module (supporting scalability)
 *   - Case Management Engine (design of scalability)
 *   - User Access Control System (implementation of scalability)
 *   - Database Architecture (operational concerns)
 *
 * Functional Themes: scalability, reliability, core, integration, operational, security
 */

import {
  UserRole,
  Permission,
  RoleDefinition,
  AuthSession,
  AuthAuditEntry,
} from './types';

// ─── RBAC Role Definitions ────────────────────────────────────────────

const ROLE_DEFINITIONS: RoleDefinition[] = [
  {
    role: 'teacher',
    displayName: 'Teacher',
    permissions: [
      { resource: 'students', actions: ['read'], conditions: { scope: 'own_sections' } },
      { resource: 'observations', actions: ['read', 'create', 'update'], conditions: { scope: 'own_observations' } },
      { resource: 'grades', actions: ['read'], conditions: { scope: 'own_sections' } },
      { resource: 'attendance', actions: ['read'], conditions: { scope: 'own_sections' } },
      { resource: 'interventions', actions: ['read', 'create'], conditions: { scope: 'own_students' } },
      { resource: 'referrals', actions: ['read', 'create'], conditions: { scope: 'own_referrals' } },
      { resource: 'sections', actions: ['read'], conditions: { scope: 'own_sections' } },
      { resource: 'notifications', actions: ['read', 'update'] },
      { resource: 'briefing', actions: ['read'] },
      { resource: 'ai_assistant', actions: ['read', 'create'] },
    ],
  },
  {
    role: 'counselor',
    displayName: 'School Counselor',
    permissions: [
      { resource: 'students', actions: ['read'], conditions: { scope: 'own_school' } },
      { resource: 'observations', actions: ['read'], conditions: { scope: 'own_school' } },
      { resource: 'grades', actions: ['read'], conditions: { scope: 'own_school' } },
      { resource: 'attendance', actions: ['read'], conditions: { scope: 'own_school' } },
      { resource: 'interventions', actions: ['read', 'create', 'update'], conditions: { scope: 'own_school' } },
      { resource: 'referrals', actions: ['read', 'update'], conditions: { scope: 'own_school' } },
      { resource: 'accommodations', actions: ['read', 'create', 'update'], conditions: { scope: 'own_school' } },
    ],
  },
  {
    role: 'admin',
    displayName: 'School Administrator',
    inheritsFrom: 'counselor',
    permissions: [
      { resource: 'students', actions: ['read', 'create', 'update'], conditions: { scope: 'own_school' } },
      { resource: 'teachers', actions: ['read', 'create', 'update'], conditions: { scope: 'own_school' } },
      { resource: 'sections', actions: ['read', 'create', 'update', 'delete'], conditions: { scope: 'own_school' } },
      { resource: 'reports', actions: ['read'], conditions: { scope: 'own_school' } },
      { resource: 'audit_logs', actions: ['read'], conditions: { scope: 'own_school' } },
    ],
  },
  {
    role: 'district_admin',
    displayName: 'District Administrator',
    inheritsFrom: 'admin',
    permissions: [
      { resource: 'students', actions: ['read', 'create', 'update'], conditions: { scope: 'own_district' } },
      { resource: 'teachers', actions: ['read', 'create', 'update', 'delete'], conditions: { scope: 'own_district' } },
      { resource: 'schools', actions: ['read', 'create', 'update'], conditions: { scope: 'own_district' } },
      { resource: 'reports', actions: ['read'], conditions: { scope: 'own_district' } },
      { resource: 'audit_logs', actions: ['read'], conditions: { scope: 'own_district' } },
      { resource: 'tenant_config', actions: ['read', 'update'] },
    ],
  },
  {
    role: 'system_admin',
    displayName: 'System Administrator',
    permissions: [
      { resource: '*', actions: ['read', 'create', 'update', 'delete'] },
    ],
  },
];

// ─── Authorization Service ────────────────────────────────────────────

export class AuthorizationService {
  private sessions = new Map<string, AuthSession>();
  private auditLog: AuthAuditEntry[] = [];
  private readonly maxAuditEntries: number;
  private readonly sessionTimeoutMs: number;

  constructor() {
    this.maxAuditEntries = parseInt(process.env.AUTH_AUDIT_MAX || '50000', 10);
    this.sessionTimeoutMs = parseInt(process.env.SESSION_TIMEOUT_MS || '28800000', 10); // 8h default
  }

  /**
   * Check if a role has permission to perform an action on a resource.
   */
  hasPermission(role: UserRole, resource: string, action: 'read' | 'create' | 'update' | 'delete'): boolean {
    const permissions = this.getEffectivePermissions(role);
    return permissions.some(
      (p) =>
        (p.resource === resource || p.resource === '*') &&
        p.actions.includes(action)
    );
  }

  /**
   * Get all effective permissions for a role, including inherited permissions.
   */
  getEffectivePermissions(role: UserRole): Permission[] {
    const roleDef = ROLE_DEFINITIONS.find((r) => r.role === role);
    if (!roleDef) return [];

    const permissions = [...roleDef.permissions];

    if (roleDef.inheritsFrom) {
      const inheritedPermissions = this.getEffectivePermissions(roleDef.inheritsFrom);
      for (const inherited of inheritedPermissions) {
        const exists = permissions.some(
          (p) => p.resource === inherited.resource && JSON.stringify(p.actions) === JSON.stringify(inherited.actions)
        );
        if (!exists) {
          permissions.push(inherited);
        }
      }
    }

    return permissions;
  }

  /**
   * Get all role definitions.
   */
  getRoleDefinitions(): RoleDefinition[] {
    return ROLE_DEFINITIONS.map((r) => ({ ...r }));
  }

  /**
   * Create a new auth session.
   */
  createSession(userId: string, role: UserRole, tenantId: string, ipAddress: string, userAgent: string): AuthSession {
    const now = new Date();
    const expiresAt = new Date(now.getTime() + this.sessionTimeoutMs);

    const session: AuthSession = {
      sessionId: `sess-${Date.now()}-${Math.random().toString(36).substring(2, 10)}`,
      userId,
      role,
      tenantId,
      issuedAt: now.toISOString(),
      expiresAt: expiresAt.toISOString(),
      ipAddress,
      userAgent,
      mfaVerified: false,
    };

    this.sessions.set(session.sessionId, session);
    this.recordAudit(userId, 'login', ipAddress, userAgent, true);

    return session;
  }

  /**
   * Validate an existing session.
   */
  validateSession(sessionId: string): AuthSession | null {
    const session = this.sessions.get(sessionId);
    if (!session) return null;

    if (new Date(session.expiresAt).getTime() < Date.now()) {
      this.sessions.delete(sessionId);
      return null;
    }

    return session;
  }

  /**
   * Invalidate a session (logout).
   */
  invalidateSession(sessionId: string, ipAddress: string, userAgent: string): boolean {
    const session = this.sessions.get(sessionId);
    if (!session) return false;

    this.sessions.delete(sessionId);
    this.recordAudit(session.userId, 'logout', ipAddress, userAgent, true);

    return true;
  }

  /**
   * Invalidate all sessions for a user.
   */
  invalidateUserSessions(userId: string): number {
    let count = 0;
    for (const [sessionId, session] of this.sessions.entries()) {
      if (session.userId === userId) {
        this.sessions.delete(sessionId);
        count++;
      }
    }
    return count;
  }

  /**
   * Get active session count.
   */
  getActiveSessionCount(): number {
    this.cleanExpiredSessions();
    return this.sessions.size;
  }

  /**
   * Record a permission denied event.
   */
  recordPermissionDenied(userId: string, resource: string, action: string, ipAddress: string, userAgent: string): void {
    this.recordAudit(
      userId,
      'permission_denied',
      ipAddress,
      userAgent,
      false,
      `Denied ${action} on ${resource}`
    );
  }

  /**
   * Get auth audit log entries.
   */
  getAuditLog(limit = 100, userId?: string): AuthAuditEntry[] {
    let entries = this.auditLog;
    if (userId) {
      entries = entries.filter((e) => e.userId === userId);
    }
    return entries.slice(-limit);
  }

  // ─── Private Helpers ──────────────────────────────────────────────

  private recordAudit(
    userId: string,
    action: AuthAuditEntry['action'],
    ipAddress: string,
    userAgent: string,
    success: boolean,
    details?: string
  ): void {
    this.auditLog.push({
      timestamp: new Date().toISOString(),
      userId,
      action,
      ipAddress,
      userAgent,
      success,
      details,
    });

    if (this.auditLog.length > this.maxAuditEntries) {
      this.auditLog = this.auditLog.slice(-this.maxAuditEntries);
    }
  }

  private cleanExpiredSessions(): void {
    const now = Date.now();
    for (const [sessionId, session] of this.sessions.entries()) {
      if (new Date(session.expiresAt).getTime() < now) {
        this.sessions.delete(sessionId);
      }
    }
  }
}

// ─── Singleton Export ─────────────────────────────────────────────────

export const authorizationService = new AuthorizationService();
