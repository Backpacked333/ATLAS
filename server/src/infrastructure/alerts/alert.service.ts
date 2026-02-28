import { prisma } from '../../utils/prisma';
import { eventBus } from '../events/event-bus';

// ─── Alert Types ──────────────────────────────────────────────────────

export interface CreateAlertInput {
  type: 'ATTENDANCE_PATTERN' | 'GRADE_DROP' | 'BEHAVIORAL_INCIDENT' | 'COMPLIANCE_DEADLINE' | 'SCHEDULE_CONFLICT' | 'SYSTEM_HEALTH' | 'IEP_REVIEW_DUE' | 'MISSING_WORK_THRESHOLD';
  severity: 'INFO' | 'WARNING' | 'CRITICAL';
  title: string;
  message: string;
  resourceType?: string;
  resourceId?: string;
  schoolId?: string;
  recipientId?: string;
}

// ─── Alert Service ────────────────────────────────────────────────────

export class AlertService {
  /**
   * Create a new alert and publish it to the event bus.
   */
  static async create(input: CreateAlertInput) {
    const alert = await prisma.alert.create({
      data: {
        type: input.type,
        severity: input.severity,
        title: input.title,
        message: input.message,
        resourceType: input.resourceType ?? null,
        resourceId: input.resourceId ?? null,
        schoolId: input.schoolId ?? null,
        recipientId: input.recipientId ?? null,
      },
    });

    // Publish event for real-time notification
    eventBus.publish({
      type: 'student.updated',
      payload: {
        alertId: alert.id,
        alertType: alert.type,
        severity: alert.severity,
        studentId: input.resourceId || '',
        schoolId: input.schoolId || '',
      },
      timestamp: new Date(),
      source: 'AlertService',
    });

    return alert;
  }

  /**
   * Get alerts for a specific recipient.
   */
  static async getForRecipient(recipientId: string, params?: { unreadOnly?: boolean; limit?: number }) {
    const where: Record<string, unknown> = { recipientId };
    if (params?.unreadOnly) {
      where.isRead = false;
      where.isDismissed = false;
    }

    return prisma.alert.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: params?.limit ?? 50,
    });
  }

  /**
   * Get alerts for a school.
   */
  static async getForSchool(schoolId: string, params?: { type?: string; limit?: number }) {
    const where: Record<string, unknown> = { schoolId };
    if (params?.type) where.type = params.type;

    return prisma.alert.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: params?.limit ?? 100,
    });
  }

  /**
   * Mark an alert as read.
   */
  static async markRead(alertId: string) {
    return prisma.alert.update({
      where: { id: alertId },
      data: { isRead: true, readAt: new Date() },
    });
  }

  /**
   * Dismiss an alert.
   */
  static async dismiss(alertId: string) {
    return prisma.alert.update({
      where: { id: alertId },
      data: { isDismissed: true, isRead: true, readAt: new Date() },
    });
  }

  /**
   * Get unread alert count.
   */
  static async getUnreadCount(recipientId: string): Promise<number> {
    return prisma.alert.count({
      where: { recipientId, isRead: false, isDismissed: false },
    });
  }
}
