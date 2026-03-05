import { prisma } from '../utils/prisma';
import { getTeacherStudentIds } from '../middleware/ferpa';
import { TeacherInsights, StudentBrief } from '../types';

// ─── Helper: build a StudentBrief from a student record ──────────────
function toStudentBrief(s: {
  id: string;
  firstName: string;
  lastName: string;
  photoUrl: string | null;
  riskTier: string;
}): StudentBrief {
  return {
    id: s.id,
    firstName: s.firstName,
    lastName: s.lastName,
    photoUrl: s.photoUrl,
    riskTier: s.riskTier,
  };
}

// ─── Helper: compute grade percentage for a student given grades+assignments
function computeGradePercent(
  grades: { pointsEarned: number | null; pointsPossible: number }[]
): number {
  const validGrades = grades.filter((g) => g.pointsEarned !== null);
  if (validGrades.length === 0) return 0;
  const earned = validGrades.reduce((s, g) => s + g.pointsEarned!, 0);
  const possible = validGrades.reduce((s, g) => s + g.pointsPossible, 0);
  return possible > 0 ? (earned / possible) * 100 : 0;
}

// ─── Helper: week label ──────────────────────────────────────────────
function weekLabel(date: Date): string {
  return date.toISOString().split('T')[0];
}

// ─── Main function ───────────────────────────────────────────────────

export async function getTeacherInsights(teacherId: string): Promise<TeacherInsights> {
  const studentIds = await getTeacherStudentIds(teacherId);

  if (studentIds.length === 0) {
    return {
      riskDistribution: [
        { tier: 'ON_TRACK', count: 0, students: [] },
        { tier: 'NEEDS_SUPPORT', count: 0, students: [] },
        { tier: 'URGENT', count: 0, students: [] },
      ],
      riskTrend: [],
      sectionComparisons: [],
      priorityStudents: [],
      patterns: [],
      weeklySnapshot: {
        studentsImproved: 0,
        studentsDeclined: 0,
        interventionCompletionRate: 0,
        parentContactsMade: 0,
        observationsLogged: 0,
      },
    };
  }

  const now = new Date();
  const today = new Date(now);
  today.setHours(0, 0, 0, 0);

  const sevenDaysAgo = new Date(today);
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const fourteenDaysAgo = new Date(today);
  fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);

  const ninetyDaysAgo = new Date(today);
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

  // ─── Fetch core data in parallel ────────────────────────────────────

  const [students, teacherSections, allAttendance, allObservations] = await Promise.all([
    prisma.student.findMany({
      where: { id: { in: studentIds } },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        photoUrl: true,
        riskTier: true,
      },
    }),
    prisma.teacherSection.findMany({
      where: { teacherId },
      include: {
        section: {
          include: {
            enrollments: {
              where: { status: 'ACTIVE' },
              select: { studentId: true },
            },
            assignments: {
              include: {
                grades: {
                  where: { studentId: { in: studentIds } },
                },
              },
              orderBy: { dueDate: 'desc' },
            },
          },
        },
      },
    }),
    prisma.attendanceRecord.findMany({
      where: {
        studentId: { in: studentIds },
        date: { gte: ninetyDaysAgo },
      },
    }),
    prisma.observation.findMany({
      where: {
        teacherId,
        studentId: { in: studentIds },
      },
      orderBy: { createdAt: 'desc' },
    }),
  ]);

  const studentMap = new Map(students.map((s: any) => [s.id, s]));

  // ─── 1. Risk Distribution ──────────────────────────────────────────

  const riskBuckets: Record<string, StudentBrief[]> = {
    ON_TRACK: [],
    NEEDS_SUPPORT: [],
    URGENT: [],
  };

  for (const s of students) {
    const tier = s.riskTier;
    if (riskBuckets[tier]) {
      riskBuckets[tier].push(toStudentBrief(s));
    } else {
      riskBuckets.ON_TRACK.push(toStudentBrief(s));
    }
  }

  const riskDistribution = Object.entries(riskBuckets).map(([tier, studs]) => ({
    tier,
    count: studs.length,
    students: studs,
  }));

  // ─── 2. Risk Trend (8 weeks) ──────────────────────────────────────
  //
  // We approximate historical risk tier for each student by computing their
  // grade percentage and attendance rate as of each week-end date, then
  // bucketing into ON_TRACK / NEEDS_SUPPORT / URGENT.

  // Pre-compute per-student grade data keyed by assignment dueDate/gradedAt
  type GradeEntry = {
    studentId: string;
    pointsEarned: number;
    pointsPossible: number;
    effectiveDate: Date;
  };

  const gradeEntries: GradeEntry[] = [];
  for (const ts of teacherSections) {
    for (const assignment of ts.section.assignments) {
      for (const grade of assignment.grades) {
        if (grade.pointsEarned !== null) {
          gradeEntries.push({
            studentId: grade.studentId,
            pointsEarned: grade.pointsEarned,
            pointsPossible: assignment.pointsPossible,
            effectiveDate: grade.gradedAt || grade.createdAt,
          });
        }
      }
    }
  }

  const riskTrend: TeacherInsights['riskTrend'] = [];

  for (let w = 7; w >= 0; w--) {
    const weekEnd = new Date(today);
    weekEnd.setDate(weekEnd.getDate() - w * 7);

    let onTrack = 0;
    let needsSupport = 0;
    let urgent = 0;

    for (const sid of studentIds) {
      // Grade as of weekEnd
      const studentGrades = gradeEntries.filter(
        (g) => g.studentId === sid && g.effectiveDate <= weekEnd
      );
      const gradePercent = computeGradePercent(
        studentGrades.map((g) => ({
          pointsEarned: g.pointsEarned,
          pointsPossible: g.pointsPossible,
        }))
      );

      // Attendance rate up to weekEnd (last 90 days from weekEnd)
      const windowStart = new Date(weekEnd);
      windowStart.setDate(windowStart.getDate() - 90);
      const attRecords = allAttendance.filter(
        (a: any) => a.studentId === sid && a.date >= windowStart && a.date <= weekEnd
      );
      const totalDays = new Set(attRecords.map((a: any) => a.date.toISOString().split('T')[0])).size;
      const absentDays = new Set(
        attRecords
          .filter((a: any) => a.status === 'ABSENT')
          .map((a: any) => a.date.toISOString().split('T')[0])
      ).size;
      const attRate = totalDays > 0 ? ((totalDays - absentDays) / totalDays) * 100 : 100;

      // Approximate tier: URGENT if grade < 60 or attendance < 85
      //                   NEEDS_SUPPORT if grade < 73 or attendance < 92
      //                   else ON_TRACK
      if (gradePercent < 60 || attRate < 85) {
        urgent++;
      } else if (gradePercent < 73 || attRate < 92) {
        needsSupport++;
      } else {
        onTrack++;
      }
    }

    riskTrend.push({
      week: weekLabel(weekEnd),
      onTrack,
      needsSupport,
      urgent,
    });
  }

  // ─── 3. Section Comparisons ────────────────────────────────────────

  const sectionComparisons: TeacherInsights['sectionComparisons'] = [];

  for (const ts of teacherSections) {
    const section = ts.section;
    const sectionStudentIds = section.enrollments.map((e: any) => e.studentId);
    if (sectionStudentIds.length === 0) {
      sectionComparisons.push({
        sectionId: section.id,
        sectionName: `${section.courseName} — ${section.period}`,
        avgGrade: 0,
        avgGradeDelta: 0,
        avgAttendance: 0,
        failingCount: 0,
        missingWorkCount: 0,
      });
      continue;
    }

    // Current grades per student in this section
    const studentPercents: number[] = [];
    const studentPercents7dAgo: number[] = [];

    for (const sid of sectionStudentIds) {
      const currentGrades = section.assignments.flatMap((a) =>
        a.grades
          .filter((g) => g.studentId === sid && g.pointsEarned !== null)
          .map((g) => ({
            pointsEarned: g.pointsEarned,
            pointsPossible: a.pointsPossible,
            effectiveDate: g.gradedAt || g.createdAt,
          }))
      );

      studentPercents.push(
        computeGradePercent(
          currentGrades.map((g) => ({
            pointsEarned: g.pointsEarned,
            pointsPossible: g.pointsPossible,
          }))
        )
      );

      // Grade as of 7 days ago
      const oldGrades = currentGrades.filter((g) => g.effectiveDate <= sevenDaysAgo);
      studentPercents7dAgo.push(
        computeGradePercent(
          oldGrades.map((g) => ({
            pointsEarned: g.pointsEarned,
            pointsPossible: g.pointsPossible,
          }))
        )
      );
    }

    const avgGrade =
      studentPercents.length > 0
        ? Math.round((studentPercents.reduce((a, b) => a + b, 0) / studentPercents.length) * 10) / 10
        : 0;

    const avgGrade7dAgo =
      studentPercents7dAgo.length > 0
        ? Math.round(
            (studentPercents7dAgo.reduce((a, b) => a + b, 0) / studentPercents7dAgo.length) * 10
          ) / 10
        : avgGrade;

    const avgGradeDelta = Math.round((avgGrade - avgGrade7dAgo) * 10) / 10;

    // Attendance for this section (use period-specific if available)
    const sectionAttendance = allAttendance.filter(
      (a) => sectionStudentIds.includes(a.studentId) && (a.period === section.period || a.period === null)
    );
    const totalAttDays = sectionAttendance.length || 1;
    const presentDays = sectionAttendance.filter(
      (a) => a.status === 'PRESENT' || a.status === 'TARDY'
    ).length;
    const avgAttendance = Math.round((presentDays / totalAttDays) * 1000) / 10;

    const failingCount = studentPercents.filter((p) => p < 60).length;

    const missingWorkCount = section.assignments.flatMap((a) =>
      a.grades.filter((g) => g.isMissing && sectionStudentIds.includes(g.studentId))
    ).length;

    sectionComparisons.push({
      sectionId: section.id,
      sectionName: `${section.courseName} — ${section.period}`,
      avgGrade,
      avgGradeDelta,
      avgAttendance,
      failingCount,
      missingWorkCount,
    });
  }

  // ─── 4. Priority Students ─────────────────────────────────────────

  // Pre-compute per-student metrics
  type StudentMetrics = {
    avgGradePercent: number;
    attendanceRate: number;
    missingCount: number;
    gradeDelta: number;
    consecutiveAbsences: number;
    hasActiveIntervention: boolean;
    daysSinceLastObservation: number | null;
  };

  // Fetch active interventions for these students
  const activeInterventions = await prisma.intervention.findMany({
    where: {
      studentId: { in: studentIds },
      status: 'ACTIVE',
    },
    select: { studentId: true },
  });
  const studentsWithIntervention = new Set(activeInterventions.map((i) => i.studentId));

  const metricsMap = new Map<string, StudentMetrics>();

  for (const sid of studentIds) {
    // Grade across all teacher sections
    const allStudentGrades: { pointsEarned: number | null; pointsPossible: number; effectiveDate: Date }[] = [];
    for (const ts of teacherSections) {
      for (const assignment of ts.section.assignments) {
        for (const grade of assignment.grades) {
          if (grade.studentId === sid) {
            allStudentGrades.push({
              pointsEarned: grade.pointsEarned,
              pointsPossible: assignment.pointsPossible,
              effectiveDate: grade.gradedAt || grade.createdAt,
            });
          }
        }
      }
    }

    const avgGradePercent = computeGradePercent(
      allStudentGrades.map((g) => ({
        pointsEarned: g.pointsEarned,
        pointsPossible: g.pointsPossible,
      }))
    );

    // Grade from 14 days ago for trajectory
    const oldGrades = allStudentGrades.filter((g) => g.effectiveDate <= fourteenDaysAgo);
    const oldGradePercent = computeGradePercent(
      oldGrades.map((g) => ({
        pointsEarned: g.pointsEarned,
        pointsPossible: g.pointsPossible,
      }))
    );
    const gradeDelta = oldGrades.length > 0 ? avgGradePercent - oldGradePercent : 0;

    // Missing work count
    let missingCount = 0;
    for (const ts of teacherSections) {
      for (const assignment of ts.section.assignments) {
        for (const grade of assignment.grades) {
          if (grade.studentId === sid && grade.isMissing) {
            missingCount++;
          }
        }
      }
    }

    // Attendance rate
    const studentAttendance = allAttendance.filter((a) => a.studentId === sid);
    const uniqueDays = new Set(studentAttendance.map((a) => a.date.toISOString().split('T')[0]));
    const totalDays = uniqueDays.size;
    const absentDaySet = new Set(
      studentAttendance
        .filter((a) => a.status === 'ABSENT')
        .map((a) => a.date.toISOString().split('T')[0])
    );
    const absentDays = absentDaySet.size;
    const attendanceRate = totalDays > 0 ? ((totalDays - absentDays) / totalDays) * 100 : 100;

    // Consecutive absences (counting backwards from today, skipping weekends)
    let consecutiveAbsences = 0;
    const checkDate = new Date(today);
    for (let i = 0; i < 30; i++) {
      const dateStr = checkDate.toISOString().split('T')[0];
      const dayAbsences = studentAttendance.filter(
        (a) => a.date.toISOString().split('T')[0] === dateStr && a.status === 'ABSENT'
      );
      if (dayAbsences.length === 0) break;
      consecutiveAbsences++;
      checkDate.setDate(checkDate.getDate() - 1);
      while (checkDate.getDay() === 0 || checkDate.getDay() === 6) {
        checkDate.setDate(checkDate.getDate() - 1);
      }
    }

    // Days since last observation by this teacher
    const lastObs = allObservations.find((o) => o.studentId === sid);
    const daysSinceLastObservation = lastObs
      ? Math.floor((now.getTime() - lastObs.createdAt.getTime()) / (1000 * 60 * 60 * 24))
      : null;

    metricsMap.set(sid, {
      avgGradePercent,
      attendanceRate,
      missingCount,
      gradeDelta,
      consecutiveAbsences,
      hasActiveIntervention: studentsWithIntervention.has(sid),
      daysSinceLastObservation,
    });
  }

  // Compute risk scores and build priority list
  const priorityStudents: TeacherInsights['priorityStudents'] = [];

  for (const sid of studentIds) {
    const student = studentMap.get(sid);
    if (!student) continue;
    const m = metricsMap.get(sid)!;

    // Risk score components (0–100, higher = more at risk)
    const gradeComponent = (100 - m.avgGradePercent) * 0.3;
    const attendanceComponent = (100 - m.attendanceRate) * 0.25;
    const missingComponent = Math.min(m.missingCount * 5, 20) * 0.2;
    const trajectoryComponent = Math.max(0, -m.gradeDelta) * 0.15;
    const absenceComponent = Math.min(m.consecutiveAbsences * 10, 10) * 0.1;

    const riskScore = Math.round(
      Math.min(
        100,
        gradeComponent + attendanceComponent + missingComponent + trajectoryComponent + absenceComponent
      ) * 10
    ) / 10;

    // Risk factors
    const riskFactors: string[] = [];
    if (m.consecutiveAbsences >= 3) {
      riskFactors.push(`${m.consecutiveAbsences} consecutive absences`);
    }
    if (m.avgGradePercent < 60) {
      riskFactors.push(`Grade below 60% (${Math.round(m.avgGradePercent)}%)`);
    } else if (m.avgGradePercent < 73) {
      riskFactors.push(`Grade below C (${Math.round(m.avgGradePercent)}%)`);
    }
    if (m.attendanceRate < 90) {
      riskFactors.push(`Attendance rate ${Math.round(m.attendanceRate)}%`);
    }
    if (m.gradeDelta < -10) {
      riskFactors.push(`Grade dropped ${Math.round(Math.abs(m.gradeDelta))}% in 2 weeks`);
    }
    if (m.missingCount >= 3) {
      riskFactors.push(`${m.missingCount} missing assignments`);
    }

    // Suggested actions
    const suggestedActions: string[] = [];
    if (m.consecutiveAbsences >= 3) {
      suggestedActions.push('Schedule parent contact');
    }
    if (m.avgGradePercent < 60 && !m.hasActiveIntervention) {
      suggestedActions.push('Consider Tier 2 intervention');
    }
    if (
      m.daysSinceLastObservation !== null &&
      m.daysSinceLastObservation > 14 &&
      m.avgGradePercent < 73
    ) {
      suggestedActions.push('Log an observation');
    }
    if (m.daysSinceLastObservation === null && m.avgGradePercent < 73) {
      suggestedActions.push('Log an observation');
    }
    if (m.gradeDelta >= 10) {
      suggestedActions.push('Celebrate progress with student');
    }

    // Last teacher contact (most recent observation by this teacher)
    const lastObs = allObservations.find((o) => o.studentId === sid);
    const lastTeacherContact = lastObs ? lastObs.createdAt.toISOString() : null;
    const daysSinceContact = lastObs
      ? Math.floor((now.getTime() - lastObs.createdAt.getTime()) / (1000 * 60 * 60 * 24))
      : null;

    priorityStudents.push({
      studentId: sid,
      firstName: student.firstName,
      lastName: student.lastName,
      photoUrl: student.photoUrl,
      riskTier: student.riskTier,
      riskScore,
      riskFactors,
      suggestedActions,
      lastTeacherContact,
      daysSinceContact,
    });
  }

  // Sort by riskScore descending, take top 20
  priorityStudents.sort((a, b) => b.riskScore - a.riskScore);
  priorityStudents.splice(20);

  // ─── 5. Pattern Detection ─────────────────────────────────────────

  const patterns: TeacherInsights['patterns'] = [];
  let patternIdCounter = 0;
  const nextPatternId = () => `pattern-${++patternIdCounter}`;

  // 5a. Attendance clusters: dates where 3+ students were absent
  const absencesByDate = new Map<string, Set<string>>();
  for (const a of allAttendance) {
    if (a.status === 'ABSENT') {
      const dateStr = a.date.toISOString().split('T')[0];
      if (!absencesByDate.has(dateStr)) {
        absencesByDate.set(dateStr, new Set());
      }
      absencesByDate.get(dateStr)!.add(a.studentId);
    }
  }

  // Only look at last 14 days for cluster detection
  for (const [dateStr, absentStudentIds] of absencesByDate) {
    const d = new Date(dateStr);
    if (d < fourteenDaysAgo) continue;
    if (absentStudentIds.size >= 3) {
      const affectedStudents = [...absentStudentIds]
        .map((id) => studentMap.get(id))
        .filter(Boolean)
        .map((s) => toStudentBrief(s!));

      patterns.push({
        id: nextPatternId(),
        type: 'attendance_cluster',
        title: `${absentStudentIds.size} students absent on ${dateStr}`,
        description: `An unusual number of your students were absent on ${dateStr}. This may indicate a shared issue.`,
        affectedStudents,
        severity: absentStudentIds.size >= 5 ? 'critical' : 'warning',
        suggestedAction: 'Review if students share a common class, bus route, or activity',
      });
    }
  }

  // 5b. Grade decline cohort: students in same section with >10% grade drop in past 2 weeks
  for (const ts of teacherSections) {
    const section = ts.section;
    const sectionStudentIds = section.enrollments.map((e) => e.studentId);
    const declining: StudentBrief[] = [];

    for (const sid of sectionStudentIds) {
      const currentGrades = section.assignments.flatMap((a) =>
        a.grades
          .filter((g) => g.studentId === sid && g.pointsEarned !== null)
          .map((g) => ({
            pointsEarned: g.pointsEarned,
            pointsPossible: a.pointsPossible,
            effectiveDate: g.gradedAt || g.createdAt,
          }))
      );

      const currentPct = computeGradePercent(
        currentGrades.map((g) => ({
          pointsEarned: g.pointsEarned,
          pointsPossible: g.pointsPossible,
        }))
      );

      const oldGrades = currentGrades.filter((g) => g.effectiveDate <= fourteenDaysAgo);
      const oldPct = computeGradePercent(
        oldGrades.map((g) => ({
          pointsEarned: g.pointsEarned,
          pointsPossible: g.pointsPossible,
        }))
      );

      if (oldGrades.length > 0 && oldPct - currentPct > 10) {
        const student = studentMap.get(sid);
        if (student) declining.push(toStudentBrief(student));
      }
    }

    if (declining.length >= 2) {
      patterns.push({
        id: nextPatternId(),
        type: 'grade_decline_cohort',
        title: `${declining.length} students declining in ${section.courseName}`,
        description: `Multiple students in ${section.courseName} — ${section.period} have seen grade drops exceeding 10% over the past two weeks.`,
        affectedStudents: declining,
        severity: declining.length >= 4 ? 'critical' : 'warning',
        suggestedAction: 'Review recent assignments for common misunderstandings and consider reteaching',
      });
    }
  }

  // 5c. Missing work spikes: assignments where >40% of section students have missing grades
  for (const ts of teacherSections) {
    const section = ts.section;
    const sectionStudentIds = section.enrollments.map((e) => e.studentId);
    if (sectionStudentIds.length === 0) continue;

    // Only recent assignments (past 14 days)
    const recentAssignments = section.assignments.filter(
      (a) => a.dueDate >= fourteenDaysAgo && a.dueDate <= today
    );

    for (const assignment of recentAssignments) {
      const missingGrades = assignment.grades.filter(
        (g) => g.isMissing && sectionStudentIds.includes(g.studentId)
      );
      const missingRate = missingGrades.length / sectionStudentIds.length;

      if (missingRate > 0.4 && missingGrades.length >= 2) {
        const affectedStudents = missingGrades
          .map((g) => studentMap.get(g.studentId))
          .filter(Boolean)
          .map((s) => toStudentBrief(s!));

        patterns.push({
          id: nextPatternId(),
          type: 'missing_work_spike',
          title: `${Math.round(missingRate * 100)}% missing "${assignment.name}"`,
          description: `${missingGrades.length} of ${sectionStudentIds.length} students have not turned in "${assignment.name}" in ${section.courseName} — ${section.period}.`,
          affectedStudents,
          severity: missingRate > 0.6 ? 'critical' : 'warning',
          suggestedAction: 'Consider extending the deadline or providing class time to complete',
        });
      }
    }
  }

  // 5d. Positive trends: students whose grade improved 10%+ over past 2 weeks
  const improving: StudentBrief[] = [];
  for (const sid of studentIds) {
    const m = metricsMap.get(sid);
    if (m && m.gradeDelta >= 10) {
      const student = studentMap.get(sid);
      if (student) improving.push(toStudentBrief(student));
    }
  }

  if (improving.length > 0) {
    patterns.push({
      id: nextPatternId(),
      type: 'positive_trend',
      title: `${improving.length} student${improving.length > 1 ? 's' : ''} showing strong improvement`,
      description: `These students have improved their grades by 10% or more in the past two weeks.`,
      affectedStudents: improving,
      severity: 'info',
      suggestedAction: 'Acknowledge their effort and encourage them to keep it up',
    });
  }

  // ─── 6. Weekly Snapshot ────────────────────────────────────────────

  // Students improved vs declined over past 7 days
  let studentsImproved = 0;
  let studentsDeclined = 0;

  for (const sid of studentIds) {
    const allStudentGrades: { pointsEarned: number | null; pointsPossible: number; effectiveDate: Date }[] = [];
    for (const ts of teacherSections) {
      for (const assignment of ts.section.assignments) {
        for (const grade of assignment.grades) {
          if (grade.studentId === sid) {
            allStudentGrades.push({
              pointsEarned: grade.pointsEarned,
              pointsPossible: assignment.pointsPossible,
              effectiveDate: grade.gradedAt || grade.createdAt,
            });
          }
        }
      }
    }

    const currentPct = computeGradePercent(
      allStudentGrades.map((g) => ({
        pointsEarned: g.pointsEarned,
        pointsPossible: g.pointsPossible,
      }))
    );

    const oldGrades = allStudentGrades.filter((g) => g.effectiveDate <= sevenDaysAgo);
    if (oldGrades.length === 0) continue;

    const oldPct = computeGradePercent(
      oldGrades.map((g) => ({
        pointsEarned: g.pointsEarned,
        pointsPossible: g.pointsPossible,
      }))
    );

    const delta = currentPct - oldPct;
    if (delta >= 2) studentsImproved++;
    else if (delta <= -2) studentsDeclined++;
  }

  // Intervention logs completed by this teacher in past 7 days
  const [interventionLogsCompleted, interventionLogsDue, parentContactsMade, observationsLogged] =
    await Promise.all([
      prisma.interventionLog.count({
        where: {
          teacherId,
          date: { gte: sevenDaysAgo },
          completionStatus: 'COMPLETED',
        },
      }),
      prisma.interventionLog.count({
        where: {
          teacherId,
          date: { gte: sevenDaysAgo },
        },
      }),
      prisma.parentContact.count({
        where: {
          teacherId,
          createdAt: { gte: sevenDaysAgo },
        },
      }),
      prisma.observation.count({
        where: {
          teacherId,
          createdAt: { gte: sevenDaysAgo },
        },
      }),
    ]);

  const interventionCompletionRate =
    interventionLogsDue > 0
      ? Math.round((interventionLogsCompleted / interventionLogsDue) * 1000) / 10
      : 100;

  const weeklySnapshot: TeacherInsights['weeklySnapshot'] = {
    studentsImproved,
    studentsDeclined,
    interventionCompletionRate,
    parentContactsMade,
    observationsLogged,
  };

  // ─── Assemble result ──────────────────────────────────────────────

  return {
    riskDistribution,
    riskTrend,
    sectionComparisons,
    priorityStudents,
    patterns,
    weeklySnapshot,
  };
}
