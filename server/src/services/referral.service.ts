import { prisma } from '../utils/prisma';
import { CreateReferralInput } from '../types';

export async function createReferral(teacherId: string, input: CreateReferralInput) {
  const referral = await prisma.sSTReferral.create({
    data: {
      studentId: input.studentId,
      referringTeacherId: teacherId,
      primaryConcern: input.primaryConcern,
      narrative: input.narrative,
      strategiesAttempted: input.strategiesAttempted,
      urgency: input.urgency,
      meetingTime: input.meetingTime ? new Date(input.meetingTime) : undefined,
    },
    include: {
      student: { select: { firstName: true, lastName: true, schoolId: true } },
    },
  });

  // Notify counselors if urgent
  if (input.urgency === 'URGENT') {
    await prisma.notification.create({
      data: {
        schoolId: referral.student.schoolId,
        studentId: input.studentId,
        type: 'GRADE_DROP',
        title: `Urgent SST Referral: ${referral.student.firstName} ${referral.student.lastName}`,
        body: `${input.primaryConcern} concern. ${input.narrative.slice(0, 200)}`,
        channel: 'BOTH',
      },
    });
  }

  return referral;
}

export async function getReferralPrePopulatedData(teacherId: string, studentId: string) {
  const student = await prisma.student.findUniqueOrThrow({
    where: { id: studentId },
    include: {
      assessmentScores: {
        orderBy: { testDate: 'desc' },
        take: 5,
      },
      accommodations: { where: { isActive: true } },
    },
  });

  // Get grades in referring teacher's sections
  const enrollments = await prisma.enrollment.findMany({
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
              grades: { where: { studentId } },
            },
          },
        },
      },
    },
  });

  const sectionGrades = enrollments.map((e) => {
    const grades = e.section.assignments.flatMap((a) =>
      a.grades.filter((g) => g.pointsEarned !== null)
    );
    const earned = grades.reduce((s, g) => s + (g.pointsEarned || 0), 0);
    const possible = e.section.assignments
      .filter((a) => a.grades.some((g) => g.pointsEarned !== null))
      .reduce((s, a) => s + a.pointsPossible, 0);

    return {
      sectionName: `${e.section.courseName} — ${e.section.period}`,
      gradePercent: possible > 0 ? Math.round((earned / possible) * 1000) / 10 : 0,
    };
  });

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
  const overallAttendanceRate = Math.round(((totalDays - absentDays) / totalDays) * 1000) / 10;

  // Missing assignments count
  const missingCount = enrollments.reduce(
    (sum, e) =>
      sum + e.section.assignments.flatMap((a) => a.grades.filter((g) => g.isMissing)).length,
    0
  );

  // Count failing courses
  const failingInTeacherCourses = sectionGrades.filter((sg) => sg.gradePercent < 60).length;

  return {
    student: {
      id: student.id,
      firstName: student.firstName,
      lastName: student.lastName,
      studentIdNo: student.studentIdNo,
      gradeLevel: student.gradeLevel,
      ellStatus: student.ellStatus,
      iepActive: student.iepActive,
      has504: student.has504,
      cumulativeGpa: student.cumulativeGpa,
    },
    sectionGrades,
    overallAttendanceRate,
    missingAssignmentCount: missingCount,
    failingCourseCount: failingInTeacherCourses,
    assessmentScores: student.assessmentScores.map((a) => ({
      name: a.assessmentName,
      subject: a.subject,
      score: a.score,
      date: a.testDate.toISOString().split('T')[0],
    })),
  };
}

export async function getTeacherReferrals(teacherId: string) {
  return prisma.sSTReferral.findMany({
    where: { referringTeacherId: teacherId },
    include: {
      student: { select: { firstName: true, lastName: true } },
    },
    orderBy: { createdAt: 'desc' },
  });
}
