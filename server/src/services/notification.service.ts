import { prisma } from '../utils/prisma';

export async function getTeacherNotifications(
  teacherId: string,
  unreadOnly = false,
  limit = 50
) {
  return prisma.notification.findMany({
    where: {
      teacherId,
      ...(unreadOnly ? { isRead: false } : {}),
    },
    orderBy: { createdAt: 'desc' },
    take: limit,
  });
}

export async function markNotificationRead(notificationId: string, teacherId: string) {
  return prisma.notification.updateMany({
    where: {
      id: notificationId,
      teacherId,
    },
    data: { isRead: true },
  });
}

export async function markAllNotificationsRead(teacherId: string) {
  return prisma.notification.updateMany({
    where: {
      teacherId,
      isRead: false,
    },
    data: { isRead: true },
  });
}

export async function getUnreadCount(teacherId: string): Promise<number> {
  return prisma.notification.count({
    where: {
      teacherId,
      isRead: false,
    },
  });
}

/**
 * Generate notifications based on data conditions.
 * This would typically run as a scheduled job.
 */
export async function generateNotifications(schoolId: string) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // 1. Absent streak notifications (3+ consecutive days)
  const students = await prisma.student.findMany({
    where: { schoolId },
    include: {
      attendanceRecords: {
        where: { date: today, status: 'ABSENT' },
      },
      enrollments: {
        where: { status: 'ACTIVE' },
        include: {
          section: {
            include: {
              teachers: { include: { teacher: true } },
            },
          },
        },
      },
    },
  });

  for (const student of students) {
    if (student.attendanceRecords.length === 0) continue;

    // Check consecutive days
    let consecutiveDays = 1;
    const checkDate = new Date(today);
    for (let i = 1; i < 10; i++) {
      checkDate.setDate(checkDate.getDate() - 1);
      while (checkDate.getDay() === 0 || checkDate.getDay() === 6) {
        checkDate.setDate(checkDate.getDate() - 1);
      }
      const prev = await prisma.attendanceRecord.findFirst({
        where: { studentId: student.id, date: checkDate, status: 'ABSENT' },
      });
      if (!prev) break;
      consecutiveDays++;
    }

    if (consecutiveDays >= 3) {
      for (const enrollment of student.enrollments) {
        for (const ts of enrollment.section.teachers) {
          // Check if notification already exists today
          const existing = await prisma.notification.findFirst({
            where: {
              teacherId: ts.teacherId,
              studentId: student.id,
              type: 'ABSENT_STREAK',
              createdAt: { gte: today },
            },
          });

          if (!existing) {
            await prisma.notification.create({
              data: {
                teacherId: ts.teacherId,
                schoolId,
                studentId: student.id,
                type: 'ABSENT_STREAK',
                title: `${student.firstName} ${student.lastName} — ${consecutiveDays} consecutive absences`,
                body: `${student.firstName} ${student.lastName} has been absent for ${consecutiveDays} consecutive days. Consider reaching out to parent.`,
                channel: consecutiveDays >= 5 ? 'BOTH' : 'IN_APP',
              },
            });
          }
        }
      }
    }
  }
}
