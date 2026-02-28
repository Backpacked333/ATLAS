import { prisma } from '../../utils/prisma';
import { AuditService } from '../../infrastructure/audit/audit.service';
import { eventBus } from '../../infrastructure/events/event-bus';
import { AlertService } from '../../infrastructure/alerts/alert.service';
import { cacheService } from '../../infrastructure/cache/cache.service';
import {
  StaffMemberRecord,
  CreateStaffMemberInput,
  CreateScheduleInput,
  CreateAbsenceInput,
  StaffAbsenceRecord,
  ScheduleDashboard,
  StaffScheduleEntry,
} from './staff-scheduling.types';

// ─── Module 6: Staff Scheduling Coordinator ──────────────────────────

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export class StaffSchedulingService {
  /**
   * Get all staff members for a school.
   */
  static async getStaffMembers(schoolId: string): Promise<StaffMemberRecord[]> {
    const cacheKey = `staff:${schoolId}`;

    return cacheService.getOrSet(cacheKey, async () => {
      const staff = await prisma.staffMember.findMany({
        where: { schoolId, isActive: true },
        include: {
          schedules: {
            where: {
              effectiveFrom: { lte: new Date() },
              OR: [
                { effectiveUntil: null },
                { effectiveUntil: { gte: new Date() } },
              ],
            },
            orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }],
          },
        },
        orderBy: [{ lastName: 'asc' }, { firstName: 'asc' }],
      });

      return staff.map((s) => ({
        id: s.id,
        schoolId: s.schoolId,
        email: s.email,
        firstName: s.firstName,
        lastName: s.lastName,
        role: s.role,
        department: s.department,
        isActive: s.isActive,
        hireDate: s.hireDate?.toISOString().split('T')[0] ?? null,
        certifications: s.certifications,
        schedules: s.schedules.map((sch) => ({
          id: sch.id,
          dayOfWeek: sch.dayOfWeek,
          dayName: DAY_NAMES[sch.dayOfWeek],
          startTime: sch.startTime,
          endTime: sch.endTime,
          location: sch.location,
          duty: sch.duty,
          isRecurring: sch.isRecurring,
        })),
      }));
    }, 300);
  }

  /**
   * Create a new staff member.
   */
  static async createStaffMember(input: CreateStaffMemberInput, schoolId: string, requesterId: string) {
    const staff = await prisma.staffMember.create({
      data: {
        schoolId,
        email: input.email,
        firstName: input.firstName,
        lastName: input.lastName,
        role: input.role,
        department: input.department ?? null,
        hireDate: input.hireDate ? new Date(input.hireDate) : null,
        certifications: (input.certifications as any) ?? null,
      },
    });

    cacheService.invalidateByPrefix(`staff:${schoolId}`);

    await AuditService.log({
      userId: requesterId,
      userRole: 'teacher',
      action: 'CREATE',
      resource: 'StaffMember',
      resourceId: staff.id,
      schoolId,
    });

    return staff;
  }

  /**
   * Create a schedule entry for a staff member.
   */
  static async createSchedule(input: CreateScheduleInput, requesterId: string) {
    const schedule = await prisma.staffSchedule.create({
      data: {
        staffMemberId: input.staffMemberId,
        dayOfWeek: input.dayOfWeek,
        startTime: input.startTime,
        endTime: input.endTime,
        location: input.location ?? null,
        duty: input.duty ?? null,
        isRecurring: input.isRecurring ?? true,
        effectiveFrom: new Date(input.effectiveFrom),
        effectiveUntil: input.effectiveUntil ? new Date(input.effectiveUntil) : null,
      },
    });

    cacheService.invalidateByPrefix('staff:');
    cacheService.invalidateByPrefix('schedule-dashboard:');

    await AuditService.log({
      userId: requesterId,
      userRole: 'teacher',
      action: 'CREATE',
      resource: 'StaffSchedule',
      resourceId: schedule.id,
    });

    return schedule;
  }

  /**
   * Report a staff absence.
   */
  static async reportAbsence(input: CreateAbsenceInput, schoolId: string, requesterId: string): Promise<StaffAbsenceRecord> {
    const absence = await prisma.staffAbsence.create({
      data: {
        staffMemberId: input.staffMemberId,
        startDate: new Date(input.startDate),
        endDate: new Date(input.endDate),
        reason: input.reason,
        notes: input.notes ?? null,
        substituteId: input.substituteId ?? null,
      },
      include: {
        staffMember: { select: { firstName: true, lastName: true } },
      },
    });

    eventBus.publish({
      type: 'schedule.absence_reported',
      payload: {
        staffMemberId: input.staffMemberId,
        startDate: input.startDate,
        endDate: input.endDate,
        reason: input.reason,
      },
      timestamp: new Date(),
      source: 'StaffSchedulingService',
    });

    // Check for coverage gaps
    if (!input.substituteId) {
      await AlertService.create({
        type: 'SCHEDULE_CONFLICT',
        severity: 'WARNING',
        title: 'Staff absence without substitute coverage',
        message: `${absence.staffMember.firstName} ${absence.staffMember.lastName} absent ${input.startDate} to ${input.endDate} — no substitute assigned`,
        resourceType: 'StaffAbsence',
        resourceId: absence.id,
        schoolId,
      });
    }

    cacheService.invalidateByPrefix('schedule-dashboard:');

    await AuditService.log({
      userId: requesterId,
      userRole: 'teacher',
      action: 'CREATE',
      resource: 'StaffAbsence',
      resourceId: absence.id,
      schoolId,
    });

    return {
      id: absence.id,
      staffMemberId: absence.staffMemberId,
      staffName: `${absence.staffMember.firstName} ${absence.staffMember.lastName}`,
      startDate: absence.startDate.toISOString().split('T')[0],
      endDate: absence.endDate.toISOString().split('T')[0],
      reason: absence.reason,
      notes: absence.notes,
      substituteId: absence.substituteId,
      substituteName: null,
      status: absence.status,
    };
  }

  /**
   * Update absence status (approve/deny).
   */
  static async updateAbsenceStatus(
    absenceId: string,
    status: 'APPROVED' | 'DENIED' | 'CANCELLED',
    requesterId: string
  ) {
    const absence = await prisma.staffAbsence.update({
      where: { id: absenceId },
      data: { status, approvedById: requesterId },
    });

    cacheService.invalidateByPrefix('schedule-dashboard:');

    await AuditService.log({
      userId: requesterId,
      userRole: 'teacher',
      action: 'UPDATE',
      resource: 'StaffAbsence',
      resourceId: absenceId,
      details: { status },
    });

    return absence;
  }

  /**
   * Get the schedule dashboard for a school.
   */
  static async getDashboard(schoolId: string): Promise<ScheduleDashboard> {
    const cacheKey = `schedule-dashboard:${schoolId}`;

    return cacheService.getOrSet(cacheKey, async () => {
      const today = new Date();
      const dayOfWeek = today.getDay();
      const todayDate = today.toISOString().split('T')[0];

      const [allStaff, todaySchedules, todayAbsences, upcomingAbsences] = await Promise.all([
        prisma.staffMember.findMany({
          where: { schoolId, isActive: true },
          select: { id: true, firstName: true, lastName: true, role: true },
        }),
        prisma.staffSchedule.findMany({
          where: {
            dayOfWeek,
            staffMember: { schoolId, isActive: true },
            effectiveFrom: { lte: today },
            OR: [{ effectiveUntil: null }, { effectiveUntil: { gte: today } }],
          },
          include: {
            staffMember: { select: { id: true, firstName: true, lastName: true, role: true } },
          },
          orderBy: { startTime: 'asc' },
        }),
        prisma.staffAbsence.findMany({
          where: {
            staffMember: { schoolId },
            startDate: { lte: today },
            endDate: { gte: today },
            status: { in: ['APPROVED', 'PENDING'] },
          },
          include: {
            staffMember: { select: { firstName: true, lastName: true } },
          },
        }),
        prisma.staffAbsence.findMany({
          where: {
            staffMember: { schoolId },
            startDate: { gt: today },
            status: { in: ['APPROVED', 'PENDING'] },
          },
          include: {
            staffMember: { select: { firstName: true, lastName: true } },
          },
          orderBy: { startDate: 'asc' },
          take: 20,
        }),
      ]);

      // Build today's schedule by staff member
      const scheduleByStaff = new Map<string, { name: string; role: string; entries: StaffScheduleEntry[] }>();
      for (const sch of todaySchedules) {
        const key = sch.staffMember.id;
        if (!scheduleByStaff.has(key)) {
          scheduleByStaff.set(key, {
            name: `${sch.staffMember.firstName} ${sch.staffMember.lastName}`,
            role: sch.staffMember.role,
            entries: [],
          });
        }
        scheduleByStaff.get(key)!.entries.push({
          id: sch.id,
          dayOfWeek: sch.dayOfWeek,
          dayName: DAY_NAMES[sch.dayOfWeek],
          startTime: sch.startTime,
          endTime: sch.endTime,
          location: sch.location,
          duty: sch.duty,
          isRecurring: sch.isRecurring,
        });
      }

      const absentStaffIds = new Set(todayAbsences.map((a) => a.staffMemberId));

      // Coverage gaps: absent staff who have scheduled duties today
      const coverageGaps = todaySchedules
        .filter((sch) => absentStaffIds.has(sch.staffMember.id))
        .map((sch) => ({
          time: `${sch.startTime} - ${sch.endTime}`,
          location: sch.location ?? 'Unknown',
          duty: sch.duty ?? 'Regular duties',
          absentStaff: `${sch.staffMember.firstName} ${sch.staffMember.lastName}`,
        }));

      // Staff summary by role
      const roleCounts = new Map<string, number>();
      for (const s of allStaff) {
        roleCounts.set(s.role, (roleCounts.get(s.role) || 0) + 1);
      }

      const mapAbsence = (a: typeof todayAbsences[0]): StaffAbsenceRecord => ({
        id: a.id,
        staffMemberId: a.staffMemberId,
        staffName: `${a.staffMember.firstName} ${a.staffMember.lastName}`,
        startDate: a.startDate.toISOString().split('T')[0],
        endDate: a.endDate.toISOString().split('T')[0],
        reason: a.reason,
        notes: a.notes,
        substituteId: a.substituteId,
        substituteName: null,
        status: a.status,
      });

      return {
        todaySchedule: Array.from(scheduleByStaff.entries()).map(([staffMemberId, data]) => ({
          staffMemberId,
          staffName: data.name,
          role: data.role,
          entries: data.entries,
        })),
        todayAbsences: todayAbsences.map(mapAbsence),
        upcomingAbsences: upcomingAbsences.map(mapAbsence),
        coverageGaps,
        staffSummary: {
          totalStaff: allStaff.length,
          presentToday: allStaff.length - absentStaffIds.size,
          absentToday: absentStaffIds.size,
          byRole: Array.from(roleCounts.entries())
            .map(([role, count]) => ({ role, count }))
            .sort((a, b) => b.count - a.count),
        },
      };
    }, 120);
  }
}
