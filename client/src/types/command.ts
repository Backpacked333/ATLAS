// ─── District Admin Auth ──────────────────────────────────────────────

export type DistrictAdminRole = 'SUPERINTENDENT' | 'DIRECTOR_STUDENT_SERVICES' | 'CTO' | 'SELPA_DIRECTOR';

export interface DistrictAdmin {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: DistrictAdminRole;
  districtId: string;
  district?: { name: string };
  photoUrl?: string | null;
}

// ─── Scoreboard ───────────────────────────────────────────────────────

export interface SchoolScoreboardEntry {
  schoolId: string;
  schoolName: string;
  gradeSpan: string;
  enrollmentCount: number;
  attendanceRate: number;
  attendanceTrend: number;
  chronicAbsenceRate: number;
  atRiskCount: number;
  atRiskPercent: number;
  mtssPipelineCapacity: number;
  interventionFidelity: number;
  interventionSuccessRate: number;
  sstBacklog: number;
  suspensionRate: number;
  suspensionCountIss: number;
  suspensionCountOss: number;
  disproportionalityIndex: number;
  iepComplianceRate: number;
  courseFailureRate: number;
  onTrackGraduation: number | null;
  teacherEngagementRate: number;
  counselorWorkload: number;
}

export interface ScoreboardResponse {
  schools: SchoolScoreboardEntry[];
  districtTotals: {
    totalEnrollment: number;
    avgAttendanceRate: number;
    avgChronicAbsenceRate: number;
    totalAtRisk: number;
    avgInterventionFidelity: number;
    avgInterventionSuccessRate: number;
    totalSstBacklog: number;
    avgSuspensionRate: number;
    avgIepComplianceRate: number;
    avgCourseFailureRate: number;
  };
  generatedAt: string;
}

// ─── School Deep Dive ─────────────────────────────────────────────────

export interface SchoolDeepDive {
  overview: SchoolOverview;
  outcomeTrends: OutcomeTrend[];
  mtssHealth: MTSSHealth;
  complianceStatus: ComplianceStatus;
  equitySnapshot: EquitySnapshot;
  staffCapacity: StaffCapacity;
  budgetAndRoi: BudgetAndRoi;
}

export interface SchoolOverview {
  schoolId: string;
  schoolName: string;
  gradeSpan: string;
  enrollment: number;
  teacherCount: number;
  counselorCount: number;
  spedCoordinatorCount: number;
  iepPercent: number;
  ellPercent: number;
  frlPercent: number;
  demographics: { group: string; count: number; percent: number }[];
}

export interface OutcomeTrend {
  date: string;
  attendanceRate: number;
  chronicAbsenceRate: number;
  suspensionRate: number;
  courseFailureRate: number;
  avgRiskScore: number;
}

export interface MTSSHealth {
  tierDistribution: { tier: string; count: number; percent: number }[];
  pipelineFlow: { enteredTier2: number; enteredTier3: number; exitedToTier1: number; thisMonth: boolean };
  avgTimeToIntervention: number;
  fidelityByType: { type: string; fidelity: number; count: number }[];
  successRateByType: { type: string; successRate: number; count: number }[];
  sstMeetingCadence: { month: string; count: number }[];
}

export interface ComplianceStatus {
  iepTotal: number;
  iepCompliant: number;
  iepComplianceRate: number;
  overdueItems: { studentId: string; item: string; dueDate: string }[];
  approachingDeadlines: { studentId: string; item: string; dueDate: string }[];
  serviceMinuteDeliveryRate: number;
}

export interface EquitySnapshot {
  disciplineDisproportionality: { group: string; riskRatio: number; threshold: number }[];
  mtssReferralEquity: { group: string; rate: number }[];
  spedIdentificationRates: { group: string; rate: number }[];
}

export interface StaffCapacity {
  counselors: {
    name: string;
    totalStudents: number;
    atRiskStudents: number;
    ratioAll: string;
    ratioRisk: string;
    assessment: string;
  }[];
  teacherEngagementRate: number;
  interventionSpecialistCapacity: number;
}

export interface BudgetAndRoi {
  totalInterventionSpend: number;
  costPerStudent: number;
  costPerSuccess: number;
  programs: {
    name: string;
    annualCost: number;
    studentsServed: number;
    costPerStudent: number;
    successRate: number;
    costPerSuccess: number;
  }[];
  comparisonToDistrictAvg: number;
}

// ─── Equity ───────────────────────────────────────────────────────────

export interface DisciplineEquityMatrix {
  schools: {
    schoolId: string;
    schoolName: string;
    groups: { group: string; riskRatio: number; count: number; threshold: number }[];
  }[];
  district: { group: string; riskRatio: number; count: number; threshold: number }[];
}

export interface MTSSEquityDashboard {
  identificationEquity: { group: string; atRiskCount: number; referredCount: number; referralRate: number }[];
  interventionAccessEquity: { group: string; referredCount: number; receivingCount: number; accessRate: number; avgDaysToService: number }[];
  outcomeEquity: { group: string; interventionCount: number; successCount: number; successRate: number }[];
  exitEquity: { group: string; tier2Count: number; exitedCount: number; exitRate: number; avgDaysInTier: number }[];
}

export interface SPEDEquityDashboard {
  identificationRates: { group: string; totalStudents: number; spedStudents: number; identificationRate: number; enrollmentPercent: number }[];
  placementByRace: { group: string; placement: string; count: number }[];
  disciplineOfIEP: { group: string; iepStudents: number; suspendedCount: number; suspensionRate: number }[];
}

// ─── Resource Allocation ──────────────────────────────────────────────

export interface StaffingModel {
  schools: {
    schoolId: string;
    schoolName: string;
    totalStudents: number;
    atRiskStudents: number;
    counselorCount: number;
    ratioAll: string;
    ratioRisk: string;
    assessment: string;
  }[];
  districtAvgRatio: string;
  ascaRecommendation: string;
}

export interface WhatIfScenario {
  scenario: string;
  currentState: Record<string, unknown>;
  projectedState: Record<string, unknown>;
  impact: string;
  confidence: string;
  recommendation: string;
}

export interface BudgetOutcomeMapping {
  programs: {
    name: string;
    annualCost: number;
    studentsServed: number;
    costPerStudent: number;
    successRate: number;
    costPerSuccess: number;
    fidelityRate: number;
  }[];
  totalSpend: number;
  totalStudentsServed: number;
  overallSuccessRate: number;
  overallCostPerSuccess: number;
}

// ─── Reports ──────────────────────────────────────────────────────────

export interface ReportTypeInfo {
  type: string;
  title: string;
  description: string;
  schedule: string;
}

export interface GeneratedReport {
  id: string;
  type: string;
  title: string;
  generatedAt: string;
  sections: { title: string; content: string; data?: Record<string, unknown> }[];
  summary: string;
}

// ─── District AI ──────────────────────────────────────────────────────

export interface DistrictAIResponse {
  response: string;
  conversationId: string;
  data?: Record<string, unknown>;
}

export interface ConversationSummary {
  id: string;
  createdAt: string;
  lastMessage: string;
}
