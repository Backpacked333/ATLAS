import { prisma } from '../utils/prisma';
import {
  DisciplineEquityMatrix,
  MTSSEquityDashboard,
  SPEDEquityDashboard,
} from '../types/command';

/**
 * Get the Discipline Equity Matrix — risk ratios by demographic group per school and district-wide.
 */
export async function getDisciplineEquityMatrix(districtId: string): Promise<DisciplineEquityMatrix> {
  const schools = await prisma.school.findMany({
    where: { districtId },
    select: { id: true, name: true },
  });

  const yearStart = new Date();
  yearStart.setMonth(yearStart.getMonth() - 10);

  const schoolResults: DisciplineEquityMatrix['schools'] = [];

  // District-wide aggregation
  const allStudents = await prisma.student.findMany({
    where: { school: { districtId }, enrollments: { some: { status: 'ACTIVE' } } },
    include: {
      demographic: true,
      disciplineRecords: {
        where: { incidentDate: { gte: yearStart }, consequenceType: { in: ['ISS', 'OSS'] } },
      },
    },
  });

  for (const school of schools) {
    const schoolStudents = allStudents.filter((s) => s.schoolId === school.id);
    const groups = computeRiskRatios(schoolStudents);
    schoolResults.push({
      schoolId: school.id,
      schoolName: school.name,
      groups,
    });
  }

  const districtGroups = computeRiskRatios(allStudents);

  return {
    schools: schoolResults,
    district: districtGroups,
  };
}

/**
 * Get the MTSS Equity Dashboard — identification, intervention access, outcome, and exit equity.
 */
export async function getMTSSEquityDashboard(districtId: string): Promise<MTSSEquityDashboard> {
  const students = await prisma.student.findMany({
    where: { school: { districtId }, enrollments: { some: { status: 'ACTIVE' } } },
    include: {
      demographic: true,
      interventions: { include: { logs: true } },
      referrals: true,
    },
  });

  const demographicGroups = getDemographicGroups(students);

  // Identification equity: among at-risk students, % referred by group
  const identificationEquity = demographicGroups.map((group) => {
    const groupStudents = students.filter((s) => matchDemographicGroup(s, group));
    const atRiskCount = groupStudents.filter((s) => s.riskTier !== 'ON_TRACK').length;
    const referredCount = groupStudents.filter((s) => s.referrals.length > 0).length;
    return {
      group,
      atRiskCount,
      referredCount,
      referralRate: atRiskCount > 0 ? Math.round((referredCount / atRiskCount) * 100) : 0,
    };
  });

  // Intervention access equity: among referred, % receiving interventions
  const interventionAccessEquity = demographicGroups.map((group) => {
    const groupStudents = students.filter((s) => matchDemographicGroup(s, group));
    const referredCount = groupStudents.filter((s) => s.referrals.length > 0).length;
    const receivingCount = groupStudents.filter((s) => s.interventions.some((i) => i.status === 'ACTIVE')).length;
    return {
      group,
      referredCount,
      receivingCount,
      accessRate: referredCount > 0 ? Math.round((receivingCount / referredCount) * 100) : 0,
      avgDaysToService: 0,
    };
  });

  // Outcome equity: among students with completed interventions, success rate by group
  const outcomeEquity = demographicGroups.map((group) => {
    const groupStudents = students.filter((s) => matchDemographicGroup(s, group));
    const withInterventions = groupStudents.filter((s) =>
      s.interventions.some((i) => i.status === 'COMPLETED')
    );
    const interventionCount = withInterventions.length;
    const successCount = withInterventions.filter((s) =>
      s.interventions.some((i) => {
        if (i.status !== 'COMPLETED') return false;
        const completedLogs = i.logs.filter((l) => l.completionStatus === 'COMPLETED').length;
        return i.logs.length > 0 && (completedLogs / i.logs.length) >= 0.8;
      })
    ).length;
    return {
      group,
      interventionCount,
      successCount,
      successRate: interventionCount > 0 ? Math.round((successCount / interventionCount) * 100) : 0,
    };
  });

  // Exit equity
  const exitEquity = demographicGroups.map((group) => {
    const groupStudents = students.filter((s) => matchDemographicGroup(s, group));
    const tier2Count = groupStudents.filter((s) =>
      s.interventions.some((i) => i.tier === 'TIER_2')
    ).length;
    const exitedCount = groupStudents.filter((s) =>
      s.interventions.some((i) => i.tier === 'TIER_2' && i.status === 'COMPLETED')
    ).length;
    return {
      group,
      tier2Count,
      exitedCount,
      exitRate: tier2Count > 0 ? Math.round((exitedCount / tier2Count) * 100) : 0,
      avgDaysInTier: 0,
    };
  });

  return { identificationEquity, interventionAccessEquity, outcomeEquity, exitEquity };
}

/**
 * Get the SPED Equity Dashboard — identification rates, placement, and discipline by race.
 */
export async function getSPEDEquityDashboard(districtId: string): Promise<SPEDEquityDashboard> {
  const students = await prisma.student.findMany({
    where: { school: { districtId }, enrollments: { some: { status: 'ACTIVE' } } },
    include: {
      demographic: true,
      disciplineRecords: {
        where: { consequenceType: { in: ['ISS', 'OSS'] } },
      },
    },
  });

  const demographicGroups = getDemographicGroups(students);

  // Identification rates by race
  const identificationRates = demographicGroups.map((group) => {
    const groupStudents = students.filter((s) => matchDemographicGroup(s, group));
    const totalStudents = groupStudents.length;
    const spedStudents = groupStudents.filter((s) => s.iepActive).length;
    const enrollmentPercent = students.length > 0
      ? Math.round((totalStudents / students.length) * 1000) / 10
      : 0;
    return {
      group,
      totalStudents,
      spedStudents,
      identificationRate: totalStudents > 0
        ? Math.round((spedStudents / totalStudents) * 1000) / 10
        : 0,
      enrollmentPercent,
    };
  });

  // Discipline of students with IEPs by race
  const disciplineOfIEP = demographicGroups.map((group) => {
    const groupStudents = students.filter((s) => matchDemographicGroup(s, group) && s.iepActive);
    const iepStudents = groupStudents.length;
    const suspendedCount = groupStudents.filter((s) => (s.disciplineRecords ?? []).length > 0).length;
    return {
      group,
      iepStudents,
      suspendedCount,
      suspensionRate: iepStudents > 0 ? Math.round((suspendedCount / iepStudents) * 1000) / 10 : 0,
    };
  });

  return {
    identificationRates,
    placementByRace: [],
    disciplineOfIEP,
  };
}

// ─── Helper Functions ─────────────────────────────────────────────────

interface StudentWithDemographic {
  id: string;
  schoolId: string;
  riskTier: string;
  iepActive: boolean;
  demographic: { race: string; gender: string } | null;
  disciplineRecords?: { consequenceType: string }[];
  interventions?: { status: string; tier: string; logs: { completionStatus: string }[] }[];
  referrals?: { id: string }[];
}

function computeRiskRatios(students: StudentWithDemographic[]) {
  const whiteStudents = students.filter((s) => s.demographic?.race === 'White');
  const whiteSuspendedCount = whiteStudents.filter((s) => (s.disciplineRecords ?? []).length > 0).length;
  const whiteRate = whiteStudents.length > 0 ? whiteSuspendedCount / whiteStudents.length : 0;

  const groupDefinitions = [
    { label: 'Black Male', race: 'Black', gender: 'Male' },
    { label: 'Black Female', race: 'Black', gender: 'Female' },
    { label: 'Hispanic Male', race: 'Hispanic', gender: 'Male' },
    { label: 'Hispanic Female', race: 'Hispanic', gender: 'Female' },
    { label: 'Students w/ IEPs', race: null, gender: null },
  ];

  return groupDefinitions.map((def) => {
    let groupStudents: StudentWithDemographic[];
    if (def.label === 'Students w/ IEPs') {
      groupStudents = students.filter((s) => s.iepActive);
    } else {
      groupStudents = students.filter(
        (s) => s.demographic?.race === def.race && s.demographic?.gender === def.gender
      );
    }

    const groupSuspendedCount = groupStudents.filter((s) => (s.disciplineRecords ?? []).length > 0).length;
    const groupRate = groupStudents.length > 0 ? groupSuspendedCount / groupStudents.length : 0;
    const riskRatio = whiteRate > 0 ? Math.round((groupRate / whiteRate) * 10) / 10 : 0;

    return {
      group: def.label,
      riskRatio,
      count: groupStudents.length,
      threshold: def.label === 'Students w/ IEPs' ? 2.0 : 2.0,
    };
  });
}

function getDemographicGroups(students: StudentWithDemographic[]): string[] {
  const groups = new Set<string>();
  for (const student of students) {
    if (student.demographic?.race) {
      groups.add(student.demographic.race);
    }
  }
  return Array.from(groups).sort();
}

function matchDemographicGroup(student: StudentWithDemographic, group: string): boolean {
  return student.demographic?.race === group;
}
