// ─── Module 1: Student Information Management System ──────────────────
// Functional Themes: core functionality, integration, operations, security, scalability, reliability
// Cross-references: Staff Scheduling Coordinator, Real-time Alert System,
//                   Mobile Support Module, Encryption Security Module

export interface StudentRecord {
  id: string;
  studentIdNo: string;
  firstName: string;
  lastName: string;
  gradeLevel: number;
  photoUrl: string | null;
  ellStatus: boolean;
  iepActive: boolean;
  has504: boolean;
  cumulativeGpa: number | null;
  totalCredits: number | null;
  creditsRequired: number | null;
  riskTier: string;
  schoolId: string;
  createdAt: string;
  updatedAt: string;
}

export interface StudentSearchParams {
  query?: string;
  schoolId?: string;
  gradeLevel?: number;
  riskTier?: 'ON_TRACK' | 'NEEDS_SUPPORT' | 'URGENT';
  ellStatus?: boolean;
  iepActive?: boolean;
  has504?: boolean;
  page?: number;
  limit?: number;
  sortBy?: 'name' | 'gradeLevel' | 'riskTier' | 'gpa';
  sortOrder?: 'asc' | 'desc';
}

export interface StudentSearchResult {
  students: StudentRecord[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface CreateStudentInput {
  studentIdNo: string;
  firstName: string;
  lastName: string;
  gradeLevel: number;
  schoolId: string;
  photoUrl?: string;
  ellStatus?: boolean;
  iepActive?: boolean;
  has504?: boolean;
}

export interface UpdateStudentInput {
  firstName?: string;
  lastName?: string;
  gradeLevel?: number;
  photoUrl?: string;
  ellStatus?: boolean;
  iepActive?: boolean;
  has504?: boolean;
  riskTier?: 'ON_TRACK' | 'NEEDS_SUPPORT' | 'URGENT';
}

export interface StudentEnrollmentInfo {
  studentId: string;
  sections: {
    sectionId: string;
    courseName: string;
    period: string;
    teacherName: string;
    enrollDate: string;
    status: string;
  }[];
}

export interface StudentDemographicSummary {
  totalStudents: number;
  byGradeLevel: { gradeLevel: number; count: number }[];
  byRiskTier: { tier: string; count: number }[];
  ellCount: number;
  iepCount: number;
  count504: number;
}
