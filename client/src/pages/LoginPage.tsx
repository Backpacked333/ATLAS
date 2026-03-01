import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export function LoginPage() {
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (isAuthenticated) {
    navigate('/dashboard', { replace: true });
    return null;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(email);
      navigate('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  }

  async function handleDemoLogin() {
    setError('');
    setLoading(true);
    try {
      await login('teacher@demo.edu');
      navigate('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Demo login failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 px-4">
      <div className="w-full max-w-lg">
        {/* Hero Section */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-atlas-primary mb-4 shadow-lg shadow-blue-500/25">
            <svg className="w-9 h-9 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20" />
              <path d="M2 12h20" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-atlas-primary tracking-tight">AtlasED</h1>
          <p className="text-lg font-medium text-gray-700 mt-1">Classroom</p>
          <p className="text-sm text-gray-500 mt-2 max-w-xs mx-auto">
            The daily operating system for classroom teachers
          </p>
        </div>

        {/* Demo CTA — Primary Action */}
        <div className="card p-6 mb-4 border-2 border-atlas-primary/20 shadow-lg shadow-blue-500/5">
          <div className="text-center mb-4">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-100 text-atlas-primary text-xs font-semibold uppercase tracking-wide">
              <span className="h-1.5 w-1.5 rounded-full bg-atlas-primary animate-pulse" />
              Live Demo
            </span>
          </div>
          <button
            onClick={handleDemoLogin}
            disabled={loading}
            className="btn-primary w-full py-3 text-base font-semibold shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 transition-all"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Entering demo...
              </span>
            ) : (
              'Try the Demo'
            )}
          </button>
          <p className="text-xs text-gray-500 text-center mt-3">
            Explore as <strong>Sarah Martinez</strong>, a 9th-grade math teacher at Lincoln High with 3 sections and 25+ students.
          </p>
        </div>

        {/* Feature Highlights */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="text-center p-3 rounded-lg bg-white/60 backdrop-blur border border-white">
            <div className="text-lg mb-1">{"\uD83D\uDCCA"}</div>
            <p className="text-xs font-medium text-gray-700">Morning Briefing</p>
            <p className="text-xs text-gray-500">Daily snapshot</p>
          </div>
          <div className="text-center p-3 rounded-lg bg-white/60 backdrop-blur border border-white">
            <div className="text-lg mb-1">{"\uD83C\uDF93"}</div>
            <p className="text-xs font-medium text-gray-700">Student Profiles</p>
            <p className="text-xs text-gray-500">360° view</p>
          </div>
          <div className="text-center p-3 rounded-lg bg-white/60 backdrop-blur border border-white">
            <div className="text-lg mb-1">{"\uD83E\uDD16"}</div>
            <p className="text-xs font-medium text-gray-700">AI Assistant</p>
            <p className="text-xs text-gray-500">FERPA-safe</p>
          </div>
        </div>

        {/* Staff Login — Secondary */}
        <details className="group">
          <summary className="flex items-center justify-center gap-2 text-sm text-gray-500 cursor-pointer hover:text-gray-700 transition-colors py-2">
            <span>Staff sign-in</span>
            <svg className="w-4 h-4 transition-transform group-open:rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
          </summary>
          <div className="card p-5 mt-2 animate-in">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                  Email Address
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="teacher@school.edu"
                  className="input"
                  required
                />
              </div>

              {error && (
                <p className="text-sm text-atlas-danger">{error}</p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full"
              >
                {loading ? 'Signing in...' : 'Sign In'}
              </button>
            </form>

            <div className="mt-4 pt-4 border-t border-atlas-border">
              <button className="btn-secondary w-full" disabled>
                Sign in with SSO
              </button>
              <p className="text-xs text-gray-400 text-center mt-2">
                Google Workspace, Microsoft Azure AD, or Clever
              </p>
            </div>
          </div>
        </details>
      </div>
    </div>
  );
}
