import { Request } from 'express';

// ─── District Auth ────────────────────────────────────────────────────

export interface DistrictAdminContext {
  id: string;
  districtId: string;
  email: string;
  firstName: string;
  lastName: string;
  role: DistrictAdminRole;
}

export type DistrictAdminRole = 'SUPERINTENDENT' | 'DIRECTOR_STUDENT_SERVICES' | 'CTO' | 'SELPA_DIRECTOR';

export interface AuthenticatedDistrictRequest extends Request {
  districtAdmin?: DistrictAdminContext;
}

// ─── School Health Scoreboard ─────────────────────────────────────────

export interface SchoolScoreboardEntry {
  schoolId: string;
  schoolName: string;
  gradeSpan: string;
  enrollmentCount: number;
  attendanceRate: number;
  attendanceTrend: number; // delta from 30 days ago
  chronicAbsenceRate: number;
  atRiskCount: number;
  atRiskPercent: number;
  mtssPipelineCapacity: number; // (tier2+tier3) / atRisk * 100
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
  pipelineFlow: {
    enteredTier2: number;
    enteredTier3: number;
    exitedToTier1: number;
    thisMonth: boolean;
  };
  avgTimeToIntervention: number; // days from identification to intervention
  fidelityByType: { type: string; fidelity: number; count: number }[];
  successRateByType: { type: string; successRate: number; count: number }[];
  sstMeetingCadence: { month: string; count: number }[];
}

export interface ComplianceStatus {
  iepTotal: number;
  iepCompliant: number;
  iepComplianceRate: number;
  overdueItems: { studentId: string; studentName: string; itemType: string; dueDate: string }[];
  approachingDeadlines: { studentId: string; studentName: string; itemType: string; dueDate: string }[];
  serviceMinuteDeliveryRate: number;
}

export interface EquitySnapshot {
  disciplineDisproportionality: { group: string; riskRatio: number; threshold: number }[];
  mtssReferralEquity: { group: string; atRiskPercent: number; referredPercent: number; gap: number }[];
  spedIdentificationRates: { group: string; identificationRate: number; enrollmentPercent: number; ratio: number }[];
}

export interface StaffCapacity {
  counselors: {
    name: string;
    totalStudents: number;
    atRiskStudents: number;
    ratioAll: string;
    ratioRisk: string;
    assessment: 'OK' | 'ADEQUATE' | 'OVERLOADED' | 'CRITICAL';
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
  comparisonToDistrictAvg: number; // percentage difference
}

// ─── Equity Dashboard ─────────────────────────────────────────────────

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
  placementByRace: { group: string; leastRestrictive: number; moderateRestrictive: number; mostRestrictive: number }[];
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
    assessment: 'OK' | 'ADEQUATE' | 'OVERLOADED' | 'CRITICAL';
  }[];
  districtAvgRatio: string;
  ascaRecommendation: string;
}

export interface WhatIfScenario {
  scenario: string;
  currentState: Record<string, number | string>;
  projectedState: Record<string, number | string>;
  impact: string;
  confidence: 'HIGH' | 'MEDIUM' | 'LOW';
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

export type ReportType =
  | 'MONTHLY_BRIEF'
  | 'QUARTERLY_EQUITY'
  | 'ANNUAL_MTSS'
  | 'BUDGET_JUSTIFICATION'
  | 'STATE_ACCOUNTABILITY'
  | 'SCHOOL_PERFORMANCE'
  | 'COMPLIANCE_STATUS'
  | 'AD_HOC';

export interface ReportRequest {
  type: ReportType;
  schoolId?: string;
  startDate?: string;
  endDate?: string;
  query?: string; // for AD_HOC
}

export interface GeneratedReport {
  id: string;
  type: ReportType;
  title: string;
  generatedAt: string;
  sections: ReportSection[];
  summary: string;
}

export interface ReportSection {
  title: string;
  content: string;
  data?: Record<string, unknown>;
  charts?: { type: string; title: string; data: unknown }[];
}

// ─── District AI ──────────────────────────────────────────────────────

export interface DistrictAIRequest {
  message: string;
  conversationId?: string;
  context?: {
    schoolIds?: string[];
    reportType?: string;
  };
}

export interface DistrictAIResponse {
  response: string;
  conversationId: string;
  data?: Record<string, unknown>;
}
