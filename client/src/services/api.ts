const API_BASE = '/api';

type DemoHandler = (url: string, body?: unknown) => Promise<unknown>;

class ApiClient {
  private token: string | null = null;
  private demoMode = false;
  private demoHandler: DemoHandler | null = null;

  setToken(token: string | null) {
    this.token = token;
  }

  setDemoMode(enabled: boolean, handler?: DemoHandler) {
    this.demoMode = enabled;
    this.demoHandler = handler || null;
  }

  private async request<T>(url: string, options: RequestInit = {}): Promise<T> {
    // In demo mode, route through the demo handler
    if (this.demoMode && this.demoHandler) {
      const body = options.body ? JSON.parse(options.body as string) : undefined;
      const result = await this.demoHandler(url, body);
      return result as T;
    }

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

  get<T>(url: string): Promise<T> {
    return this.request<T>(url);
  }

  post<T>(url: string, body: unknown): Promise<T> {
    return this.request<T>(url, {
      method: 'POST',
      body: JSON.stringify(body),
    });
  }

  put<T>(url: string, body?: unknown): Promise<T> {
    return this.request<T>(url, {
      method: 'PUT',
      body: body ? JSON.stringify(body) : undefined,
    });
  }
}

export const api = new ApiClient();
