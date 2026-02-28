// ─── Module 3: Attendance Tracking Module ─────────────────────────────
// Functional Themes: operational requirements, security, scalability, reliability, core, integration
// Cross-references: Case Management Engine, User Access Control System,
//                   Database Architecture, Authentication Authorization System

export interface AttendanceRecordInput {
  studentId: string;
  date: string;
  period?: string;
  status: 'PRESENT' | 'ABSENT' | 'TARDY' | 'EXCUSED';
}

export interface BulkAttendanceInput {
  sectionId: string;
  date: string;
  period: string;
  records: { studentId: string; status: 'PRESENT' | 'ABSENT' | 'TARDY' | 'EXCUSED' }[];
}

export interface AttendanceQueryParams {
  studentId?: string;
  sectionId?: string;
  startDate: string;
  endDate: string;
  status?: 'PRESENT' | 'ABSENT' | 'TARDY' | 'EXCUSED';
  period?: string;
}

export interface StudentAttendanceSummary {
  studentId: string;
  studentName: string;
  totalDays: number;
  presentDays: number;
  absentDays: number;
  tardyDays: number;
  excusedDays: number;
  attendanceRate: number;
  consecutiveAbsences: number;
  isChronicallyAbsent: boolean; // <90% attendance
  patterns: AttendancePattern[];
}

export interface AttendancePattern {
  type: 'day_of_week' | 'period' | 'consecutive' | 'improving' | 'declining';
  description: string;
  severity: 'info' | 'warning' | 'critical';
  data?: Record<string, unknown>;
}

export interface SectionAttendanceSummary {
  sectionId: string;
  courseName: string;
  period: string;
  date: string;
  totalStudents: number;
  presentCount: number;
  absentCount: number;
  tardyCount: number;
  attendanceRate: number;
}

export interface AttendanceDashboard {
  todaySummary: {
    totalStudents: number;
    presentCount: number;
    absentCount: number;
    tardyCount: number;
    schoolAttendanceRate: number;
  };
  chronicAbsentStudents: {
    studentId: string;
    studentName: string;
    attendanceRate: number;
    consecutiveAbsences: number;
  }[];
  sectionSummaries: SectionAttendanceSummary[];
  recentTrend: { date: string; rate: number }[];
}
