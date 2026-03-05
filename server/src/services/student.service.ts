import { prisma } from '../utils/prisma';
import { percentageToLetter } from '../utils/grades';
import { StudentProfileTeacherView, EnhancedStudentProfile } from '../types';

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

export async function getEnhancedStudentProfile(
  teacherId: string,
  studentId: string
): Promise<EnhancedStudentProfile> {
  const baseProfile = await getStudentProfile(teacherId, studentId);

  // ─── Narrative Summary ────────────────────────────────────────────────
  const narrativeParts: string[] = [];
  narrativeParts.push(
    `${baseProfile.firstName} ${baseProfile.lastName} is a grade ${baseProfile.gradeLevel} student`
  );

  if (baseProfile.myClassPerformance.length > 0) {
    const avgGrade =
      baseProfile.myClassPerformance.reduce((s, c) => s + c.currentGradePercent, 0) /
      baseProfile.myClassPerformance.length;
    narrativeParts.push(
      `currently averaging ${Math.round(avgGrade)}% across ${baseProfile.myClassPerformance.length} class${baseProfile.myClassPerformance.length === 1 ? '' : 'es'}`
    );
  }

  if (baseProfile.attendance.overallRate < 90) {
    narrativeParts.push(
      `with an attendance rate of ${baseProfile.attendance.overallRate}% which is below the 90% threshold`
    );
  } else {
    narrativeParts.push(`with ${baseProfile.attendance.overallRate}% attendance`);
  }

  if (baseProfile.attendance.consecutiveAbsenceStreak > 0) {
    narrativeParts.push(
      `and is currently on a ${baseProfile.attendance.consecutiveAbsenceStreak}-day absence streak`
    );
  }

  const flags: string[] = [];
  if (baseProfile.iepActive) flags.push('an active IEP');
  if (baseProfile.has504) flags.push('a 504 plan');
  if (baseProfile.ellStatus) flags.push('ELL services');
  if (flags.length > 0) {
    narrativeParts.push(`This student has ${flags.join(', ')}.`);
  }

  if (baseProfile.activeInterventions.length > 0) {
    narrativeParts.push(
      `There ${baseProfile.activeInterventions.length === 1 ? 'is' : 'are'} ${baseProfile.activeInterventions.length} active intervention${baseProfile.activeInterventions.length === 1 ? '' : 's'}.`
    );
  }

  const narrativeSummary = narrativeParts.join(', ').replace(/,\s*\./g, '.') + (narrativeParts[narrativeParts.length - 1].endsWith('.') ? '' : '.');

  // ─── Risk Analysis ────────────────────────────────────────────────────
  const riskFactors: { factor: string; impact: 'high' | 'medium' | 'low'; detail: string }[] = [];
  let riskScore = 0;

  // Attendance factor
  if (baseProfile.attendance.overallRate < 85) {
    riskScore += 30;
    riskFactors.push({
      factor: 'Chronic absenteeism',
      impact: 'high',
      detail: `${baseProfile.attendance.overallRate}% attendance rate`,
    });
  } else if (baseProfile.attendance.overallRate < 90) {
    riskScore += 15;
    riskFactors.push({
      factor: 'Below-target attendance',
      impact: 'medium',
      detail: `${baseProfile.attendance.overallRate}% attendance rate`,
    });
  }

  if (baseProfile.attendance.consecutiveAbsenceStreak >= 3) {
    riskScore += 20;
    riskFactors.push({
      factor: 'Consecutive absences',
      impact: 'high',
      detail: `${baseProfile.attendance.consecutiveAbsenceStreak} days in a row`,
    });
  }

  // Academic factors
  const failingClasses = baseProfile.myClassPerformance.filter((c) => c.currentGradePercent < 60);
  if (failingClasses.length > 0) {
    riskScore += 25;
    riskFactors.push({
      factor: 'Failing grades',
      impact: 'high',
      detail: `Failing ${failingClasses.length} class${failingClasses.length === 1 ? '' : 'es'}`,
    });
  }

  const decliningClasses = baseProfile.myClassPerformance.filter((c) => {
    if (c.trendData.length < 2) return false;
    const recent = c.trendData[c.trendData.length - 1].grade;
    const older = c.trendData[Math.max(0, c.trendData.length - 3)].grade;
    return recent - older < -5;
  });
  if (decliningClasses.length > 0) {
    riskScore += 15;
    riskFactors.push({
      factor: 'Grade decline',
      impact: 'medium',
      detail: `Declining in ${decliningClasses.length} class${decliningClasses.length === 1 ? '' : 'es'}`,
    });
  }

  // Missing work factor
  const totalMissing = baseProfile.myClassPerformance.reduce((s, c) => s + c.missingCount, 0);
  if (totalMissing >= 5) {
    riskScore += 15;
    riskFactors.push({
      factor: 'Excessive missing work',
      impact: 'medium',
      detail: `${totalMissing} missing assignments`,
    });
  } else if (totalMissing >= 3) {
    riskScore += 8;
    riskFactors.push({
      factor: 'Missing work',
      impact: 'low',
      detail: `${totalMissing} missing assignments`,
    });
  }

  riskScore = Math.min(100, riskScore);

  // Compute previous risk score (approximate from a month ago using available data)
  let previousScore = riskScore;
  // Estimate based on trend: if grades are declining, previous score was lower
  const avgTrendDelta =
    baseProfile.myClassPerformance.length > 0
      ? baseProfile.myClassPerformance.reduce((s, c) => {
          if (c.trendData.length < 2) return s;
          return s + (c.trendData[c.trendData.length - 1].grade - c.trendData[0].grade);
        }, 0) / baseProfile.myClassPerformance.length
      : 0;

  if (avgTrendDelta < -5) {
    previousScore = Math.max(0, riskScore - 15);
  } else if (avgTrendDelta > 5) {
    previousScore = Math.min(100, riskScore + 15);
  }

  const trajectory: 'improving' | 'stable' | 'declining' =
    riskScore < previousScore - 5 ? 'improving' : riskScore > previousScore + 5 ? 'declining' : 'stable';

  const riskAnalysis = {
    currentScore: riskScore,
    previousScore,
    trajectory,
    factors: riskFactors,
  };

  // ─── Recommended Actions ──────────────────────────────────────────────
  const recommendedActions: {
    priority: number;
    action: string;
    reason: string;
    actionType: 'contact' | 'observation' | 'intervention' | 'referral' | 'celebrate';
  }[] = [];
  let priority = 1;

  if (baseProfile.attendance.consecutiveAbsenceStreak >= 3) {
    recommendedActions.push({
      priority: priority++,
      action: 'Contact parent/guardian about absences',
      reason: `Student has been absent ${baseProfile.attendance.consecutiveAbsenceStreak} consecutive days`,
      actionType: 'contact',
    });
  }

  if (failingClasses.length > 0) {
    recommendedActions.push({
      priority: priority++,
      action: 'Initiate academic intervention',
      reason: `Failing ${failingClasses.map((c) => c.sectionName).join(', ')}`,
      actionType: 'intervention',
    });
  }

  if (totalMissing >= 3) {
    recommendedActions.push({
      priority: priority++,
      action: 'Address missing work with student',
      reason: `${totalMissing} missing assignments need attention`,
      actionType: 'observation',
    });
  }

  // Check for recent observations
  const recentObservations = baseProfile.observations.filter((o) => {
    const obsDate = new Date(o.createdAt);
    const twoWeeksAgo = new Date();
    twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
    return obsDate >= twoWeeksAgo;
  });
  if (recentObservations.length === 0) {
    recommendedActions.push({
      priority: priority++,
      action: 'Log a classroom observation',
      reason: 'No observations recorded in the last 2 weeks',
      actionType: 'observation',
    });
  }

  if (baseProfile.attendance.overallRate < 90 && baseProfile.attendance.consecutiveAbsenceStreak < 3) {
    recommendedActions.push({
      priority: priority++,
      action: 'Monitor attendance pattern',
      reason: `Attendance at ${baseProfile.attendance.overallRate}%, approaching chronic threshold`,
      actionType: 'observation',
    });
  }

  // Celebrate if doing well
  if (riskScore === 0 && baseProfile.myClassPerformance.every((c) => c.currentGradePercent >= 80)) {
    recommendedActions.push({
      priority: priority++,
      action: 'Recognize student achievement',
      reason: 'Student is performing well across all classes',
      actionType: 'celebrate',
    });
  }

  // ─── Attendance Calendar (90 days) ────────────────────────────────────
  const ninetyDaysAgo = new Date();
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

  const attendanceRecords = await prisma.attendanceRecord.findMany({
    where: {
      studentId,
      date: { gte: ninetyDaysAgo },
    },
  });

  const attendanceByDate = new Map<string, string>();
  for (const record of attendanceRecords) {
    const dateStr = record.date.toISOString().split('T')[0];
    // If any period is absent, mark as absent; tardy if any tardy and no absent
    const existing = attendanceByDate.get(dateStr);
    if (record.status === 'ABSENT') {
      attendanceByDate.set(dateStr, 'absent');
    } else if (record.status === 'TARDY' && existing !== 'absent') {
      attendanceByDate.set(dateStr, 'tardy');
    } else if (record.status === 'EXCUSED') {
      if (!existing || existing === 'present') attendanceByDate.set(dateStr, 'excused');
    } else if (!existing) {
      attendanceByDate.set(dateStr, 'present');
    }
  }

  const attendanceCalendar: { date: string; status: 'present' | 'absent' | 'tardy' | 'excused' | 'weekend' }[] = [];
  const calDate = new Date(ninetyDaysAgo);
  const todayDate = new Date();
  todayDate.setHours(23, 59, 59, 999);

  while (calDate <= todayDate) {
    const dateStr = calDate.toISOString().split('T')[0];
    const dayOfWeek = calDate.getDay();

    if (dayOfWeek === 0 || dayOfWeek === 6) {
      attendanceCalendar.push({ date: dateStr, status: 'weekend' });
    } else {
      const status = attendanceByDate.get(dateStr);
      attendanceCalendar.push({
        date: dateStr,
        status: (status as 'present' | 'absent' | 'tardy' | 'excused') || 'present',
      });
    }

    calDate.setDate(calDate.getDate() + 1);
  }

  // ─── Grade Trajectory (linear regression) ─────────────────────────────
  const gradeTrajectory: {
    sectionName: string;
    currentGrade: number;
    projectedEndOfTerm: number;
    confidence: 'high' | 'medium' | 'low';
  }[] = [];

  for (const classPerf of baseProfile.myClassPerformance) {
    if (classPerf.trendData.length < 2) {
      gradeTrajectory.push({
        sectionName: classPerf.sectionName,
        currentGrade: classPerf.currentGradePercent,
        projectedEndOfTerm: classPerf.currentGradePercent,
        confidence: 'low',
      });
      continue;
    }

    // Simple linear regression on trend data
    const n = classPerf.trendData.length;
    const xs = classPerf.trendData.map((_, i) => i);
    const ys = classPerf.trendData.map((t) => t.grade);

    const sumX = xs.reduce((s, x) => s + x, 0);
    const sumY = ys.reduce((s, y) => s + y, 0);
    const sumXY = xs.reduce((s, x, i) => s + x * ys[i], 0);
    const sumXX = xs.reduce((s, x) => s + x * x, 0);

    const denominator = n * sumXX - sumX * sumX;
    let slope = 0;
    let intercept = sumY / n;

    if (denominator !== 0) {
      slope = (n * sumXY - sumX * sumY) / denominator;
      intercept = (sumY - slope * sumX) / n;
    }

    // Project to end of term (~16 weeks from the start of data, or ~8 more weeks)
    const projectedIndex = n + 8;
    const projected = Math.max(0, Math.min(100, intercept + slope * projectedIndex));

    // Confidence based on data points and variance
    const residuals = ys.map((y, i) => Math.abs(y - (intercept + slope * i)));
    const avgResidual = residuals.reduce((s, r) => s + r, 0) / n;

    const confidence: 'high' | 'medium' | 'low' =
      n >= 6 && avgResidual < 5 ? 'high' : n >= 4 && avgResidual < 10 ? 'medium' : 'low';

    gradeTrajectory.push({
      sectionName: classPerf.sectionName,
      currentGrade: classPerf.currentGradePercent,
      projectedEndOfTerm: Math.round(projected * 10) / 10,
      confidence,
    });
  }

  // ─── Class Comparison ─────────────────────────────────────────────────
  const classComparison: {
    sectionName: string;
    studentGrade: number;
    classAverage: number;
    percentile: number;
  }[] = [];

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
          enrollments: {
            where: { status: 'ACTIVE' },
            include: { student: { select: { id: true } } },
          },
          assignments: {
            include: { grades: true },
          },
        },
      },
    },
  });

  for (const enrollment of teacherEnrollments) {
    const section = enrollment.section;
    const allStudentIds = section.enrollments.map((e: any) => e.student.id);

    // Compute all student grades in this section
    const sectionGrades: { sid: string; pct: number }[] = [];
    for (const sid of allStudentIds) {
      const grades = section.assignments.flatMap((a: any) =>
        a.grades.filter((g: any) => g.studentId === sid && g.pointsEarned !== null)
      );
      const earned = grades.reduce((s: any, g: any) => s + (g.pointsEarned || 0), 0);
      const possible = section.assignments
        .filter((a: any) => a.grades.some((g: any) => g.studentId === sid && g.pointsEarned !== null))
        .reduce((s: any, a: any) => s + a.pointsPossible, 0);
      if (possible > 0) {
        sectionGrades.push({ sid, pct: (earned / possible) * 100 });
      }
    }

    if (sectionGrades.length === 0) continue;

    const studentEntry = sectionGrades.find((sg) => sg.sid === studentId);
    if (!studentEntry) continue;

    const classAvg = sectionGrades.reduce((s, sg) => s + sg.pct, 0) / sectionGrades.length;
    const belowCount = sectionGrades.filter((sg) => sg.pct < studentEntry.pct).length;
    const percentile =
      sectionGrades.length > 1
        ? Math.round((belowCount / (sectionGrades.length - 1)) * 100)
        : 50;

    classComparison.push({
      sectionName: `${section.courseName} — ${section.period}`,
      studentGrade: Math.round(studentEntry.pct * 10) / 10,
      classAverage: Math.round(classAvg * 10) / 10,
      percentile: Math.min(99, Math.max(1, percentile)),
    });
  }

  return {
    ...baseProfile,
    narrativeSummary,
    riskAnalysis,
    recommendedActions,
    attendanceCalendar,
    gradeTrajectory,
    classComparison,
  };
}
