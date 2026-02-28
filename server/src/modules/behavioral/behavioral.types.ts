// ─── Module 4: Behavioral Management System ──────────────────────────
// Functional Themes: security features, scalability, reliability, core, integration, operations
// Cross-references: Task Assignment System, Audit Logging Module,
//                   Performance Optimization Module, Backup Recovery System

export interface CreateBehavioralIncidentInput {
  studentId: string;
  incidentDate: string;
  incidentType: 'DISRUPTION' | 'DEFIANCE' | 'BULLYING' | 'FIGHTING' | 'VANDALISM' | 'ACADEMIC_DISHONESTY' | 'TARDY_PATTERN' | 'DRESS_CODE' | 'TECHNOLOGY_MISUSE' | 'OTHER';
  location?: string;
  description: string;
  actionsTaken?: { action: string; timestamp: string }[];
  severity: 'MINOR' | 'MODERATE' | 'MAJOR';
  parentNotified?: boolean;
  adminNotified?: boolean;
}

export interface UpdateBehavioralIncidentInput {
  status?: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'ESCALATED';
  followUpDate?: string;
  followUpNotes?: string;
  parentNotified?: boolean;
  adminNotified?: boolean;
  actionsTaken?: { action: string; timestamp: string }[];
}

export interface BehavioralIncidentRecord {
  id: string;
  studentId: string;
  studentName: string;
  reportedById: string;
  reportedByName: string;
  incidentDate: string;
  incidentType: string;
  location: string | null;
  description: string;
  actionsTaken: unknown;
  severity: string;
  parentNotified: boolean;
  adminNotified: boolean;
  followUpDate: string | null;
  followUpNotes: string | null;
  status: string;
  createdAt: string;
}

export interface BehavioralSearchParams {
  schoolId?: string;
  studentId?: string;
  reportedById?: string;
  incidentType?: string;
  severity?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}

export interface BehavioralSummary {
  totalIncidents: number;
  byType: { type: string; count: number }[];
  bySeverity: { severity: string; count: number }[];
  byStatus: { status: string; count: number }[];
  recentIncidents: BehavioralIncidentRecord[];
  frequentStudents: { studentId: string; studentName: string; incidentCount: number }[];
  trendData: { week: string; count: number }[];
}
