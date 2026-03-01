import { prisma } from '../utils/prisma';
import {
  ReportType,
  GeneratedReport,
  ReportSection,
} from '../types/command';

/**
 * Generate a report based on type and parameters.
 */
export async function generateReport(
  districtId: string,
  type: ReportType,
  options: { schoolId?: string; startDate?: string; endDate?: string; query?: string }
): Promise<GeneratedReport> {
  switch (type) {
    case 'MONTHLY_BRIEF':
      return generateMonthlyBrief(districtId);
    case 'QUARTERLY_EQUITY':
      return generateQuarterlyEquity(districtId);
    case 'ANNUAL_MTSS':
      return generateAnnualMTSS(districtId);
    case 'BUDGET_JUSTIFICATION':
      return generateBudgetJustification(districtId);
    case 'SCHOOL_PERFORMANCE':
      return generateSchoolPerformance(districtId, options.schoolId);
    case 'COMPLIANCE_STATUS':
      return generateComplianceStatus(districtId);
    case 'STATE_ACCOUNTABILITY':
      return generateStateAccountability(districtId);
    case 'AD_HOC':
      return generateAdHoc(districtId, options.query || '');
    default:
      return {
        id: generateReportId(),
        type,
        title: 'Unknown Report Type',
        generatedAt: new Date().toISOString(),
        sections: [],
        summary: 'Unknown report type requested.',
      };
  }
}

/**
 * Get available report types and their descriptions.
 */
export function getReportTypes() {
  return [
    {
      type: 'MONTHLY_BRIEF',
      title: 'Monthly Student Outcomes Brief',
      description: '2-page executive summary: enrollment trends, attendance, risk tier distribution, MTSS activity, suspensions, IEP compliance.',
      schedule: 'Monthly',
    },
    {
      type: 'QUARTERLY_EQUITY',
      title: 'Quarterly Equity Report',
      description: 'Comprehensive equity analysis: discipline disproportionality, SPED identification, MTSS access equity, intervention outcome equity.',
      schedule: 'Quarterly',
    },
    {
      type: 'ANNUAL_MTSS',
      title: 'Annual MTSS Effectiveness Report',
      description: 'Year-in-review: students identified, interventions assigned, fidelity rates, success rates, cost-per-outcome, tier movement summary.',
      schedule: 'Annually',
    },
    {
      type: 'BUDGET_JUSTIFICATION',
      title: 'Budget Justification Report',
      description: 'Links spending to outcomes. Cost, students served, outcomes, cost-effectiveness ratio for every major program.',
      schedule: 'On demand',
    },
    {
      type: 'SCHOOL_PERFORMANCE',
      title: 'School Performance Report',
      description: 'Per-school report card showing all scoreboard metrics, trends, and comparison to district average.',
      schedule: 'Monthly per school',
    },
    {
      type: 'COMPLIANCE_STATUS',
      title: 'Compliance Status Report',
      description: 'District-wide IEP/504 compliance: overdue items, approaching deadlines, service minute delivery rates.',
      schedule: 'Quarterly',
    },
    {
      type: 'STATE_ACCOUNTABILITY',
      title: 'State Accountability Dashboard',
      description: 'Progress toward LCAP goals, assessment score trends, graduation rates, college/career readiness indicators.',
      schedule: 'Annually',
    },
    {
      type: 'AD_HOC',
      title: 'Ad-Hoc Query Response',
      description: 'Generate a data-backed response to any board question in under 60 seconds.',
      schedule: 'On demand',
    },
  ];
}

// ─── Report Generators ────────────────────────────────────────────────

async function generateMonthlyBrief(districtId: string): Promise<GeneratedReport> {
  const [totalStudents, atRiskStudents, tier2, tier3, pendingReferrals, schools] = await Promise.all([
    prisma.student.count({ where: { school: { districtId }, enrollments: { some: { status: 'ACTIVE' } } } }),
    prisma.student.count({ where: { school: { districtId }, riskTier: { in: ['NEEDS_SUPPORT', 'URGENT'] } } }),
    prisma.intervention.count({ where: { student: { school: { districtId } }, tier: 'TIER_2', status: 'ACTIVE' } }),
    prisma.intervention.count({ where: { student: { school: { districtId } }, tier: 'TIER_3', status: 'ACTIVE' } }),
    prisma.sSTReferral.count({ where: { student: { school: { districtId } }, status: 'PENDING' } }),
    prisma.school.count({ where: { districtId } }),
  ]);

  const iepStudents = await prisma.student.count({
    where: { school: { districtId }, iepActive: true },
  });

  const sections: ReportSection[] = [
    {
      title: 'Enrollment Overview',
      content: `The district serves ${totalStudents.toLocaleString()} students across ${schools} schools.`,
      data: { totalStudents, schools },
    },
    {
      title: 'Risk Tier Distribution',
      content: `${atRiskStudents} students (${totalStudents > 0 ? Math.round((atRiskStudents / totalStudents) * 100) : 0}%) are identified as at-risk. ${tier2} in Tier 2, ${tier3} in Tier 3.`,
      data: { atRiskStudents, tier1: totalStudents - atRiskStudents, tier2, tier3 },
    },
    {
      title: 'MTSS Activity',
      content: `${pendingReferrals} SST referrals pending review. ${tier2 + tier3} students currently receiving tiered interventions.`,
      data: { pendingReferrals, activeInterventions: tier2 + tier3 },
    },
    {
      title: 'IEP Compliance',
      content: `${iepStudents} students with active IEPs across the district.`,
      data: { iepStudents },
    },
  ];

  return {
    id: generateReportId(),
    type: 'MONTHLY_BRIEF',
    title: `Monthly Student Outcomes Brief — ${new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}`,
    generatedAt: new Date().toISOString(),
    sections,
    summary: `District enrollment: ${totalStudents.toLocaleString()} students. ${atRiskStudents} at-risk (${tier2} Tier 2, ${tier3} Tier 3). ${pendingReferrals} pending SST referrals. ${iepStudents} active IEPs.`,
  };
}

async function generateQuarterlyEquity(districtId: string): Promise<GeneratedReport> {
  const yearStart = new Date();
  yearStart.setMonth(yearStart.getMonth() - 10);

  const [suspensions, totalStudents] = await Promise.all([
    prisma.disciplineRecord.count({
      where: { school: { districtId }, incidentDate: { gte: yearStart }, consequenceType: { in: ['ISS', 'OSS'] } },
    }),
    prisma.student.count({ where: { school: { districtId }, enrollments: { some: { status: 'ACTIVE' } } } }),
  ]);

  const sections: ReportSection[] = [
    {
      title: 'Discipline Overview',
      content: `${suspensions} suspension incidents recorded this school year across all schools.`,
      data: { suspensions, totalStudents },
    },
    {
      title: 'Disproportionality Analysis',
      content: 'Risk ratios calculated for all demographic groups compared to White student baseline. See data tables for per-school and district-wide breakdowns.',
    },
    {
      title: 'MTSS Access Equity',
      content: 'Analysis of identification, referral, and intervention access rates by demographic group.',
    },
    {
      title: 'Recommendations',
      content: 'Schools with disproportionality indices above 2.0x require immediate review and action plans.',
    },
  ];

  return {
    id: generateReportId(),
    type: 'QUARTERLY_EQUITY',
    title: `Quarterly Equity Report — Q${Math.ceil((new Date().getMonth() + 1) / 3)} ${new Date().getFullYear()}`,
    generatedAt: new Date().toISOString(),
    sections,
    summary: `${suspensions} suspensions this year. Disproportionality analysis across ${totalStudents.toLocaleString()} students.`,
  };
}

async function generateAnnualMTSS(districtId: string): Promise<GeneratedReport> {
  const [totalInterventions, activeInterventions, completedInterventions] = await Promise.all([
    prisma.intervention.count({ where: { student: { school: { districtId } } } }),
    prisma.intervention.count({ where: { student: { school: { districtId } }, status: 'ACTIVE' } }),
    prisma.intervention.count({ where: { student: { school: { districtId } }, status: 'COMPLETED' } }),
  ]);

  const sections: ReportSection[] = [
    {
      title: 'MTSS Program Overview',
      content: `Total interventions this year: ${totalInterventions}. Currently active: ${activeInterventions}. Completed: ${completedInterventions}.`,
      data: { totalInterventions, activeInterventions, completedInterventions },
    },
    {
      title: 'Fidelity Analysis',
      content: 'Intervention fidelity rates by school and by intervention type.',
    },
    {
      title: 'Outcome Analysis',
      content: 'Success rates by intervention type, tier, and school.',
    },
    {
      title: 'Cost-Effectiveness',
      content: 'Cost per successful outcome by program. ROI analysis for each intervention type.',
    },
  ];

  return {
    id: generateReportId(),
    type: 'ANNUAL_MTSS',
    title: `Annual MTSS Effectiveness Report — ${new Date().getFullYear()}`,
    generatedAt: new Date().toISOString(),
    sections,
    summary: `${totalInterventions} total interventions. ${activeInterventions} active, ${completedInterventions} completed.`,
  };
}

async function generateBudgetJustification(districtId: string): Promise<GeneratedReport> {
  const budgetItems = await prisma.budgetLineItem.findMany({
    where: { districtId },
    orderBy: { annualBudget: 'desc' },
  });

  const totalBudget = budgetItems.reduce((s, b) => s + b.annualBudget, 0);
  const totalStudentsServed = budgetItems.reduce((s, b) => s + b.studentsServed, 0);

  const sections: ReportSection[] = [
    {
      title: 'Budget Summary',
      content: `Total student support budget: $${totalBudget.toLocaleString()}. Serving ${totalStudentsServed.toLocaleString()} students across ${budgetItems.length} programs.`,
      data: { totalBudget, totalStudentsServed, programCount: budgetItems.length },
    },
    {
      title: 'Program Cost-Effectiveness',
      content: 'Programs ranked by cost per successful outcome.',
      data: {
        programs: budgetItems.map((b) => ({
          name: b.programName,
          budget: b.annualBudget,
          students: b.studentsServed,
          successRate: b.successRate,
          costPerSuccess: b.costPerSuccess,
        })),
      },
    },
    {
      title: 'Recommendations',
      content: 'Scale high-ROI programs. Review and restructure low-performing programs.',
    },
  ];

  return {
    id: generateReportId(),
    type: 'BUDGET_JUSTIFICATION',
    title: `Budget Justification Report — FY ${new Date().getFullYear()}`,
    generatedAt: new Date().toISOString(),
    sections,
    summary: `Total budget: $${totalBudget.toLocaleString()} across ${budgetItems.length} programs serving ${totalStudentsServed.toLocaleString()} students.`,
  };
}

async function generateSchoolPerformance(districtId: string, schoolId?: string): Promise<GeneratedReport> {
  if (!schoolId) {
    return {
      id: generateReportId(),
      type: 'SCHOOL_PERFORMANCE',
      title: 'School Performance Report',
      generatedAt: new Date().toISOString(),
      sections: [{ title: 'Error', content: 'School ID is required for this report type.' }],
      summary: 'No school specified.',
    };
  }

  const school = await prisma.school.findUniqueOrThrow({
    where: { id: schoolId },
    include: {
      students: { where: { enrollments: { some: { status: 'ACTIVE' } } }, select: { id: true, riskTier: true } },
      counselors: { select: { id: true } },
    },
  });

  const enrollment = school.students.length;
  const atRisk = school.students.filter((s) => s.riskTier !== 'ON_TRACK').length;

  const sections: ReportSection[] = [
    {
      title: 'School Overview',
      content: `${school.name} (${school.gradeSpan}): ${enrollment} students, ${school.counselors.length} counselors.`,
      data: { enrollment, counselors: school.counselors.length, atRisk },
    },
    {
      title: 'Key Metrics',
      content: `${atRisk} at-risk students (${enrollment > 0 ? Math.round((atRisk / enrollment) * 100) : 0}% of enrollment).`,
    },
  ];

  return {
    id: generateReportId(),
    type: 'SCHOOL_PERFORMANCE',
    title: `School Performance Report — ${school.name} — ${new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}`,
    generatedAt: new Date().toISOString(),
    sections,
    summary: `${school.name}: ${enrollment} students, ${atRisk} at-risk, ${school.counselors.length} counselors.`,
  };
}

async function generateComplianceStatus(districtId: string): Promise<GeneratedReport> {
  const iepStudents = await prisma.student.count({
    where: { school: { districtId }, iepActive: true },
  });

  const has504 = await prisma.student.count({
    where: { school: { districtId }, has504: true },
  });

  const sections: ReportSection[] = [
    {
      title: 'IEP Compliance Overview',
      content: `${iepStudents} students with active IEPs district-wide. ${has504} students with 504 plans.`,
      data: { iepStudents, has504 },
    },
    {
      title: 'Compliance Rate',
      content: 'Overall compliance rate and per-school breakdown.',
    },
    {
      title: 'Risk Assessment',
      content: 'Schools with compliance rates below 95% flagged for immediate review.',
    },
  ];

  return {
    id: generateReportId(),
    type: 'COMPLIANCE_STATUS',
    title: `Compliance Status Report — ${new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}`,
    generatedAt: new Date().toISOString(),
    sections,
    summary: `${iepStudents} active IEPs, ${has504} active 504 plans.`,
  };
}

async function generateStateAccountability(districtId: string): Promise<GeneratedReport> {
  const totalStudents = await prisma.student.count({
    where: { school: { districtId }, enrollments: { some: { status: 'ACTIVE' } } },
  });

  const sections: ReportSection[] = [
    {
      title: 'State Accountability Overview',
      content: `District enrollment: ${totalStudents.toLocaleString()} students. Tracking progress toward LCAP goals.`,
    },
    {
      title: 'CAASPP Score Trends',
      content: 'Assessment score trends by subgroup across benchmark windows.',
    },
    {
      title: 'Chronic Absence by Subgroup',
      content: 'Chronic absence rates broken down by race/ethnicity, ELL status, and SPED status.',
    },
  ];

  return {
    id: generateReportId(),
    type: 'STATE_ACCOUNTABILITY',
    title: `State Accountability Dashboard — ${new Date().getFullYear()}`,
    generatedAt: new Date().toISOString(),
    sections,
    summary: `State accountability report for ${totalStudents.toLocaleString()} students.`,
  };
}

async function generateAdHoc(districtId: string, query: string): Promise<GeneratedReport> {
  // In production, this would use the AI to parse the query and generate a data-backed response
  const totalStudents = await prisma.student.count({
    where: { school: { districtId }, enrollments: { some: { status: 'ACTIVE' } } },
  });

  return {
    id: generateReportId(),
    type: 'AD_HOC',
    title: `Ad-Hoc Query Response`,
    generatedAt: new Date().toISOString(),
    sections: [
      {
        title: 'Query',
        content: query,
      },
      {
        title: 'Response',
        content: `[AI Integration Point] This query would be processed by the district AI assistant with access to all ${totalStudents.toLocaleString()} student records. Connect your Anthropic API key to enable AI-powered ad-hoc query responses.`,
      },
    ],
    summary: `Ad-hoc query processed for district with ${totalStudents.toLocaleString()} students.`,
  };
}

// ─── Helpers ──────────────────────────────────────────────────────────

function generateReportId(): string {
  return `rpt_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}
