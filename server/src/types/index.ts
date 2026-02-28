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

// ─── Case Management Engine (Module 8) ─────────────────────────────

export interface CreateCaseInput {
  studentId: string;
  type: 'ACADEMIC' | 'BEHAVIORAL' | 'ATTENDANCE' | 'SOCIAL_EMOTIONAL' | 'SST' | 'HEALTH' | 'OTHER';
  priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  title: string;
  description: string;
  assignedToId?: string;
}

export interface CaseFilters {
  status?: string;
  type?: string;
  priority?: string;
  assignedToId?: string;
  studentId?: string;
}

// ─── Task Assignment System (Module 9) ──────────────────────────────

export interface CreateTaskInput {
  title: string;
  description?: string;
  category: 'FOLLOW_UP' | 'PARENT_CONTACT' | 'DOCUMENTATION' | 'MEETING' | 'INTERVENTION' | 'REFERRAL' | 'ASSESSMENT' | 'OTHER';
  priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  assignedToId?: string;
  studentId?: string;
  caseId?: string;
  dueDate?: string;
}

export interface TaskFilters {
  status?: string;
  category?: string;
  priority?: string;
  overdueOnly?: boolean;
}

// ─── Policy Compliance Monitor (Module 10) ──────────────────────────

export interface CreatePolicyRuleInput {
  name: string;
  description: string;
  category: 'ATTENDANCE' | 'GRADING' | 'BEHAVIORAL' | 'DATA_PRIVACY' | 'ACCOMMODATION' | 'REPORTING';
  threshold?: string;
}

export interface RecordViolationInput {
  policyRuleId: string;
  studentId?: string;
  teacherId?: string;
  severity: 'INFO' | 'WARNING' | 'CRITICAL';
  description: string;
}

// ─── Real-time Alert System (Module 11) ─────────────────────────────

export interface CreateAlertRuleInput {
  name: string;
  description?: string;
  category: 'ATTENDANCE_ALERT' | 'GRADE_ALERT' | 'BEHAVIOR_ALERT' | 'SAFETY_ALERT' | 'SYSTEM_ALERT' | 'CUSTOM';
  condition: string;
  channels?: string;
  priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
}

export interface AlertFilters {
  status?: string;
  priority?: string;
  limit?: number;
}

// ─── Data Integration Framework (Module 12) ─────────────────────────

export interface CreateConnectorInput {
  name: string;
  provider: string;
  type: 'SIS' | 'LMS' | 'ASSESSMENT' | 'IDENTITY' | 'COMMUNICATION';
  config: string;
}

export interface StartSyncInput {
  direction: 'INBOUND' | 'OUTBOUND' | 'BIDIRECTIONAL';
  entityType: string;
}
