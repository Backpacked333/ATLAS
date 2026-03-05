import { prisma } from '../utils/prisma';
import { percentageToLetter } from '../utils/grades';
import { SectionSummary, EnhancedSectionSummary } from '../types';

export async function getSectionSummary(
  teacherId: string,
  sectionId: string
): Promise<SectionSummary> {
  const section = await prisma.section.findUnique({
    where: { id: sectionId },
    include: {
      enrollments: {
        where: { status: 'ACTIVE' },
        include: {
          student: true,
        },
      },
      assignments: {
        include: {
          grades: true,
        },
        orderBy: { dueDate: 'desc' },
      },
    },
  });

  if (!section) throw new Error('Section not found');

  const students = section.enrollments.map((e) => e.student);
  const today = new Date();
  const oneWeekAgo = new Date(today);
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
  const ninetyDaysAgo = new Date(today);
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

  // Calculate each student's grade percentage
  const studentGrades: { studentId: string; pct: number }[] = [];

  for (const student of students) {
    const grades = section.assignments.flatMap((a) =>
      a.grades.filter((g) => g.studentId === student.id && g.pointsEarned !== null)
    );
    const earned = grades.reduce((sum, g) => sum + (g.pointsEarned || 0), 0);
    const possible = section.assignments
      .filter((a) => a.grades.some((g) => g.studentId === student.id && g.pointsEarned !== null))
      .reduce((sum, a) => sum + a.pointsPossible, 0);

    const pct = possible > 0 ? (earned / possible) * 100 : 0;
    studentGrades.push({ studentId: student.id, pct });
  }

  const classAverageGrade =
    studentGrades.length > 0
      ? Math.round((studentGrades.reduce((sum, sg) => sum + sg.pct, 0) / studentGrades.length) * 10) / 10
      : 0;

  // Attendance
  const attendanceRecords = await prisma.attendanceRecord.findMany({
    where: {
      studentId: { in: students.map((s) => s.id) },
      date: { gte: ninetyDaysAgo },
      period: section.period,
    },
  });

  const totalAttendanceDays = attendanceRecords.length || 1;
  const presentDays = attendanceRecords.filter((a) => a.status === 'PRESENT').length;
  const classAverageAttendance = Math.round((presentDays / totalAttendanceDays) * 1000) / 10;

  // Failing count
  const failingCount = studentGrades.filter((sg) => sg.pct < 60).length;

  // Missing work count
  const missingWorkCount = section.assignments.flatMap((a) =>
    a.grades.filter((g) => g.isMissing)
  ).length;

  // Grade distribution
  const gradeDistribution: Record<string, number> = { A: 0, B: 0, C: 0, D: 0, F: 0 };
  for (const sg of studentGrades) {
    const letter = percentageToLetter(sg.pct);
    const bucket = letter.charAt(0);
    if (bucket in gradeDistribution) {
      gradeDistribution[bucket]++;
    }
  }

  // Recent assignments (last 5)
  const recentAssignments = section.assignments.slice(0, 5).map((assignment) => {
    const graded = assignment.grades.filter((g) => g.pointsEarned !== null);
    const completionRate =
      students.length > 0
        ? Math.round((graded.length / students.length) * 100)
        : 0;
    const avg =
      graded.length > 0
        ? Math.round(
            (graded.reduce((sum, g) => sum + (g.pointsEarned || 0), 0) / graded.length / assignment.pointsPossible) * 1000
          ) / 10
        : 0;

    // Outliers: students scoring significantly below average (more than 20 points below)
    const outliers = graded
      .filter((g) => {
        const studentPct = ((g.pointsEarned || 0) / assignment.pointsPossible) * 100;
        return studentPct < avg - 20;
      })
      .map((g) => {
        const student = students.find((s) => s.id === g.studentId);
        return {
          studentId: g.studentId,
          firstName: student?.firstName || '',
          lastName: student?.lastName || '',
          score: Math.round(((g.pointsEarned || 0) / assignment.pointsPossible) * 100),
        };
      });

    return {
      id: assignment.id,
      name: assignment.name,
      dueDate: assignment.dueDate.toISOString().split('T')[0],
      classAverage: avg,
      completionRate,
      outliers,
    };
  });

  // Week-over-week changes (simplified)
  const weekOverWeekGradeChange = 0; // Would need historical snapshots for real calculation
  const weekOverWeekAttendanceChange = 0;

  return {
    id: section.id,
    courseName: section.courseName,
    period: section.period,
    classAverageGrade,
    classAverageAttendance,
    failingCount,
    missingWorkCount,
    weekOverWeekGradeChange,
    weekOverWeekAttendanceChange,
    gradeDistribution: Object.entries(gradeDistribution).map(([letter, count]) => ({
      letter,
      count,
    })),
    recentAssignments,
    studentCount: students.length,
  };
}

export async function getEnhancedSectionSummary(
  teacherId: string,
  sectionId: string
): Promise<EnhancedSectionSummary> {
  const baseSummary = await getSectionSummary(teacherId, sectionId);

  const section = await prisma.section.findUnique({
    where: { id: sectionId },
    include: {
      enrollments: {
        where: { status: 'ACTIVE' },
        include: { student: true },
      },
      assignments: {
        include: { grades: true },
        orderBy: { dueDate: 'asc' },
      },
    },
  });

  if (!section) throw new Error('Section not found');

  const students = section.enrollments.map((e) => e.student);
  const studentIds = students.map((s) => s.id);
  const today = new Date();

  // ─── Fix weekOverWeekGradeChange ──────────────────────────────────────
  const oneWeekAgo = new Date(today);
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

  // Compute current class average and class average as of 7 days ago
  function computeClassAvgAsOf(cutoffDate: Date): number {
    const perStudentPcts: number[] = [];
    for (const student of students) {
      const grades = section!.assignments.flatMap((a) =>
        a.grades.filter(
          (g) =>
            g.studentId === student.id &&
            g.pointsEarned !== null &&
            (g.gradedAt || g.createdAt) <= cutoffDate
        )
      );
      const earned = grades.reduce((s, g) => s + (g.pointsEarned || 0), 0);
      const possible = section!.assignments
        .filter((a) =>
          a.grades.some(
            (g) =>
              g.studentId === student.id &&
              g.pointsEarned !== null &&
              (g.gradedAt || g.createdAt) <= cutoffDate
          )
        )
        .reduce((s, a) => s + a.pointsPossible, 0);
      if (possible > 0) {
        perStudentPcts.push((earned / possible) * 100);
      }
    }
    return perStudentPcts.length > 0
      ? perStudentPcts.reduce((s, p) => s + p, 0) / perStudentPcts.length
      : 0;
  }

  const currentAvg = computeClassAvgAsOf(today);
  const weekAgoAvg = computeClassAvgAsOf(oneWeekAgo);
  const weekOverWeekGradeChange = Math.round((currentAvg - weekAgoAvg) * 10) / 10;

  // ─── Grade Trend (8 weeks) ────────────────────────────────────────────
  const gradeTrend: { week: string; avg: number }[] = [];
  for (let w = 7; w >= 0; w--) {
    const weekEnd = new Date(today);
    weekEnd.setDate(weekEnd.getDate() - w * 7);
    const avg = computeClassAvgAsOf(weekEnd);
    gradeTrend.push({
      week: weekEnd.toISOString().split('T')[0],
      avg: Math.round(avg * 10) / 10,
    });
  }

  // ─── Attendance Trend (8 weeks) ───────────────────────────────────────
  const eightWeeksAgo = new Date(today);
  eightWeeksAgo.setDate(eightWeeksAgo.getDate() - 56);

  const allAttendance = await prisma.attendanceRecord.findMany({
    where: {
      studentId: { in: studentIds },
      date: { gte: eightWeeksAgo },
      period: section.period,
    },
  });

  const attendanceTrend: { week: string; rate: number }[] = [];
  for (let w = 7; w >= 0; w--) {
    const weekStart = new Date(today);
    weekStart.setDate(weekStart.getDate() - (w + 1) * 7);
    const weekEnd = new Date(today);
    weekEnd.setDate(weekEnd.getDate() - w * 7);

    const weekRecords = allAttendance.filter(
      (a) => a.date >= weekStart && a.date < weekEnd
    );
    const total = weekRecords.length || 1;
    const present = weekRecords.filter((a) => a.status === 'PRESENT').length;
    attendanceTrend.push({
      week: weekEnd.toISOString().split('T')[0],
      rate: Math.round((present / total) * 1000) / 10,
    });
  }

  // Compute week-over-week attendance change
  const currentWeekAttendance = attendanceTrend.length > 0 ? attendanceTrend[attendanceTrend.length - 1].rate : 0;
  const prevWeekAttendance = attendanceTrend.length > 1 ? attendanceTrend[attendanceTrend.length - 2].rate : currentWeekAttendance;
  const weekOverWeekAttendanceChange = Math.round((currentWeekAttendance - prevWeekAttendance) * 10) / 10;

  // ─── Risk Breakdown ──────────────────────────────────────────────────
  const riskCounts = new Map<string, number>();
  for (const student of students) {
    const tier = student.riskTier || 'ON_TRACK';
    riskCounts.set(tier, (riskCounts.get(tier) || 0) + 1);
  }
  const riskBreakdown = Array.from(riskCounts.entries()).map(([tier, count]) => ({ tier, count }));

  // ─── Student Rankings ─────────────────────────────────────────────────
  const twoWeeksAgo = new Date(today);
  twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
  const ninetyDaysAgo = new Date(today);
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

  const studentAttendance = await prisma.attendanceRecord.findMany({
    where: {
      studentId: { in: studentIds },
      date: { gte: ninetyDaysAgo },
      period: section.period,
    },
  });

  const studentRankings = students.map((student) => {
    // Current grade
    const grades = section.assignments.flatMap((a) =>
      a.grades.filter((g) => g.studentId === student.id && g.pointsEarned !== null)
    );
    const earned = grades.reduce((s, g) => s + (g.pointsEarned || 0), 0);
    const possible = section.assignments
      .filter((a) => a.grades.some((g) => g.studentId === student.id && g.pointsEarned !== null))
      .reduce((s, a) => s + a.pointsPossible, 0);
    const gradePercent = possible > 0 ? Math.round((earned / possible) * 1000) / 10 : 0;

    // Grade 2 weeks ago
    const oldGrades = section.assignments.flatMap((a) =>
      a.grades.filter(
        (g) =>
          g.studentId === student.id &&
          g.pointsEarned !== null &&
          (g.gradedAt || g.createdAt) <= twoWeeksAgo
      )
    );
    const oldEarned = oldGrades.reduce((s, g) => s + (g.pointsEarned || 0), 0);
    const oldPossible = section.assignments
      .filter((a) =>
        a.grades.some(
          (g) =>
            g.studentId === student.id &&
            g.pointsEarned !== null &&
            (g.gradedAt || g.createdAt) <= twoWeeksAgo
        )
      )
      .reduce((s, a) => s + a.pointsPossible, 0);
    const oldPct = oldPossible > 0 ? (oldEarned / oldPossible) * 100 : gradePercent;
    const gradeDelta = Math.round((gradePercent - oldPct) * 10) / 10;

    // Attendance rate
    const records = studentAttendance.filter((a) => a.studentId === student.id);
    const totalRecs = records.length || 1;
    const presentRecs = records.filter((a) => a.status === 'PRESENT').length;
    const attendanceRate = Math.round((presentRecs / totalRecs) * 1000) / 10;

    // Missing work
    const missingCount = section.assignments.flatMap((a) =>
      a.grades.filter((g) => g.studentId === student.id && g.isMissing)
    ).length;

    return {
      studentId: student.id,
      firstName: student.firstName,
      lastName: student.lastName,
      gradePercent,
      gradeDelta,
      attendanceRate,
      missingCount,
      riskTier: student.riskTier || 'ON_TRACK',
    };
  });

  // Sort by most concerning first: lowest grade, then most missing work
  studentRankings.sort((a, b) => {
    if (a.gradePercent !== b.gradePercent) return a.gradePercent - b.gradePercent;
    return b.missingCount - a.missingCount;
  });

  // ─── Category Performance ─────────────────────────────────────────────
  const categoryMap = new Map<string, { totalPct: number; count: number }>();
  for (const assignment of section.assignments) {
    const category = assignment.category || 'Uncategorized';
    const graded = assignment.grades.filter((g) => g.pointsEarned !== null);
    if (graded.length === 0) continue;

    const avgPct =
      (graded.reduce((s, g) => s + (g.pointsEarned || 0), 0) /
        (graded.length * assignment.pointsPossible)) *
      100;

    const existing = categoryMap.get(category) || { totalPct: 0, count: 0 };
    existing.totalPct += avgPct;
    existing.count += 1;
    categoryMap.set(category, existing);
  }

  const categoryPerformance = Array.from(categoryMap.entries()).map(([category, data]) => ({
    category,
    avgScore: Math.round((data.totalPct / data.count) * 10) / 10,
    assignmentCount: data.count,
  }));

  // ─── Section Insights ─────────────────────────────────────────────────
  const sectionInsights: { type: string; message: string; severity: 'info' | 'warning' | 'critical' }[] = [];

  const failingStudents = studentRankings.filter((s) => s.gradePercent < 60);
  if (failingStudents.length > 0) {
    sectionInsights.push({
      type: 'failing_students',
      message: `${failingStudents.length} student${failingStudents.length === 1 ? '' : 's'} below 60%`,
      severity: failingStudents.length >= 5 ? 'critical' : 'warning',
    });
  }

  // Missing work insight
  const totalMissing = studentRankings.reduce((s, r) => s + r.missingCount, 0);
  if (totalMissing > 0) {
    sectionInsights.push({
      type: 'missing_work',
      message: `${totalMissing} missing assignment${totalMissing === 1 ? '' : 's'} across the section`,
      severity: totalMissing >= 10 ? 'warning' : 'info',
    });
  }

  // Grade trend insight
  if (weekOverWeekGradeChange < -3) {
    sectionInsights.push({
      type: 'grade_decline',
      message: `Class average dropped ${Math.abs(weekOverWeekGradeChange)}% this week`,
      severity: weekOverWeekGradeChange < -5 ? 'critical' : 'warning',
    });
  } else if (weekOverWeekGradeChange > 3) {
    sectionInsights.push({
      type: 'grade_improvement',
      message: `Class average improved ${weekOverWeekGradeChange}% this week`,
      severity: 'info',
    });
  }

  // High-risk students
  const highRiskCount = students.filter((s) => s.riskTier === 'HIGH' || s.riskTier === 'CRITICAL').length;
  if (highRiskCount > 0) {
    sectionInsights.push({
      type: 'high_risk',
      message: `${highRiskCount} student${highRiskCount === 1 ? '' : 's'} at high or critical risk`,
      severity: 'warning',
    });
  }

  return {
    ...baseSummary,
    weekOverWeekGradeChange,
    weekOverWeekAttendanceChange,
    gradeTrend,
    attendanceTrend,
    riskBreakdown,
    studentRankings,
    categoryPerformance,
    sectionInsights,
  };
}
