import {
  DEMO_TEACHER,
  MORNING_BRIEFING,
  NOTIFICATIONS,
  SECTION_SUMMARIES,
  ROSTER,
  POSITIVE_SUGGESTIONS,
  CONTACT_HISTORY,
  INSIGHTS,
  SMART_GROUPS,
  SUB_BRIEFS,
  getStudentProfile,
  getActionItemDashboard,
  createActionItem,
  completeActionItem,
  reviewActionItem,
  dismissActionItem,
} from './mockData';

const API_BASE = '/api';

const delay = (ms = 200) => new Promise((r) => setTimeout(r, ms + Math.random() * 150));

class ApiClient {
  private token: string | null = null;
  private _demoMode = false;

  setToken(token: string | null) {
    this.token = token;
  }

  enableDemoMode() {
    this._demoMode = true;
  }

  get isDemoMode() {
    return this._demoMode;
  }

  private async request<T>(url: string, options: RequestInit = {}): Promise<T> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string> || {}),
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const response = await fetch(`${API_BASE}${url}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: { message: 'Request failed' } }));
      throw new Error(error.error?.message || `HTTP ${response.status}`);
    }

    return response.json();
  }

  private async mockRoute(method: string, url: string, body?: Record<string, unknown>): Promise<unknown> {
    await delay();

    // Auth
    if (url === '/auth/login' && method === 'POST') {
      return { token: 'demo-token-xyz', teacher: DEMO_TEACHER };
    }
    if (url === '/auth/me') {
      return DEMO_TEACHER;
    }

    // Briefing
    if (url === '/briefing') return MORNING_BRIEFING;

    // Notifications
    if (url === '/notifications/unread-count') {
      return { count: NOTIFICATIONS.filter((n) => !n.isRead).length };
    }
    if (url === '/notifications') return NOTIFICATIONS;

    // Roster
    if (url.startsWith('/roster')) return ROSTER;

    // Sections
    if (url.match(/^\/sections\/([^/]+)\/groups$/)) {
      const sectionId = url.match(/^\/sections\/([^/]+)\/groups$/)![1];
      return SMART_GROUPS[sectionId] || [];
    }
    if (url.match(/^\/sections\/([^/]+)$/)) {
      const sectionId = url.match(/^\/sections\/([^/]+)$/)![1];
      return SECTION_SUMMARIES[sectionId] || null;
    }

    // Students
    if (url.match(/^\/students\/([^/]+)$/)) {
      const studentId = url.match(/^\/students\/([^/]+)$/)![1];
      return getStudentProfile(studentId);
    }

    // Observations
    if (url === '/observations' && method === 'POST') {
      return { id: 'obs-new', ...body, createdAt: new Date().toISOString(), isEditable: true };
    }

    // Interventions
    if (url === '/interventions/log' && method === 'POST') return { success: true };

    // Referrals
    if (url.match(/^\/referrals/) && method === 'POST') {
      return { id: 'ref-new', ...body, status: 'PENDING', createdAt: new Date().toISOString() };
    }

    // Communication
    if (url === '/communication/positive-suggestions') return POSITIVE_SUGGESTIONS;
    if (url === '/communication/contacts') return CONTACT_HISTORY;
    if (url === '/communication/contact' && method === 'POST') {
      return { id: 'pc-new', ...body, createdAt: new Date().toISOString() };
    }
    if (url.match(/^\/communication\/conference-prep\/([^/]+)$/)) {
      const studentId = url.match(/^\/communication\/conference-prep\/([^/]+)$/)![1];
      const stu = getStudentProfile(studentId);
      return {
        student: { firstName: stu?.firstName, lastName: stu?.lastName, gradeLevel: stu?.gradeLevel, photoUrl: null },
        gradesSummary: stu?.myClassPerformance.map((p) => ({ sectionName: p.sectionName, gradePercent: p.currentGradePercent, letterGrade: p.letterGrade, missingCount: p.missingCount })) || [],
        attendanceSummary: stu?.attendance || { overallRate: 95, daysAbsentThisMonth: 0, tardyCount: 0 },
        strengths: ['Participates in class'], concerns: [], accommodations: [],
        talkingPoints: ['Discuss current progress'], guardians: stu?.guardians || [],
      };
    }

    // Insights
    if (url === '/insights') return INSIGHTS;

    // Substitute
    if (url.match(/^\/substitute\/([^/]+)$/)) {
      const sectionId = url.match(/^\/substitute\/([^/]+)$/)![1];
      return SUB_BRIEFS[sectionId] || null;
    }

    // Action Items
    if (url === '/action-items' && method === 'GET') return getActionItemDashboard();
    if (url === '/action-items' && method === 'POST') {
      return createActionItem(body as { studentId: string; triggerType: 'ABSENT'; title: string; suggestedAction: string; triggerRef?: string });
    }
    if (url.match(/^\/action-items\/([^/]+)\/complete$/) && method === 'PUT') {
      const id = url.match(/^\/action-items\/([^/]+)\/complete$/)![1];
      return completeActionItem(id, body as { actionTaken: string; completionNotes: string });
    }
    if (url.match(/^\/action-items\/([^/]+)\/review$/) && method === 'PUT') {
      const id = url.match(/^\/action-items\/([^/]+)\/review$/)![1];
      return reviewActionItem(id, body as { outcomeStatus: string; outcomeNotes: string });
    }
    if (url.match(/^\/action-items\/([^/]+)\/dismiss$/) && method === 'PUT') {
      const id = url.match(/^\/action-items\/([^/]+)\/dismiss$/)![1];
      return dismissActionItem(id);
    }
    if (url.match(/^\/action-items\/student\//)) return [];

    // AI (stub)
    if (url.match(/^\/ai/) && method === 'POST') {
      return {
        message: "I'm the AI assistant in demo mode. In the full product, I can help you analyze student data, suggest interventions, and draft parent communications.",
        conversationId: 'conv-demo',
      };
    }

    console.warn(`[MockAPI] Unhandled: ${method} ${url}`);
    return {};
  }

  get<T>(url: string): Promise<T> {
    if (this._demoMode) return this.mockRoute('GET', url) as Promise<T>;
    return this.request<T>(url);
  }

  post<T>(url: string, body: unknown): Promise<T> {
    if (this._demoMode) return this.mockRoute('POST', url, body as Record<string, unknown>) as Promise<T>;
    return this.request<T>(url, {
      method: 'POST',
      body: JSON.stringify(body),
    });
  }

  put<T>(url: string, body?: unknown): Promise<T> {
    if (this._demoMode) return this.mockRoute('PUT', url, body as Record<string, unknown>) as Promise<T>;
    return this.request<T>(url, {
      method: 'PUT',
      body: body ? JSON.stringify(body) : undefined,
    });
  }
}

export const api = new ApiClient();
