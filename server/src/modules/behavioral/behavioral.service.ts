import { prisma } from '../../utils/prisma';
import { AuditService } from '../../infrastructure/audit/audit.service';
import { eventBus } from '../../infrastructure/events/event-bus';
import { AlertService } from '../../infrastructure/alerts/alert.service';
import { cacheService } from '../../infrastructure/cache/cache.service';
import {
  CreateBehavioralIncidentInput,
  UpdateBehavioralIncidentInput,
  BehavioralIncidentRecord,
  BehavioralSearchParams,
  BehavioralSummary,
} from './behavioral.types';

// ─── Module 4: Behavioral Management System ──────────────────────────

export class BehavioralService {
  /**
   * Create a new behavioral incident.
   */
  static async createIncident(
    input: CreateBehavioralIncidentInput,
    reportedById: string,
    schoolId: string
  ): Promise<BehavioralIncidentRecord> {
    const incident = await prisma.behavioralIncident.create({
      data: {
        studentId: input.studentId,
        reportedById,
        incidentDate: new Date(input.incidentDate),
        incidentType: input.incidentType,
        location: input.location ?? null,
        description: input.description,
        actionsTaken: (input.actionsTaken as any) ?? null,
        severity: input.severity,
        parentNotified: input.parentNotified ?? false,
        adminNotified: input.adminNotified ?? false,
      },
    });

    const [student, teacher] = await Promise.all([
      prisma.student.findUnique({ where: { id: input.studentId }, select: { firstName: true, lastName: true } }),
      prisma.teacher.findUnique({ where: { id: reportedById }, select: { firstName: true, lastName: true } }),
    ]);

    const studentName = student ? `${student.firstName} ${student.lastName}` : 'Unknown';

    // Create alert for major incidents
    if (input.severity === 'MAJOR') {
      await AlertService.create({
        type: 'BEHAVIORAL_INCIDENT',
        severity: 'CRITICAL',
        title: `Major behavioral incident reported`,
        message: `${studentName}: ${input.incidentType.replace(/_/g, ' ').toLowerCase()}`,
        resourceType: 'BehavioralIncident',
        resourceId: incident.id,
        schoolId,
      });
    }

    eventBus.publish({
      type: 'behavioral.incident_created',
      payload: {
        studentId: input.studentId,
        incidentId: incident.id,
        type: input.incidentType,
        severity: input.severity,
      },
      timestamp: new Date(),
      source: 'BehavioralService',
    });

    await AuditService.log({
      userId: reportedById,
      userRole: 'teacher',
      action: 'CREATE',
      resource: 'BehavioralIncident',
      resourceId: incident.id,
      schoolId,
      details: { incidentType: input.incidentType, severity: input.severity },
    });

    cacheService.invalidateByPrefix('behavioral:');

    return {
      id: incident.id,
      studentId: incident.studentId,
      studentName,
      reportedById,
      reportedByName: teacher ? `${teacher.firstName} ${teacher.lastName}` : 'Unknown',
      incidentDate: incident.incidentDate.toISOString().split('T')[0],
      incidentType: incident.incidentType,
      location: incident.location,
      description: incident.description,
      actionsTaken: incident.actionsTaken,
      severity: incident.severity,
      parentNotified: incident.parentNotified,
      adminNotified: incident.adminNotified,
      followUpDate: null,
      followUpNotes: null,
      status: incident.status,
      createdAt: incident.createdAt.toISOString(),
    };
  }

  /**
   * Update a behavioral incident.
   */
  static async updateIncident(
    incidentId: string,
    input: UpdateBehavioralIncidentInput,
    requesterId: string
  ) {
    const data: Record<string, unknown> = {};
    if (input.status) data.status = input.status;
    if (input.followUpDate) data.followUpDate = new Date(input.followUpDate);
    if (input.followUpNotes) data.followUpNotes = input.followUpNotes;
    if (input.parentNotified !== undefined) data.parentNotified = input.parentNotified;
    if (input.adminNotified !== undefined) data.adminNotified = input.adminNotified;
    if (input.actionsTaken) data.actionsTaken = input.actionsTaken;

    const incident = await prisma.behavioralIncident.update({
      where: { id: incidentId },
      data,
    });

    if (input.status === 'ESCALATED') {
      eventBus.publish({
        type: 'behavioral.escalated',
        payload: { studentId: incident.studentId, incidentId: incident.id },
        timestamp: new Date(),
        source: 'BehavioralService',
      });
    }

    if (input.status === 'RESOLVED') {
      eventBus.publish({
        type: 'behavioral.incident_resolved',
        payload: { studentId: incident.studentId, incidentId: incident.id },
        timestamp: new Date(),
        source: 'BehavioralService',
      });
    }

    await AuditService.log({
      userId: requesterId,
      userRole: 'teacher',
      action: 'UPDATE',
      resource: 'BehavioralIncident',
      resourceId: incidentId,
      details: input as unknown as Record<string, unknown>,
    });

    cacheService.invalidateByPrefix('behavioral:');

    return incident;
  }

  /**
   * Search behavioral incidents.
   */
  static async search(params: BehavioralSearchParams) {
    const page = params.page ?? 1;
    const limit = Math.min(params.limit ?? 25, 100);
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};
    if (params.studentId) where.studentId = params.studentId;
    if (params.reportedById) where.reportedById = params.reportedById;
    if (params.incidentType) where.incidentType = params.incidentType;
    if (params.severity) where.severity = params.severity;
    if (params.status) where.status = params.status;
    if (params.startDate || params.endDate) {
      where.incidentDate = {
        ...(params.startDate ? { gte: new Date(params.startDate) } : {}),
        ...(params.endDate ? { lte: new Date(params.endDate) } : {}),
      };
    }

    const [incidents, total] = await Promise.all([
      prisma.behavioralIncident.findMany({
        where,
        include: { student: { select: { firstName: true, lastName: true } } },
        orderBy: { incidentDate: 'desc' },
        skip,
        take: limit,
      }),
      prisma.behavioralIncident.count({ where }),
    ]);

    return {
      incidents: incidents.map((i) => ({
        id: i.id,
        studentId: i.studentId,
        studentName: `${i.student.firstName} ${i.student.lastName}`,
        reportedById: i.reportedById,
        reportedByName: '',
        incidentDate: i.incidentDate.toISOString().split('T')[0],
        incidentType: i.incidentType,
        location: i.location,
        description: i.description,
        actionsTaken: i.actionsTaken,
        severity: i.severity,
        parentNotified: i.parentNotified,
        adminNotified: i.adminNotified,
        followUpDate: i.followUpDate?.toISOString().split('T')[0] ?? null,
        followUpNotes: i.followUpNotes,
        status: i.status,
        createdAt: i.createdAt.toISOString(),
      })),
      total,
      page,
      limit,
    };
  }

  /**
   * Get behavioral summary for a school.
   */
  static async getSummary(schoolId: string): Promise<BehavioralSummary> {
    const cacheKey = `behavioral:summary:${schoolId}`;

    return cacheService.getOrSet(cacheKey, async () => {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const studentIds = await prisma.student.findMany({
        where: { schoolId },
        select: { id: true },
      });

      const where = {
        studentId: { in: studentIds.map((s) => s.id) },
        incidentDate: { gte: thirtyDaysAgo },
      };

      const [incidents, byType, bySeverity, byStatus] = await Promise.all([
        prisma.behavioralIncident.findMany({
          where,
          include: { student: { select: { firstName: true, lastName: true } } },
          orderBy: { incidentDate: 'desc' },
          take: 10,
        }),
        prisma.behavioralIncident.groupBy({
          by: ['incidentType'],
          where,
          _count: true,
        }),
        prisma.behavioralIncident.groupBy({
          by: ['severity'],
          where,
          _count: true,
        }),
        prisma.behavioralIncident.groupBy({
          by: ['status'],
          where,
          _count: true,
        }),
      ]);

      // Students with most incidents
      const studentCounts = new Map<string, { name: string; count: number }>();
      for (const i of incidents) {
        const key = i.studentId;
        if (!studentCounts.has(key)) {
          studentCounts.set(key, { name: `${i.student.firstName} ${i.student.lastName}`, count: 0 });
        }
        studentCounts.get(key)!.count++;
      }

      // Weekly trend
      const trendData: { week: string; count: number }[] = [];
      for (let w = 3; w >= 0; w--) {
        const weekStart = new Date();
        weekStart.setDate(weekStart.getDate() - (w + 1) * 7);
        const weekEnd = new Date();
        weekEnd.setDate(weekEnd.getDate() - w * 7);
        const weekIncidents = await prisma.behavioralIncident.count({
          where: {
            ...where,
            incidentDate: { gte: weekStart, lt: weekEnd },
          },
        });
        trendData.push({
          week: weekStart.toISOString().split('T')[0],
          count: weekIncidents,
        });
      }

      return {
        totalIncidents: incidents.length,
        byType: byType.map((t) => ({ type: t.incidentType, count: t._count })),
        bySeverity: bySeverity.map((s) => ({ severity: s.severity, count: s._count })),
        byStatus: byStatus.map((s) => ({ status: s.status, count: s._count })),
        recentIncidents: incidents.map((i) => ({
          id: i.id,
          studentId: i.studentId,
          studentName: `${i.student.firstName} ${i.student.lastName}`,
          reportedById: i.reportedById,
          reportedByName: '',
          incidentDate: i.incidentDate.toISOString().split('T')[0],
          incidentType: i.incidentType,
          location: i.location,
          description: i.description,
          actionsTaken: i.actionsTaken,
          severity: i.severity,
          parentNotified: i.parentNotified,
          adminNotified: i.adminNotified,
          followUpDate: i.followUpDate?.toISOString().split('T')[0] ?? null,
          followUpNotes: i.followUpNotes,
          status: i.status,
          createdAt: i.createdAt.toISOString(),
        })),
        frequentStudents: Array.from(studentCounts.entries())
          .map(([studentId, data]) => ({ studentId, studentName: data.name, incidentCount: data.count }))
          .sort((a, b) => b.incidentCount - a.incidentCount)
          .slice(0, 10),
        trendData,
      };
    }, 180);
  }

  /**
   * Get incidents for a specific student.
   */
  static async getStudentIncidents(studentId: string) {
    const incidents = await prisma.behavioralIncident.findMany({
      where: { studentId },
      include: { student: { select: { firstName: true, lastName: true } } },
      orderBy: { incidentDate: 'desc' },
    });

    return incidents.map((i) => ({
      id: i.id,
      studentId: i.studentId,
      studentName: `${i.student.firstName} ${i.student.lastName}`,
      reportedById: i.reportedById,
      reportedByName: '',
      incidentDate: i.incidentDate.toISOString().split('T')[0],
      incidentType: i.incidentType,
      location: i.location,
      description: i.description,
      actionsTaken: i.actionsTaken,
      severity: i.severity,
      parentNotified: i.parentNotified,
      adminNotified: i.adminNotified,
      followUpDate: i.followUpDate?.toISOString().split('T')[0] ?? null,
      followUpNotes: i.followUpNotes,
      status: i.status,
      createdAt: i.createdAt.toISOString(),
    }));
  }
}
