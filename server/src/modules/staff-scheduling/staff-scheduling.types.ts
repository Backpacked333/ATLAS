// ─── Module 6: Staff Scheduling Coordinator ──────────────────────────
// Functional Themes: reliability, core, integration, operations, security, scalability
// Cross-references: Real-time Alert System, Mobile Support Module,
//                   Encryption Security Module, Student Information Management System

export interface StaffMemberRecord {
  id: string;
  schoolId: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  department: string | null;
  isActive: boolean;
  hireDate: string | null;
  certifications: unknown;
  schedules: StaffScheduleEntry[];
}

export interface StaffScheduleEntry {
  id: string;
  dayOfWeek: number;
  dayName: string;
  startTime: string;
  endTime: string;
  location: string | null;
  duty: string | null;
  isRecurring: boolean;
}

export interface CreateStaffMemberInput {
  email: string;
  firstName: string;
  lastName: string;
  role: 'TEACHER' | 'ADMINISTRATOR' | 'COUNSELOR' | 'PARAPROFESSIONAL' | 'SUBSTITUTE' | 'SPECIALIST' | 'SUPPORT_STAFF';
  department?: string;
  hireDate?: string;
  certifications?: string[];
}

export interface CreateScheduleInput {
  staffMemberId: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  location?: string;
  duty?: string;
  isRecurring?: boolean;
  effectiveFrom: string;
  effectiveUntil?: string;
}

export interface CreateAbsenceInput {
  staffMemberId: string;
  startDate: string;
  endDate: string;
  reason: 'SICK' | 'PERSONAL' | 'PROFESSIONAL_DEVELOPMENT' | 'JURY_DUTY' | 'BEREAVEMENT' | 'FAMILY_MEDICAL' | 'OTHER';
  notes?: string;
  substituteId?: string;
}

export interface StaffAbsenceRecord {
  id: string;
  staffMemberId: string;
  staffName: string;
  startDate: string;
  endDate: string;
  reason: string;
  notes: string | null;
  substituteId: string | null;
  substituteName: string | null;
  status: string;
}

export interface ScheduleDashboard {
  todaySchedule: {
    staffMemberId: string;
    staffName: string;
    role: string;
    entries: StaffScheduleEntry[];
  }[];
  todayAbsences: StaffAbsenceRecord[];
  upcomingAbsences: StaffAbsenceRecord[];
  coverageGaps: {
    time: string;
    location: string;
    duty: string;
    absentStaff: string;
  }[];
  staffSummary: {
    totalStaff: number;
    presentToday: number;
    absentToday: number;
    byRole: { role: string; count: number }[];
  };
}
