import { Request } from 'express';

export interface AuthenticatedRequest extends Request {
  teacher?: TeacherContext;
}

export interface TeacherContext {
  id: string;
  schoolId: string;
  email: string;
  firstName: string;
  lastName: string;
  sectionIds: string[];
}

export interface PaginationParams {
  page: number;
  limit: number;
}

export interface SortParams {
  sortBy: string;
  sortOrder: 'asc' | 'desc';
}

export interface MorningBriefing {
  absentToday: AbsentStudent[];
  gradeAlerts: GradeAlert[];
  missingWorkQueue: MissingWorkItem[];
  interventionTasks: InterventionTask[];
  accommodationAlerts: AccommodationAlert[];
  newStudents: NewStudent[];
}

export interface AbsentStudent {
  studentId: string;
  firstName: string;
  lastName: string;
  photoUrl: string | null;
  periods: string[];
  consecutiveDays: number;
  severity: 'gray' | 'amber' | 'red';
}

export interface GradeAlert {
  studentId: string;
  firstName: string;
  lastName: string;
  photoUrl: string | null;
  sectionName: string;
  currentGrade: number;
  previousGrade: number;
  delta: number;
  lowAssignments: { name: string; score: number; possible: number }[];
}

export interface MissingWorkItem {
  studentId: string;
  firstName: string;
  lastName: string;
  assignmentName: string;
  dueDate: string;
  daysOverdue: number;
  sectionName: string;
}

export interface InterventionTask {
  interventionId: string;
  studentId: string;
  firstName: string;
  lastName: string;
  type: string;
  description: string;
  teacherRole: string | null;
  isOverdue: boolean;
  completedToday: boolean;
}

export interface AccommodationAlert {
  studentId: string;
  firstName: string;
  lastName: string;
  accommodations: string[];
  upcomingAssessment: string;
  assessmentDate: string;
}

export interface NewStudent {
  studentId: string;
  firstName: string;
  lastName: string;
  photoUrl: string | null;
  gradeLevel: number;
  ellStatus: boolean;
  iepActive: boolean;
  has504: boolean;
  priorGpa: number | null;
  addedDate: string;
}

export interface RosterFilters {
  sectionId?: string;
  gradeStatus?: 'all' | 'passing' | 'failing' | 'declining';
  attendance?: 'all' | 'chronic' | 'at-risk';
  flags?: ('ell' | 'iep' | '504' | 'tier2' | 'tier3')[];
  missingWork?: 'any' | '3+' | '5+';
}

export interface StudentProfileTeacherView {
  id: string;
  firstName: string;
  lastName: string;
  photoUrl: string | null;
  gradeLevel: number;
  ellStatus: boolean;
  iepActive: boolean;
  has504: boolean;
  riskTier: string;

  myClassPerformance: {
    sectionName: string;
    currentGradePercent: number;
    letterGrade: string;
    trendData: { week: string; grade: number }[];
    missingCount: number;
    recentGrades: { assignmentName: string; score: number; possible: number; date: string }[];
  }[];

  overallAcademicSnapshot: {
    cumulativeGpa: number | null;
    failingCourseCount: number;
    totalCredits: number | null;
    creditsRequired: number | null;
    assessmentScores: { name: string; subject: string; score: number; percentile: number | null; date: string }[];
  };

  attendance: {
    overallRate: number;
    periodRates: { period: string; rate: number }[];
    daysAbsentThisMonth: number;
    consecutiveAbsenceStreak: number;
    tardyCount: number;
  };

  accommodations: {
    type: string;
    description: string;
    category: string;
  }[];

  observations: {
    id: string;
    category: string;
    severity: string;
    content: string;
    createdAt: string;
    isEditable: boolean;
  }[];

  activeInterventions: {
    id: string;
    tier: string;
    type: string;
    description: string;
    teacherRole: string | null;
    logs: { date: string; status: string; notes: string | null }[];
  }[];

  guardians: {
    id: string;
    firstName: string;
    lastName: string;
    email: string | null;
    phone: string | null;
    relation: string;
    isPrimary: boolean;
  }[];
}

export interface SectionSummary {
  id: string;
  courseName: string;
  period: string;
  classAverageGrade: number;
  classAverageAttendance: number;
  failingCount: number;
  missingWorkCount: number;
  weekOverWeekGradeChange: number;
  weekOverWeekAttendanceChange: number;
  gradeDistribution: { letter: string; count: number }[];
  recentAssignments: {
    id: string;
    name: string;
    dueDate: string;
    classAverage: number;
    completionRate: number;
    outliers: { studentId: string; firstName: string; lastName: string; score: number }[];
  }[];
  studentCount: number;
}

export interface CreateObservationInput {
  studentId: string;
  category: 'ACADEMIC' | 'BEHAVIORAL' | 'SOCIAL_EMOTIONAL' | 'ATTENDANCE' | 'OTHER';
  severity: 'POSITIVE' | 'CONCERN' | 'URGENT';
  content: string;
}

export interface CreateReferralInput {
  studentId: string;
  primaryConcern: 'ACADEMIC' | 'BEHAVIORAL' | 'ATTENDANCE' | 'SOCIAL_EMOTIONAL' | 'OTHER';
  narrative: string;
  strategiesAttempted: { strategy: string; date: string }[];
  urgency: 'STANDARD' | 'URGENT';
  meetingTime?: string;
}

export interface LogInterventionInput {
  interventionId: string;
  completionStatus: 'COMPLETED' | 'PARTIALLY_COMPLETED' | 'NOT_COMPLETED';
  notes?: string;
}

export interface AIAssistantRequest {
  message: string;
  studentId?: string;
  conversationId?: string;
}

// ─── Enhanced Briefing ────────────────────────────────────────────────

export interface PriorityAction {
  id: string;
  urgency: 'critical' | 'high' | 'medium';
  category: 'attendance' | 'academic' | 'intervention' | 'accommodation';
  title: string;
  subtitle: string;
  studentId: string;
  firstName: string;
  lastName: string;
  actionLabel: string;
  actionUrl: string;
}

export interface TodayStats {
  totalStudents: number;
  absentCount: number;
  absentRate: number;
  interventionsDue: number;
  interventionsCompleted: number;
  urgentAlerts: number;
}

export interface Celebration {
  studentId: string;
  firstName: string;
  lastName: string;
  achievement: string;
}

export interface WeekAhead {
  assessmentsCount: number;
  studentsWithAccommodations: number;
  interventionCheckIns: number;
}

export interface EnhancedMorningBriefing extends MorningBriefing {
  priorityActions: PriorityAction[];
  todayStats: TodayStats;
  celebrations: Celebration[];
  weekAhead: WeekAhead;
}

// ─── Enhanced Student Profile ─────────────────────────────────────────

export interface EnhancedStudentProfile extends StudentProfileTeacherView {
  narrativeSummary: string;
  riskAnalysis: {
    currentScore: number;
    previousScore: number;
    trajectory: 'improving' | 'stable' | 'declining';
    factors: { factor: string; impact: 'high' | 'medium' | 'low'; detail: string }[];
  };
  recommendedActions: {
    priority: number;
    action: string;
    reason: string;
    actionType: 'contact' | 'observation' | 'intervention' | 'referral' | 'celebrate';
  }[];
  attendanceCalendar: {
    date: string;
    status: 'present' | 'absent' | 'tardy' | 'excused' | 'weekend';
  }[];
  gradeTrajectory: {
    sectionName: string;
    currentGrade: number;
    projectedEndOfTerm: number;
    confidence: 'high' | 'medium' | 'low';
  }[];
  classComparison: {
    sectionName: string;
    studentGrade: number;
    classAverage: number;
    percentile: number;
  }[];
}

// ─── Enhanced Section Summary ─────────────────────────────────────────

export interface EnhancedSectionSummary extends SectionSummary {
  gradeTrend: { week: string; avg: number }[];
  attendanceTrend: { week: string; rate: number }[];
  riskBreakdown: { tier: string; count: number }[];
  studentRankings: {
    studentId: string;
    firstName: string;
    lastName: string;
    gradePercent: number;
    gradeDelta: number;
    attendanceRate: number;
    missingCount: number;
    riskTier: string;
  }[];
  categoryPerformance: { category: string; avgScore: number; assignmentCount: number }[];
  sectionInsights: { type: string; message: string; severity: 'info' | 'warning' | 'critical' }[];
}

// ─── Teacher Insights ─────────────────────────────────────────────────

export interface StudentBrief {
  id: string;
  firstName: string;
  lastName: string;
  photoUrl: string | null;
  riskTier: string;
}

export interface TeacherInsights {
  riskDistribution: { tier: string; count: number; students: StudentBrief[] }[];
  riskTrend: { week: string; onTrack: number; needsSupport: number; urgent: number }[];
  sectionComparisons: {
    sectionId: string;
    sectionName: string;
    avgGrade: number;
    avgGradeDelta: number;
    avgAttendance: number;
    failingCount: number;
    missingWorkCount: number;
  }[];
  priorityStudents: {
    studentId: string;
    firstName: string;
    lastName: string;
    photoUrl: string | null;
    riskTier: string;
    riskScore: number;
    riskFactors: string[];
    suggestedActions: string[];
    lastTeacherContact: string | null;
    daysSinceContact: number | null;
  }[];
  patterns: {
    id: string;
    type: 'attendance_cluster' | 'grade_decline_cohort' | 'missing_work_spike' | 'positive_trend';
    title: string;
    description: string;
    affectedStudents: StudentBrief[];
    severity: 'info' | 'warning' | 'critical';
    suggestedAction: string;
  }[];
  weeklySnapshot: {
    studentsImproved: number;
    studentsDeclined: number;
    interventionCompletionRate: number;
    parentContactsMade: number;
    observationsLogged: number;
  };
}
