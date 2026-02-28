// ─── Module 5: Academic Performance Reporting ─────────────────────────
// Functional Themes: scalability, reliability, core, integration, operations, security
// Cross-references: Policy Compliance Monitor, Reporting Analytics Engine,
//                   Disaster Recovery System, Monitoring Alerting System

export interface ReportRequest {
  type: 'GRADE_DISTRIBUTION' | 'ATTENDANCE_SUMMARY' | 'PERFORMANCE_TREND' | 'INTERVENTION_EFFECTIVENESS' | 'AT_RISK_IDENTIFICATION' | 'SECTION_COMPARISON' | 'STUDENT_PROGRESS' | 'COMPLIANCE_STATUS';
  scope: 'STUDENT' | 'SECTION' | 'SCHOOL' | 'DISTRICT';
  scopeId: string;
  parameters?: Record<string, unknown>;
  format?: 'JSON' | 'CSV' | 'PDF';
}

export interface GradeDistributionReport {
  sectionId: string;
  courseName: string;
  period: string;
  totalStudents: number;
  distribution: { letter: string; count: number; percentage: number }[];
  classAverage: number;
  median: number;
  standardDeviation: number;
  passingRate: number;
}

export interface PerformanceTrendReport {
  entityId: string;
  entityType: string;
  entityName: string;
  trendData: {
    period: string;
    averageGrade: number;
    attendanceRate: number;
    missingWorkCount: number;
    interventionCount: number;
  }[];
  overallTrend: 'improving' | 'stable' | 'declining';
}

export interface AtRiskReport {
  students: {
    studentId: string;
    studentName: string;
    gradeLevel: number;
    riskTier: string;
    riskFactors: string[];
    currentGpa: number | null;
    attendanceRate: number;
    failingCourseCount: number;
    missingWorkCount: number;
    activeInterventions: number;
    recommendedActions: string[];
  }[];
  summary: {
    totalAtRisk: number;
    totalUrgent: number;
    byGradeLevel: { gradeLevel: number; count: number }[];
    topRiskFactors: { factor: string; count: number }[];
  };
}

export interface SectionComparisonReport {
  sections: {
    sectionId: string;
    courseName: string;
    period: string;
    teacherName: string;
    classAverage: number;
    attendanceRate: number;
    passingRate: number;
    missingWorkRate: number;
    studentCount: number;
  }[];
}

export interface StudentProgressReport {
  studentId: string;
  studentName: string;
  gradeLevel: number;
  reportPeriod: { start: string; end: string };
  courses: {
    courseName: string;
    period: string;
    currentGrade: number;
    letterGrade: string;
    previousGrade: number;
    trend: 'improving' | 'stable' | 'declining';
    missingAssignments: number;
    attendanceRate: number;
    teacherObservations: number;
  }[];
  overallGpa: number | null;
  overallAttendanceRate: number;
  activeInterventions: number;
  behavioralIncidents: number;
}

export interface ReportMetadata {
  id: string;
  title: string;
  type: string;
  scope: string;
  scopeId: string;
  status: string;
  format: string;
  generatedById: string | null;
  createdAt: string;
  completedAt: string | null;
}
