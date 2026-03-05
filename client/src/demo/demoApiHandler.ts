import {
  DEMO_TEACHER,
  DEMO_BRIEFING,
  DEMO_ROSTER,
  DEMO_NOTIFICATIONS,
  getDemoStudentProfile,
  getDemoSection,
  getDemoSeats,
  getDemoReferralData,
  getDemoAIResponse,
} from './mockData';

// Simulate network delay for realism
function delay(ms = 300): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms + Math.random() * 200));
}

// Mutable state for demo interactions
let demoNotifications = [...DEMO_NOTIFICATIONS];
let demoObservations: Array<{
  id: string;
  studentId: string;
  category: string;
  severity: string;
  content: string;
  createdAt: string;
  isEditable: boolean;
}> = [];
let completedInterventionIds = new Set<string>();
let aiConversationCounter = 0;

export function resetDemoState() {
  demoNotifications = [...DEMO_NOTIFICATIONS];
  demoObservations = [];
  completedInterventionIds = new Set();
  aiConversationCounter = 0;
}

export async function demoApiHandler(url: string, body?: unknown): Promise<unknown> {
  await delay();

  // ─── Auth ───────────────────────────────────────────────────────
  if (url === '/auth/me') {
    return {
      id: DEMO_TEACHER.id,
      email: DEMO_TEACHER.email,
      firstName: DEMO_TEACHER.firstName,
      lastName: DEMO_TEACHER.lastName,
      photoUrl: DEMO_TEACHER.photoUrl,
      school: DEMO_TEACHER.school,
      sections: DEMO_TEACHER.sections,
    };
  }

  if (url === '/auth/login') {
    return {
      token: 'demo-jwt-token',
      teacher: DEMO_TEACHER,
    };
  }

  // ─── Briefing ───────────────────────────────────────────────────
  if (url === '/briefing') {
    // Reflect completed interventions in the briefing
    const briefing = { ...DEMO_BRIEFING };
    briefing.interventionTasks = briefing.interventionTasks.map((task) => ({
      ...task,
      completedToday: task.completedToday || completedInterventionIds.has(task.interventionId),
    }));
    return briefing;
  }

  // ─── Roster ─────────────────────────────────────────────────────
  if (url.startsWith('/roster')) {
    const params = new URLSearchParams(url.split('?')[1] || '');
    let students = [...DEMO_ROSTER];

    const sectionId = params.get('sectionId');
    if (sectionId) students = students.filter((s) => s.sectionId === sectionId);

    const gradeStatus = params.get('gradeStatus');
    if (gradeStatus === 'failing') students = students.filter((s) => s.gradePercent < 60);
    if (gradeStatus === 'passing') students = students.filter((s) => s.gradePercent >= 60);
    if (gradeStatus === 'declining') students = students.filter((s) => {
      const t = s.trendData;
      return t.length >= 2 && t[t.length - 1] < t[0];
    });

    const attendance = params.get('attendance');
    if (attendance === 'at-risk') students = students.filter((s) => s.attendanceRate < 95);
    if (attendance === 'chronic') students = students.filter((s) => s.attendanceRate < 90);

    const missingWork = params.get('missingWork');
    if (missingWork === 'any') students = students.filter((s) => s.missingCount > 0);
    if (missingWork === '3+') students = students.filter((s) => s.missingCount >= 3);
    if (missingWork === '5+') students = students.filter((s) => s.missingCount >= 5);

    const flags = params.get('flags');
    if (flags) {
      const flagList = flags.split(',');
      students = students.filter((s) => flagList.some((f) => s.flags.includes(f)));
    }

    return students;
  }

  // ─── Sections ───────────────────────────────────────────────────
  const sectionMatch = url.match(/^\/sections\/([^/]+)$/);
  if (sectionMatch) {
    const section = getDemoSection(sectionMatch[1]);
    if (!section) throw new Error('Section not found');
    return section;
  }

  const seatsMatch = url.match(/^\/sections\/([^/]+)\/seats$/);
  if (seatsMatch) {
    return getDemoSeats(seatsMatch[1]);
  }

  // ─── Students ───────────────────────────────────────────────────
  const studentMatch = url.match(/^\/students\/([^/]+)$/);
  if (studentMatch) {
    const profile = getDemoStudentProfile(studentMatch[1]);
    if (!profile) throw new Error('Student not found');

    // Inject demo observations
    const studentObs = demoObservations.filter((o) => o.studentId === profile.id);
    profile.observations = [...studentObs, ...profile.observations];

    return profile;
  }

  // ─── Observations ───────────────────────────────────────────────
  if (url === '/observations' && body) {
    const b = body as { studentId: string; category: string; severity: string; content: string };
    const newObs = {
      id: `obs-demo-${Date.now()}`,
      studentId: b.studentId,
      category: b.category,
      severity: b.severity,
      content: b.content,
      createdAt: new Date().toISOString(),
      isEditable: true,
    };
    demoObservations.unshift(newObs);
    return newObs;
  }

  // ─── Referrals ──────────────────────────────────────────────────
  const referralMatch = url.match(/^\/referrals\/prepopulate\/([^/]+)$/);
  if (referralMatch) {
    const data = getDemoReferralData(referralMatch[1]);
    if (!data) throw new Error('Student not found');
    return data;
  }

  if (url === '/referrals' && body) {
    return { id: `ref-demo-${Date.now()}`, status: 'SUBMITTED' };
  }

  // ─── Interventions ─────────────────────────────────────────────
  if (url === '/interventions/log' && body) {
    const b = body as { interventionId: string; completionStatus: string };
    completedInterventionIds.add(b.interventionId);
    return { success: true };
  }

  // ─── Notifications ──────────────────────────────────────────────
  if (url === '/notifications') {
    return demoNotifications;
  }

  if (url === '/notifications/unread-count') {
    const count = demoNotifications.filter((n) => !n.isRead).length;
    return { count };
  }

  const readOneMatch = url.match(/^\/notifications\/([^/]+)\/read$/);
  if (readOneMatch) {
    demoNotifications = demoNotifications.map((n) =>
      n.id === readOneMatch[1] ? { ...n, isRead: true } : n
    );
    return { success: true };
  }

  if (url === '/notifications/read-all') {
    demoNotifications = demoNotifications.map((n) => ({ ...n, isRead: true }));
    return { success: true };
  }

  // ─── AI ─────────────────────────────────────────────────────────
  if (url === '/ai/chat' && body) {
    const b = body as { message: string; studentId?: string; conversationId?: string };
    aiConversationCounter++;
    // Simulate AI thinking time
    await delay(800);
    return {
      response: getDemoAIResponse(b.message),
      conversationId: b.conversationId || `conv-demo-${aiConversationCounter}`,
    };
  }

  if (url === '/ai/conversations') {
    return [];
  }

  // ─── Fallback ───────────────────────────────────────────────────
  console.warn(`[Demo] Unhandled API call: ${url}`);
  return {};
}
