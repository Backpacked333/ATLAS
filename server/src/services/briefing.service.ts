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
      const allGrades = section.assignments.flatMap((a) =>
        a.grades
          .filter((g) => g.studentId === student.id && g.pointsEarned !== null)
          .map((g) => ({
            pointsEarned: g.pointsEarned!,
            pointsPossible: a.pointsPossible,
            gradedAt: g.gradedAt || g.createdAt,
            assignmentName: a.name,
          }))
      );

      if (allGrades.length === 0) continue;

      const totalEarned = allGrades.reduce((sum, g) => sum + g.pointsEarned, 0);
      const totalPossible = allGrades.reduce((sum, g) => sum + g.pointsPossible, 0);
      const currentPct = totalPossible > 0 ? (totalEarned / totalPossible) * 100 : 0;

      // Calculate grade 2 weeks ago
      const oldGrades = allGrades.filter((g) => g.gradedAt < twoWeeksAgo);
      const oldEarned = oldGrades.reduce((sum, g) => sum + g.pointsEarned, 0);
      const oldPossible = oldGrades.reduce((sum, g) => sum + g.pointsPossible, 0);
      const oldPct = oldPossible > 0 ? (oldEarned / oldPossible) * 100 : currentPct;

      const delta = currentPct - oldPct;

      // Alert if below C (73%) or dropped more than 10 points (roughly one letter grade)
      if (currentPct < 73 || delta < -10) {
        const lowAssignments = allGrades
          .filter((g) => g.pointsPossible > 0 && (g.pointsEarned / g.pointsPossible) * 100 < 60)
          .slice(-3)
          .map((g) => ({
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

  return missingGrades.map((g) => ({
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

  return interventions.map((intervention) => {
    const todayLog = intervention.logs.find(
      (l) => l.date.toISOString().split('T')[0] === today.toISOString().split('T')[0]
    );
    const yesterdayLog = intervention.logs.find(
      (l) => l.date.toISOString().split('T')[0] === yesterday.toISOString().split('T')[0]
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
          accommodations: student.accommodations.map((a) => a.description),
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

  return recentEnrollments.map((e) => ({
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
