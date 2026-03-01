import { prisma } from '../utils/prisma';
import { percentageToLetter, gradeColor, attendanceColor } from '../utils/grades';
import { RosterFilters } from '../types';

export interface RosterStudent {
  id: string;
  firstName: string;
  lastName: string;
  photoUrl: string | null;
  sectionId: string;
  sectionName: string;
  gradePercent: number;
  letterGrade: string;
  gradeColor: 'green' | 'amber' | 'red';
  trendData: number[];
  missingCount: number;
  attendanceRate: number;
  attendanceColor: 'green' | 'amber' | 'red';
  cumulativeGpa: number | null;
  flags: string[];
  lastNoteDate: string | null;
  daysSinceLastNote: number | null;
}

export async function getRoster(
  teacherId: string,
  filters: RosterFilters
): Promise<RosterStudent[]> {
  const teacherSections = await prisma.teacherSection.findMany({
    where: { teacherId },
    select: { sectionId: true },
  });

  const sectionIds = filters.sectionId
    ? [filters.sectionId]
    : teacherSections.map((ts) => ts.sectionId);

  const enrollments = await prisma.enrollment.findMany({
    where: {
      sectionId: { in: sectionIds },
      status: 'ACTIVE',
    },
    include: {
      student: {
        include: {
          accommodations: { where: { isActive: true } },
          interventions: { where: { status: 'ACTIVE' } },
          observations: {
            where: { teacherId },
            orderBy: { createdAt: 'desc' },
            take: 1,
          },
        },
      },
      section: {
        include: {
          assignments: {
            include: {
              grades: true,
            },
          },
        },
      },
    },
  });

  const today = new Date();
  const ninetyDaysAgo = new Date(today);
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

  const results: RosterStudent[] = [];

  for (const enrollment of enrollments) {
    const student = enrollment.student;
    const section = enrollment.section;

    // Calculate grade percentage
    const studentGrades = section.assignments.flatMap((a) =>
      a.grades.filter((g) => g.studentId === student.id && g.pointsEarned !== null)
    );

    const totalEarned = studentGrades.reduce((sum, g) => sum + (g.pointsEarned || 0), 0);
    const totalPossible = section.assignments
      .filter((a) => a.grades.some((g) => g.studentId === student.id && g.pointsEarned !== null))
      .reduce((sum, a) => sum + a.pointsPossible, 0);

    const gradePercent = totalPossible > 0 ? Math.round((totalEarned / totalPossible) * 1000) / 10 : 0;
    const letterGrade = percentageToLetter(gradePercent);

    // Missing count
    const missingCount = section.assignments.flatMap((a) =>
      a.grades.filter((g) => g.studentId === student.id && g.isMissing)
    ).length;

    // Attendance rate (own period)
    const attendanceRecords = await prisma.attendanceRecord.findMany({
      where: {
        studentId: student.id,
        date: { gte: ninetyDaysAgo },
        period: section.period,
      },
    });

    const totalDays = attendanceRecords.length || 1;
    const presentDays = attendanceRecords.filter((a) => a.status === 'PRESENT').length;
    const attRate = Math.round((presentDays / totalDays) * 1000) / 10;

    // Flags
    const flags: string[] = [];
    if (student.ellStatus) flags.push('ELL');
    if (student.iepActive) flags.push('IEP');
    if (student.has504) flags.push('504');
    const activeTiers = student.interventions.map((i) => i.tier);
    if (activeTiers.includes('TIER_2')) flags.push('Tier 2');
    if (activeTiers.includes('TIER_3')) flags.push('Tier 3');

    // Last note date
    const lastNote = student.observations[0];
    const lastNoteDate = lastNote ? lastNote.createdAt.toISOString().split('T')[0] : null;
    const daysSinceLastNote = lastNote
      ? Math.floor((today.getTime() - lastNote.createdAt.getTime()) / (1000 * 60 * 60 * 24))
      : null;

    // Trend data (simplified: last 8 weeks of grade)
    const trendData: number[] = [];
    for (let w = 7; w >= 0; w--) {
      const weekEnd = new Date(today);
      weekEnd.setDate(weekEnd.getDate() - w * 7);
      const weekGrades = studentGrades.filter(
        (g) => g.gradedAt && g.gradedAt <= weekEnd
      );
      if (weekGrades.length > 0) {
        const wEarned = weekGrades.reduce((s, g) => s + (g.pointsEarned || 0), 0);
        const wPossible = section.assignments
          .filter((a) => a.grades.some((g) => g.studentId === student.id && g.pointsEarned !== null && g.gradedAt && g.gradedAt <= weekEnd))
          .reduce((s, a) => s + a.pointsPossible, 0);
        trendData.push(wPossible > 0 ? Math.round((wEarned / wPossible) * 100) : 0);
      }
    }

    const rosterStudent: RosterStudent = {
      id: student.id,
      firstName: student.firstName,
      lastName: student.lastName,
      photoUrl: student.photoUrl,
      sectionId: section.id,
      sectionName: `${section.courseName} — ${section.period}`,
      gradePercent,
      letterGrade,
      gradeColor: gradeColor(letterGrade),
      trendData,
      missingCount,
      attendanceRate: attRate,
      attendanceColor: attendanceColor(attRate),
      cumulativeGpa: student.cumulativeGpa,
      flags,
      lastNoteDate,
      daysSinceLastNote,
    };

    results.push(rosterStudent);
  }

  // Apply filters
  let filtered = results;

  if (filters.gradeStatus && filters.gradeStatus !== 'all') {
    filtered = filtered.filter((s) => {
      if (filters.gradeStatus === 'passing') return s.gradePercent >= 60;
      if (filters.gradeStatus === 'failing') return s.gradePercent < 60;
      if (filters.gradeStatus === 'declining') return s.trendData.length >= 2 && s.trendData[s.trendData.length - 1] < s.trendData[s.trendData.length - 2];
      return true;
    });
  }

  if (filters.attendance && filters.attendance !== 'all') {
    filtered = filtered.filter((s) => {
      if (filters.attendance === 'chronic') return s.attendanceRate < 90;
      if (filters.attendance === 'at-risk') return s.attendanceRate < 95;
      return true;
    });
  }

  if (filters.flags && filters.flags.length > 0) {
    filtered = filtered.filter((s) =>
      filters.flags!.some((flag) => {
        const flagMap: Record<string, string> = { ell: 'ELL', iep: 'IEP', '504': '504', tier2: 'Tier 2', tier3: 'Tier 3' };
        return s.flags.includes(flagMap[flag] || flag);
      })
    );
  }

  if (filters.missingWork) {
    filtered = filtered.filter((s) => {
      if (filters.missingWork === '3+') return s.missingCount >= 3;
      if (filters.missingWork === '5+') return s.missingCount >= 5;
      return s.missingCount > 0;
    });
  }

  return filtered.sort((a, b) => a.lastName.localeCompare(b.lastName));
}

/**
 * Quick search for the global search bar — returns minimal student data.
 */
export async function searchRoster(
  teacherId: string,
  query: string
): Promise<{ id: string; firstName: string; lastName: string }[]> {
  const teacherSections = await prisma.teacherSection.findMany({
    where: { teacherId },
    select: { sectionId: true },
  });
  const sectionIds = teacherSections.map((ts) => ts.sectionId);

  const enrollments = await prisma.enrollment.findMany({
    where: {
      sectionId: { in: sectionIds },
      status: 'ACTIVE',
      student: {
        OR: [
          { firstName: { contains: query, mode: 'insensitive' } },
          { lastName: { contains: query, mode: 'insensitive' } },
        ],
      },
    },
    include: {
      student: { select: { id: true, firstName: true, lastName: true } },
    },
    distinct: ['studentId'],
    take: 10,
  });

  return enrollments.map((e) => e.student);
}
