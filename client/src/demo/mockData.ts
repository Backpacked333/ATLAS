import type {
  Teacher,
  MorningBriefing,
  RosterStudent,
  StudentProfile,
  SectionSummary,
  SeatInfo,
  Notification,
} from '../types';

// ─── Teacher ──────────────────────────────────────────────────────────────

export const DEMO_TEACHER: Teacher = {
  id: 'demo-teacher-001',
  email: 'sarah.chen@lincoln.edu',
  firstName: 'Sarah',
  lastName: 'Chen',
  schoolId: 'school-001',
  school: { name: 'Lincoln High School' },
  sections: [
    { id: 'sec-alg2-p1', courseName: 'Algebra II', period: 'Period 1' },
    { id: 'sec-alg2-p3', courseName: 'Algebra II', period: 'Period 3' },
    { id: 'sec-precalc-p4', courseName: 'Pre-Calculus', period: 'Period 4' },
    { id: 'sec-geo-p6', courseName: 'Geometry', period: 'Period 6' },
    { id: 'sec-alg1-p7', courseName: 'Algebra I', period: 'Period 7' },
  ],
};

// ─── Student IDs ──────────────────────────────────────────────────────────

const S = {
  marcus: 'stu-001',
  aisha: 'stu-002',
  jayden: 'stu-003',
  sofia: 'stu-004',
  liam: 'stu-005',
  maya: 'stu-006',
  ethan: 'stu-007',
  isabella: 'stu-008',
  noah: 'stu-009',
  olivia: 'stu-010',
  diego: 'stu-011',
  emma: 'stu-012',
  tyler: 'stu-013',
  priya: 'stu-014',
  connor: 'stu-015',
  zara: 'stu-016',
  jackson: 'stu-017',
  lily: 'stu-018',
  kevin: 'stu-019',
  rachel: 'stu-020',
  brandon: 'stu-021',
  natalie: 'stu-022',
  andre: 'stu-023',
  hannah: 'stu-024',
  daniel: 'stu-025',
  chloe: 'stu-026',
  ryan: 'stu-027',
  samantha: 'stu-028',
};

// ─── Morning Briefing ─────────────────────────────────────────────────────

export const DEMO_BRIEFING: MorningBriefing = {
  absentToday: [
    {
      studentId: S.marcus,
      firstName: 'Marcus',
      lastName: 'Williams',
      photoUrl: null,
      periods: ['Period 1', 'Period 3'],
      consecutiveDays: 3,
      severity: 'red',
    },
    {
      studentId: S.jayden,
      firstName: 'Jayden',
      lastName: 'Carter',
      photoUrl: null,
      periods: ['Period 4'],
      consecutiveDays: 1,
      severity: 'gray',
    },
    {
      studentId: S.sofia,
      firstName: 'Sofia',
      lastName: 'Rodriguez',
      photoUrl: null,
      periods: ['Period 6', 'Period 7'],
      consecutiveDays: 2,
      severity: 'amber',
    },
  ],
  gradeAlerts: [
    {
      studentId: S.ethan,
      firstName: 'Ethan',
      lastName: 'Brooks',
      photoUrl: null,
      sectionName: 'Algebra II - P1',
      currentGrade: 52,
      previousGrade: 67,
      delta: -15,
      lowAssignments: [
        { name: 'Ch. 7 Quiz', score: 12, possible: 30 },
        { name: 'Polynomial HW #4', score: 3, possible: 20 },
      ],
    },
    {
      studentId: S.tyler,
      firstName: 'Tyler',
      lastName: 'Morrison',
      photoUrl: null,
      sectionName: 'Pre-Calculus - P4',
      currentGrade: 58,
      previousGrade: 71,
      delta: -13,
      lowAssignments: [
        { name: 'Unit Circle Test', score: 28, possible: 60 },
      ],
    },
    {
      studentId: S.brandon,
      firstName: 'Brandon',
      lastName: 'Lee',
      photoUrl: null,
      sectionName: 'Geometry - P6',
      currentGrade: 61,
      previousGrade: 74,
      delta: -13,
      lowAssignments: [
        { name: 'Triangle Proofs', score: 15, possible: 30 },
        { name: 'Midpoint Formula HW', score: 5, possible: 15 },
      ],
    },
    {
      studentId: S.maya,
      firstName: 'Maya',
      lastName: 'Patel',
      photoUrl: null,
      sectionName: 'Algebra II - P3',
      currentGrade: 64,
      previousGrade: 73,
      delta: -9,
      lowAssignments: [
        { name: 'Rational Expressions Quiz', score: 14, possible: 25 },
      ],
    },
  ],
  missingWorkQueue: [
    { studentId: S.ethan, firstName: 'Ethan', lastName: 'Brooks', assignmentName: 'Polynomial HW #4', dueDate: '2026-02-24', daysOverdue: 4, sectionName: 'Algebra II - P1' },
    { studentId: S.ethan, firstName: 'Ethan', lastName: 'Brooks', assignmentName: 'Polynomial HW #3', dueDate: '2026-02-20', daysOverdue: 8, sectionName: 'Algebra II - P1' },
    { studentId: S.marcus, firstName: 'Marcus', lastName: 'Williams', assignmentName: 'Ch. 7 Practice Set', dueDate: '2026-02-26', daysOverdue: 2, sectionName: 'Algebra II - P1' },
    { studentId: S.tyler, firstName: 'Tyler', lastName: 'Morrison', assignmentName: 'Trig Identities WS', dueDate: '2026-02-25', daysOverdue: 3, sectionName: 'Pre-Calculus - P4' },
    { studentId: S.sofia, firstName: 'Sofia', lastName: 'Rodriguez', assignmentName: 'Area & Perimeter Lab', dueDate: '2026-02-27', daysOverdue: 1, sectionName: 'Geometry - P6' },
    { studentId: S.brandon, firstName: 'Brandon', lastName: 'Lee', assignmentName: 'Congruence Proof HW', dueDate: '2026-02-23', daysOverdue: 5, sectionName: 'Geometry - P6' },
    { studentId: S.kevin, firstName: 'Kevin', lastName: 'Nguyen', assignmentName: 'Linear Equations WS', dueDate: '2026-02-26', daysOverdue: 2, sectionName: 'Algebra I - P7' },
  ],
  interventionTasks: [
    {
      interventionId: 'int-001',
      studentId: S.ethan,
      firstName: 'Ethan',
      lastName: 'Brooks',
      type: 'Daily Check-In',
      description: 'Spend 2 minutes at start of class checking in on assignment completion and understanding',
      teacherRole: 'Daily check-in at start of Period 1',
      isOverdue: true,
      completedToday: false,
    },
    {
      interventionId: 'int-002',
      studentId: S.marcus,
      firstName: 'Marcus',
      lastName: 'Williams',
      type: 'Academic Tutoring',
      description: 'Provide extra practice problems on polynomial operations',
      teacherRole: 'Provide modified practice set',
      isOverdue: false,
      completedToday: false,
    },
    {
      interventionId: 'int-003',
      studentId: S.sofia,
      firstName: 'Sofia',
      lastName: 'Rodriguez',
      type: 'Attendance Monitoring',
      description: 'Track attendance pattern and call home after 2nd consecutive absence',
      teacherRole: 'Parent contact if absent today',
      isOverdue: false,
      completedToday: false,
    },
    {
      interventionId: 'int-004',
      studentId: S.brandon,
      firstName: 'Brandon',
      lastName: 'Lee',
      type: 'Behavior Contract',
      description: 'Modified seating and structured breaks for focus',
      teacherRole: 'Implement preferred seating and 5-min break mid-class',
      isOverdue: false,
      completedToday: true,
    },
  ],
  accommodationAlerts: [
    {
      studentId: S.aisha,
      firstName: 'Aisha',
      lastName: 'Johnson',
      accommodations: ['Extended time (1.5x)', 'Separate testing room', 'Calculator allowed'],
      upcomingAssessment: 'Ch. 8 Unit Test - Rational Functions',
      assessmentDate: '2026-03-03',
    },
    {
      studentId: S.liam,
      firstName: 'Liam',
      lastName: 'O\'Brien',
      accommodations: ['Preferential seating', 'Graphic organizer', 'Chunked assignments'],
      upcomingAssessment: 'Pre-Calculus Midterm',
      assessmentDate: '2026-03-05',
    },
  ],
  newStudents: [
    {
      studentId: S.zara,
      firstName: 'Zara',
      lastName: 'Hassan',
      photoUrl: null,
      gradeLevel: 10,
      ellStatus: true,
      iepActive: false,
      has504: false,
      priorGpa: 3.2,
      addedDate: '2026-02-24',
    },
  ],
};

// ─── Roster Students ──────────────────────────────────────────────────────

export const DEMO_ROSTER: RosterStudent[] = [
  // Period 1 - Algebra II
  { id: S.ethan, firstName: 'Ethan', lastName: 'Brooks', photoUrl: null, sectionId: 'sec-alg2-p1', sectionName: 'Algebra II - P1', gradePercent: 52, letterGrade: 'F', gradeColor: 'red', trendData: [68, 65, 62, 58, 55, 54, 52, 52], missingCount: 4, attendanceRate: 91, attendanceColor: 'amber', cumulativeGpa: 1.8, flags: [], lastNoteDate: '2/20', daysSinceLastNote: 8 },
  { id: S.marcus, firstName: 'Marcus', lastName: 'Williams', photoUrl: null, sectionId: 'sec-alg2-p1', sectionName: 'Algebra II - P1', gradePercent: 67, letterGrade: 'D', gradeColor: 'red', trendData: [72, 71, 70, 69, 68, 67, 67, 67], missingCount: 2, attendanceRate: 84, attendanceColor: 'red', cumulativeGpa: 2.3, flags: [], lastNoteDate: '2/25', daysSinceLastNote: 3 },
  { id: S.aisha, firstName: 'Aisha', lastName: 'Johnson', photoUrl: null, sectionId: 'sec-alg2-p1', sectionName: 'Algebra II - P1', gradePercent: 88, letterGrade: 'B+', gradeColor: 'green', trendData: [85, 86, 87, 88, 87, 88, 88, 88], missingCount: 0, attendanceRate: 98, attendanceColor: 'green', cumulativeGpa: 3.5, flags: ['IEP'], lastNoteDate: '2/15', daysSinceLastNote: 13 },
  { id: S.noah, firstName: 'Noah', lastName: 'Kim', photoUrl: null, sectionId: 'sec-alg2-p1', sectionName: 'Algebra II - P1', gradePercent: 94, letterGrade: 'A', gradeColor: 'green', trendData: [92, 93, 93, 94, 95, 94, 94, 94], missingCount: 0, attendanceRate: 99, attendanceColor: 'green', cumulativeGpa: 3.9, flags: [], lastNoteDate: null, daysSinceLastNote: null },
  { id: S.olivia, firstName: 'Olivia', lastName: 'Santos', photoUrl: null, sectionId: 'sec-alg2-p1', sectionName: 'Algebra II - P1', gradePercent: 78, letterGrade: 'C+', gradeColor: 'green', trendData: [75, 76, 77, 78, 78, 77, 78, 78], missingCount: 1, attendanceRate: 96, attendanceColor: 'green', cumulativeGpa: 2.9, flags: [], lastNoteDate: '2/10', daysSinceLastNote: 18 },
  { id: S.diego, firstName: 'Diego', lastName: 'Ramirez', photoUrl: null, sectionId: 'sec-alg2-p1', sectionName: 'Algebra II - P1', gradePercent: 73, letterGrade: 'C', gradeColor: 'green', trendData: [70, 71, 72, 73, 73, 72, 73, 73], missingCount: 1, attendanceRate: 94, attendanceColor: 'amber', cumulativeGpa: 2.6, flags: ['ELL'], lastNoteDate: '2/18', daysSinceLastNote: 10 },

  // Period 3 - Algebra II
  { id: S.maya, firstName: 'Maya', lastName: 'Patel', photoUrl: null, sectionId: 'sec-alg2-p3', sectionName: 'Algebra II - P3', gradePercent: 64, letterGrade: 'D', gradeColor: 'red', trendData: [73, 72, 70, 68, 66, 65, 64, 64], missingCount: 2, attendanceRate: 92, attendanceColor: 'amber', cumulativeGpa: 2.4, flags: [], lastNoteDate: '2/22', daysSinceLastNote: 6 },
  { id: S.emma, firstName: 'Emma', lastName: 'Wilson', photoUrl: null, sectionId: 'sec-alg2-p3', sectionName: 'Algebra II - P3', gradePercent: 91, letterGrade: 'A-', gradeColor: 'green', trendData: [89, 90, 90, 91, 91, 91, 91, 91], missingCount: 0, attendanceRate: 100, attendanceColor: 'green', cumulativeGpa: 3.7, flags: [], lastNoteDate: null, daysSinceLastNote: null },
  { id: S.priya, firstName: 'Priya', lastName: 'Sharma', photoUrl: null, sectionId: 'sec-alg2-p3', sectionName: 'Algebra II - P3', gradePercent: 96, letterGrade: 'A', gradeColor: 'green', trendData: [95, 95, 96, 96, 96, 97, 96, 96], missingCount: 0, attendanceRate: 99, attendanceColor: 'green', cumulativeGpa: 4.0, flags: [], lastNoteDate: null, daysSinceLastNote: null },
  { id: S.connor, firstName: 'Connor', lastName: 'Murphy', photoUrl: null, sectionId: 'sec-alg2-p3', sectionName: 'Algebra II - P3', gradePercent: 81, letterGrade: 'B-', gradeColor: 'green', trendData: [79, 80, 80, 81, 81, 81, 81, 81], missingCount: 0, attendanceRate: 97, attendanceColor: 'green', cumulativeGpa: 3.1, flags: [], lastNoteDate: '2/14', daysSinceLastNote: 14 },
  { id: S.zara, firstName: 'Zara', lastName: 'Hassan', photoUrl: null, sectionId: 'sec-alg2-p3', sectionName: 'Algebra II - P3', gradePercent: 75, letterGrade: 'C', gradeColor: 'green', trendData: [75, 75, 75, 75, 75, 75, 75, 75], missingCount: 0, attendanceRate: 100, attendanceColor: 'green', cumulativeGpa: 3.2, flags: ['ELL'], lastNoteDate: '2/24', daysSinceLastNote: 4 },

  // Period 4 - Pre-Calculus
  { id: S.tyler, firstName: 'Tyler', lastName: 'Morrison', photoUrl: null, sectionId: 'sec-precalc-p4', sectionName: 'Pre-Calculus - P4', gradePercent: 58, letterGrade: 'F', gradeColor: 'red', trendData: [71, 69, 67, 64, 62, 60, 59, 58], missingCount: 3, attendanceRate: 88, attendanceColor: 'red', cumulativeGpa: 2.1, flags: [], lastNoteDate: '2/19', daysSinceLastNote: 9 },
  { id: S.liam, firstName: 'Liam', lastName: 'O\'Brien', photoUrl: null, sectionId: 'sec-precalc-p4', sectionName: 'Pre-Calculus - P4', gradePercent: 82, letterGrade: 'B', gradeColor: 'green', trendData: [80, 81, 81, 82, 82, 82, 82, 82], missingCount: 0, attendanceRate: 96, attendanceColor: 'green', cumulativeGpa: 3.3, flags: ['504'], lastNoteDate: '2/17', daysSinceLastNote: 11 },
  { id: S.lily, firstName: 'Lily', lastName: 'Chen', photoUrl: null, sectionId: 'sec-precalc-p4', sectionName: 'Pre-Calculus - P4', gradePercent: 97, letterGrade: 'A+', gradeColor: 'green', trendData: [96, 96, 97, 97, 97, 97, 97, 97], missingCount: 0, attendanceRate: 100, attendanceColor: 'green', cumulativeGpa: 4.0, flags: [], lastNoteDate: null, daysSinceLastNote: null },
  { id: S.jackson, firstName: 'Jackson', lastName: 'Taylor', photoUrl: null, sectionId: 'sec-precalc-p4', sectionName: 'Pre-Calculus - P4', gradePercent: 85, letterGrade: 'B', gradeColor: 'green', trendData: [83, 84, 84, 85, 85, 85, 85, 85], missingCount: 0, attendanceRate: 97, attendanceColor: 'green', cumulativeGpa: 3.4, flags: [], lastNoteDate: null, daysSinceLastNote: null },
  { id: S.rachel, firstName: 'Rachel', lastName: 'Adams', photoUrl: null, sectionId: 'sec-precalc-p4', sectionName: 'Pre-Calculus - P4', gradePercent: 74, letterGrade: 'C', gradeColor: 'green', trendData: [76, 75, 75, 74, 74, 74, 74, 74], missingCount: 1, attendanceRate: 93, attendanceColor: 'amber', cumulativeGpa: 2.8, flags: [], lastNoteDate: '2/21', daysSinceLastNote: 7 },

  // Period 6 - Geometry
  { id: S.sofia, firstName: 'Sofia', lastName: 'Rodriguez', photoUrl: null, sectionId: 'sec-geo-p6', sectionName: 'Geometry - P6', gradePercent: 71, letterGrade: 'C-', gradeColor: 'amber', trendData: [76, 75, 74, 73, 72, 71, 71, 71], missingCount: 2, attendanceRate: 87, attendanceColor: 'red', cumulativeGpa: 2.5, flags: ['ELL'], lastNoteDate: '2/23', daysSinceLastNote: 5 },
  { id: S.brandon, firstName: 'Brandon', lastName: 'Lee', photoUrl: null, sectionId: 'sec-geo-p6', sectionName: 'Geometry - P6', gradePercent: 61, letterGrade: 'D-', gradeColor: 'red', trendData: [74, 72, 70, 68, 65, 63, 62, 61], missingCount: 3, attendanceRate: 90, attendanceColor: 'amber', cumulativeGpa: 2.0, flags: [], lastNoteDate: '2/20', daysSinceLastNote: 8 },
  { id: S.natalie, firstName: 'Natalie', lastName: 'Park', photoUrl: null, sectionId: 'sec-geo-p6', sectionName: 'Geometry - P6', gradePercent: 89, letterGrade: 'B+', gradeColor: 'green', trendData: [87, 88, 88, 89, 89, 89, 89, 89], missingCount: 0, attendanceRate: 98, attendanceColor: 'green', cumulativeGpa: 3.6, flags: [], lastNoteDate: null, daysSinceLastNote: null },
  { id: S.andre, firstName: 'Andre', lastName: 'Davis', photoUrl: null, sectionId: 'sec-geo-p6', sectionName: 'Geometry - P6', gradePercent: 76, letterGrade: 'C', gradeColor: 'green', trendData: [74, 75, 75, 76, 76, 76, 76, 76], missingCount: 0, attendanceRate: 95, attendanceColor: 'green', cumulativeGpa: 2.7, flags: [], lastNoteDate: '2/16', daysSinceLastNote: 12 },
  { id: S.hannah, firstName: 'Hannah', lastName: 'Clark', photoUrl: null, sectionId: 'sec-geo-p6', sectionName: 'Geometry - P6', gradePercent: 83, letterGrade: 'B', gradeColor: 'green', trendData: [81, 82, 82, 83, 83, 83, 83, 83], missingCount: 0, attendanceRate: 97, attendanceColor: 'green', cumulativeGpa: 3.2, flags: [], lastNoteDate: null, daysSinceLastNote: null },

  // Period 7 - Algebra I
  { id: S.kevin, firstName: 'Kevin', lastName: 'Nguyen', photoUrl: null, sectionId: 'sec-alg1-p7', sectionName: 'Algebra I - P7', gradePercent: 69, letterGrade: 'D+', gradeColor: 'red', trendData: [72, 71, 70, 70, 69, 69, 69, 69], missingCount: 2, attendanceRate: 93, attendanceColor: 'amber', cumulativeGpa: 2.4, flags: [], lastNoteDate: '2/18', daysSinceLastNote: 10 },
  { id: S.samantha, firstName: 'Samantha', lastName: 'Rivera', photoUrl: null, sectionId: 'sec-alg1-p7', sectionName: 'Algebra I - P7', gradePercent: 86, letterGrade: 'B', gradeColor: 'green', trendData: [84, 85, 85, 86, 86, 86, 86, 86], missingCount: 0, attendanceRate: 97, attendanceColor: 'green', cumulativeGpa: 3.3, flags: [], lastNoteDate: null, daysSinceLastNote: null },
  { id: S.daniel, firstName: 'Daniel', lastName: 'Foster', photoUrl: null, sectionId: 'sec-alg1-p7', sectionName: 'Algebra I - P7', gradePercent: 92, letterGrade: 'A-', gradeColor: 'green', trendData: [90, 91, 91, 92, 92, 92, 92, 92], missingCount: 0, attendanceRate: 99, attendanceColor: 'green', cumulativeGpa: 3.8, flags: [], lastNoteDate: null, daysSinceLastNote: null },
  { id: S.chloe, firstName: 'Chloe', lastName: 'Martinez', photoUrl: null, sectionId: 'sec-alg1-p7', sectionName: 'Algebra I - P7', gradePercent: 77, letterGrade: 'C+', gradeColor: 'green', trendData: [75, 76, 76, 77, 77, 77, 77, 77], missingCount: 0, attendanceRate: 95, attendanceColor: 'green', cumulativeGpa: 2.9, flags: ['IEP'], lastNoteDate: '2/13', daysSinceLastNote: 15 },
  { id: S.ryan, firstName: 'Ryan', lastName: 'Thompson', photoUrl: null, sectionId: 'sec-alg1-p7', sectionName: 'Algebra I - P7', gradePercent: 80, letterGrade: 'B-', gradeColor: 'green', trendData: [78, 79, 79, 80, 80, 80, 80, 80], missingCount: 0, attendanceRate: 96, attendanceColor: 'green', cumulativeGpa: 3.0, flags: [], lastNoteDate: null, daysSinceLastNote: null },
];

// ─── Student Profiles ─────────────────────────────────────────────────────

export function getDemoStudentProfile(studentId: string): StudentProfile | null {
  const rosterEntry = DEMO_ROSTER.find((s) => s.id === studentId);
  if (!rosterEntry) return null;

  const profiles: Record<string, Partial<StudentProfile>> = {
    [S.ethan]: {
      gradeLevel: 10,
      ellStatus: false,
      iepActive: false,
      has504: false,
      riskTier: 'URGENT',
      myClassPerformance: [
        {
          sectionName: 'Algebra II - P1',
          currentGradePercent: 52,
          letterGrade: 'F',
          trendData: [
            { week: 'W1', grade: 68 }, { week: 'W2', grade: 65 }, { week: 'W3', grade: 62 },
            { week: 'W4', grade: 58 }, { week: 'W5', grade: 55 }, { week: 'W6', grade: 54 },
            { week: 'W7', grade: 52 }, { week: 'W8', grade: 52 },
          ],
          missingCount: 4,
          recentGrades: [
            { assignmentName: 'Ch. 7 Quiz', score: 12, possible: 30, date: '2/25' },
            { assignmentName: 'Polynomial HW #4', score: 0, possible: 20, date: '2/24' },
            { assignmentName: 'Polynomial HW #3', score: 0, possible: 20, date: '2/20' },
            { assignmentName: 'Factoring Practice', score: 18, possible: 25, date: '2/18' },
            { assignmentName: 'Ch. 6 Test', score: 42, possible: 80, date: '2/14' },
          ],
        },
      ],
      overallAcademicSnapshot: {
        cumulativeGpa: 1.8,
        failingCourseCount: 2,
        totalCredits: 45,
        creditsRequired: 230,
        assessmentScores: [
          { name: 'SBAC Math', subject: 'Mathematics', score: 2418, percentile: 22, date: '2025-05' },
          { name: 'SBAC ELA', subject: 'English', score: 2502, percentile: 38, date: '2025-05' },
        ],
      },
      attendance: {
        overallRate: 91,
        periodRates: [
          { period: 'Period 1', rate: 89 },
          { period: 'Period 2', rate: 92 },
          { period: 'Period 3', rate: 93 },
        ],
        daysAbsentThisMonth: 3,
        consecutiveAbsenceStreak: 0,
        tardyCount: 7,
      },
      accommodations: [],
      observations: [
        { id: 'obs-001', category: 'ACADEMIC', severity: 'CONCERN', content: 'Ethan has not turned in homework in 2 weeks. Seems disengaged during group work and often puts head down during independent practice time.', createdAt: '2026-02-20T14:30:00Z', isEditable: false },
        { id: 'obs-002', category: 'BEHAVIORAL', severity: 'CONCERN', content: 'Noticed Ethan on phone during instruction. When asked to put it away, he complied but seemed frustrated. This is the 3rd time this week.', createdAt: '2026-02-18T10:15:00Z', isEditable: false },
        { id: 'obs-003', category: 'ACADEMIC', severity: 'POSITIVE', content: 'Ethan participated actively in the review game today and correctly answered 3 questions about factoring. He seemed more engaged than usual.', createdAt: '2026-02-12T11:00:00Z', isEditable: false },
      ],
      activeInterventions: [
        {
          id: 'int-001',
          tier: 'TIER_2',
          type: 'Daily Check-In',
          description: 'Two-minute daily check-in at start of Period 1 to review assignment completion and understanding. Goal: Improve homework completion rate from 40% to 80%.',
          teacherRole: 'Daily check-in at start of Period 1',
          logs: [
            { date: '2/27', status: 'COMPLETED', notes: 'Checked in — said he "forgot" homework again' },
            { date: '2/26', status: 'COMPLETED', notes: 'Brief check-in, seemed tired' },
            { date: '2/25', status: 'NOT_COMPLETED', notes: null },
            { date: '2/24', status: 'COMPLETED', notes: 'Productive conversation about study habits' },
          ],
        },
      ],
      guardians: [
        { id: 'g-001', firstName: 'Denise', lastName: 'Brooks', email: 'denise.brooks@email.com', phone: '(555) 234-5678', relation: 'Mother', isPrimary: true },
        { id: 'g-002', firstName: 'Robert', lastName: 'Brooks', email: null, phone: '(555) 234-5679', relation: 'Father', isPrimary: false },
      ],
    },
    [S.aisha]: {
      gradeLevel: 10,
      ellStatus: false,
      iepActive: true,
      has504: false,
      riskTier: 'ON_TRACK',
      myClassPerformance: [
        {
          sectionName: 'Algebra II - P1',
          currentGradePercent: 88,
          letterGrade: 'B+',
          trendData: [
            { week: 'W1', grade: 85 }, { week: 'W2', grade: 86 }, { week: 'W3', grade: 87 },
            { week: 'W4', grade: 88 }, { week: 'W5', grade: 87 }, { week: 'W6', grade: 88 },
            { week: 'W7', grade: 88 }, { week: 'W8', grade: 88 },
          ],
          missingCount: 0,
          recentGrades: [
            { assignmentName: 'Ch. 7 Quiz', score: 27, possible: 30, date: '2/25' },
            { assignmentName: 'Polynomial HW #4', score: 18, possible: 20, date: '2/24' },
            { assignmentName: 'Factoring Practice', score: 23, possible: 25, date: '2/18' },
          ],
        },
      ],
      overallAcademicSnapshot: {
        cumulativeGpa: 3.5,
        failingCourseCount: 0,
        totalCredits: 55,
        creditsRequired: 230,
        assessmentScores: [
          { name: 'SBAC Math', subject: 'Mathematics', score: 2580, percentile: 65, date: '2025-05' },
          { name: 'SBAC ELA', subject: 'English', score: 2610, percentile: 72, date: '2025-05' },
        ],
      },
      attendance: {
        overallRate: 98,
        periodRates: [{ period: 'Period 1', rate: 98 }],
        daysAbsentThisMonth: 1,
        consecutiveAbsenceStreak: 0,
        tardyCount: 1,
      },
      accommodations: [
        { type: 'IEP', description: 'Extended time (1.5x) on all timed assessments', category: 'Testing' },
        { type: 'IEP', description: 'Separate testing room for unit tests and finals', category: 'Testing' },
        { type: 'IEP', description: 'Calculator allowed for all assessments', category: 'Assistive Technology' },
        { type: 'IEP', description: 'Preferential seating near teacher', category: 'Classroom' },
      ],
      observations: [
        { id: 'obs-010', category: 'ACADEMIC', severity: 'POSITIVE', content: 'Aisha has been consistently turning in quality work. She asked insightful questions about polynomial division today.', createdAt: '2026-02-15T10:30:00Z', isEditable: false },
      ],
      activeInterventions: [],
      guardians: [
        { id: 'g-003', firstName: 'Michelle', lastName: 'Johnson', email: 'michelle.j@email.com', phone: '(555) 345-6789', relation: 'Mother', isPrimary: true },
      ],
    },
    [S.tyler]: {
      gradeLevel: 11,
      ellStatus: false,
      iepActive: false,
      has504: false,
      riskTier: 'URGENT',
      myClassPerformance: [
        {
          sectionName: 'Pre-Calculus - P4',
          currentGradePercent: 58,
          letterGrade: 'F',
          trendData: [
            { week: 'W1', grade: 71 }, { week: 'W2', grade: 69 }, { week: 'W3', grade: 67 },
            { week: 'W4', grade: 64 }, { week: 'W5', grade: 62 }, { week: 'W6', grade: 60 },
            { week: 'W7', grade: 59 }, { week: 'W8', grade: 58 },
          ],
          missingCount: 3,
          recentGrades: [
            { assignmentName: 'Unit Circle Test', score: 28, possible: 60, date: '2/26' },
            { assignmentName: 'Trig Identities WS', score: 0, possible: 20, date: '2/25' },
            { assignmentName: 'Graphing Sine/Cosine', score: 12, possible: 25, date: '2/21' },
          ],
        },
      ],
      overallAcademicSnapshot: {
        cumulativeGpa: 2.1,
        failingCourseCount: 2,
        totalCredits: 85,
        creditsRequired: 230,
        assessmentScores: [
          { name: 'SBAC Math', subject: 'Mathematics', score: 2490, percentile: 35, date: '2025-05' },
        ],
      },
      attendance: {
        overallRate: 88,
        periodRates: [{ period: 'Period 4', rate: 85 }],
        daysAbsentThisMonth: 4,
        consecutiveAbsenceStreak: 0,
        tardyCount: 6,
      },
      accommodations: [],
      observations: [
        { id: 'obs-020', category: 'ACADEMIC', severity: 'URGENT', content: 'Tyler scored 28/60 on the unit circle test — lowest score in the class. He seems completely lost on trigonometric concepts. Recommend immediate intervention.', createdAt: '2026-02-26T15:00:00Z', isEditable: true },
        { id: 'obs-021', category: 'ATTENDANCE', severity: 'CONCERN', content: 'Tyler was 15 minutes late to class again. Said he was "in the bathroom." This is the 3rd tardy this week.', createdAt: '2026-02-24T13:45:00Z', isEditable: false },
      ],
      activeInterventions: [],
      guardians: [
        { id: 'g-005', firstName: 'Karen', lastName: 'Morrison', email: 'k.morrison@email.com', phone: '(555) 567-8901', relation: 'Mother', isPrimary: true },
      ],
    },
    [S.sofia]: {
      gradeLevel: 9,
      ellStatus: true,
      iepActive: false,
      has504: false,
      riskTier: 'NEEDS_SUPPORT',
      myClassPerformance: [
        {
          sectionName: 'Geometry - P6',
          currentGradePercent: 71,
          letterGrade: 'C-',
          trendData: [
            { week: 'W1', grade: 76 }, { week: 'W2', grade: 75 }, { week: 'W3', grade: 74 },
            { week: 'W4', grade: 73 }, { week: 'W5', grade: 72 }, { week: 'W6', grade: 71 },
            { week: 'W7', grade: 71 }, { week: 'W8', grade: 71 },
          ],
          missingCount: 2,
          recentGrades: [
            { assignmentName: 'Triangle Congruence Quiz', score: 15, possible: 25, date: '2/26' },
            { assignmentName: 'Area & Perimeter Lab', score: 0, possible: 30, date: '2/27' },
            { assignmentName: 'Parallel Lines HW', score: 16, possible: 20, date: '2/21' },
          ],
        },
      ],
      overallAcademicSnapshot: {
        cumulativeGpa: 2.5,
        failingCourseCount: 0,
        totalCredits: 25,
        creditsRequired: 230,
        assessmentScores: [
          { name: 'ELPAC', subject: 'English Proficiency', score: 3, percentile: null, date: '2025-03' },
        ],
      },
      attendance: {
        overallRate: 87,
        periodRates: [{ period: 'Period 6', rate: 85 }, { period: 'Period 7', rate: 89 }],
        daysAbsentThisMonth: 4,
        consecutiveAbsenceStreak: 2,
        tardyCount: 3,
      },
      accommodations: [],
      observations: [
        { id: 'obs-030', category: 'ATTENDANCE', severity: 'CONCERN', content: 'Sofia has been absent 2 days in a row. Previous pattern suggests family obligations may be a factor.', createdAt: '2026-02-27T08:30:00Z', isEditable: true },
        { id: 'obs-031', category: 'ACADEMIC', severity: 'POSITIVE', content: 'Sofia did well on the vocabulary portion of the geometry assessment and seems to understand spatial concepts. Language support on word problems would help.', createdAt: '2026-02-21T14:00:00Z', isEditable: false },
      ],
      activeInterventions: [
        {
          id: 'int-003',
          tier: 'TIER_1',
          type: 'Attendance Monitoring',
          description: 'Track attendance and contact home after 2nd consecutive absence.',
          teacherRole: 'Parent contact if absent today',
          logs: [
            { date: '2/26', status: 'COMPLETED', notes: 'Left voicemail for mother' },
          ],
        },
      ],
      guardians: [
        { id: 'g-006', firstName: 'Maria', lastName: 'Rodriguez', email: null, phone: '(555) 678-9012', relation: 'Mother', isPrimary: true },
      ],
    },
  };

  const base: StudentProfile = {
    id: rosterEntry.id,
    firstName: rosterEntry.firstName,
    lastName: rosterEntry.lastName,
    photoUrl: null,
    gradeLevel: 10,
    ellStatus: rosterEntry.flags.includes('ELL'),
    iepActive: rosterEntry.flags.includes('IEP'),
    has504: rosterEntry.flags.includes('504'),
    riskTier: rosterEntry.gradePercent < 60 ? 'URGENT' : rosterEntry.gradePercent < 73 ? 'NEEDS_SUPPORT' : 'ON_TRACK',
    myClassPerformance: [
      {
        sectionName: rosterEntry.sectionName,
        currentGradePercent: rosterEntry.gradePercent,
        letterGrade: rosterEntry.letterGrade,
        trendData: rosterEntry.trendData.map((g, i) => ({ week: `W${i + 1}`, grade: g })),
        missingCount: rosterEntry.missingCount,
        recentGrades: [
          { assignmentName: 'Recent Assignment 1', score: Math.round(rosterEntry.gradePercent * 0.25), possible: 25, date: '2/25' },
          { assignmentName: 'Recent Assignment 2', score: Math.round(rosterEntry.gradePercent * 0.20), possible: 20, date: '2/21' },
          { assignmentName: 'Recent Quiz', score: Math.round(rosterEntry.gradePercent * 0.30), possible: 30, date: '2/18' },
        ],
      },
    ],
    overallAcademicSnapshot: {
      cumulativeGpa: rosterEntry.cumulativeGpa,
      failingCourseCount: rosterEntry.gradePercent < 60 ? 1 : 0,
      totalCredits: 50,
      creditsRequired: 230,
      assessmentScores: [],
    },
    attendance: {
      overallRate: rosterEntry.attendanceRate,
      periodRates: [],
      daysAbsentThisMonth: Math.round((100 - rosterEntry.attendanceRate) / 5),
      consecutiveAbsenceStreak: 0,
      tardyCount: Math.floor(Math.random() * 5),
    },
    accommodations: [],
    observations: [],
    activeInterventions: [],
    guardians: [
      { id: `g-${rosterEntry.id}`, firstName: 'Parent', lastName: rosterEntry.lastName, email: `parent.${rosterEntry.lastName.toLowerCase()}@email.com`, phone: '(555) 000-0000', relation: 'Parent/Guardian', isPrimary: true },
    ],
  };

  const override = profiles[studentId];
  if (override) {
    return { ...base, ...override } as StudentProfile;
  }
  return base;
}

// ─── Section Summaries ────────────────────────────────────────────────────

export function getDemoSection(sectionId: string): SectionSummary | null {
  const sections: Record<string, SectionSummary> = {
    'sec-alg2-p1': {
      id: 'sec-alg2-p1',
      courseName: 'Algebra II',
      period: 'Period 1',
      classAverageGrade: 75,
      classAverageAttendance: 93,
      failingCount: 2,
      missingWorkCount: 7,
      weekOverWeekGradeChange: -2,
      weekOverWeekAttendanceChange: -1,
      gradeDistribution: [
        { letter: 'A', count: 1 },
        { letter: 'B', count: 1 },
        { letter: 'C', count: 2 },
        { letter: 'D', count: 1 },
        { letter: 'F', count: 1 },
      ],
      recentAssignments: [
        { id: 'a-001', name: 'Ch. 7 Quiz - Polynomial Operations', dueDate: '2/25', classAverage: 72, completionRate: 100, outliers: [{ studentId: S.ethan, firstName: 'Ethan', lastName: 'Brooks', score: 40 }] },
        { id: 'a-002', name: 'Polynomial HW #4', dueDate: '2/24', classAverage: 78, completionRate: 67, outliers: [{ studentId: S.ethan, firstName: 'Ethan', lastName: 'Brooks', score: 0 }, { studentId: S.marcus, firstName: 'Marcus', lastName: 'Williams', score: 0 }] },
        { id: 'a-003', name: 'Factoring Practice', dueDate: '2/18', classAverage: 82, completionRate: 100, outliers: [] },
        { id: 'a-004', name: 'Ch. 6 Test - Quadratics', dueDate: '2/14', classAverage: 76, completionRate: 100, outliers: [{ studentId: S.ethan, firstName: 'Ethan', lastName: 'Brooks', score: 53 }] },
      ],
      studentCount: 6,
    },
    'sec-alg2-p3': {
      id: 'sec-alg2-p3',
      courseName: 'Algebra II',
      period: 'Period 3',
      classAverageGrade: 81,
      classAverageAttendance: 97,
      failingCount: 0,
      missingWorkCount: 2,
      weekOverWeekGradeChange: 1,
      weekOverWeekAttendanceChange: 0,
      gradeDistribution: [
        { letter: 'A', count: 1 },
        { letter: 'B', count: 1 },
        { letter: 'C', count: 2 },
        { letter: 'D', count: 1 },
        { letter: 'F', count: 0 },
      ],
      recentAssignments: [
        { id: 'a-010', name: 'Rational Expressions Quiz', dueDate: '2/25', classAverage: 80, completionRate: 100, outliers: [{ studentId: S.maya, firstName: 'Maya', lastName: 'Patel', score: 56 }] },
        { id: 'a-011', name: 'Polynomial Division WS', dueDate: '2/21', classAverage: 84, completionRate: 100, outliers: [] },
      ],
      studentCount: 5,
    },
    'sec-precalc-p4': {
      id: 'sec-precalc-p4',
      courseName: 'Pre-Calculus',
      period: 'Period 4',
      classAverageGrade: 79,
      classAverageAttendance: 95,
      failingCount: 1,
      missingWorkCount: 4,
      weekOverWeekGradeChange: -1,
      weekOverWeekAttendanceChange: 0,
      gradeDistribution: [
        { letter: 'A', count: 1 },
        { letter: 'B', count: 2 },
        { letter: 'C', count: 1 },
        { letter: 'D', count: 0 },
        { letter: 'F', count: 1 },
      ],
      recentAssignments: [
        { id: 'a-020', name: 'Unit Circle Test', dueDate: '2/26', classAverage: 74, completionRate: 100, outliers: [{ studentId: S.tyler, firstName: 'Tyler', lastName: 'Morrison', score: 47 }] },
        { id: 'a-021', name: 'Trig Identities Worksheet', dueDate: '2/25', classAverage: 79, completionRate: 80, outliers: [{ studentId: S.tyler, firstName: 'Tyler', lastName: 'Morrison', score: 0 }] },
        { id: 'a-022', name: 'Graphing Sine & Cosine', dueDate: '2/21', classAverage: 81, completionRate: 100, outliers: [{ studentId: S.tyler, firstName: 'Tyler', lastName: 'Morrison', score: 48 }] },
      ],
      studentCount: 5,
    },
    'sec-geo-p6': {
      id: 'sec-geo-p6',
      courseName: 'Geometry',
      period: 'Period 6',
      classAverageGrade: 76,
      classAverageAttendance: 93,
      failingCount: 1,
      missingWorkCount: 5,
      weekOverWeekGradeChange: -2,
      weekOverWeekAttendanceChange: -1,
      gradeDistribution: [
        { letter: 'A', count: 0 },
        { letter: 'B', count: 2 },
        { letter: 'C', count: 2 },
        { letter: 'D', count: 1 },
        { letter: 'F', count: 0 },
      ],
      recentAssignments: [
        { id: 'a-030', name: 'Triangle Congruence Quiz', dueDate: '2/26', classAverage: 74, completionRate: 100, outliers: [{ studentId: S.brandon, firstName: 'Brandon', lastName: 'Lee', score: 45 }, { studentId: S.sofia, firstName: 'Sofia', lastName: 'Rodriguez', score: 60 }] },
        { id: 'a-031', name: 'Area & Perimeter Lab', dueDate: '2/27', classAverage: 80, completionRate: 80, outliers: [{ studentId: S.sofia, firstName: 'Sofia', lastName: 'Rodriguez', score: 0 }] },
        { id: 'a-032', name: 'Congruence Proof HW', dueDate: '2/23', classAverage: 72, completionRate: 80, outliers: [{ studentId: S.brandon, firstName: 'Brandon', lastName: 'Lee', score: 0 }] },
      ],
      studentCount: 5,
    },
    'sec-alg1-p7': {
      id: 'sec-alg1-p7',
      courseName: 'Algebra I',
      period: 'Period 7',
      classAverageGrade: 81,
      classAverageAttendance: 96,
      failingCount: 0,
      missingWorkCount: 2,
      weekOverWeekGradeChange: 1,
      weekOverWeekAttendanceChange: 0,
      gradeDistribution: [
        { letter: 'A', count: 1 },
        { letter: 'B', count: 2 },
        { letter: 'C', count: 1 },
        { letter: 'D', count: 1 },
        { letter: 'F', count: 0 },
      ],
      recentAssignments: [
        { id: 'a-040', name: 'Linear Equations WS', dueDate: '2/26', classAverage: 82, completionRate: 80, outliers: [{ studentId: S.kevin, firstName: 'Kevin', lastName: 'Nguyen', score: 0 }] },
        { id: 'a-041', name: 'Systems of Equations Quiz', dueDate: '2/24', classAverage: 79, completionRate: 100, outliers: [{ studentId: S.kevin, firstName: 'Kevin', lastName: 'Nguyen', score: 55 }] },
      ],
      studentCount: 5,
    },
  };

  return sections[sectionId] || null;
}

// ─── Seating Charts ───────────────────────────────────────────────────────

export function getDemoSeats(sectionId: string): SeatInfo[] {
  const sectionStudents = DEMO_ROSTER.filter((s) => s.sectionId === sectionId);
  const seats: SeatInfo[] = [];
  const cols = 5;
  const rows = Math.ceil(sectionStudents.length / cols) + 1;

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const idx = r * cols + c;
      const student = sectionStudents[idx] || null;
      seats.push({
        row: r,
        col: c,
        label: null,
        student: student
          ? {
              id: student.id,
              firstName: student.firstName,
              lastName: student.lastName,
              riskTier: student.gradePercent < 60 ? 'URGENT' : student.gradePercent < 73 ? 'NEEDS_SUPPORT' : 'ON_TRACK',
            }
          : null,
      });
    }
  }
  return seats;
}

// ─── Notifications ────────────────────────────────────────────────────────

export const DEMO_NOTIFICATIONS: Notification[] = [
  { id: 'n-001', type: 'ABSENT_STREAK', title: 'Marcus Williams — 3 consecutive absences', body: 'Marcus has been absent for 3 school days in a row. Consider contacting home.', isRead: false, createdAt: '2026-02-28T07:30:00Z', studentId: S.marcus },
  { id: 'n-002', type: 'GRADE_DROP', title: 'Ethan Brooks grade dropped to 52% in Algebra II', body: 'Ethan\'s grade has dropped 15 points in the last 2 weeks. He currently has 4 missing assignments.', isRead: false, createdAt: '2026-02-27T16:00:00Z', studentId: S.ethan },
  { id: 'n-003', type: 'INTERVENTION_OVERDUE', title: 'Overdue: Daily check-in with Ethan Brooks', body: 'The daily check-in intervention for Ethan was not logged yesterday.', isRead: false, createdAt: '2026-02-27T08:00:00Z', studentId: S.ethan },
  { id: 'n-004', type: 'GRADE_DROP', title: 'Tyler Morrison grade dropped to 58% in Pre-Calculus', body: 'Tyler has failed the Unit Circle Test and has 3 missing assignments.', isRead: false, createdAt: '2026-02-26T16:00:00Z', studentId: S.tyler },
  { id: 'n-005', type: 'ACCOMMODATION_REMINDER', title: 'Upcoming: Ch. 8 Unit Test accommodations needed', body: 'Aisha Johnson requires extended time (1.5x), separate testing room, and calculator for the Ch. 8 Unit Test on 3/3.', isRead: true, createdAt: '2026-02-26T07:00:00Z', studentId: S.aisha },
  { id: 'n-006', type: 'NEW_STUDENT', title: 'New student: Zara Hassan added to Algebra II P3', body: 'Zara is an ELL student transferring from Jefferson MS. Prior GPA: 3.2.', isRead: true, createdAt: '2026-02-24T09:00:00Z', studentId: S.zara },
  { id: 'n-007', type: 'INTERVENTION_ASSIGNED', title: 'New intervention assigned: Sofia Rodriguez', body: 'Attendance monitoring intervention has been created for Sofia. Your role: contact home after 2nd consecutive absence.', isRead: true, createdAt: '2026-02-23T10:00:00Z', studentId: S.sofia },
  { id: 'n-008', type: 'SST_MEETING_SCHEDULED', title: 'SST Meeting scheduled for Brandon Lee', body: 'An SST meeting has been scheduled for March 10 at 3:30 PM to discuss Brandon\'s academic performance in Geometry.', isRead: true, createdAt: '2026-02-22T14:00:00Z', studentId: S.brandon },
  { id: 'n-009', type: 'GRADE_DROP', title: 'Brandon Lee grade dropped to 61% in Geometry', body: 'Brandon has dropped 13 points over the last 3 weeks. He has 3 missing assignments.', isRead: true, createdAt: '2026-02-21T16:00:00Z', studentId: S.brandon },
];

// ─── Referral Pre-populated Data ──────────────────────────────────────────

export function getDemoReferralData(studentId: string) {
  const roster = DEMO_ROSTER.find((s) => s.id === studentId);
  if (!roster) return null;

  return {
    student: {
      id: roster.id,
      firstName: roster.firstName,
      lastName: roster.lastName,
      studentIdNo: `LHS-${roster.id.split('-')[1]}`,
      gradeLevel: 10,
      ellStatus: roster.flags.includes('ELL'),
      iepActive: roster.flags.includes('IEP'),
      has504: roster.flags.includes('504'),
      cumulativeGpa: roster.cumulativeGpa,
    },
    sectionGrades: DEMO_ROSTER.filter((s) => s.id === studentId).map((s) => ({
      sectionName: s.sectionName,
      gradePercent: s.gradePercent,
    })),
    overallAttendanceRate: roster.attendanceRate,
    missingAssignmentCount: roster.missingCount,
    failingCourseCount: roster.gradePercent < 60 ? 1 : 0,
    assessmentScores: [],
  };
}

// ─── AI Responses ─────────────────────────────────────────────────────────

const AI_RESPONSES: Record<string, string[]> = {
  'What strategies might help this student?': [
    `Based on the data I can see, here are some targeted strategies:\n\n**Immediate Actions:**\n1. **Structured check-ins** — Start each class with a 2-minute one-on-one to review what's due and what they're struggling with\n2. **Chunked assignments** — Break larger assignments into smaller pieces with intermediate deadlines\n3. **Peer study buddy** — Pair with a strong student for collaborative practice\n\n**Medium-term:**\n4. **Parent communication** — Schedule a call to align on expectations at home\n5. **Modified assessment format** — Consider allowing test corrections for partial credit\n6. **Before/after school tutoring** — Recommend Tuesday/Thursday math lab sessions\n\nWould you like me to help draft a parent communication or create a modified assignment plan?`,
  ],
  'Draft a parent email about missing work': [
    `Here's a draft email:\n\n---\n\n**Subject:** Checking In — Missing Assignments in Math\n\nDear [Parent/Guardian],\n\nI hope this message finds you well. I'm reaching out because I've noticed that your child has several missing assignments in my class, and I want to work together to get them back on track.\n\n**Current missing assignments:**\n- [Assignment details would be listed here]\n\nI understand that students sometimes fall behind for a variety of reasons, and I want to help. Here are a few things we can do together:\n\n1. I'm offering a make-up window through [date] for late work at reduced credit\n2. Math tutoring is available on Tuesdays and Thursdays after school\n3. I'm happy to schedule a brief phone call or meeting at your convenience\n\nYour child has shown capability in class, and I believe that with some support, they can get back on track. Please don't hesitate to reach out.\n\nBest regards,\nMs. Chen\nMathematics Department\nLincoln High School\n\n---\n\nWould you like me to adjust the tone, add specific assignment details, or make any changes?`,
  ],
  'Generate a report card comment': [
    `Here's a report card comment based on the available data:\n\n---\n\n**[Student Name]** has been working through challenging material this quarter. While their current grade reflects some gaps in understanding, I have observed moments of strong engagement, particularly during collaborative activities and review sessions.\n\nAreas of strength include [specific positive observations from the data]. To improve, I recommend focusing on completing all practice assignments, as consistent practice is essential for building mathematical fluency.\n\nI encourage [Student Name] to take advantage of available tutoring sessions and to communicate proactively when struggling with a concept. With increased effort on daily practice, I'm confident they can make meaningful progress.\n\n---\n\nShall I make this more specific or adjust the tone?`,
  ],
  'What\'s this student\'s grade trend?': [
    `Here's a summary of the grade trend:\n\n**Recent Performance:**\nThe data shows a **declining trajectory** over the past 8 weeks. The grade has dropped steadily, which suggests this isn't a single bad test but rather a compounding issue — likely a combination of missing work and declining assessment scores.\n\n**Key patterns I notice:**\n- The decline accelerated in the most recent weeks\n- Missing assignments are a major contributing factor\n- Quiz/test scores have also been trending down, suggesting gaps in understanding are building\n\n**Turning point needed:**\nIf this trend continues, the student will need significant recovery effort. The most impactful intervention right now would be addressing the missing work backlog while simultaneously providing targeted re-teaching on foundational concepts.\n\nWould you like me to suggest specific recovery strategies?`,
  ],
};

const GENERIC_AI_RESPONSES = [
  `That's a great question. Based on the student data I have access to, here's what I can tell you:\n\nThe student's performance data shows some patterns worth noting. Looking at their grade trajectory, attendance record, and assignment completion, I'd recommend focusing on building consistent habits first before tackling the content gaps.\n\nWould you like me to elaborate on any specific aspect?`,
  `I'd be happy to help with that. Let me analyze what I see in the data.\n\nThere are a few areas that stand out as opportunities for support. The most impactful thing you could do right now is establish a consistent check-in routine and ensure the student has a clear understanding of what's expected.\n\nDo you want me to help you draft a specific plan or communication?`,
  `Good question! Here's my analysis based on the available student data:\n\nI notice some trends that suggest this student would benefit from more structured support. The combination of their current metrics points to a student who may be struggling with either motivation, understanding, or external factors affecting their schoolwork.\n\nI'd recommend starting with a brief student conference to understand their perspective. Would you like me to help prepare talking points for that conversation?`,
];

export function getDemoAIResponse(message: string): string {
  const matchedKey = Object.keys(AI_RESPONSES).find(
    (key) => message.toLowerCase().includes(key.toLowerCase())
  );

  if (matchedKey) {
    const responses = AI_RESPONSES[matchedKey];
    return responses[Math.floor(Math.random() * responses.length)];
  }

  return GENERIC_AI_RESPONSES[Math.floor(Math.random() * GENERIC_AI_RESPONSES.length)];
}
