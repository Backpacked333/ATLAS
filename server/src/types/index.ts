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

// ─── User Access Control System (Module 13) ─────────────────────────

export interface CreateRoleInput {
  name: string;
  description?: string;
}

// ─── Audit Logging Module (Module 14) ───────────────────────────────

export interface AuditLogFilters {
  userId?: string;
  action?: string;
  resource?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
  limit?: number;
  offset?: number;
}

// ─── Reporting Analytics Engine (Module 15) ─────────────────────────

export interface CreateReportInput {
  name: string;
  description?: string;
  type: 'ATTENDANCE_SUMMARY' | 'GRADE_DISTRIBUTION' | 'INTERVENTION_PROGRESS' | 'BEHAVIOR_TRENDS' | 'COMPLIANCE_STATUS' | 'STUDENT_RISK' | 'CUSTOM';
  config: string;
  schedule?: string;
}

// ─── Mobile Support Module (Module 16) ──────────────────────────────

export interface RegisterDeviceInput {
  deviceToken: string;
  platform: 'IOS' | 'ANDROID' | 'WEB';
  deviceName?: string;
}

export interface MobilePreferencesInput {
  pushNotificationsEnabled?: boolean;
  alertSound?: boolean;
  quietHoursStart?: string;
  quietHoursEnd?: string;
  dataSaverMode?: boolean;
  offlineCacheEnabled?: boolean;
}

// ─── API Gateway System (Module 17) ─────────────────────────────────

export interface CreateApiKeyInput {
  name: string;
  scopes: string;
  expiresAt?: string;
  rateLimitPerMinute?: number;
}

// ─── Database Architecture (Module 18) ──────────────────────────────

export interface RecordMigrationInput {
  version: string;
  name: string;
  description?: string;
  checksum?: string;
}

// ─── Performance Optimization (Module 19) ────────────────────────────

export interface RunBenchmarkInput {
  name: string;
  category: string;
  targetMs: number;
}

// ─── Disaster Recovery (Module 20) ───────────────────────────────────

export interface CreateRecoveryPlanInput {
  name: string;
  description?: string;
  type: 'DATABASE_FAILURE' | 'APPLICATION_FAILURE' | 'NETWORK_FAILURE' | 'FULL_SITE_RECOVERY' | 'DATA_CORRUPTION' | 'RANSOMWARE';
  priority?: number;
  rtoMinutes: number;
  rpoMinutes: number;
  steps: string;
}

export interface CompleteRecoveryTestInput {
  passed: boolean;
  notes?: string;
  issues?: string;
}

export interface InitiateFailoverInput {
  sourceRegion: string;
  targetRegion: string;
  trigger: string;
}

// ─── Encryption Security (Module 21) ─────────────────────────────────

export interface CreateEncryptionKeyInput {
  alias: string;
  algorithm: string;
  purpose: 'DATA_ENCRYPTION' | 'TOKEN_SIGNING' | 'BACKUP_ENCRYPTION' | 'TRANSPORT' | 'API_SIGNING';
  expiresAt?: string;
}

export interface RegisterEncryptedFieldInput {
  tableName: string;
  fieldName: string;
  keyAlias: string;
  encryptionType: string;
}

// ─── Multi-Tenancy (Module 22) ───────────────────────────────────────

export interface CreateTenantInput {
  name: string;
  displayName: string;
  domain?: string;
  tier?: 'FREE' | 'STANDARD' | 'PREMIUM' | 'ENTERPRISE';
  maxUsers?: number;
  maxStorage?: number;
  config?: string;
}

export interface SetResourceQuotaInput {
  resourceType: string;
  limitValue: number;
  periodStart: string;
  periodEnd: string;
}

// ─── Authentication Authorization (Module 23) ────────────────────────

export interface CreatePasswordPolicyInput {
  name: string;
  minLength?: number;
  requireUppercase?: boolean;
  requireLowercase?: boolean;
  requireNumbers?: boolean;
  requireSpecial?: boolean;
  maxAgeDays?: number;
  historyCount?: number;
  lockoutThreshold?: number;
  lockoutDurationMinutes?: number;
}

// ─── Backup Recovery (Module 24) ─────────────────────────────────────

export interface CreateScheduledBackupInput {
  name: string;
  type: 'FULL' | 'INCREMENTAL' | 'SNAPSHOT';
  schedule: string;
  retention?: number;
  destination: string;
}

export interface CreateRetentionPolicyInput {
  name: string;
  backupType: 'FULL' | 'INCREMENTAL' | 'SNAPSHOT';
  retentionDays: number;
  maxCopies?: number;
}

// ─── Monitoring Alerting (Module 25) ─────────────────────────────────

export interface RecordMetricInput {
  name: string;
  value: number;
  unit: string;
  host?: string;
  tags?: string;
}

export interface CreateMonitoringAlertInput {
  name: string;
  metricName: string;
  condition: string;
  threshold: number;
  severity?: 'INFO_M' | 'WARNING_M' | 'CRITICAL_M';
  cooldownMinutes?: number;
  notifyChannels?: string;
}

export interface CreateDashboardInput {
  name: string;
  description?: string;
  layout: string;
  isDefault?: boolean;
}
