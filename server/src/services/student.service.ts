import { prisma } from '../utils/prisma';
import { percentageToLetter } from '../utils/grades';
import { StudentProfileTeacherView } from '../types';

export async function getStudentProfile(
  teacherId: string,
  studentId: string
): Promise<StudentProfileTeacherView> {
  const student = await prisma.student.findUniqueOrThrow({
    where: { id: studentId },
    include: {
      accommodations: { where: { isActive: true } },
      guardians: true,
      interventions: {
        where: { status: 'ACTIVE' },
        include: {
          logs: {
            where: { teacherId },
            orderBy: { date: 'desc' },
            take: 10,
          },
        },
      },
      assessmentScores: {
        orderBy: { testDate: 'desc' },
        take: 10,
      },
    },
  });

  // Get teacher's sections with this student enrolled
  const teacherEnrollments = await prisma.enrollment.findMany({
    where: {
      studentId,
      status: 'ACTIVE',
      section: {
        teachers: { some: { teacherId } },
      },
    },
    include: {
      section: {
        include: {
          assignments: {
            include: {
              grades: {
                where: { studentId },
              },
            },
            orderBy: { dueDate: 'desc' },
          },
        },
      },
    },
  });

  // My class performance (per section)
  const myClassPerformance = teacherEnrollments.map((enrollment) => {
    const section = enrollment.section;
    const allGrades = section.assignments.flatMap((a) =>
      a.grades
        .filter((g) => g.pointsEarned !== null)
        .map((g) => ({
          earned: g.pointsEarned!,
          possible: a.pointsPossible,
          gradedAt: g.gradedAt || g.createdAt,
          name: a.name,
          date: (g.gradedAt || g.createdAt).toISOString().split('T')[0],
        }))
    );

    const totalEarned = allGrades.reduce((s, g) => s + g.earned, 0);
    const totalPossible = allGrades.reduce((s, g) => s + g.possible, 0);
    const currentGradePercent = totalPossible > 0 ? Math.round((totalEarned / totalPossible) * 1000) / 10 : 0;

    const missingCount = section.assignments.flatMap((a) =>
      a.grades.filter((g) => g.isMissing)
    ).length;

    const recentGrades = allGrades
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 5)
      .map((g) => ({
        assignmentName: g.name,
        score: g.earned,
        possible: g.possible,
        date: g.date,
      }));

    // Trend data (8 weeks)
    const today = new Date();
    const trendData: { week: string; grade: number }[] = [];
    for (let w = 7; w >= 0; w--) {
      const weekEnd = new Date(today);
      weekEnd.setDate(weekEnd.getDate() - w * 7);
      const weekGrades = allGrades.filter(
        (g) => new Date(g.date) <= weekEnd
      );
      if (weekGrades.length > 0) {
        const wEarned = weekGrades.reduce((s, g) => s + g.earned, 0);
        const wPossible = weekGrades.reduce((s, g) => s + g.possible, 0);
        trendData.push({
          week: weekEnd.toISOString().split('T')[0],
          grade: wPossible > 0 ? Math.round((wEarned / wPossible) * 1000) / 10 : 0,
        });
      }
    }

    return {
      sectionName: `${section.courseName} — ${section.period}`,
      currentGradePercent,
      letterGrade: percentageToLetter(currentGradePercent),
      trendData,
      missingCount,
      recentGrades,
    };
  });

  // Failing course count (across all sections, using GPA as proxy)
  const failingCourseCount = await prisma.enrollment.count({
    where: {
      studentId,
      status: 'ACTIVE',
    },
  });
  // Simplified: use the known count from student record if available
  const actualFailingCount = myClassPerformance.filter((c) => c.currentGradePercent < 60).length;

  // Attendance
  const ninetyDaysAgo = new Date();
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

  const attendanceRecords = await prisma.attendanceRecord.findMany({
    where: {
      studentId,
      date: { gte: ninetyDaysAgo },
    },
  });

  const totalDays = new Set(attendanceRecords.map((a) => a.date.toISOString().split('T')[0])).size || 1;
  const absentDays = new Set(
    attendanceRecords
      .filter((a) => a.status === 'ABSENT')
      .map((a) => a.date.toISOString().split('T')[0])
  ).size;
  const tardyCount = attendanceRecords.filter((a) => a.status === 'TARDY').length;

  const overallRate = Math.round(((totalDays - absentDays) / totalDays) * 1000) / 10;

  // Per-period attendance rates
  const periods = [...new Set(attendanceRecords.map((a) => a.period).filter(Boolean))] as string[];
  const periodRates = periods.map((period) => {
    const periodRecords = attendanceRecords.filter((a) => a.period === period);
    const total = periodRecords.length || 1;
    const present = periodRecords.filter((a) => a.status === 'PRESENT').length;
    return { period, rate: Math.round((present / total) * 1000) / 10 };
  });

  // Days absent this month
  const firstOfMonth = new Date();
  firstOfMonth.setDate(1);
  firstOfMonth.setHours(0, 0, 0, 0);
  const daysAbsentThisMonth = attendanceRecords.filter(
    (a) => a.status === 'ABSENT' && a.date >= firstOfMonth
  ).length;

  // Consecutive absence streak
  let consecutiveAbsenceStreak = 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const checkDate = new Date(today);
  for (let i = 0; i < 30; i++) {
    const dayAbsences = attendanceRecords.filter(
      (a) => a.date.toISOString().split('T')[0] === checkDate.toISOString().split('T')[0] && a.status === 'ABSENT'
    );
    if (dayAbsences.length === 0) break;
    consecutiveAbsenceStreak++;
    checkDate.setDate(checkDate.getDate() - 1);
    while (checkDate.getDay() === 0 || checkDate.getDay() === 6) {
      checkDate.setDate(checkDate.getDate() - 1);
    }
  }

  // Observations by this teacher
  const observations = await prisma.observation.findMany({
    where: { studentId, teacherId },
    orderBy: { createdAt: 'desc' },
  });

  const twentyFourHoursAgo = new Date();
  twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24);

  return {
    id: student.id,
    firstName: student.firstName,
    lastName: student.lastName,
    photoUrl: student.photoUrl,
    gradeLevel: student.gradeLevel,
    ellStatus: student.ellStatus,
    iepActive: student.iepActive,
    has504: student.has504,
    riskTier: student.riskTier,

    myClassPerformance,

    overallAcademicSnapshot: {
      cumulativeGpa: student.cumulativeGpa,
      failingCourseCount: actualFailingCount,
      totalCredits: student.totalCredits,
      creditsRequired: student.creditsRequired,
      assessmentScores: student.assessmentScores.map((a) => ({
        name: a.assessmentName,
        subject: a.subject,
        score: a.score,
        percentile: a.percentile,
        date: a.testDate.toISOString().split('T')[0],
      })),
    },

    attendance: {
      overallRate,
      periodRates,
      daysAbsentThisMonth,
      consecutiveAbsenceStreak,
      tardyCount,
    },

    accommodations: student.accommodations.map((a) => ({
      type: a.type,
      description: a.description,
      category: a.category,
    })),

    observations: observations.map((o) => ({
      id: o.id,
      category: o.category,
      severity: o.severity,
      content: o.content,
      createdAt: o.createdAt.toISOString(),
      isEditable: o.createdAt > twentyFourHoursAgo,
    })),

    activeInterventions: student.interventions.map((i) => ({
      id: i.id,
      tier: i.tier,
      type: i.type,
      description: i.description,
      teacherRole: i.teacherRole,
      logs: i.logs.map((l) => ({
        date: l.date.toISOString().split('T')[0],
        status: l.completionStatus,
        notes: l.notes,
      })),
    })),

    guardians: student.guardians.map((g) => ({
      id: g.id,
      firstName: g.firstName,
      lastName: g.lastName,
      email: g.email,
      phone: g.phone,
      relation: g.relation,
      isPrimary: g.isPrimary,
    })),
  };
}
