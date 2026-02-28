import { prisma } from '../../utils/prisma';
import { AuditService } from '../../infrastructure/audit/audit.service';
import { eventBus } from '../../infrastructure/events/event-bus';
import { AlertService } from '../../infrastructure/alerts/alert.service';
import { cacheService } from '../../infrastructure/cache/cache.service';
import {
  AttendanceRecordInput,
  BulkAttendanceInput,
  AttendanceQueryParams,
  StudentAttendanceSummary,
  AttendancePattern,
  AttendanceDashboard,
} from './attendance.types';

// ─── Module 3: Attendance Tracking Module ─────────────────────────────

export class AttendanceService {
  /**
   * Record a single attendance entry.
   */
  static async recordAttendance(input: AttendanceRecordInput, requesterId: string) {
    const record = await prisma.attendanceRecord.upsert({
      where: {
        studentId_date_period: {
          studentId: input.studentId,
          date: new Date(input.date),
          period: input.period ?? 'ALL',
        },
      },
      create: {
        studentId: input.studentId,
        date: new Date(input.date),
        period: input.period ?? null,
        status: input.status,
      },
      update: {
        status: input.status,
      },
    });

    eventBus.publish({
      type: 'attendance.recorded',
      payload: {
        studentId: input.studentId,
        date: input.date,
        status: input.status,
        period: input.period || 'ALL',
      },
      timestamp: new Date(),
      source: 'AttendanceService',
    });

    // Check for absence patterns
    if (input.status === 'ABSENT') {
      await this.checkAbsencePatterns(input.studentId, requesterId);
    }

    await AuditService.log({
      userId: requesterId,
      userRole: 'teacher',
      action: 'CREATE',
      resource: 'AttendanceRecord',
      resourceId: record.id,
      details: { studentId: input.studentId, status: input.status },
    });

    cacheService.invalidateByPrefix(`attendance:${input.studentId}`);

    return record;
  }

  /**
   * Record attendance for an entire section at once.
   */
  static async recordBulkAttendance(input: BulkAttendanceInput, requesterId: string) {
    const results = await Promise.all(
      input.records.map((record) =>
        this.recordAttendance(
          {
            studentId: record.studentId,
            date: input.date,
            period: input.period,
            status: record.status,
          },
          requesterId
        )
      )
    );

    await AuditService.log({
      userId: requesterId,
      userRole: 'teacher',
      action: 'CREATE',
      resource: 'AttendanceRecord',
      details: {
        sectionId: input.sectionId,
        date: input.date,
        recordCount: results.length,
      },
    });

    return { recorded: results.length, date: input.date, sectionId: input.sectionId };
  }

  /**
   * Query attendance records with filters.
   */
  static async queryRecords(params: AttendanceQueryParams) {
    const where: Record<string, unknown> = {
      date: {
        gte: new Date(params.startDate),
        lte: new Date(params.endDate),
      },
    };
    if (params.studentId) where.studentId = params.studentId;
    if (params.status) where.status = params.status;
    if (params.period) where.period = params.period;

    if (params.sectionId) {
      const studentIds = await prisma.enrollment.findMany({
        where: { sectionId: params.sectionId, status: 'ACTIVE' },
        select: { studentId: true },
      });
      where.studentId = { in: studentIds.map((e) => e.studentId) };
    }

    return prisma.attendanceRecord.findMany({
      where,
      include: { student: { select: { firstName: true, lastName: true, studentIdNo: true } } },
      orderBy: [{ date: 'desc' }, { period: 'asc' }],
    });
  }

  /**
   * Get attendance summary for a specific student.
   */
  static async getStudentSummary(studentId: string, days = 90): Promise<StudentAttendanceSummary> {
    const cacheKey = `attendance:${studentId}:summary:${days}`;

    return cacheService.getOrSet(cacheKey, async () => {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const [student, records] = await Promise.all([
        prisma.student.findUniqueOrThrow({
          where: { id: studentId },
          select: { firstName: true, lastName: true },
        }),
        prisma.attendanceRecord.findMany({
          where: { studentId, date: { gte: startDate } },
          orderBy: { date: 'desc' },
        }),
      ]);

      // Calculate daily attendance (deduplicate by date)
      const dayMap = new Map<string, string>();
      for (const r of records) {
        const dateKey = r.date.toISOString().split('T')[0];
        const existing = dayMap.get(dateKey);
        // ABSENT takes priority, then TARDY, then EXCUSED, then PRESENT
        if (!existing || this.statusPriority(r.status) > this.statusPriority(existing)) {
          dayMap.set(dateKey, r.status);
        }
      }

      const totalDays = dayMap.size || 1;
      let presentDays = 0;
      let absentDays = 0;
      let tardyDays = 0;
      let excusedDays = 0;

      for (const status of dayMap.values()) {
        switch (status) {
          case 'PRESENT': presentDays++; break;
          case 'ABSENT': absentDays++; break;
          case 'TARDY': tardyDays++; break;
          case 'EXCUSED': excusedDays++; break;
        }
      }

      const attendanceRate = Math.round(((totalDays - absentDays) / totalDays) * 1000) / 10;

      // Calculate consecutive absences
      const consecutiveAbsences = this.calcConsecutiveAbsences(dayMap);

      // Detect patterns
      const patterns = this.detectPatterns(records, dayMap);

      return {
        studentId,
        studentName: `${student.firstName} ${student.lastName}`,
        totalDays,
        presentDays,
        absentDays,
        tardyDays,
        excusedDays,
        attendanceRate,
        consecutiveAbsences,
        isChronicallyAbsent: attendanceRate < 90,
        patterns,
      };
    }, 120);
  }

  /**
   * Get the attendance dashboard for a school.
   */
  static async getDashboard(schoolId: string, teacherSectionIds: string[]): Promise<AttendanceDashboard> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

    // Today's attendance across teacher's sections
    const sectionStudents = await prisma.enrollment.findMany({
      where: { sectionId: { in: teacherSectionIds }, status: 'ACTIVE' },
      select: { studentId: true, sectionId: true },
    });

    const studentIds = [...new Set(sectionStudents.map((e) => e.studentId))];

    const todayRecords = await prisma.attendanceRecord.findMany({
      where: { studentId: { in: studentIds }, date: today },
    });

    const presentCount = new Set(todayRecords.filter((r) => r.status === 'PRESENT').map((r) => r.studentId)).size;
    const absentCount = new Set(todayRecords.filter((r) => r.status === 'ABSENT').map((r) => r.studentId)).size;
    const tardyCount = new Set(todayRecords.filter((r) => r.status === 'TARDY').map((r) => r.studentId)).size;

    // Chronic absent students (last 90 days)
    const allRecords = await prisma.attendanceRecord.findMany({
      where: { studentId: { in: studentIds }, date: { gte: ninetyDaysAgo } },
      include: { student: { select: { firstName: true, lastName: true } } },
    });

    const studentAttendance = new Map<string, { name: string; total: number; absent: number; consec: number }>();
    for (const r of allRecords) {
      const key = r.studentId;
      if (!studentAttendance.has(key)) {
        studentAttendance.set(key, {
          name: `${r.student.firstName} ${r.student.lastName}`,
          total: 0,
          absent: 0,
          consec: 0,
        });
      }
      const entry = studentAttendance.get(key)!;
      entry.total++;
      if (r.status === 'ABSENT') entry.absent++;
    }

    const chronicAbsentStudents = Array.from(studentAttendance.entries())
      .map(([studentId, data]) => ({
        studentId,
        studentName: data.name,
        attendanceRate: data.total > 0 ? Math.round(((data.total - data.absent) / data.total) * 1000) / 10 : 100,
        consecutiveAbsences: 0,
      }))
      .filter((s) => s.attendanceRate < 90)
      .sort((a, b) => a.attendanceRate - b.attendanceRate)
      .slice(0, 15);

    // Section summaries
    const sections = await prisma.section.findMany({
      where: { id: { in: teacherSectionIds } },
      select: { id: true, courseName: true, period: true },
    });

    const sectionSummaries = sections.map((section) => {
      const sectionStudentIds = sectionStudents
        .filter((e) => e.sectionId === section.id)
        .map((e) => e.studentId);
      const sectionRecords = todayRecords.filter((r) => sectionStudentIds.includes(r.studentId));
      const sPresent = sectionRecords.filter((r) => r.status === 'PRESENT').length;
      const sAbsent = sectionRecords.filter((r) => r.status === 'ABSENT').length;
      const sTardy = sectionRecords.filter((r) => r.status === 'TARDY').length;

      return {
        sectionId: section.id,
        courseName: section.courseName,
        period: section.period,
        date: today.toISOString().split('T')[0],
        totalStudents: sectionStudentIds.length,
        presentCount: sPresent,
        absentCount: sAbsent,
        tardyCount: sTardy,
        attendanceRate: sectionStudentIds.length > 0
          ? Math.round((sPresent / sectionStudentIds.length) * 1000) / 10
          : 100,
      };
    });

    // 7-day trend
    const recentTrend: { date: string; rate: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      d.setHours(0, 0, 0, 0);
      const dayRecords = allRecords.filter(
        (r) => r.date.toISOString().split('T')[0] === d.toISOString().split('T')[0]
      );
      const dayStudents = new Set(dayRecords.map((r) => r.studentId));
      const dayPresent = new Set(
        dayRecords.filter((r) => r.status === 'PRESENT').map((r) => r.studentId)
      );
      recentTrend.push({
        date: d.toISOString().split('T')[0],
        rate: dayStudents.size > 0 ? Math.round((dayPresent.size / dayStudents.size) * 1000) / 10 : 100,
      });
    }

    return {
      todaySummary: {
        totalStudents: studentIds.length,
        presentCount,
        absentCount,
        tardyCount,
        schoolAttendanceRate: studentIds.length > 0
          ? Math.round((presentCount / studentIds.length) * 1000) / 10
          : 100,
      },
      chronicAbsentStudents,
      sectionSummaries,
      recentTrend,
    };
  }

  // ─── Private Helpers ──────────────────────────────────────────────────

  private static statusPriority(status: string): number {
    switch (status) {
      case 'ABSENT': return 3;
      case 'TARDY': return 2;
      case 'EXCUSED': return 1;
      case 'PRESENT': return 0;
      default: return -1;
    }
  }

  private static calcConsecutiveAbsences(dayMap: Map<string, string>): number {
    const dates = Array.from(dayMap.keys()).sort().reverse();
    let streak = 0;
    for (const date of dates) {
      if (dayMap.get(date) === 'ABSENT') {
        streak++;
      } else {
        break;
      }
    }
    return streak;
  }

  private static detectPatterns(
    records: { date: Date; status: string; period: string | null }[],
    dayMap: Map<string, string>
  ): AttendancePattern[] {
    const patterns: AttendancePattern[] = [];

    // Day-of-week pattern
    const dayAbsences = [0, 0, 0, 0, 0, 0, 0]; // Sun-Sat
    const dayTotal = [0, 0, 0, 0, 0, 0, 0];
    for (const r of records) {
      const day = new Date(r.date).getDay();
      dayTotal[day]++;
      if (r.status === 'ABSENT') dayAbsences[day]++;
    }

    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    for (let i = 1; i <= 5; i++) { // Weekdays only
      if (dayTotal[i] >= 3 && dayAbsences[i] / dayTotal[i] > 0.4) {
        patterns.push({
          type: 'day_of_week',
          description: `Frequent absences on ${dayNames[i]}s (${Math.round((dayAbsences[i] / dayTotal[i]) * 100)}% absent)`,
          severity: 'warning',
          data: { day: dayNames[i], absenceRate: dayAbsences[i] / dayTotal[i] },
        });
      }
    }

    // Consecutive absence pattern
    const consecutiveAbsences = this.calcConsecutiveAbsences(dayMap);
    if (consecutiveAbsences >= 3) {
      patterns.push({
        type: 'consecutive',
        description: `${consecutiveAbsences} consecutive school days absent`,
        severity: consecutiveAbsences >= 5 ? 'critical' : 'warning',
        data: { days: consecutiveAbsences },
      });
    }

    return patterns;
  }

  /**
   * Check if a student has concerning absence patterns and create alerts.
   */
  private static async checkAbsencePatterns(studentId: string, requesterId: string): Promise<void> {
    const summary = await this.getStudentSummary(studentId, 30);

    if (summary.consecutiveAbsences >= 3) {
      const student = await prisma.student.findUnique({
        where: { id: studentId },
        select: { firstName: true, lastName: true, schoolId: true },
      });

      if (student) {
        await AlertService.create({
          type: 'ATTENDANCE_PATTERN',
          severity: summary.consecutiveAbsences >= 5 ? 'CRITICAL' : 'WARNING',
          title: `${summary.consecutiveAbsences} consecutive absences`,
          message: `${student.firstName} ${student.lastName} has been absent for ${summary.consecutiveAbsences} consecutive days`,
          resourceType: 'Student',
          resourceId: studentId,
          schoolId: student.schoolId,
          recipientId: requesterId,
        });

        eventBus.publish({
          type: 'attendance.pattern_detected',
          payload: {
            studentId,
            date: new Date().toISOString().split('T')[0],
            consecutiveAbsences: summary.consecutiveAbsences,
            attendanceRate: summary.attendanceRate,
          },
          timestamp: new Date(),
          source: 'AttendanceService',
        });
      }
    }
  }
}
