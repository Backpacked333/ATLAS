/**
 * All synthetic data for the standalone AtlasED Classroom demo.
 * No backend needed — this file IS the database.
 */

import type {
  MorningBriefing,
  ActionItemDashboard,
  ActionItemView,
  SectionSummary,
  StudentProfile,
  RosterStudent,
  ProfessionalInsights,
  PositiveContactSuggestion,
  ParentContactRecord,
  SmartGroup,
  SubstituteBrief,
} from '../types';

// ─── Date helpers ─────────────────────────────────────────────────────
const today = new Date();
const todayStr = today.toISOString().split('T')[0];

function daysAgoStr(n: number): string {
  const d = new Date(today);
  d.setDate(d.getDate() - n);
  return d.toISOString().split('T')[0];
}

function daysFromNowStr(n: number): string {
  const d = new Date(today);
  d.setDate(d.getDate() + n);
  return d.toISOString().split('T')[0];
}

// ─── Teacher ──────────────────────────────────────────────────────────
export const DEMO_TEACHER = {
  id: 'teacher-1',
  email: 'teacher@demo.edu',
  firstName: 'Sarah',
  lastName: 'Martinez',
  photoUrl: null,
  schoolId: 'school-1',
  school: { name: 'Lincoln High School' },
  sections: [
    { id: 'section-alg-p3', courseName: 'Algebra I', period: 'P3' },
    { id: 'section-alg-p5', courseName: 'Algebra I', period: 'P5' },
    { id: 'section-geo-p1', courseName: 'Geometry', period: 'P1' },
  ],
};

// ─── Students ─────────────────────────────────────────────────────────
export const STUDENTS = [
  { id: 'stu-0', firstName: 'James',    lastName: 'Washington', photoUrl: null, gradeLevel: 9,  riskTier: 'NEEDS_SUPPORT', ell: false, iep: false, has504: false, gpa: 2.1 },
  { id: 'stu-1', firstName: 'Maria',    lastName: 'Rodriguez',  photoUrl: null, gradeLevel: 9,  riskTier: 'ON_TRACK',      ell: true,  iep: false, has504: false, gpa: 3.2 },
  { id: 'stu-2', firstName: 'Tyler',    lastName: 'Chen',       photoUrl: null, gradeLevel: 9,  riskTier: 'ON_TRACK',      ell: false, iep: true,  has504: false, gpa: 2.8 },
  { id: 'stu-3', firstName: 'Sofia',    lastName: 'Hernandez',  photoUrl: null, gradeLevel: 9,  riskTier: 'NEEDS_SUPPORT', ell: true,  iep: false, has504: true,  gpa: 1.9 },
  { id: 'stu-4', firstName: 'Aiden',    lastName: 'Johnson',    photoUrl: null, gradeLevel: 9,  riskTier: 'ON_TRACK',      ell: false, iep: false, has504: false, gpa: 3.8 },
  { id: 'stu-5', firstName: 'Emma',     lastName: 'Williams',   photoUrl: null, gradeLevel: 9,  riskTier: 'ON_TRACK',      ell: false, iep: false, has504: false, gpa: 3.5 },
  { id: 'stu-6', firstName: 'Liam',     lastName: 'Brown',      photoUrl: null, gradeLevel: 9,  riskTier: 'WATCH',         ell: false, iep: false, has504: false, gpa: 2.4 },
  { id: 'stu-7', firstName: 'Olivia',   lastName: 'Davis',      photoUrl: null, gradeLevel: 9,  riskTier: 'ON_TRACK',      ell: false, iep: true,  has504: false, gpa: 2.9 },
  { id: 'stu-8', firstName: 'Noah',     lastName: 'Garcia',     photoUrl: null, gradeLevel: 10, riskTier: 'ON_TRACK',      ell: false, iep: false, has504: false, gpa: 3.1 },
  { id: 'stu-9', firstName: 'Ava',      lastName: 'Martinez',   photoUrl: null, gradeLevel: 10, riskTier: 'WATCH',         ell: false, iep: false, has504: true,  gpa: 2.6 },
  { id: 'stu-10', firstName: 'Ethan',   lastName: 'Miller',     photoUrl: null, gradeLevel: 10, riskTier: 'NEEDS_SUPPORT', ell: false, iep: false, has504: false, gpa: 1.5 },
  { id: 'stu-11', firstName: 'Isabella', lastName: 'Wilson',    photoUrl: null, gradeLevel: 10, riskTier: 'ON_TRACK',      ell: true,  iep: false, has504: false, gpa: 3.4 },
  { id: 'stu-12', firstName: 'Marcus',  lastName: 'Thompson',   photoUrl: null, gradeLevel: 9,  riskTier: 'ON_TRACK',      ell: false, iep: true,  has504: false, gpa: 2.5 },
];

const s = (i: number) => STUDENTS[i];

// ─── Morning Briefing ─────────────────────────────────────────────────
export const MORNING_BRIEFING: MorningBriefing = {
  absentToday: [
    {
      studentId: 'stu-0', firstName: 'James', lastName: 'Washington', photoUrl: null,
      periods: ['All Day'], consecutiveDays: 3, severity: 'red',
    },
    {
      studentId: 'stu-10', firstName: 'Ethan', lastName: 'Miller', photoUrl: null,
      periods: ['All Day'], consecutiveDays: 2, severity: 'amber',
    },
    {
      studentId: 'stu-3', firstName: 'Sofia', lastName: 'Hernandez', photoUrl: null,
      periods: ['All Day'], consecutiveDays: 1, severity: 'gray',
    },
  ],
  gradeAlerts: [
    {
      studentId: 'stu-10', firstName: 'Ethan', lastName: 'Miller', photoUrl: null,
      sectionName: 'Geometry — P1', currentGrade: 58.9, previousGrade: 76.7, delta: -17.8,
      lowAssignments: [
        { name: 'Chapter 9 HW', score: 5, possible: 20 },
        { name: 'Group Project', score: 15, possible: 50 },
      ],
    },
    {
      studentId: 'stu-3', firstName: 'Sofia', lastName: 'Hernandez', photoUrl: null,
      sectionName: 'Algebra I — P3', currentGrade: 62.9, previousGrade: 68.3, delta: -5.4,
      lowAssignments: [
        { name: 'Chapter 9 HW', score: 6, possible: 20 },
      ],
    },
    {
      studentId: 'stu-0', firstName: 'James', lastName: 'Washington', photoUrl: null,
      sectionName: 'Algebra I — P3', currentGrade: 63.6, previousGrade: 67.5, delta: -3.9,
      lowAssignments: [
        { name: 'Chapter 9 HW', score: 8, possible: 20 },
      ],
    },
    {
      studentId: 'stu-6', firstName: 'Liam', lastName: 'Brown', photoUrl: null,
      sectionName: 'Algebra I — P5', currentGrade: 66.3, previousGrade: 70.0, delta: -3.8,
      lowAssignments: [
        { name: 'Chapter 9 HW', score: 10, possible: 20 },
        { name: 'Unit 5 Quiz', score: 12, possible: 20 },
      ],
    },
  ],
  missingWorkQueue: [
    { studentId: 'stu-0', firstName: 'James', lastName: 'Washington', assignmentName: 'Unit 5 Quiz', dueDate: daysAgoStr(7), daysOverdue: 7, sectionName: 'Algebra I — P3' },
    { studentId: 'stu-0', firstName: 'James', lastName: 'Washington', assignmentName: 'Group Project', dueDate: daysAgoStr(3), daysOverdue: 3, sectionName: 'Algebra I — P3' },
    { studentId: 'stu-3', firstName: 'Sofia', lastName: 'Hernandez', assignmentName: 'Unit 5 Quiz', dueDate: daysAgoStr(7), daysOverdue: 7, sectionName: 'Algebra I — P3' },
    { studentId: 'stu-3', firstName: 'Sofia', lastName: 'Hernandez', assignmentName: 'Group Project', dueDate: daysAgoStr(3), daysOverdue: 3, sectionName: 'Algebra I — P3' },
    { studentId: 'stu-6', firstName: 'Liam', lastName: 'Brown', assignmentName: 'Group Project', dueDate: daysAgoStr(3), daysOverdue: 3, sectionName: 'Algebra I — P5' },
    { studentId: 'stu-10', firstName: 'Ethan', lastName: 'Miller', assignmentName: 'Unit 5 Quiz', dueDate: daysAgoStr(7), daysOverdue: 7, sectionName: 'Geometry — P1' },
  ],
  interventionTasks: [
    {
      interventionId: 'int-1', studentId: 'stu-0', firstName: 'James', lastName: 'Washington',
      type: 'Daily Check-In', description: 'Daily 2-minute morning check-in to build rapport.',
      teacherRole: '2-minute morning check-in, ask about homework completion.',
      isOverdue: true, completedToday: false,
    },
    {
      interventionId: 'int-2', studentId: 'stu-3', firstName: 'Sofia', lastName: 'Hernandez',
      type: 'Modified Homework', description: 'Reduce homework volume by 50%.',
      teacherRole: 'Provide modified assignment list each Monday.',
      isOverdue: false, completedToday: false,
    },
    {
      interventionId: 'int-3', studentId: 'stu-10', firstName: 'Ethan', lastName: 'Miller',
      type: 'Peer Tutoring', description: 'Paired with high-performing student.',
      teacherRole: 'Facilitate pairing, provide structured problems.',
      isOverdue: false, completedToday: false,
    },
  ],
  accommodationAlerts: [
    {
      studentId: 'stu-2', firstName: 'Tyler', lastName: 'Chen',
      accommodations: ['Extended time 1.5x on all assessments', 'Check for understanding every 10 minutes'],
      upcomingAssessment: 'Unit 6 Quiz', assessmentDate: daysFromNowStr(2),
    },
    {
      studentId: 'stu-3', firstName: 'Sofia', lastName: 'Hernandez',
      accommodations: ['Preferential seating near teacher', 'Extended time 1.5x on assessments'],
      upcomingAssessment: 'Unit 6 Quiz', assessmentDate: daysFromNowStr(2),
    },
    {
      studentId: 'stu-9', firstName: 'Ava', lastName: 'Martinez',
      accommodations: ['Extended time 2x on all assessments', 'Graphic organizer provided'],
      upcomingAssessment: 'Unit 6 Quiz', assessmentDate: daysFromNowStr(2),
    },
  ],
  newStudents: [
    {
      studentId: 'stu-12', firstName: 'Marcus', lastName: 'Thompson', photoUrl: null,
      gradeLevel: 9, ellStatus: false, iepActive: true, has504: false, priorGpa: 2.5,
      addedDate: daysAgoStr(3),
    },
  ],
  relationshipMonitor: [
    { studentId: 'stu-2', firstName: 'Tyler', lastName: 'Chen', photoUrl: null, daysSincePositiveInteraction: 18 },
    { studentId: 'stu-5', firstName: 'Emma', lastName: 'Williams', photoUrl: null, daysSincePositiveInteraction: 22 },
    { studentId: 'stu-8', firstName: 'Noah', lastName: 'Garcia', photoUrl: null, daysSincePositiveInteraction: 999 },
    { studentId: 'stu-11', firstName: 'Isabella', lastName: 'Wilson', photoUrl: null, daysSincePositiveInteraction: 999 },
  ],
};

// ─── Action Items ─────────────────────────────────────────────────────
function makeAI(partial: Partial<ActionItemView> & { id: string; studentId: string; triggerType: ActionItemView['triggerType']; title: string; suggestedAction: string }): ActionItemView {
  const stu = STUDENTS.find((s) => s.id === partial.studentId)!;
  return {
    firstName: stu.firstName, lastName: stu.lastName, photoUrl: null,
    triggerRef: null, status: 'PENDING', completedAt: null, completionNotes: null,
    actionTaken: null, reviewAfterDays: 3, reviewDueAt: null, outcomeStatus: 'PENDING',
    outcomeNotes: null, outcomeReviewedAt: null, createdAt: new Date().toISOString(),
    ...partial,
  };
}

const INITIAL_ACTION_ITEMS: ActionItemView[] = [
  // Completed + reviewed: IMPROVED
  makeAI({
    id: 'ai-1', studentId: 'stu-6', triggerType: 'GRADE_ALERT',
    title: "Address Liam's grade drop in Algebra I (P5)",
    suggestedAction: 'Check in on grade drop',
    status: 'COMPLETED', completedAt: daysAgoStr(5) + 'T00:00:00.000Z',
    actionTaken: '1on1_conference',
    completionNotes: 'Had a 10-minute conference. Liam missed key concepts from Chapter 9. Scheduled him for peer tutoring with Emma.',
    reviewDueAt: daysAgoStr(2) + 'T00:00:00.000Z',
    outcomeStatus: 'IMPROVED',
    outcomeNotes: 'Liam scored 85% on a practice quiz after tutoring. Much better engagement in class.',
    outcomeReviewedAt: daysAgoStr(1) + 'T00:00:00.000Z',
    createdAt: daysAgoStr(6) + 'T00:00:00.000Z',
  }),
  // Completed + reviewed: NO_CHANGE
  makeAI({
    id: 'ai-2', studentId: 'stu-0', triggerType: 'ABSENT',
    title: "Check in on James's absences (day 2)",
    suggestedAction: 'Reach out about absences',
    status: 'COMPLETED', completedAt: daysAgoStr(4) + 'T00:00:00.000Z',
    actionTaken: 'called_home',
    completionNotes: 'Spoke with Denise Washington. Family situation ongoing.',
    reviewDueAt: daysAgoStr(1) + 'T00:00:00.000Z',
    outcomeStatus: 'NO_CHANGE',
    outcomeNotes: 'James is still absent (day 3 now). Will escalate to counselor.',
    outcomeReviewedAt: todayStr + 'T00:00:00.000Z',
    createdAt: daysAgoStr(5) + 'T00:00:00.000Z',
  }),
  // Completed + reviewed: IMPROVED (relationship)
  makeAI({
    id: 'ai-3', studentId: 'stu-1', triggerType: 'RELATIONSHIP',
    title: 'Reconnect with Maria',
    suggestedAction: 'Have a positive interaction',
    status: 'COMPLETED', completedAt: daysAgoStr(6) + 'T00:00:00.000Z',
    actionTaken: 'positive_comment',
    completionNotes: 'Praised Maria publicly for helping the new ELL student. She beamed.',
    reviewDueAt: daysAgoStr(3) + 'T00:00:00.000Z',
    outcomeStatus: 'IMPROVED',
    outcomeNotes: 'Maria has been more engaged and volunteering more in class since.',
    outcomeReviewedAt: daysAgoStr(2) + 'T00:00:00.000Z',
    createdAt: daysAgoStr(7) + 'T00:00:00.000Z',
  }),
  // Completed, PENDING REVIEW (Ethan missing work)
  makeAI({
    id: 'ai-4', studentId: 'stu-10', triggerType: 'MISSING_WORK', triggerRef: 'Chapter 9 HW',
    title: "Follow up on Ethan's missing Chapter 9 HW",
    suggestedAction: 'Follow up on missing work',
    status: 'COMPLETED', completedAt: daysAgoStr(3) + 'T00:00:00.000Z',
    actionTaken: 'new_deadline',
    completionNotes: 'Extended deadline by 3 days. Walked through two examples together.',
    reviewDueAt: todayStr + 'T00:00:00.000Z',
    createdAt: daysAgoStr(4) + 'T00:00:00.000Z',
  }),
  // Completed, PENDING REVIEW (Sofia grade)
  makeAI({
    id: 'ai-5', studentId: 'stu-3', triggerType: 'GRADE_ALERT',
    title: "Intervene on Sofia's failing grade in Algebra I",
    suggestedAction: 'Intervene on failing grade',
    status: 'COMPLETED', completedAt: daysAgoStr(4) + 'T00:00:00.000Z',
    actionTaken: 'parent_contact',
    completionNotes: 'Called Rosa Hernandez. Discussed modified homework plan and extra tutoring.',
    reviewDueAt: daysAgoStr(1) + 'T00:00:00.000Z',
    createdAt: daysAgoStr(5) + 'T00:00:00.000Z',
  }),
  // PENDING — accommodation
  makeAI({
    id: 'ai-6', studentId: 'stu-2', triggerType: 'ACCOMMODATION', triggerRef: 'Unit 6 Quiz',
    title: "Prepare accommodations for Tyler's Unit 6 Quiz",
    suggestedAction: 'Confirm accommodations are ready',
    createdAt: daysAgoStr(1) + 'T00:00:00.000Z',
  }),
  // PENDING — new student
  makeAI({
    id: 'ai-7', studentId: 'stu-12', triggerType: 'NEW_STUDENT',
    title: 'Welcome Marcus Thompson to Algebra I',
    suggestedAction: 'Welcome and onboard new student',
    reviewAfterDays: 5,
    createdAt: daysAgoStr(2) + 'T00:00:00.000Z',
  }),
  // PENDING — relationship
  makeAI({
    id: 'ai-8', studentId: 'stu-5', triggerType: 'RELATIONSHIP',
    title: 'Reconnect with Emma (22 days since last contact)',
    suggestedAction: 'Have a positive interaction',
    createdAt: daysAgoStr(1) + 'T00:00:00.000Z',
  }),
];

// In-memory mutable store for demo interactivity
let actionItems = [...INITIAL_ACTION_ITEMS];
let nextId = 20;

export function getActionItemDashboard(): ActionItemDashboard {
  const pending = actionItems.filter((a) => a.status === 'PENDING' || a.status === 'IN_PROGRESS');
  const reviews = actionItems.filter((a) => a.status === 'COMPLETED' && a.outcomeStatus === 'PENDING');
  const outcomes = actionItems.filter((a) => a.outcomeStatus !== 'PENDING');

  const weekAgo = new Date(today);
  weekAgo.setDate(weekAgo.getDate() - 7);
  const completedThisWeek = actionItems.filter(
    (a) => a.status === 'COMPLETED' && a.completedAt && new Date(a.completedAt) >= weekAgo
  ).length;

  const reviewable = outcomes.filter((a) => a.outcomeStatus !== 'NOT_APPLICABLE');
  const improved = reviewable.filter((a) => a.outcomeStatus === 'IMPROVED').length;

  return {
    pendingActions: pending,
    pendingReviews: reviews,
    recentOutcomes: outcomes.sort((a, b) => (b.outcomeReviewedAt || '').localeCompare(a.outcomeReviewedAt || '')),
    stats: {
      totalOpen: pending.length,
      completedThisWeek,
      pendingReviewCount: reviews.length,
      improvedRate: reviewable.length > 0 ? improved / reviewable.length : 0,
    },
  };
}

export function createActionItem(data: { studentId: string; triggerType: ActionItemView['triggerType']; triggerRef?: string; title: string; suggestedAction: string }): ActionItemView {
  const item = makeAI({
    id: `ai-${nextId++}`,
    studentId: data.studentId,
    triggerType: data.triggerType,
    triggerRef: data.triggerRef || null,
    title: data.title,
    suggestedAction: data.suggestedAction,
  });
  actionItems.push(item);
  return item;
}

export function completeActionItem(id: string, data: { actionTaken: string; completionNotes: string }): ActionItemView {
  const item = actionItems.find((a) => a.id === id);
  if (!item) throw new Error('Not found');
  item.status = 'COMPLETED';
  item.completedAt = new Date().toISOString();
  item.actionTaken = data.actionTaken;
  item.completionNotes = data.completionNotes;
  const reviewDate = new Date();
  reviewDate.setDate(reviewDate.getDate() + item.reviewAfterDays);
  item.reviewDueAt = reviewDate.toISOString();
  return { ...item };
}

export function reviewActionItem(id: string, data: { outcomeStatus: string; outcomeNotes: string }): ActionItemView {
  const item = actionItems.find((a) => a.id === id);
  if (!item) throw new Error('Not found');
  item.outcomeStatus = data.outcomeStatus as ActionItemView['outcomeStatus'];
  item.outcomeNotes = data.outcomeNotes;
  item.outcomeReviewedAt = new Date().toISOString();
  return { ...item };
}

export function dismissActionItem(id: string): ActionItemView {
  const item = actionItems.find((a) => a.id === id);
  if (!item) throw new Error('Not found');
  item.status = 'DISMISSED';
  item.outcomeStatus = 'NOT_APPLICABLE';
  return { ...item };
}

// ─── Notifications ────────────────────────────────────────────────────
export const NOTIFICATIONS = [
  { id: 'n-1', type: 'ABSENT_STREAK', title: 'James Washington — 3 consecutive absences', body: 'James Washington has been absent for 3 consecutive school days.', isRead: false, createdAt: new Date().toISOString(), studentId: 'stu-0' },
  { id: 'n-2', type: 'GRADE_DROP', title: 'Ethan Miller — Grade dropped 18 points', body: "Ethan's grade in Geometry dropped from 77% to 59%.", isRead: false, createdAt: new Date().toISOString(), studentId: 'stu-10' },
  { id: 'n-3', type: 'GRADE_DROP', title: 'Sofia Hernandez — Grade dropped to D', body: "Sofia's grade in Algebra I (P3) has dropped from 68% to 63%.", isRead: true, createdAt: daysAgoStr(1) + 'T08:00:00.000Z', studentId: 'stu-3' },
  { id: 'n-4', type: 'ACCOMMODATION_REMINDER', title: 'Unit 6 Quiz — 3 students need accommodations', body: 'Tyler Chen, Sofia Hernandez, and Ava Martinez have accommodations.', isRead: false, createdAt: daysAgoStr(1) + 'T06:00:00.000Z' },
  { id: 'n-5', type: 'NEW_STUDENT', title: 'New student: Marcus Thompson', body: 'Marcus Thompson has been enrolled in Algebra I (P3). He has an active IEP.', isRead: true, createdAt: daysAgoStr(3) + 'T08:00:00.000Z' },
];

// ─── Section Summaries ────────────────────────────────────────────────
export const SECTION_SUMMARIES: Record<string, SectionSummary> = {
  'section-alg-p3': {
    id: 'section-alg-p3', courseName: 'Algebra I', period: 'P3',
    classAverageGrade: 72.4, classAverageAttendance: 91.2,
    failingCount: 2, missingWorkCount: 4,
    weekOverWeekGradeChange: -3.2, weekOverWeekAttendanceChange: -2.1,
    gradeDistribution: [
      { letter: 'A', count: 1 }, { letter: 'B', count: 1 }, { letter: 'C', count: 1 },
      { letter: 'D', count: 2 }, { letter: 'F', count: 1 },
    ],
    recentAssignments: [
      { id: 'a-1', name: 'Group Project', dueDate: daysAgoStr(3), classAverage: 74.2, completionRate: 60, outliers: [{ studentId: 'stu-0', firstName: 'James', lastName: 'Washington', score: 0 }, { studentId: 'stu-3', firstName: 'Sofia', lastName: 'Hernandez', score: 0 }] },
      { id: 'a-2', name: 'Unit 5 Quiz', dueDate: daysAgoStr(7), classAverage: 70.5, completionRate: 60, outliers: [] },
    ],
    studentCount: 6,
  },
  'section-alg-p5': {
    id: 'section-alg-p5', courseName: 'Algebra I', period: 'P5',
    classAverageGrade: 78.9, classAverageAttendance: 95.3,
    failingCount: 1, missingWorkCount: 1,
    weekOverWeekGradeChange: -1.5, weekOverWeekAttendanceChange: 0.2,
    gradeDistribution: [
      { letter: 'A', count: 1 }, { letter: 'B', count: 1 }, { letter: 'C', count: 0 },
      { letter: 'D', count: 1 }, { letter: 'F', count: 0 },
    ],
    recentAssignments: [
      { id: 'a-3', name: 'Group Project', dueDate: daysAgoStr(3), classAverage: 82.1, completionRate: 67, outliers: [{ studentId: 'stu-6', firstName: 'Liam', lastName: 'Brown', score: 0 }] },
    ],
    studentCount: 3,
  },
  'section-geo-p1': {
    id: 'section-geo-p1', courseName: 'Geometry', period: 'P1',
    classAverageGrade: 74.7, classAverageAttendance: 92.8,
    failingCount: 1, missingWorkCount: 1,
    weekOverWeekGradeChange: -4.8, weekOverWeekAttendanceChange: -3.1,
    gradeDistribution: [
      { letter: 'A', count: 1 }, { letter: 'B', count: 1 }, { letter: 'C', count: 1 },
      { letter: 'D', count: 0 }, { letter: 'F', count: 1 },
    ],
    recentAssignments: [
      { id: 'a-4', name: 'Group Project', dueDate: daysAgoStr(3), classAverage: 70.5, completionRate: 100, outliers: [{ studentId: 'stu-10', firstName: 'Ethan', lastName: 'Miller', score: 30 }] },
    ],
    studentCount: 4,
  },
};

// ─── Roster ───────────────────────────────────────────────────────────
const rosterBase = (stu: typeof STUDENTS[0], sectionId: string, sectionName: string, gradePercent: number, trendData: number[], missingCount: number, attendanceRate: number): RosterStudent => ({
  id: stu.id,
  firstName: stu.firstName,
  lastName: stu.lastName,
  photoUrl: null,
  sectionId,
  sectionName,
  gradePercent,
  letterGrade: gradePercent >= 90 ? 'A' : gradePercent >= 80 ? 'B' : gradePercent >= 70 ? 'C' : gradePercent >= 60 ? 'D' : 'F',
  gradeColor: gradePercent >= 70 ? 'green' : gradePercent >= 60 ? 'amber' : 'red',
  trendData,
  missingCount,
  attendanceRate,
  attendanceColor: attendanceRate >= 95 ? 'green' : attendanceRate >= 90 ? 'amber' : 'red',
  cumulativeGpa: stu.gpa,
  flags: [
    ...(stu.ell ? ['ELL'] : []),
    ...(stu.iep ? ['IEP'] : []),
    ...(stu.has504 ? ['504'] : []),
    ...(stu.riskTier === 'NEEDS_SUPPORT' ? ['At Risk'] : []),
  ],
  lastNoteDate: null,
  daysSinceLastNote: null,
});

export const ROSTER: RosterStudent[] = [
  rosterBase(s(0), 'section-alg-p3', 'Algebra I — P3', 63.6, [68, 67, 65, 64], 2, 82.0),
  rosterBase(s(1), 'section-alg-p3', 'Algebra I — P3', 82.9, [80, 81, 83, 83], 0, 96.5),
  rosterBase(s(2), 'section-alg-p3', 'Algebra I — P3', 76.2, [78, 77, 77, 76], 0, 97.0),
  rosterBase(s(3), 'section-alg-p3', 'Algebra I — P3', 62.9, [68, 66, 64, 63], 2, 88.0),
  rosterBase(s(4), 'section-alg-p3', 'Algebra I — P3', 95.2, [94, 95, 95, 95], 0, 100.0),
  rosterBase(s(5), 'section-alg-p5', 'Algebra I — P5', 88.1, [87, 88, 88, 88], 0, 97.5),
  rosterBase(s(6), 'section-alg-p5', 'Algebra I — P5', 66.3, [70, 69, 68, 66], 1, 92.0),
  rosterBase(s(7), 'section-alg-p5', 'Algebra I — P5', 73.3, [77, 76, 74, 73], 0, 95.0),
  rosterBase(s(8), 'section-geo-p1', 'Geometry — P1', 80.5, [81, 81, 80, 81], 0, 95.0),
  rosterBase(s(9), 'section-geo-p1', 'Geometry — P1', 75.2, [77, 76, 76, 75], 0, 93.5),
  rosterBase(s(10), 'section-geo-p1', 'Geometry — P1', 58.9, [77, 72, 65, 59], 1, 85.0),
  rosterBase(s(11), 'section-geo-p1', 'Geometry — P1', 84.3, [85, 84, 85, 84], 0, 97.0),
  rosterBase(s(12), 'section-alg-p3', 'Algebra I — P3', 0, [], 0, 100.0),
];

// ─── Student Profiles (simplified) ───────────────────────────────────
export function getStudentProfile(studentId: string): StudentProfile | null {
  const stu = STUDENTS.find((s) => s.id === studentId);
  if (!stu) return null;
  const roster = ROSTER.find((r) => r.id === studentId);
  return {
    id: stu.id, firstName: stu.firstName, lastName: stu.lastName,
    photoUrl: null, gradeLevel: stu.gradeLevel,
    ellStatus: stu.ell, iepActive: stu.iep, has504: stu.has504,
    riskTier: stu.riskTier,
    myClassPerformance: roster ? [{
      sectionName: roster.sectionName,
      currentGradePercent: roster.gradePercent,
      letterGrade: roster.letterGrade,
      trendData: roster.trendData.map((g, i) => ({ week: `Week ${i + 1}`, grade: g })),
      missingCount: roster.missingCount,
      recentGrades: [],
    }] : [],
    overallAcademicSnapshot: {
      cumulativeGpa: stu.gpa, failingCourseCount: (roster?.gradePercent || 0) < 60 ? 1 : 0,
      totalCredits: 45, creditsRequired: 220,
      assessmentScores: [{ name: 'MAP Math Fall 2025', subject: 'Math', score: 200 + Math.round(stu.gpa * 10), percentile: Math.round(stu.gpa * 20), date: '2025-09-15' }],
    },
    attendance: {
      overallRate: roster?.attendanceRate || 95,
      periodRates: [{ period: 'P3', rate: roster?.attendanceRate || 95 }],
      daysAbsentThisMonth: studentId === 'stu-0' ? 3 : studentId === 'stu-10' ? 2 : studentId === 'stu-3' ? 1 : 0,
      consecutiveAbsenceStreak: studentId === 'stu-0' ? 3 : studentId === 'stu-10' ? 2 : 0,
      tardyCount: 1,
    },
    accommodations: stu.iep || stu.has504 ? [
      { type: stu.iep ? 'IEP' : '504', description: 'Extended time 1.5x on assessments', category: 'Testing' },
    ] : [],
    observations: [],
    activeInterventions: [],
    guardians: [{ id: 'g-1', firstName: 'Parent', lastName: stu.lastName, email: `parent.${stu.lastName.toLowerCase()}@email.com`, phone: '(555) 200-4100', relation: 'Parent', isPrimary: true }],
  };
}

// ─── Communication ────────────────────────────────────────────────────
export const POSITIVE_SUGGESTIONS: PositiveContactSuggestion[] = [
  { studentId: 'stu-4', firstName: 'Aiden', lastName: 'Johnson', photoUrl: null, reason: 'Scored 95.2% overall — top performer', draftMessage: 'I wanted to share how well Aiden has been doing in Algebra I. He scored 95% on the midterm and has been showing great leadership during group work.', guardianEmail: 'robert.johnson@email.com', guardianName: 'Robert Johnson' },
  { studentId: 'stu-5', firstName: 'Emma', lastName: 'Williams', photoUrl: null, reason: 'Consistent 88% — strong A-', draftMessage: "Emma continues to be a strong performer in Algebra I. Her consistent effort and 88% grade reflect her dedication.", guardianEmail: 'jennifer.williams@email.com', guardianName: 'Jennifer Williams' },
  { studentId: 'stu-11', firstName: 'Isabella', lastName: 'Wilson', photoUrl: null, reason: '84.3% despite ELL challenges', draftMessage: "Isabella has been doing excellent work in Geometry while navigating language challenges. Her 84% grade is a testament to her hard work.", guardianEmail: 'fatima.wilson@email.com', guardianName: 'Fatima Wilson' },
];

export const CONTACT_HISTORY: ParentContactRecord[] = [
  { id: 'pc-1', studentId: 'stu-0', studentName: 'James Washington', method: 'PHONE', subject: 'Attendance concerns — 3rd absence', notes: 'Called Denise Washington. Family situation ongoing.', sentiment: 'CONCERN', createdAt: new Date().toISOString() },
  { id: 'pc-2', studentId: 'stu-4', studentName: 'Aiden Johnson', method: 'EMAIL', subject: 'Great work on the group project!', notes: 'Sent email highlighting leadership.', sentiment: 'POSITIVE', createdAt: daysAgoStr(2) + 'T08:00:00.000Z' },
  { id: 'pc-3', studentId: 'stu-3', studentName: 'Sofia Hernandez', method: 'PHONE', subject: 'Academic support discussion', notes: 'Discussed modified homework plan.', sentiment: 'CONCERN', createdAt: daysAgoStr(5) + 'T08:00:00.000Z' },
];

// ─── Professional Insights ────────────────────────────────────────────
export const INSIGHTS: ProfessionalInsights = {
  sectionComparison: [
    { sectionName: 'Algebra I — P3', averageGrade: 72.4, failingCount: 2, studentCount: 6 },
    { sectionName: 'Algebra I — P5', averageGrade: 78.9, failingCount: 1, studentCount: 3 },
    { sectionName: 'Geometry — P1', averageGrade: 74.7, failingCount: 1, studentCount: 4 },
  ],
  assignmentEffectiveness: [
    { assignmentName: 'Midterm Exam', sectionName: 'Algebra I — P3', avgScore: 74.3, completionRate: 100, discriminationRating: 'Good', insight: 'Wide score distribution — effectively differentiates student understanding.' },
    { assignmentName: 'Unit 5 Quiz', sectionName: 'Algebra I — P3', avgScore: 66.7, completionRate: 60, discriminationRating: 'Review', insight: 'Low completion rate (60%) — 2 students did not take the quiz.' },
    { assignmentName: 'Group Project', sectionName: 'Geometry — P1', avgScore: 72.5, completionRate: 100, discriminationRating: 'Good', insight: 'All students completed — strong collaborative assessment.' },
  ],
  gradingPatterns: [
    { type: 'Missing Work Impact', insight: '6 missing assignments across 4 students are significantly dragging down class averages in P3.' },
    { type: 'Attendance Correlation', insight: 'Students absent 2+ days have 15% lower grades on average than regularly attending peers.' },
  ],
  observationStats: {
    totalThisMonth: 6,
    positiveRatio: 0.33,
    categoryCounts: [
      { category: 'Academic', count: 2 },
      { category: 'Attendance', count: 1 },
      { category: 'Behavioral', count: 1 },
      { category: 'Positive', count: 2 },
    ],
  },
};

// ─── Smart Groups ─────────────────────────────────────────────────────
export const SMART_GROUPS: Record<string, SmartGroup[]> = {
  'section-alg-p3': [
    { label: 'Reteach', recommendation: 'Students below 65% — need targeted intervention on core concepts.', students: [{ studentId: 'stu-3', firstName: 'Sofia', lastName: 'Hernandez', avgScore: 62.9 }, { studentId: 'stu-0', firstName: 'James', lastName: 'Washington', avgScore: 63.6 }] },
    { label: 'Reinforce', recommendation: 'Students 65-80% — reinforce with practice problems.', students: [{ studentId: 'stu-2', firstName: 'Tyler', lastName: 'Chen', avgScore: 76.2 }] },
    { label: 'Extend', recommendation: 'Students above 80% — challenge with extensions.', students: [{ studentId: 'stu-4', firstName: 'Aiden', lastName: 'Johnson', avgScore: 95.2 }, { studentId: 'stu-1', firstName: 'Maria', lastName: 'Rodriguez', avgScore: 82.9 }] },
  ],
  'section-alg-p5': [
    { label: 'Reteach', recommendation: 'Targeted support needed.', students: [{ studentId: 'stu-6', firstName: 'Liam', lastName: 'Brown', avgScore: 66.3 }] },
    { label: 'Reinforce', recommendation: 'Practice and reinforcement.', students: [{ studentId: 'stu-7', firstName: 'Olivia', lastName: 'Davis', avgScore: 73.3 }] },
    { label: 'Extend', recommendation: 'Challenge opportunities.', students: [{ studentId: 'stu-5', firstName: 'Emma', lastName: 'Williams', avgScore: 88.1 }] },
  ],
  'section-geo-p1': [
    { label: 'Reteach', recommendation: 'Immediate support needed.', students: [{ studentId: 'stu-10', firstName: 'Ethan', lastName: 'Miller', avgScore: 58.9 }] },
    { label: 'Reinforce', recommendation: 'Practice and reinforcement.', students: [{ studentId: 'stu-9', firstName: 'Ava', lastName: 'Martinez', avgScore: 75.2 }] },
    { label: 'Extend', recommendation: 'Extension activities.', students: [{ studentId: 'stu-11', firstName: 'Isabella', lastName: 'Wilson', avgScore: 84.3 }, { studentId: 'stu-8', firstName: 'Noah', lastName: 'Garcia', avgScore: 80.5 }] },
  ],
};

// ─── Substitute Brief ─────────────────────────────────────────────────
export const SUB_BRIEFS: Record<string, SubstituteBrief> = {
  'section-alg-p3': {
    section: { courseName: 'Algebra I', period: 'P3', room: '204' },
    students: [
      { firstName: 'James', lastName: 'Washington', seatLabel: 'A1', accommodationNotes: null, interventionNotes: '2-minute morning check-in' },
      { firstName: 'Maria', lastName: 'Rodriguez', seatLabel: 'A2', accommodationNotes: null, interventionNotes: null },
      { firstName: 'Tyler', lastName: 'Chen', seatLabel: 'B1', accommodationNotes: 'IEP: Extended time 1.5x, check for understanding', interventionNotes: null },
      { firstName: 'Sofia', lastName: 'Hernandez', seatLabel: 'A3', accommodationNotes: '504: Preferential seating, extended time 1.5x', interventionNotes: 'Modified homework' },
      { firstName: 'Aiden', lastName: 'Johnson', seatLabel: 'B2', accommodationNotes: null, interventionNotes: null },
      { firstName: 'Marcus', lastName: 'Thompson', seatLabel: 'C1', accommodationNotes: 'IEP: Extended time 1.5x', interventionNotes: null },
    ],
    teacherNotes: 'Class is working on Chapter 10 — Systems of Equations. Assignment on whiteboard.',
    generatedAt: new Date().toISOString(),
  },
  'section-alg-p5': {
    section: { courseName: 'Algebra I', period: 'P5', room: '204' },
    students: [
      { firstName: 'Emma', lastName: 'Williams', seatLabel: 'A1', accommodationNotes: null, interventionNotes: null },
      { firstName: 'Liam', lastName: 'Brown', seatLabel: 'A2', accommodationNotes: null, interventionNotes: null },
      { firstName: 'Olivia', lastName: 'Davis', seatLabel: 'B1', accommodationNotes: 'IEP: Reduced distraction environment', interventionNotes: null },
    ],
    teacherNotes: null,
    generatedAt: new Date().toISOString(),
  },
  'section-geo-p1': {
    section: { courseName: 'Geometry', period: 'P1', room: '204' },
    students: [
      { firstName: 'Noah', lastName: 'Garcia', seatLabel: 'A1', accommodationNotes: null, interventionNotes: null },
      { firstName: 'Ava', lastName: 'Martinez', seatLabel: 'A2', accommodationNotes: '504: Extended time 2x, graphic organizer', interventionNotes: null },
      { firstName: 'Ethan', lastName: 'Miller', seatLabel: 'B1', accommodationNotes: null, interventionNotes: 'Peer tutoring twice weekly' },
      { firstName: 'Isabella', lastName: 'Wilson', seatLabel: 'B2', accommodationNotes: null, interventionNotes: null },
    ],
    teacherNotes: null,
    generatedAt: new Date().toISOString(),
  },
};
