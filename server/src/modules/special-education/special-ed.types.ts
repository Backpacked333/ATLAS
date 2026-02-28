// ─── Module 2: Special Education Compliance Engine ────────────────────
// Functional Themes: integration, operations, security, scalability, reliability, core functionality
// Cross-references: Parent Communication Portal, Data Integration Framework,
//                   API Gateway System, Multi-Tenancy Framework

export interface ComplianceDeadlineRecord {
  id: string;
  studentId: string;
  studentName: string;
  type: string;
  title: string;
  description: string | null;
  dueDate: string;
  status: string;
  assignedToId: string | null;
  completedAt: string | null;
  notes: string | null;
  schoolId: string;
  daysUntilDue: number;
  isOverdue: boolean;
}

export interface ComplianceSearchParams {
  schoolId: string;
  status?: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'OVERDUE' | 'WAIVED';
  type?: string;
  assignedToId?: string;
  dueBefore?: string;
  dueAfter?: string;
  page?: number;
  limit?: number;
}

export interface CreateComplianceDeadlineInput {
  studentId: string;
  type: 'IEP_ANNUAL_REVIEW' | 'IEP_TRIENNIAL' | 'PLAN_504_REVIEW' | 'EVALUATION_TIMELINE' | 'TRANSITION_PLAN' | 'PROGRESS_REPORT' | 'CONSENT_DEADLINE';
  title: string;
  description?: string;
  dueDate: string;
  assignedToId?: string;
  schoolId: string;
}

export interface UpdateComplianceDeadlineInput {
  status?: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'OVERDUE' | 'WAIVED';
  assignedToId?: string;
  notes?: string;
}

export interface IEPDocumentRecord {
  id: string;
  studentId: string;
  studentName: string;
  documentType: string;
  title: string;
  status: string;
  effectiveDate: string | null;
  expirationDate: string | null;
  goals: unknown;
  services: unknown;
  createdAt: string;
  updatedAt: string;
}

export interface CreateIEPDocumentInput {
  studentId: string;
  documentType: 'IEP' | 'PLAN_504' | 'BIP' | 'FBA' | 'EVALUATION_REPORT' | 'TRANSITION_PLAN' | 'PROGRESS_REPORT';
  title: string;
  effectiveDate?: string;
  expirationDate?: string;
  goals?: unknown;
  services?: unknown;
  schoolId: string;
}

export interface ComplianceDashboard {
  upcomingDeadlines: ComplianceDeadlineRecord[];
  overdueDeadlines: ComplianceDeadlineRecord[];
  recentlyCompleted: ComplianceDeadlineRecord[];
  stats: {
    totalPending: number;
    totalOverdue: number;
    completedThisMonth: number;
    studentsWithActiveIEP: number;
    studentsWith504: number;
  };
}
