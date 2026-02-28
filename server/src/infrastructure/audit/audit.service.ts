import { prisma } from '../../utils/prisma';
import { Request, Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../../types';

// ─── Audit Log Types ──────────────────────────────────────────────────

export interface AuditEntry {
  userId: string;
  userRole: string;
  action: 'CREATE' | 'READ' | 'UPDATE' | 'DELETE';
  resource: string;
  resourceId?: string;
  details?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
  schoolId?: string;
}

// ─── Audit Service ────────────────────────────────────────────────────

export class AuditService {
  /**
   * Log an auditable action. Fire-and-forget to avoid blocking the request.
   */
  static async log(entry: AuditEntry): Promise<void> {
    try {
      await prisma.auditLog.create({
        data: {
          userId: entry.userId,
          userRole: entry.userRole,
          action: entry.action,
          resource: entry.resource,
          resourceId: entry.resourceId ?? null,
          details: (entry.details as any) ?? null,
          ipAddress: entry.ipAddress ?? null,
          userAgent: entry.userAgent ?? null,
          schoolId: entry.schoolId ?? null,
        },
      });
    } catch (error) {
      // Audit failures should never break the main flow
      console.error('[AuditService] Failed to write audit log:', error);
    }
  }

  /**
   * Query audit logs with filtering and pagination.
   */
  static async query(params: {
    userId?: string;
    resource?: string;
    action?: string;
    schoolId?: string;
    startDate?: Date;
    endDate?: Date;
    page?: number;
    limit?: number;
  }) {
    const page = params.page ?? 1;
    const limit = Math.min(params.limit ?? 50, 200);
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};
    if (params.userId) where.userId = params.userId;
    if (params.resource) where.resource = params.resource;
    if (params.action) where.action = params.action;
    if (params.schoolId) where.schoolId = params.schoolId;
    if (params.startDate || params.endDate) {
      where.createdAt = {
        ...(params.startDate ? { gte: params.startDate } : {}),
        ...(params.endDate ? { lte: params.endDate } : {}),
      };
    }

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.auditLog.count({ where }),
    ]);

    return { logs, total, page, limit, totalPages: Math.ceil(total / limit) };
  }
}

// ─── Audit Middleware ──────────────────────────────────────────────────

/**
 * Express middleware that automatically logs requests to the audit trail.
 */
export function auditMiddleware(resource: string, action: AuditEntry['action']) {
  return (req: AuthenticatedRequest, _res: Response, next: NextFunction) => {
    if (req.teacher) {
      // Fire-and-forget audit log
      AuditService.log({
        userId: req.teacher.id,
        userRole: 'teacher',
        action,
        resource,
        resourceId: (req.params as any)?.studentId || (req.params as any)?.sectionId || (req.params as any)?.id,
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
        schoolId: req.teacher.schoolId,
      }).catch(() => {});
    }
    next();
  };
}
