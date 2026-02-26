import { prisma } from '../utils/prisma';
import { percentageToLetter } from '../utils/grades';
import { SectionSummary } from '../types';

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
