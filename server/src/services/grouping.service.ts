import { prisma } from '../utils/prisma';
import { SmartGroup } from '../types';

/**
 * Smart Grouping Engine (Section 4.4.4)
 * Analyzes student performance to recommend flexible grouping for differentiated instruction.
 * Groups are skill-specific, temporary, and actionable.
 */
export async function getSmartGroups(
  teacherId: string,
  sectionId: string
): Promise<SmartGroup[]> {
  // Get recent assignment scores for all students in the section
  const enrollments = await prisma.enrollment.findMany({
    where: {
      sectionId,
      status: 'ACTIVE',
    },
    include: {
      student: {
        select: { id: true, firstName: true, lastName: true },
      },
    },
  });

  // Get recent assignments (last 30 days)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const assignments = await prisma.assignment.findMany({
    where: {
      sectionId,
      dueDate: { gte: thirtyDaysAgo },
    },
    include: {
      grades: {
        where: {
          studentId: { in: enrollments.map((e) => e.studentId) },
        },
      },
    },
    orderBy: { dueDate: 'desc' },
  });

  if (assignments.length === 0) {
    return [];
  }

  // Calculate average score per student
  const studentScores = new Map<string, { total: number; count: number; student: typeof enrollments[0]['student'] }>();

  for (const enrollment of enrollments) {
    studentScores.set(enrollment.studentId, {
      total: 0,
      count: 0,
      student: enrollment.student,
    });
  }

  for (const assignment of assignments) {
    for (const grade of assignment.grades) {
      if (grade.pointsEarned === null || grade.isMissing) continue;
      const entry = studentScores.get(grade.studentId);
      if (entry) {
        entry.total += (grade.pointsEarned / assignment.pointsPossible) * 100;
        entry.count++;
      }
    }
  }

  // Build scored student list
  const scoredStudents = Array.from(studentScores.entries())
    .map(([studentId, data]) => ({
      studentId,
      firstName: data.student.firstName,
      lastName: data.student.lastName,
      avgScore: data.count > 0 ? Math.round((data.total / data.count) * 10) / 10 : 0,
    }))
    .sort((a, b) => a.avgScore - b.avgScore);

  // K-means style grouping with natural breaks (simplified: 3 groups)
  const groups: SmartGroup[] = [];

  const reteach = scoredStudents.filter((s) => s.avgScore < 50);
  const reinforce = scoredStudents.filter((s) => s.avgScore >= 50 && s.avgScore < 75);
  const extend = scoredStudents.filter((s) => s.avgScore >= 75);

  if (reteach.length > 0) {
    groups.push({
      label: 'Group A: Reteach',
      recommendation:
        'These students scored below 50% on recent assessments. They may need prerequisite skills reviewed before moving forward. Consider small group instruction with concrete examples and guided practice.',
      students: reteach,
    });
  }

  if (reinforce.length > 0) {
    groups.push({
      label: 'Group B: Reinforce',
      recommendation:
        'These students understand the concepts but make procedural errors (50-75% average). Provide guided practice with worked examples and immediate feedback.',
      students: reinforce,
    });
  }

  if (extend.length > 0) {
    groups.push({
      label: 'Group C: Extend',
      recommendation:
        'These students have demonstrated mastery (above 75%). They are ready for extension activities, challenge problems, or peer tutoring roles.',
      students: extend,
    });
  }

  return groups;
}
