import { prisma } from '../../utils/prisma';
import { AuditService } from '../../infrastructure/audit/audit.service';
import { eventBus } from '../../infrastructure/events/event-bus';
import { AlertService } from '../../infrastructure/alerts/alert.service';
import { cacheService } from '../../infrastructure/cache/cache.service';
import {
  ComplianceSearchParams,
  ComplianceDeadlineRecord,
  CreateComplianceDeadlineInput,
  UpdateComplianceDeadlineInput,
  CreateIEPDocumentInput,
  ComplianceDashboard,
} from './special-ed.types';

// ─── Module 2: Special Education Compliance Engine ────────────────────

export class SpecialEducationService {
  /**
   * Search compliance deadlines with filtering.
   */
  static async searchDeadlines(params: ComplianceSearchParams): Promise<{
    deadlines: ComplianceDeadlineRecord[];
    total: number;
  }> {
    const page = params.page ?? 1;
    const limit = Math.min(params.limit ?? 25, 100);
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = { schoolId: params.schoolId };
    if (params.status) where.status = params.status;
    if (params.type) where.type = params.type;
    if (params.assignedToId) where.assignedToId = params.assignedToId;
    if (params.dueBefore || params.dueAfter) {
      where.dueDate = {
        ...(params.dueAfter ? { gte: new Date(params.dueAfter) } : {}),
        ...(params.dueBefore ? { lte: new Date(params.dueBefore) } : {}),
      };
    }

    const [deadlines, total] = await Promise.all([
      prisma.complianceDeadline.findMany({
        where,
        include: { student: { select: { firstName: true, lastName: true } } },
        orderBy: { dueDate: 'asc' },
        skip,
        take: limit,
      }),
      prisma.complianceDeadline.count({ where }),
    ]);

    const now = new Date();

    return {
      deadlines: deadlines.map((d) => {
        const dueDate = new Date(d.dueDate);
        const daysUntilDue = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        return {
          id: d.id,
          studentId: d.studentId,
          studentName: `${d.student.firstName} ${d.student.lastName}`,
          type: d.type,
          title: d.title,
          description: d.description,
          dueDate: d.dueDate.toISOString().split('T')[0],
          status: d.status,
          assignedToId: d.assignedToId,
          completedAt: d.completedAt?.toISOString() ?? null,
          notes: d.notes,
          schoolId: d.schoolId,
          daysUntilDue,
          isOverdue: daysUntilDue < 0 && d.status !== 'COMPLETED' && d.status !== 'WAIVED',
        };
      }),
      total,
    };
  }

  /**
   * Create a compliance deadline.
   */
  static async createDeadline(input: CreateComplianceDeadlineInput, requesterId: string) {
    const deadline = await prisma.complianceDeadline.create({
      data: {
        studentId: input.studentId,
        type: input.type,
        title: input.title,
        description: input.description,
        dueDate: new Date(input.dueDate),
        assignedToId: input.assignedToId,
        schoolId: input.schoolId,
      },
    });

    eventBus.publish({
      type: 'compliance.deadline_approaching',
      payload: {
        studentId: input.studentId,
        deadlineId: deadline.id,
        type: input.type,
        dueDate: input.dueDate,
      },
      timestamp: new Date(),
      source: 'SpecialEducationService',
    });

    await AuditService.log({
      userId: requesterId,
      userRole: 'teacher',
      action: 'CREATE',
      resource: 'ComplianceDeadline',
      resourceId: deadline.id,
      schoolId: input.schoolId,
    });

    return deadline;
  }

  /**
   * Update a compliance deadline status.
   */
  static async updateDeadline(deadlineId: string, input: UpdateComplianceDeadlineInput, requesterId: string) {
    const data: Record<string, unknown> = {};
    if (input.status) {
      data.status = input.status;
      if (input.status === 'COMPLETED') data.completedAt = new Date();
    }
    if (input.assignedToId) data.assignedToId = input.assignedToId;
    if (input.notes) data.notes = input.notes;

    const deadline = await prisma.complianceDeadline.update({
      where: { id: deadlineId },
      data,
    });

    if (input.status === 'COMPLETED') {
      eventBus.publish({
        type: 'compliance.completed',
        payload: { studentId: deadline.studentId, deadlineId: deadline.id },
        timestamp: new Date(),
        source: 'SpecialEducationService',
      });
    }

    await AuditService.log({
      userId: requesterId,
      userRole: 'teacher',
      action: 'UPDATE',
      resource: 'ComplianceDeadline',
      resourceId: deadlineId,
      details: input as unknown as Record<string, unknown>,
    });

    return deadline;
  }

  /**
   * Create an IEP document.
   */
  static async createDocument(input: CreateIEPDocumentInput, requesterId: string) {
    const document = await prisma.iEPDocument.create({
      data: {
        studentId: input.studentId,
        documentType: input.documentType,
        title: input.title,
        effectiveDate: input.effectiveDate ? new Date(input.effectiveDate) : null,
        expirationDate: input.expirationDate ? new Date(input.expirationDate) : null,
        goals: (input.goals as any) ?? null,
        services: (input.services as any) ?? null,
        createdById: requesterId,
        schoolId: input.schoolId,
      },
    });

    await AuditService.log({
      userId: requesterId,
      userRole: 'teacher',
      action: 'CREATE',
      resource: 'IEPDocument',
      resourceId: document.id,
      schoolId: input.schoolId,
    });

    return document;
  }

  /**
   * Get IEP documents for a student.
   */
  static async getDocuments(studentId: string) {
    const documents = await prisma.iEPDocument.findMany({
      where: { studentId },
      include: { student: { select: { firstName: true, lastName: true } } },
      orderBy: { createdAt: 'desc' },
    });

    return documents.map((d) => ({
      id: d.id,
      studentId: d.studentId,
      studentName: `${d.student.firstName} ${d.student.lastName}`,
      documentType: d.documentType,
      title: d.title,
      status: d.status,
      effectiveDate: d.effectiveDate?.toISOString().split('T')[0] ?? null,
      expirationDate: d.expirationDate?.toISOString().split('T')[0] ?? null,
      goals: d.goals,
      services: d.services,
      createdAt: d.createdAt.toISOString(),
      updatedAt: d.updatedAt.toISOString(),
    }));
  }

  /**
   * Get the compliance dashboard for a school.
   */
  static async getDashboard(schoolId: string): Promise<ComplianceDashboard> {
    const cacheKey = `compliance-dashboard:${schoolId}`;

    return cacheService.getOrSet(cacheKey, async () => {
      const now = new Date();
      const thirtyDaysFromNow = new Date();
      thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
      const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

      const [upcoming, overdue, completed, stats] = await Promise.all([
        prisma.complianceDeadline.findMany({
          where: {
            schoolId,
            status: { in: ['PENDING', 'IN_PROGRESS'] },
            dueDate: { gte: now, lte: thirtyDaysFromNow },
          },
          include: { student: { select: { firstName: true, lastName: true } } },
          orderBy: { dueDate: 'asc' },
          take: 20,
        }),
        prisma.complianceDeadline.findMany({
          where: {
            schoolId,
            status: { in: ['PENDING', 'IN_PROGRESS'] },
            dueDate: { lt: now },
          },
          include: { student: { select: { firstName: true, lastName: true } } },
          orderBy: { dueDate: 'asc' },
          take: 20,
        }),
        prisma.complianceDeadline.findMany({
          where: {
            schoolId,
            status: 'COMPLETED',
            completedAt: { gte: firstOfMonth },
          },
          include: { student: { select: { firstName: true, lastName: true } } },
          orderBy: { completedAt: 'desc' },
          take: 10,
        }),
        Promise.all([
          prisma.complianceDeadline.count({ where: { schoolId, status: 'PENDING' } }),
          prisma.complianceDeadline.count({
            where: { schoolId, status: { in: ['PENDING', 'IN_PROGRESS'] }, dueDate: { lt: now } },
          }),
          prisma.complianceDeadline.count({
            where: { schoolId, status: 'COMPLETED', completedAt: { gte: firstOfMonth } },
          }),
          prisma.student.count({ where: { schoolId, iepActive: true } }),
          prisma.student.count({ where: { schoolId, has504: true } }),
        ]),
      ]);

      const mapDeadline = (d: typeof upcoming[0]) => {
        const dueDate = new Date(d.dueDate);
        const daysUntilDue = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        return {
          id: d.id,
          studentId: d.studentId,
          studentName: `${d.student.firstName} ${d.student.lastName}`,
          type: d.type,
          title: d.title,
          description: d.description,
          dueDate: d.dueDate.toISOString().split('T')[0],
          status: d.status,
          assignedToId: d.assignedToId,
          completedAt: d.completedAt?.toISOString() ?? null,
          notes: d.notes,
          schoolId: d.schoolId,
          daysUntilDue,
          isOverdue: daysUntilDue < 0,
        };
      };

      return {
        upcomingDeadlines: upcoming.map(mapDeadline),
        overdueDeadlines: overdue.map(mapDeadline),
        recentlyCompleted: completed.map(mapDeadline),
        stats: {
          totalPending: stats[0],
          totalOverdue: stats[1],
          completedThisMonth: stats[2],
          studentsWithActiveIEP: stats[3],
          studentsWith504: stats[4],
        },
      };
    }, 180);
  }

  /**
   * Check for approaching deadlines and create alerts.
   */
  static async checkDeadlineAlerts(schoolId: string): Promise<number> {
    const now = new Date();
    const sevenDaysOut = new Date();
    sevenDaysOut.setDate(sevenDaysOut.getDate() + 7);

    const approaching = await prisma.complianceDeadline.findMany({
      where: {
        schoolId,
        status: { in: ['PENDING', 'IN_PROGRESS'] },
        dueDate: { gte: now, lte: sevenDaysOut },
      },
      include: { student: { select: { firstName: true, lastName: true } } },
    });

    let alertCount = 0;
    for (const deadline of approaching) {
      const daysLeft = Math.ceil(
        (new Date(deadline.dueDate).getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
      );

      await AlertService.create({
        type: 'COMPLIANCE_DEADLINE',
        severity: daysLeft <= 2 ? 'CRITICAL' : 'WARNING',
        title: `${deadline.type.replace(/_/g, ' ')} due in ${daysLeft} days`,
        message: `${deadline.title} for ${deadline.student.firstName} ${deadline.student.lastName} is due ${deadline.dueDate.toISOString().split('T')[0]}`,
        resourceType: 'ComplianceDeadline',
        resourceId: deadline.id,
        schoolId,
        recipientId: deadline.assignedToId ?? undefined,
      });
      alertCount++;
    }

    return alertCount;
  }
}
