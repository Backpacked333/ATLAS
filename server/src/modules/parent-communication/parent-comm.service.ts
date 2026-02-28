import { prisma } from '../../utils/prisma';
import { AuditService } from '../../infrastructure/audit/audit.service';
import { eventBus } from '../../infrastructure/events/event-bus';
import { cacheService } from '../../infrastructure/cache/cache.service';
import { NotFoundError, ForbiddenError } from '../../utils/errors';
import {
  SendMessageInput,
  MessageRecord,
  MessageThread,
  MessageSearchParams,
  CommunicationDashboard,
  CreateParentContactInput,
} from './parent-comm.types';

// ─── Module 7: Parent Communication Portal ───────────────────────────

export class ParentCommunicationService {
  /**
   * Send a message.
   */
  static async sendMessage(
    input: SendMessageInput,
    senderId: string,
    senderType: 'TEACHER' | 'GUARDIAN'
  ): Promise<MessageRecord> {
    const threadId = input.threadId || `thread_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

    const message = await prisma.parentMessage.create({
      data: {
        threadId,
        senderId,
        senderType,
        recipientId: input.recipientId,
        recipientType: input.recipientType,
        studentId: input.studentId ?? null,
        subject: input.subject,
        body: input.body,
        priority: input.priority ?? 'NORMAL',
        channel: input.channel ?? 'IN_APP',
      },
      include: {
        student: { select: { firstName: true, lastName: true } },
      },
    });

    eventBus.publish({
      type: 'communication.message_sent',
      payload: {
        messageId: message.id,
        threadId,
        senderId,
        senderType,
        recipientId: input.recipientId,
      },
      timestamp: new Date(),
      source: 'ParentCommunicationService',
    });

    await AuditService.log({
      userId: senderId,
      userRole: senderType.toLowerCase(),
      action: 'CREATE',
      resource: 'ParentMessage',
      resourceId: message.id,
      details: { recipientId: input.recipientId, subject: input.subject },
    });

    cacheService.invalidateByPrefix(`messages:${senderId}`);
    cacheService.invalidateByPrefix(`messages:${input.recipientId}`);

    // Resolve names
    const senderName = await this.resolveUserName(senderId, senderType);
    const recipientName = await this.resolveUserName(input.recipientId, input.recipientType);

    return {
      id: message.id,
      threadId: message.threadId,
      senderId: message.senderId,
      senderType: message.senderType,
      senderName,
      recipientId: message.recipientId,
      recipientType: message.recipientType,
      recipientName,
      studentId: message.studentId,
      studentName: message.student ? `${message.student.firstName} ${message.student.lastName}` : null,
      subject: message.subject,
      body: message.body,
      isRead: message.isRead,
      readAt: null,
      priority: message.priority,
      channel: message.channel,
      createdAt: message.createdAt.toISOString(),
    };
  }

  /**
   * Get messages for a user with filtering.
   */
  static async getMessages(params: MessageSearchParams): Promise<{
    messages: MessageRecord[];
    total: number;
  }> {
    const page = params.page ?? 1;
    const limit = Math.min(params.limit ?? 25, 100);
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {
      OR: [
        { senderId: params.userId, senderType: params.userType },
        { recipientId: params.userId, recipientType: params.userType },
      ],
    };

    if (params.unreadOnly) {
      where.recipientId = params.userId;
      where.recipientType = params.userType;
      where.isRead = false;
      delete where.OR;
    }
    if (params.studentId) where.studentId = params.studentId;
    if (params.priority) where.priority = params.priority;

    const [messages, total] = await Promise.all([
      prisma.parentMessage.findMany({
        where,
        include: { student: { select: { firstName: true, lastName: true } } },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.parentMessage.count({ where }),
    ]);

    const resolvedMessages = await Promise.all(
      messages.map(async (m) => {
        const senderName = await this.resolveUserName(m.senderId, m.senderType as 'TEACHER' | 'GUARDIAN');
        const recipientName = await this.resolveUserName(m.recipientId, m.recipientType as 'TEACHER' | 'GUARDIAN');

        return {
          id: m.id,
          threadId: m.threadId,
          senderId: m.senderId,
          senderType: m.senderType,
          senderName,
          recipientId: m.recipientId,
          recipientType: m.recipientType,
          recipientName,
          studentId: m.studentId,
          studentName: m.student ? `${m.student.firstName} ${m.student.lastName}` : null,
          subject: m.subject,
          body: m.body,
          isRead: m.isRead,
          readAt: m.readAt?.toISOString() ?? null,
          priority: m.priority,
          channel: m.channel,
          createdAt: m.createdAt.toISOString(),
        };
      })
    );

    return { messages: resolvedMessages, total };
  }

  /**
   * Get a message thread.
   */
  static async getThread(threadId: string): Promise<MessageThread | null> {
    const messages = await prisma.parentMessage.findMany({
      where: { threadId },
      include: { student: { select: { firstName: true, lastName: true } } },
      orderBy: { createdAt: 'asc' },
    });

    if (messages.length === 0) return null;

    const participantMap = new Map<string, { id: string; name: string; type: string }>();
    for (const m of messages) {
      if (!participantMap.has(m.senderId)) {
        const name = await this.resolveUserName(m.senderId, m.senderType as 'TEACHER' | 'GUARDIAN');
        participantMap.set(m.senderId, { id: m.senderId, name, type: m.senderType });
      }
      if (!participantMap.has(m.recipientId)) {
        const name = await this.resolveUserName(m.recipientId, m.recipientType as 'TEACHER' | 'GUARDIAN');
        participantMap.set(m.recipientId, { id: m.recipientId, name, type: m.recipientType });
      }
    }

    const first = messages[0];
    const last = messages[messages.length - 1];

    const resolvedMessages = await Promise.all(
      messages.map(async (m) => ({
        id: m.id,
        threadId: m.threadId,
        senderId: m.senderId,
        senderType: m.senderType,
        senderName: participantMap.get(m.senderId)?.name ?? 'Unknown',
        recipientId: m.recipientId,
        recipientType: m.recipientType,
        recipientName: participantMap.get(m.recipientId)?.name ?? 'Unknown',
        studentId: m.studentId,
        studentName: m.student ? `${m.student.firstName} ${m.student.lastName}` : null,
        subject: m.subject,
        body: m.body,
        isRead: m.isRead,
        readAt: m.readAt?.toISOString() ?? null,
        priority: m.priority,
        channel: m.channel,
        createdAt: m.createdAt.toISOString(),
      }))
    );

    return {
      threadId,
      subject: first.subject,
      participants: Array.from(participantMap.values()),
      studentId: first.studentId,
      studentName: first.student ? `${first.student.firstName} ${first.student.lastName}` : null,
      messageCount: messages.length,
      lastMessageAt: last.createdAt.toISOString(),
      hasUnread: messages.some((m) => !m.isRead),
      messages: resolvedMessages,
    };
  }

  /**
   * Mark a message as read.
   * Validates that the user is the recipient of the message.
   */
  static async markRead(messageId: string, userId: string) {
    // First, verify the user has access to this message
    const message = await prisma.parentMessage.findUnique({
      where: { id: messageId },
    });

    if (!message) {
      throw new NotFoundError('Message');
    }

    // Only the recipient can mark a message as read
    if (message.recipientId !== userId) {
      throw new ForbiddenError('You do not have access to this message');
    }

    const updatedMessage = await prisma.parentMessage.update({
      where: { id: messageId },
      data: { isRead: true, readAt: new Date() },
    });

    eventBus.publish({
      type: 'communication.message_read',
      payload: { messageId, readBy: userId },
      timestamp: new Date(),
      source: 'ParentCommunicationService',
    });

    cacheService.invalidateByPrefix(`messages:${userId}`);

    return updatedMessage;
  }

  /**
   * Mark all messages in a thread as read for a user.
   */
  static async markThreadRead(threadId: string, userId: string) {
    await prisma.parentMessage.updateMany({
      where: { threadId, recipientId: userId, isRead: false },
      data: { isRead: true, readAt: new Date() },
    });

    cacheService.invalidateByPrefix(`messages:${userId}`);
  }

  /**
   * Log a parent contact (phone call, in-person, etc.)
   */
  static async logParentContact(input: CreateParentContactInput, teacherId: string) {
    const contact = await prisma.parentContact.create({
      data: {
        studentId: input.studentId,
        teacherId,
        guardianId: input.guardianId ?? null,
        method: input.method,
        subject: input.subject,
        notes: input.notes,
      },
    });

    await AuditService.log({
      userId: teacherId,
      userRole: 'teacher',
      action: 'CREATE',
      resource: 'ParentContact',
      resourceId: contact.id,
      details: { studentId: input.studentId, method: input.method },
    });

    return contact;
  }

  /**
   * Get the communication dashboard for a teacher.
   */
  static async getDashboard(teacherId: string): Promise<CommunicationDashboard> {
    const cacheKey = `messages:${teacherId}:dashboard`;

    return cacheService.getOrSet(cacheKey, async () => {
      const firstOfMonth = new Date();
      firstOfMonth.setDate(1);
      firstOfMonth.setHours(0, 0, 0, 0);

      const [unreadCount, recentMessages, parentContacts, sentCount, receivedCount] = await Promise.all([
        prisma.parentMessage.count({
          where: { recipientId: teacherId, recipientType: 'TEACHER', isRead: false },
        }),
        prisma.parentMessage.findMany({
          where: {
            OR: [
              { senderId: teacherId, senderType: 'TEACHER' },
              { recipientId: teacherId, recipientType: 'TEACHER' },
            ],
          },
          include: { student: { select: { firstName: true, lastName: true } } },
          orderBy: { createdAt: 'desc' },
          take: 20,
        }),
        prisma.parentContact.findMany({
          where: { teacherId },
          include: { student: { select: { firstName: true, lastName: true } } },
          orderBy: { createdAt: 'desc' },
          take: 10,
        }),
        prisma.parentMessage.count({
          where: { senderId: teacherId, senderType: 'TEACHER' },
        }),
        prisma.parentMessage.count({
          where: { recipientId: teacherId, recipientType: 'TEACHER' },
        }),
      ]);

      // Group messages by thread for recent threads
      const threadMap = new Map<string, typeof recentMessages>();
      for (const m of recentMessages) {
        const threadId = m.threadId || m.id;
        if (!threadMap.has(threadId)) threadMap.set(threadId, []);
        threadMap.get(threadId)!.push(m);
      }

      const recentThreads = await Promise.all(
        Array.from(threadMap.entries())
          .slice(0, 10)
          .map(async ([threadId, msgs]) => {
            const last = msgs[0]; // Already sorted by createdAt desc
            const otherParticipant = last.senderId === teacherId ? last.recipientId : last.senderId;
            const otherType = last.senderId === teacherId ? last.recipientType : last.senderType;
            const participantName = await this.resolveUserName(
              otherParticipant,
              otherType as 'TEACHER' | 'GUARDIAN'
            );

            return {
              threadId,
              subject: last.subject,
              lastMessage: last.body.slice(0, 100),
              lastMessageAt: last.createdAt.toISOString(),
              participantName,
              studentName: last.student ? `${last.student.firstName} ${last.student.lastName}` : null,
              hasUnread: msgs.some((m) => !m.isRead && m.recipientId === teacherId),
            };
          })
      );

      const parentContactsThisMonth = await prisma.parentContact.count({
        where: { teacherId, createdAt: { gte: firstOfMonth } },
      });

      return {
        unreadCount,
        recentThreads,
        recentContacts: parentContacts.map((c) => ({
          id: c.id,
          studentId: c.studentId,
          studentName: `${c.student.firstName} ${c.student.lastName}`,
          method: c.method,
          subject: c.subject,
          date: c.createdAt.toISOString().split('T')[0],
        })),
        stats: {
          totalMessagesSent: sentCount,
          totalMessagesReceived: receivedCount,
          averageResponseTime: null,
          parentContactsThisMonth,
        },
      };
    }, 60);
  }

  // ─── Private Helpers ──────────────────────────────────────────────────

  private static async resolveUserName(userId: string, userType: string): Promise<string> {
    const cacheKey = `username:${userId}`;
    const cached = cacheService.get<string>(cacheKey);
    if (cached) return cached;

    let name = 'Unknown';

    if (userType === 'TEACHER') {
      const teacher = await prisma.teacher.findUnique({
        where: { id: userId },
        select: { firstName: true, lastName: true },
      });
      if (teacher) name = `${teacher.firstName} ${teacher.lastName}`;
    } else if (userType === 'GUARDIAN') {
      const guardian = await prisma.guardian.findUnique({
        where: { id: userId },
        select: { firstName: true, lastName: true },
      });
      if (guardian) name = `${guardian.firstName} ${guardian.lastName}`;
    } else if (userType === 'SYSTEM') {
      name = 'ATLAS System';
    }

    cacheService.set(cacheKey, name, 600);
    return name;
  }
}
