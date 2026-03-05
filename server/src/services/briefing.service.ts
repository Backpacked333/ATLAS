import { prisma } from '../utils/prisma';
import { getTeacherStudentIds } from '../middleware/ferpa';
import { absenceSeverity } from '../utils/grades';
import {
  MorningBriefing,
  AbsentStudent,
  GradeAlert,
  MissingWorkItem,
  InterventionTask,
  AccommodationAlert,
  NewStudent,
  EnhancedMorningBriefing,
  PriorityAction,
  TodayStats,
  Celebration,
  WeekAhead,
} from '../types';

export async function getMorningBriefing(teacherId: string): Promise<MorningBriefing> {
  const studentIds = await getTeacherStudentIds(teacherId);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [absentToday, gradeAlerts, missingWorkQueue, interventionTasks, accommodationAlerts, newStudents] =
    await Promise.all([
      getAbsentStudents(studentIds, today),
      getGradeAlerts(teacherId, studentIds),
      getMissingWork(teacherId, studentIds),
      getInterventionTasks(teacherId, today),
      getAccommodationAlerts(teacherId, studentIds),
      getNewStudents(teacherId),
    ]);

  return {
    absentToday,
    gradeAlerts,
    missingWorkQueue,
    interventionTasks,
    accommodationAlerts,
    newStudents,
  };
}

async function getAbsentStudents(studentIds: string[], today: Date): Promise<AbsentStudent[]> {
  const absences = await prisma.attendanceRecord.findMany({
    where: {
      studentId: { in: studentIds },
      date: today,
      status: 'ABSENT',
    },
    include: {
      student: {
        select: { id: true, firstName: true, lastName: true, photoUrl: true },
      },
    },
  });

  // Group by student and calculate consecutive days
  const studentAbsences = new Map<string, { student: typeof absences[0]['student']; periods: string[] }>();

  for (const absence of absences) {
    const existing = studentAbsences.get(absence.studentId);
    if (existing) {
      if (absence.period) existing.periods.push(absence.period);
    } else {
      studentAbsences.set(absence.studentId, {
        student: absence.student,
        periods: absence.period ? [absence.period] : ['All Day'],
      });
    }
  }

  const results: AbsentStudent[] = [];

  for (const [studentId, data] of studentAbsences) {
    const consecutiveDays = await getConsecutiveAbsenceDays(studentId, today);
    results.push({
      studentId,
      firstName: data.student.firstName,
      lastName: data.student.lastName,
      photoUrl: data.student.photoUrl,
      periods: data.periods,
      consecutiveDays,
      severity: absenceSeverity(consecutiveDays),
    });
  }

  // Sort by consecutive days descending
  results.sort((a, b) => b.consecutiveDays - a.consecutiveDays);
  return results;
}

async function getConsecutiveAbsenceDays(studentId: string, fromDate: Date): Promise<number> {
  let days = 0;
  const checkDate = new Date(fromDate);

  for (let i = 0; i < 30; i++) {
    const absence = await prisma.attendanceRecord.findFirst({
      where: {
        studentId,
        date: checkDate,
        status: 'ABSENT',
        period: null, // whole-day absence
      },
    });

    // Also check if ALL periods are absent
    if (!absence) {
      const periodAbsences = await prisma.attendanceRecord.findMany({
        where: {
          studentId,
          date: checkDate,
          status: 'ABSENT',
        },
      });
      if (periodAbsences.length === 0) break;
    }

    days++;
    checkDate.setDate(checkDate.getDate() - 1);
    // Skip weekends
    while (checkDate.getDay() === 0 || checkDate.getDay() === 6) {
      checkDate.setDate(checkDate.getDate() - 1);
    }
  }

  return days;
}

async function getGradeAlerts(teacherId: string, studentIds: string[]): Promise<GradeAlert[]> {
  const twoWeeksAgo = new Date();
  twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);

  // Get teacher's sections
  const sections = await prisma.teacherSection.findMany({
    where: { teacherId },
    include: {
      section: {
        include: {
          assignments: {
            include: {
              grades: {
                where: { studentId: { in: studentIds } },
              },
            },
          },
        },
      },
    },
  });

  const alerts: GradeAlert[] = [];

  for (const ts of sections) {
    const section = ts.section;
    const enrolledStudents = await prisma.enrollment.findMany({
      where: { sectionId: section.id, status: 'ACTIVE' },
      include: { student: true },
    });

    for (const enrollment of enrolledStudents) {
      const student = enrollment.student;
      const allGrades = section.assignments.flatMap((a: any) =>
        a.grades
          .filter((g: any) => g.studentId === student.id && g.pointsEarned !== null)
          .map((g: any) => ({
            pointsEarned: g.pointsEarned!,
            pointsPossible: a.pointsPossible,
            gradedAt: g.gradedAt || g.createdAt,
            assignmentName: a.name,
          }))
      );

      if (allGrades.length === 0) continue;

      const totalEarned = allGrades.reduce((sum: any, g: any) => sum + g.pointsEarned, 0);
      const totalPossible = allGrades.reduce((sum: any, g: any) => sum + g.pointsPossible, 0);
      const currentPct = totalPossible > 0 ? (totalEarned / totalPossible) * 100 : 0;

      // Calculate grade 2 weeks ago
      const oldGrades = allGrades.filter((g: any) => g.gradedAt < twoWeeksAgo);
      const oldEarned = oldGrades.reduce((sum: any, g: any) => sum + g.pointsEarned, 0);
      const oldPossible = oldGrades.reduce((sum: any, g: any) => sum + g.pointsPossible, 0);
      const oldPct = oldPossible > 0 ? (oldEarned / oldPossible) * 100 : currentPct;

      const delta = currentPct - oldPct;

      // Alert if below C (73%) or dropped more than 10 points (roughly one letter grade)
      if (currentPct < 73 || delta < -10) {
        const lowAssignments = allGrades
          .filter((g: any) => g.pointsPossible > 0 && (g.pointsEarned / g.pointsPossible) * 100 < 60)
          .slice(-3)
          .map((g: any) => ({
            name: g.assignmentName,
            score: g.pointsEarned,
            possible: g.pointsPossible,
          }));

        alerts.push({
          studentId: student.id,
          firstName: student.firstName,
          lastName: student.lastName,
          photoUrl: student.photoUrl,
          sectionName: `${section.courseName} — ${section.period}`,
          currentGrade: Math.round(currentPct * 10) / 10,
          previousGrade: Math.round(oldPct * 10) / 10,
          delta: Math.round(delta * 10) / 10,
          lowAssignments,
        });
      }
    }
  }

  // Sort by severity (largest drop first)
  alerts.sort((a, b) => a.delta - b.delta);
  return alerts;
}

async function getMissingWork(teacherId: string, studentIds: string[]): Promise<MissingWorkItem[]> {
  const today = new Date();

  const missingGrades = await prisma.grade.findMany({
    where: {
      studentId: { in: studentIds },
      isMissing: true,
      assignment: {
        section: {
          teachers: { some: { teacherId } },
        },
        dueDate: { lt: today },
      },
    },
    include: {
      student: { select: { id: true, firstName: true, lastName: true } },
      assignment: {
        select: { name: true, dueDate: true, section: { select: { courseName: true, period: true } } },
      },
    },
    orderBy: { assignment: { dueDate: 'asc' } },
  });

  return missingGrades.map((g: any) => ({
    studentId: g.student.id,
    firstName: g.student.firstName,
    lastName: g.student.lastName,
    assignmentName: g.assignment.name,
    dueDate: g.assignment.dueDate.toISOString().split('T')[0],
    daysOverdue: Math.floor((today.getTime() - g.assignment.dueDate.getTime()) / (1000 * 60 * 60 * 24)),
    sectionName: `${g.assignment.section.courseName} — ${g.assignment.section.period}`,
  }));
}

async function getInterventionTasks(teacherId: string, today: Date): Promise<InterventionTask[]> {
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  // Skip weekends
  while (yesterday.getDay() === 0 || yesterday.getDay() === 6) {
    yesterday.setDate(yesterday.getDate() - 1);
  }

  const interventions = await prisma.intervention.findMany({
    where: {
      status: 'ACTIVE',
      student: {
        enrollments: {
          some: {
            status: 'ACTIVE',
            section: {
              teachers: { some: { teacherId } },
            },
          },
        },
      },
    },
    include: {
      student: { select: { id: true, firstName: true, lastName: true } },
      logs: {
        where: {
          teacherId,
          date: { in: [today, yesterday] },
        },
      },
    },
  });

  return interventions.map((intervention: any) => {
    const todayLog = intervention.logs.find(
      (l: any) => l.date.toISOString().split('T')[0] === today.toISOString().split('T')[0]
    );
    const yesterdayLog = intervention.logs.find(
      (l: any) => l.date.toISOString().split('T')[0] === yesterday.toISOString().split('T')[0]
    );

    return {
      interventionId: intervention.id,
      studentId: intervention.student.id,
      firstName: intervention.student.firstName,
      lastName: intervention.student.lastName,
      type: intervention.type,
      description: intervention.description,
      teacherRole: intervention.teacherRole,
      isOverdue: !yesterdayLog,
      completedToday: !!todayLog,
    };
  });
}

async function getAccommodationAlerts(
  teacherId: string,
  studentIds: string[]
): Promise<AccommodationAlert[]> {
  const today = new Date();
  const endOfWeek = new Date(today);
  endOfWeek.setDate(endOfWeek.getDate() + (5 - endOfWeek.getDay())); // Friday

  // Get students with accommodations who have assignments due this week
  const studentsWithAccommodations = await prisma.student.findMany({
    where: {
      id: { in: studentIds },
      accommodations: {
        some: { isActive: true },
      },
    },
    include: {
      accommodations: {
        where: { isActive: true },
        select: { description: true },
      },
      enrollments: {
        where: {
          status: 'ACTIVE',
          section: {
            teachers: { some: { teacherId } },
            assignments: {
              some: {
                dueDate: { gte: today, lte: endOfWeek },
                category: { in: ['Test', 'Quiz', 'Assessment', 'Exam', 'Final'] },
              },
            },
          },
        },
        include: {
          section: {
            include: {
              assignments: {
                where: {
                  dueDate: { gte: today, lte: endOfWeek },
                  category: { in: ['Test', 'Quiz', 'Assessment', 'Exam', 'Final'] },
                },
                select: { name: true, dueDate: true },
              },
            },
          },
        },
      },
    },
  });

  const alerts: AccommodationAlert[] = [];

  for (const student of studentsWithAccommodations) {
    for (const enrollment of student.enrollments) {
      for (const assignment of enrollment.section.assignments) {
        alerts.push({
          studentId: student.id,
          firstName: student.firstName,
          lastName: student.lastName,
          accommodations: student.accommodations.map((a: any) => a.description),
          upcomingAssessment: assignment.name,
          assessmentDate: assignment.dueDate.toISOString().split('T')[0],
        });
      }
    }
  }

  return alerts;
}

async function getNewStudents(teacherId: string): Promise<NewStudent[]> {
  // Find teacher's last login (simplified: look for enrollments added in last 7 days)
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const recentEnrollments = await prisma.enrollment.findMany({
    where: {
      status: 'ACTIVE',
      enrollDate: { gte: sevenDaysAgo },
      section: {
        teachers: { some: { teacherId } },
      },
    },
    include: {
      student: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          photoUrl: true,
          gradeLevel: true,
          ellStatus: true,
          iepActive: true,
          has504: true,
          cumulativeGpa: true,
        },
      },
    },
    orderBy: { enrollDate: 'desc' },
  });

  return recentEnrollments.map((e: any) => ({
    studentId: e.student.id,
    firstName: e.student.firstName,
    lastName: e.student.lastName,
    photoUrl: e.student.photoUrl,
    gradeLevel: e.student.gradeLevel,
    ellStatus: e.student.ellStatus,
    iepActive: e.student.iepActive,
    has504: e.student.has504,
    priorGpa: e.student.cumulativeGpa,
    addedDate: e.enrollDate.toISOString().split('T')[0],
  }));
}

export async function getEnhancedBriefing(teacherId: string): Promise<EnhancedMorningBriefing> {
  const baseBriefing = await getMorningBriefing(teacherId);
  const studentIds = await getTeacherStudentIds(teacherId);

  // ─── Today Stats ──────────────────────────────────────────────────────
  const totalStudents = studentIds.length;
  const absentCount = baseBriefing.absentToday.length;
  const absentRate = totalStudents > 0 ? Math.round((absentCount / totalStudents) * 1000) / 10 : 0;

  const interventionsDue = baseBriefing.interventionTasks.length;
  const interventionsCompleted = baseBriefing.interventionTasks.filter((t) => t.completedToday).length;

  // Urgent alerts: grades below 60 + absences of 3+ consecutive days
  const urgentGradeAlerts = baseBriefing.gradeAlerts.filter((a) => a.currentGrade < 60).length;
  const urgentAbsenceAlerts = baseBriefing.absentToday.filter((a) => a.consecutiveDays >= 3).length;
  const urgentAlerts = urgentGradeAlerts + urgentAbsenceAlerts;

  const todayStats: TodayStats = {
    totalStudents,
    absentCount,
    absentRate,
    interventionsDue,
    interventionsCompleted,
    urgentAlerts,
  };

  // ─── Priority Actions ─────────────────────────────────────────────────
  const priorityActions: PriorityAction[] = [];
  let actionIndex = 0;

  // Absent students with 3+ consecutive days → critical
  for (const absent of baseBriefing.absentToday) {
    if (absent.consecutiveDays >= 3) {
      priorityActions.push({
        id: `action-${actionIndex++}`,
        urgency: 'critical',
        category: 'attendance',
        title: `${absent.firstName} ${absent.lastName} — ${absent.consecutiveDays} consecutive days absent`,
        subtitle: `Periods: ${absent.periods.join(', ')}`,
        studentId: absent.studentId,
        firstName: absent.firstName,
        lastName: absent.lastName,
        actionLabel: 'Contact Family',
        actionUrl: `/students/${absent.studentId}`,
      });
    }
  }

  // Grade alerts below 60 → high
  for (const alert of baseBriefing.gradeAlerts) {
    if (alert.currentGrade < 60) {
      priorityActions.push({
        id: `action-${actionIndex++}`,
        urgency: 'high',
        category: 'academic',
        title: `${alert.firstName} ${alert.lastName} failing ${alert.sectionName}`,
        subtitle: `Current grade: ${alert.currentGrade}% (${alert.delta > 0 ? '+' : ''}${alert.delta}%)`,
        studentId: alert.studentId,
        firstName: alert.firstName,
        lastName: alert.lastName,
        actionLabel: 'View Profile',
        actionUrl: `/students/${alert.studentId}`,
      });
    }
  }

  // Overdue interventions → high
  for (const task of baseBriefing.interventionTasks) {
    if (task.isOverdue && !task.completedToday) {
      priorityActions.push({
        id: `action-${actionIndex++}`,
        urgency: 'high',
        category: 'intervention',
        title: `Overdue: ${task.type} for ${task.firstName} ${task.lastName}`,
        subtitle: task.description,
        studentId: task.studentId,
        firstName: task.firstName,
        lastName: task.lastName,
        actionLabel: 'Log Check-In',
        actionUrl: `/students/${task.studentId}`,
      });
    }
  }

  // Sort by urgency: critical first, then high, then medium
  const urgencyOrder: Record<string, number> = { critical: 0, high: 1, medium: 2 };
  priorityActions.sort((a, b) => urgencyOrder[a.urgency] - urgencyOrder[b.urgency]);

  // ─── Celebrations ─────────────────────────────────────────────────────
  const celebrations: Celebration[] = [];

  const fourWeeksAgo = new Date();
  fourWeeksAgo.setDate(fourWeeksAgo.getDate() - 28);
  const twoWeeksAgo = new Date();
  twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);

  // Look for students whose grades improved significantly
  const sections = await prisma.teacherSection.findMany({
    where: { teacherId },
    include: {
      section: {
        include: {
          assignments: {
            include: {
              grades: {
                where: { studentId: { in: studentIds } },
              },
            },
          },
          enrollments: {
            where: { status: 'ACTIVE' },
            include: { student: { select: { id: true, firstName: true, lastName: true } } },
          },
        },
      },
    },
  });

  const celebrationSet = new Set<string>();

  for (const ts of sections) {
    const section = ts.section;
    for (const enrollment of section.enrollments) {
      if (celebrationSet.has(enrollment.studentId)) continue;

      const allGrades = section.assignments.flatMap((a: any) =>
        a.grades
          .filter((g: any) => g.studentId === enrollment.studentId && g.pointsEarned !== null)
          .map((g: any) => ({
            earned: g.pointsEarned!,
            possible: a.pointsPossible,
            gradedAt: g.gradedAt || g.createdAt,
          }))
      );

      if (allGrades.length < 3) continue;

      // Recent grades (last 2 weeks)
      const recentGrades = allGrades.filter((g: any) => g.gradedAt >= twoWeeksAgo);
      const olderGrades = allGrades.filter((g: any) => g.gradedAt < twoWeeksAgo && g.gradedAt >= fourWeeksAgo);

      if (recentGrades.length === 0 || olderGrades.length === 0) continue;

      const recentEarned = recentGrades.reduce((s: any, g: any) => s + g.earned, 0);
      const recentPossible = recentGrades.reduce((s: any, g: any) => s + g.possible, 0);
      const recentPct = recentPossible > 0 ? (recentEarned / recentPossible) * 100 : 0;

      const olderEarned = olderGrades.reduce((s: any, g: any) => s + g.earned, 0);
      const olderPossible = olderGrades.reduce((s: any, g: any) => s + g.possible, 0);
      const olderPct = olderPossible > 0 ? (olderEarned / olderPossible) * 100 : 0;

      const improvement = recentPct - olderPct;

      if (improvement >= 10) {
        celebrationSet.add(enrollment.studentId);
        celebrations.push({
          studentId: enrollment.studentId,
          firstName: enrollment.student.firstName,
          lastName: enrollment.student.lastName,
          achievement: `Grade improved by ${Math.round(improvement)}% in ${section.courseName}`,
        });
      }
    }
  }

  // ─── Week Ahead ───────────────────────────────────────────────────────
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const endOfWeek = new Date(today);
  endOfWeek.setDate(endOfWeek.getDate() + (5 - endOfWeek.getDay()));
  endOfWeek.setHours(23, 59, 59, 999);

  const upcomingAssessments = await prisma.assignment.count({
    where: {
      section: {
        teachers: { some: { teacherId } },
      },
      dueDate: { gte: today, lte: endOfWeek },
      category: { in: ['Test', 'Quiz', 'Assessment', 'Exam', 'Final'] },
    },
  });

  const studentsWithAccommodations = await prisma.student.count({
    where: {
      id: { in: studentIds },
      accommodations: { some: { isActive: true } },
    },
  });

  const activeInterventions = await prisma.intervention.count({
    where: {
      status: 'ACTIVE',
      student: {
        enrollments: {
          some: {
            status: 'ACTIVE',
            section: { teachers: { some: { teacherId } } },
          },
        },
      },
    },
  });

  const weekAhead: WeekAhead = {
    assessmentsCount: upcomingAssessments,
    studentsWithAccommodations,
    interventionCheckIns: activeInterventions,
  };

  return {
    ...baseBriefing,
    priorityActions,
    todayStats,
    celebrations,
    weekAhead,
  };
}
