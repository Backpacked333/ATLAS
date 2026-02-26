import { prisma } from '../utils/prisma';
import { getTeacherStudentIds } from '../middleware/ferpa';
import { percentageToLetter } from '../utils/grades';
import {
  CreateParentContactInput,
  PositiveContactSuggestion,
  ConferencePrepKit,
} from '../types';

/**
 * Communication Suite (Section 4.7)
 * Parent-teacher communication that's effortless and data-informed.
 */

export async function createParentContact(
  teacherId: string,
  input: CreateParentContactInput
) {
  return prisma.parentContact.create({
    data: {
      teacherId,
      studentId: input.studentId,
      guardianId: input.guardianId || null,
      method: input.method,
      subject: input.subject,
      notes: input.notes,
      sentiment: input.sentiment,
    },
  });
}

export async function getParentContacts(teacherId: string) {
  return prisma.parentContact.findMany({
    where: { teacherId },
    include: {
      student: { select: { firstName: true, lastName: true } },
      guardian: { select: { firstName: true, lastName: true } },
    },
    orderBy: { createdAt: 'desc' },
    take: 50,
  });
}

/**
 * Automated Positive Contact Suggestions (Section 4.7.2)
 * Every Monday morning, generate 3-5 students who did something worth celebrating.
 */
export async function getPositiveContactSuggestions(
  teacherId: string
): Promise<PositiveContactSuggestion[]> {
  const studentIds = await getTeacherStudentIds(teacherId);
  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

  const suggestions: PositiveContactSuggestion[] = [];

  // Get students with recent grade improvements
  const teacherSections = await prisma.teacherSection.findMany({
    where: { teacherId },
    include: {
      section: {
        include: {
          assignments: {
            where: { dueDate: { gte: oneWeekAgo } },
            include: {
              grades: {
                where: { studentId: { in: studentIds }, isMissing: false },
                include: {
                  student: {
                    include: {
                      guardians: {
                        where: { isPrimary: true },
                        take: 1,
                      },
                    },
                  },
                },
              },
            },
            orderBy: { dueDate: 'desc' },
          },
        },
      },
    },
  });

  // Find highest scores and perfect submissions
  const studentScores = new Map<string, {
    student: { id: string; firstName: string; lastName: string; photoUrl: string | null };
    guardian: { firstName: string; lastName: string; email: string | null };
    highScore: number;
    assignmentName: string;
    allSubmitted: boolean;
  }>();

  for (const ts of teacherSections) {
    for (const assignment of ts.section.assignments) {
      for (const grade of assignment.grades) {
        if (grade.pointsEarned === null) continue;
        const pct = (grade.pointsEarned / assignment.pointsPossible) * 100;
        const guardian = grade.student.guardians[0];
        if (!guardian) continue;

        const existing = studentScores.get(grade.studentId);
        if (!existing || pct > existing.highScore) {
          studentScores.set(grade.studentId, {
            student: {
              id: grade.student.id,
              firstName: grade.student.firstName,
              lastName: grade.student.lastName,
              photoUrl: grade.student.photoUrl,
            },
            guardian: {
              firstName: guardian.firstName,
              lastName: guardian.lastName,
              email: guardian.email,
            },
            highScore: Math.round(pct),
            assignmentName: assignment.name,
            allSubmitted: true,
          });
        }
      }
    }
  }

  // Pick top 5 performers
  const sorted = Array.from(studentScores.values())
    .sort((a, b) => b.highScore - a.highScore)
    .slice(0, 5);

  for (const entry of sorted) {
    const reason =
      entry.highScore >= 90
        ? `Scored ${entry.highScore}% on ${entry.assignmentName}`
        : `Submitted all work this week`;

    const draftMessage =
      `Dear ${entry.guardian.firstName} ${entry.guardian.lastName},\n\n` +
      `I wanted to let you know that ${entry.student.firstName} had a great week in class. ` +
      `${entry.student.firstName} ${reason.toLowerCase()}. ` +
      `Keep up the great work!\n\nBest regards`;

    suggestions.push({
      studentId: entry.student.id,
      firstName: entry.student.firstName,
      lastName: entry.student.lastName,
      photoUrl: entry.student.photoUrl,
      reason,
      draftMessage,
      guardianEmail: entry.guardian.email,
      guardianName: `${entry.guardian.firstName} ${entry.guardian.lastName}`,
    });
  }

  return suggestions;
}

/**
 * Parent Conference Prep Kit (Section 4.7.3)
 * One-click conference preparation with data-driven talking points.
 */
export async function getConferencePrepKit(
  teacherId: string,
  studentId: string
): Promise<ConferencePrepKit> {
  const student = await prisma.student.findUniqueOrThrow({
    where: { id: studentId },
    include: {
      guardians: true,
      accommodations: { where: { isActive: true } },
      enrollments: {
        where: {
          status: 'ACTIVE',
          section: { teachers: { some: { teacherId } } },
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
      },
    },
  });

  // Calculate per-section grades
  const gradesSummary = student.enrollments.map((enrollment) => {
    const assignments = enrollment.section.assignments;
    let totalEarned = 0;
    let totalPossible = 0;
    let missingCount = 0;

    for (const assignment of assignments) {
      const grade = assignment.grades[0];
      if (!grade) continue;
      if (grade.isMissing) {
        missingCount++;
      } else if (grade.pointsEarned !== null) {
        totalEarned += grade.pointsEarned;
        totalPossible += assignment.pointsPossible;
      }
    }

    const pct = totalPossible > 0 ? Math.round((totalEarned / totalPossible) * 1000) / 10 : 0;
    return {
      sectionName: `${enrollment.section.courseName} — ${enrollment.section.period}`,
      gradePercent: pct,
      letterGrade: percentageToLetter(pct),
      missingCount,
    };
  });

  // Attendance
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const monthStart = new Date();
  monthStart.setDate(1);

  const allAttendance = await prisma.attendanceRecord.findMany({
    where: { studentId, date: { gte: thirtyDaysAgo } },
  });

  const totalDays = allAttendance.length || 1;
  const absentDays = allAttendance.filter((a) => a.status === 'ABSENT').length;
  const tardyCount = allAttendance.filter((a) => a.status === 'TARDY').length;
  const monthAttendance = allAttendance.filter(
    (a) => a.date >= monthStart && a.status === 'ABSENT'
  );

  const attendanceSummary = {
    overallRate: Math.round(((totalDays - absentDays) / totalDays) * 1000) / 10,
    daysAbsentThisMonth: monthAttendance.length,
    tardyCount,
  };

  // Build strengths and concerns
  const strengths: string[] = [];
  const concerns: string[] = [];
  const talkingPoints: string[] = [];

  for (const gs of gradesSummary) {
    if (gs.gradePercent >= 80) {
      strengths.push(`Strong performance in ${gs.sectionName} (${gs.letterGrade})`);
    } else if (gs.gradePercent < 60) {
      concerns.push(`Failing ${gs.sectionName} with ${gs.gradePercent}%`);
      talkingPoints.push(`Discuss specific struggles in ${gs.sectionName} and create an improvement plan`);
    }
    if (gs.missingCount > 2) {
      concerns.push(`${gs.missingCount} missing assignments in ${gs.sectionName}`);
      talkingPoints.push(`Review missing work and establish homework completion routine`);
    }
  }

  if (attendanceSummary.overallRate >= 95) {
    strengths.push('Excellent attendance');
  } else if (attendanceSummary.overallRate < 90) {
    concerns.push(`Attendance at ${attendanceSummary.overallRate}% (chronic absence territory)`);
    talkingPoints.push('Discuss attendance barriers and create an attendance plan');
  }

  if (strengths.length === 0) {
    strengths.push('Shows effort in class activities');
  }
  if (talkingPoints.length === 0) {
    talkingPoints.push('Set 2-3 specific academic goals for the next grading period');
  }
  talkingPoints.push('Ask parent about any concerns or changes at home that may be affecting school');

  return {
    student: {
      firstName: student.firstName,
      lastName: student.lastName,
      gradeLevel: student.gradeLevel,
      photoUrl: student.photoUrl,
    },
    gradesSummary,
    attendanceSummary,
    strengths,
    concerns,
    accommodations: student.accommodations.map((a) => a.description),
    talkingPoints,
    guardians: student.guardians.map((g) => ({
      name: `${g.firstName} ${g.lastName}`,
      email: g.email,
      phone: g.phone,
      relation: g.relation,
    })),
  };
}
