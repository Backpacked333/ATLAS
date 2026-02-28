// ─── Auth ──────────────────────────────────────────────────────────────

export interface Teacher {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  photoUrl?: string;
  schoolId: string;
  school?: { name: string };
  sections?: SectionInfo[];
}

export interface SectionInfo {
  id: string;
  courseName: string;
  period: string;
}

// ─── Morning Briefing ──────────────────────────────────────────────────

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

// ─── Roster ────────────────────────────────────────────────────────────

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

export interface RosterFilters {
  sectionId?: string;
  gradeStatus?: 'all' | 'passing' | 'failing' | 'declining';
  attendance?: 'all' | 'chronic' | 'at-risk';
  flags?: string[];
  missingWork?: string;
}

// ─── Section ───────────────────────────────────────────────────────────

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

export interface SeatInfo {
  row: number;
  col: number;
  label: string | null;
  student: {
    id: string;
    firstName: string;
    lastName: string;
    riskTier: string;
  } | null;
}

// ─── Student Profile ───────────────────────────────────────────────────

export interface StudentProfile {
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

// ─── Observations ──────────────────────────────────────────────────────

export type ObservationCategory = 'ACADEMIC' | 'BEHAVIORAL' | 'SOCIAL_EMOTIONAL' | 'ATTENDANCE' | 'OTHER';
export type ObservationSeverity = 'POSITIVE' | 'CONCERN' | 'URGENT';

export interface CreateObservationInput {
  studentId: string;
  category: ObservationCategory;
  severity: ObservationSeverity;
  content: string;
}

// ─── Referrals ─────────────────────────────────────────────────────────

export type ConcernType = 'ACADEMIC' | 'BEHAVIORAL' | 'ATTENDANCE' | 'SOCIAL_EMOTIONAL' | 'OTHER';
export type ReferralUrgency = 'STANDARD' | 'URGENT';

export interface CreateReferralInput {
  studentId: string;
  primaryConcern: ConcernType;
  narrative: string;
  strategiesAttempted: { strategy: string; date: string }[];
  urgency: ReferralUrgency;
  meetingTime?: string;
}

// ─── Notifications ─────────────────────────────────────────────────────

export interface Notification {
  id: string;
  type: string;
  title: string;
  body: string;
  isRead: boolean;
  createdAt: string;
  studentId?: string;
}

// ─── Case Management (Module 8) ─────────────────────────────────────

export type CaseType = 'ACADEMIC' | 'BEHAVIORAL' | 'ATTENDANCE' | 'SOCIAL_EMOTIONAL' | 'SST' | 'HEALTH' | 'OTHER';
export type CaseStatus = 'OPEN' | 'IN_PROGRESS' | 'PENDING_REVIEW' | 'ESCALATED' | 'RESOLVED' | 'CLOSED';
export type CasePriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

export interface Case {
  id: string;
  studentId: string;
  type: CaseType;
  status: CaseStatus;
  priority: CasePriority;
  title: string;
  description: string;
  resolution?: string;
  closedAt?: string;
  createdAt: string;
  updatedAt: string;
  student: { firstName: string; lastName: string };
  assignedTo?: { firstName: string; lastName: string };
}

export interface CaseNote {
  id: string;
  content: string;
  createdAt: string;
  author: { firstName: string; lastName: string };
}

// ─── Task Assignment (Module 9) ─────────────────────────────────────

export type TaskCategory = 'FOLLOW_UP' | 'PARENT_CONTACT' | 'DOCUMENTATION' | 'MEETING' | 'INTERVENTION' | 'REFERRAL' | 'ASSESSMENT' | 'OTHER';
export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
export type TaskStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' | 'OVERDUE';

export interface Task {
  id: string;
  title: string;
  description?: string;
  category: TaskCategory;
  priority: TaskPriority;
  status: TaskStatus;
  dueDate?: string;
  completedAt?: string;
  createdAt: string;
  createdBy: { firstName: string; lastName: string };
  assignedTo?: { firstName: string; lastName: string };
}

export interface TaskSummary {
  pending: number;
  inProgress: number;
  overdue: number;
  completedThisWeek: number;
}

// ─── Policy Compliance (Module 10) ──────────────────────────────────

export type PolicyCategory = 'ATTENDANCE' | 'GRADING' | 'BEHAVIORAL' | 'DATA_PRIVACY' | 'ACCOMMODATION' | 'REPORTING';
export type ViolationSeverity = 'INFO' | 'WARNING' | 'CRITICAL';
export type ViolationStatus = 'OPEN' | 'ACKNOWLEDGED' | 'IN_REMEDIATION' | 'RESOLVED' | 'DISMISSED';

export interface PolicyRule {
  id: string;
  name: string;
  description: string;
  category: PolicyCategory;
  isActive: boolean;
  threshold?: string;
  _count: { violations: number };
}

export interface ComplianceViolation {
  id: string;
  severity: ViolationSeverity;
  status: ViolationStatus;
  description: string;
  createdAt: string;
  policyRule: { name: string; category: string };
}

export interface ComplianceSummary {
  totalRules: number;
  activeRules: number;
  openViolations: number;
  criticalViolations: number;
  violationsBySeverity: { severity: string; count: number }[];
}

// ─── Real-time Alerts (Module 11) ───────────────────────────────────

export type AlertCategory = 'ATTENDANCE_ALERT' | 'GRADE_ALERT' | 'BEHAVIOR_ALERT' | 'SAFETY_ALERT' | 'SYSTEM_ALERT' | 'CUSTOM';
export type AlertPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type AlertStatus = 'ACTIVE' | 'ACKNOWLEDGED' | 'RESOLVED' | 'EXPIRED';

export interface Alert {
  id: string;
  title: string;
  message: string;
  priority: AlertPriority;
  status: AlertStatus;
  channel: string;
  createdAt: string;
  alertRule?: { name: string; category: string };
}

export interface AlertRule {
  id: string;
  name: string;
  description?: string;
  category: AlertCategory;
  condition: string;
  isActive: boolean;
  channels: string;
  priority: AlertPriority;
  createdBy: { firstName: string; lastName: string };
  _count: { alerts: number };
}

export interface AlertSummary {
  active: number;
  critical: number;
  acknowledged: number;
  total: number;
}

// ─── Data Integration (Module 12) ───────────────────────────────────

export type IntegrationType = 'SIS' | 'LMS' | 'ASSESSMENT' | 'IDENTITY' | 'COMMUNICATION';
export type SyncStatus = 'IN_PROGRESS' | 'COMPLETED' | 'COMPLETED_WITH_ERRORS' | 'FAILED';

export interface IntegrationConnector {
  id: string;
  name: string;
  provider: string;
  type: IntegrationType;
  isActive: boolean;
  lastSyncAt?: string;
  createdAt: string;
  _count: { syncLogs: number };
}

export interface SyncLog {
  id: string;
  direction: string;
  entityType: string;
  recordsTotal: number;
  recordsSynced: number;
  recordsFailed: number;
  status: SyncStatus;
  startedAt: string;
  completedAt?: string;
}

export interface IntegrationSummary {
  totalConnectors: number;
  activeConnectors: number;
  recentSyncsLast24h: number;
  failedSyncsLast24h: number;
  connectorsByType: { type: string; count: number }[];
}

// ─── User Access Control (Module 13) ────────────────────────────────

export interface Role {
  id: string;
  name: string;
  description: string | null;
  isSystem: boolean;
  permissions: { permission: { id: string; resource: string; action: string } }[];
  _count: { assignments: number };
}

// ─── Audit Logging (Module 14) ──────────────────────────────────────

export interface AuditLogEntry {
  id: string;
  userId: string | null;
  userEmail: string | null;
  action: string;
  resource: string;
  resourceId: string | null;
  details: string | null;
  status: string;
  createdAt: string;
}

export interface AuditSummary {
  totalLast24h: number;
  failuresLast24h: number;
  deniedLast24h: number;
  totalLast7d: number;
  topActions: { action: string; count: number }[];
}

// ─── Reporting Analytics (Module 15) ────────────────────────────────

export interface ReportDefinition {
  id: string;
  name: string;
  description: string | null;
  type: string;
  isActive: boolean;
  lastRunAt: string | null;
  createdAt: string;
  createdBy: { firstName: string; lastName: string };
  _count: { snapshots: number };
}

export interface ReportSnapshot {
  id: string;
  data: string;
  format: string;
  recordCount: number;
  generatedAt: string;
}

// ─── Mobile Support (Module 16) ─────────────────────────────────────

export interface DeviceRegistration {
  id: string;
  deviceToken: string;
  platform: string;
  deviceName: string | null;
  isActive: boolean;
  lastActiveAt: string;
}

export interface MobilePreference {
  pushNotificationsEnabled: boolean;
  alertSound: boolean;
  quietHoursStart: string | null;
  quietHoursEnd: string | null;
  dataSaverMode: boolean;
  offlineCacheEnabled: boolean;
}

// ─── API Gateway (Module 17) ────────────────────────────────────────

export interface ApiKeyInfo {
  id: string;
  name: string;
  prefix: string;
  scopes: string;
  isActive: boolean;
  expiresAt: string | null;
  lastUsedAt: string | null;
  rateLimitPerMinute: number;
  createdAt: string;
}

export interface ApiStats {
  totalRequests24h: number;
  errorRate: number;
  avgResponseTime: number;
  requestsByMethod: { method: string; count: number }[];
}

// ─── Database Architecture (Module 18) ──────────────────────────────

export interface DatabaseSummary {
  health: {
    status: string;
    responseTimeMs: number;
    checkedAt: string;
  } | null;
  migrations: {
    total: number;
    pending: number;
  };
  recentBackups: {
    id: string;
    type: string;
    status: string;
    sizeBytes: number | null;
    completedAt: string | null;
  }[];
}
