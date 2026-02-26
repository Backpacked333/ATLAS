import { prisma } from '../utils/prisma';
import { ProfessionalInsights } from '../types';

/**
 * Professional Growth Insights (Section 4.8)
 * Non-evaluative, data-driven insights about the teacher's own practice.
 * This data is visible ONLY to the teacher. Never shared with administrators.
 */
export async function getProfessionalInsights(
  teacherId: string
): Promise<ProfessionalInsights> {
  const [sectionComparison, assignmentEffectiveness, gradingPatterns, observationStats] =
    await Promise.all([
      getSectionComparison(teacherId),
      getAssignmentEffectiveness(teacherId),
      getGradingPatterns(teacherId),
      getObservationStats(teacherId),
    ]);

  return {
    sectionComparison,
    assignmentEffectiveness,
    gradingPatterns,
    observationStats,
  };
}

/**
 * Section Comparison (Section 4.8.1)
 * Compare outcomes across sections teaching the same course.
 */
async function getSectionComparison(teacherId: string) {
  const teacherSections = await prisma.teacherSection.findMany({
    where: { teacherId },
    include: {
      section: {
        include: {
          enrollments: {
            where: { status: 'ACTIVE' },
            include: { student: true },
          },
          assignments: {
            include: {
              grades: true,
            },
          },
        },
      },
    },
  });

  return teacherSections.map((ts) => {
    const section = ts.section;
    const studentIds = section.enrollments.map((e) => e.studentId);
    let totalEarned = 0;
    let totalPossible = 0;
    let failingCount = 0;

    // Calculate per-student grades
    const studentGrades = new Map<string, { earned: number; possible: number }>();
    for (const sid of studentIds) {
      studentGrades.set(sid, { earned: 0, possible: 0 });
    }

    for (const assignment of section.assignments) {
      for (const grade of assignment.grades) {
        if (!studentIds.includes(grade.studentId)) continue;
        const entry = studentGrades.get(grade.studentId)!;
        if (grade.pointsEarned !== null && !grade.isMissing) {
          entry.earned += grade.pointsEarned;
          entry.possible += assignment.pointsPossible;
          totalEarned += grade.pointsEarned;
          totalPossible += assignment.pointsPossible;
        }
      }
    }

    for (const [, data] of studentGrades) {
      if (data.possible > 0 && (data.earned / data.possible) * 100 < 60) {
        failingCount++;
      }
    }

    return {
      sectionName: `${section.courseName} — ${section.period}`,
      averageGrade: totalPossible > 0
        ? Math.round((totalEarned / totalPossible) * 1000) / 10
        : 0,
      failingCount,
      studentCount: studentIds.length,
    };
  });
}

/**
 * Assignment Effectiveness Analysis (Section 4.8.2)
 * For each assignment: discrimination, difficulty, and actionable insights.
 */
async function getAssignmentEffectiveness(teacherId: string) {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const teacherSections = await prisma.teacherSection.findMany({
    where: { teacherId },
    include: {
      section: {
        include: {
          enrollments: { where: { status: 'ACTIVE' } },
          assignments: {
            where: { dueDate: { gte: thirtyDaysAgo } },
            include: {
              grades: true,
            },
            orderBy: { dueDate: 'desc' },
          },
        },
      },
    },
  });

  const results: ProfessionalInsights['assignmentEffectiveness'] = [];

  for (const ts of teacherSections) {
    const section = ts.section;
    const enrolledIds = new Set(section.enrollments.map((e) => e.studentId));

    for (const assignment of section.assignments) {
      const relevantGrades = assignment.grades.filter((g) => enrolledIds.has(g.studentId));
      const totalStudents = enrolledIds.size || 1;
      const submitted = relevantGrades.filter((g) => !g.isMissing && g.pointsEarned !== null);
      const completionRate = Math.round((submitted.length / totalStudents) * 100);

      const scores = submitted.map((g) => (g.pointsEarned! / assignment.pointsPossible) * 100);
      const avgScore = scores.length > 0
        ? Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 10) / 10
        : 0;

      // Calculate discrimination (standard deviation as proxy)
      const stdDev = scores.length > 1
        ? Math.sqrt(scores.reduce((sum, s) => sum + Math.pow(s - avgScore, 2), 0) / scores.length)
        : 0;

      let discriminationRating: string;
      let insight: string;

      if (avgScore > 90 && stdDev < 10) {
        discriminationRating = 'Low';
        insight = `Average of ${avgScore}% with ${submitted.length} of ${totalStudents} students scoring above 90%. This assessment may not distinguish mastery levels effectively.`;
      } else if (completionRate < 70) {
        discriminationRating = 'N/A';
        insight = `Only ${completionRate}% completion rate. The primary barrier appears to be submission, not skill. Consider scaffolding into smaller deadlines.`;
      } else if (stdDev > 25) {
        discriminationRating = 'High';
        insight = `Wide score spread (SD: ${Math.round(stdDev)}). This assignment effectively distinguishes performance levels.`;
      } else {
        discriminationRating = 'Moderate';
        insight = `Average of ${avgScore}% with moderate score spread. Good assessment alignment.`;
      }

      results.push({
        assignmentName: assignment.name,
        sectionName: `${section.courseName} — ${section.period}`,
        avgScore,
        completionRate,
        discriminationRating,
        insight,
      });
    }
  }

  return results;
}

/**
 * Grading Pattern Insights (Section 4.8.3)
 * Analyze grading patterns for potential unintentional bias.
 */
async function getGradingPatterns(teacherId: string) {
  const insights: ProfessionalInsights['gradingPatterns'] = [];

  // Analyze grading timestamps for temporal bias
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const grades = await prisma.grade.findMany({
    where: {
      gradedAt: { gte: thirtyDaysAgo },
      pointsEarned: { not: null },
      assignment: {
        section: {
          teachers: { some: { teacherId } },
        },
      },
    },
    include: {
      assignment: { select: { pointsPossible: true } },
    },
    orderBy: { gradedAt: 'asc' },
  });

  if (grades.length > 20) {
    // Temporal bias: compare morning vs evening grading
    const morningGrades = grades.filter((g) => g.gradedAt && g.gradedAt.getHours() < 15);
    const eveningGrades = grades.filter((g) => g.gradedAt && g.gradedAt.getHours() >= 20);

    if (morningGrades.length > 5 && eveningGrades.length > 5) {
      const morningAvg = morningGrades.reduce(
        (sum, g) => sum + (g.pointsEarned! / g.assignment.pointsPossible) * 100,
        0
      ) / morningGrades.length;
      const eveningAvg = eveningGrades.reduce(
        (sum, g) => sum + (g.pointsEarned! / g.assignment.pointsPossible) * 100,
        0
      ) / eveningGrades.length;

      const diff = Math.round(Math.abs(morningAvg - eveningAvg));
      if (diff > 3) {
        const higher = morningAvg > eveningAvg ? 'before 3 PM' : 'after 8 PM';
        const lower = morningAvg > eveningAvg ? 'after 8 PM' : 'before 3 PM';
        insights.push({
          type: 'Temporal Bias',
          insight: `You tend to assign grades that are ${diff}% higher on assignments graded ${higher} compared to those graded ${lower}. This is common — decision fatigue affects grading. Consider grading in shorter sessions.`,
        });
      }
    }

    // Late penalty impact
    const lateGrades = grades.filter((g) => {
      // Access the raw data; the 'isLate' flag from the Grade model
      return (g as unknown as { isLate: boolean }).isLate;
    });

    if (lateGrades.length > 3) {
      const lateAvg = lateGrades.reduce(
        (sum, g) => sum + (g.pointsEarned! / g.assignment.pointsPossible) * 100,
        0
      ) / lateGrades.length;
      const onTimeGrades = grades.filter((g) => !(g as unknown as { isLate: boolean }).isLate);
      const onTimeAvg = onTimeGrades.length > 0
        ? onTimeGrades.reduce(
            (sum, g) => sum + (g.pointsEarned! / g.assignment.pointsPossible) * 100,
            0
          ) / onTimeGrades.length
        : 0;

      if (onTimeAvg - lateAvg > 10) {
        insights.push({
          type: 'Late Penalty Impact',
          insight: `Late submissions average ${Math.round(lateAvg)}% compared to ${Math.round(onTimeAvg)}% for on-time work. ${lateGrades.length} submissions were affected. Consider whether the late penalty is achieving its intended purpose.`,
        });
      }
    }
  }

  if (insights.length === 0) {
    insights.push({
      type: 'Summary',
      insight: 'No significant grading pattern anomalies detected in the past 30 days. Keep up the consistent grading practices!',
    });
  }

  return insights;
}

/**
 * Observation Statistics
 * Summary of observation patterns this month.
 */
async function getObservationStats(teacherId: string) {
  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);

  const observations = await prisma.observation.findMany({
    where: {
      teacherId,
      createdAt: { gte: monthStart },
    },
    select: { category: true, severity: true },
  });

  const totalThisMonth = observations.length;
  const positiveCount = observations.filter(
    (o) => o.severity === 'POSITIVE' || o.category === 'POSITIVE'
  ).length;
  const positiveRatio = totalThisMonth > 0
    ? Math.round((positiveCount / totalThisMonth) * 100) / 100
    : 0;

  const categoryCounts = new Map<string, number>();
  for (const obs of observations) {
    categoryCounts.set(obs.category, (categoryCounts.get(obs.category) || 0) + 1);
  }

  return {
    totalThisMonth,
    positiveRatio,
    categoryCounts: Array.from(categoryCounts.entries()).map(([category, count]) => ({
      category,
      count,
    })),
  };
}
