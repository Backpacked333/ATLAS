import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export function LoginPage() {
  const { login, loginDemo, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (isAuthenticated) {
    navigate('/briefing', { replace: true });
    return null;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(email);
      navigate('/briefing');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  }

  function handleDemoLogin() {
    loginDemo();
    navigate('/briefing');
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-atlas-background to-indigo-50 px-4">
      <div className="w-full max-w-sm">
        {/* Logo & Branding */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center h-16 w-16 rounded-2xl bg-atlas-primary shadow-lg shadow-blue-200 mb-4">
            <svg className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-atlas-primary tracking-tight">AtlasED</h1>
          <p className="text-lg text-gray-600 mt-1 font-medium">Classroom</p>
          <p className="text-sm text-gray-500 mt-2">
            The daily operating system for classroom teachers
          </p>
        </div>

        {/* Demo Card — Featured */}
        <div className="card p-5 mb-4 border-2 border-atlas-primary/20 bg-gradient-to-br from-blue-50 to-white shadow-md">
          <div className="flex items-start gap-3 mb-3">
            <div className="flex-shrink-0 h-8 w-8 rounded-lg bg-atlas-primary/10 flex items-center justify-center">
              <svg className="h-4 w-4 text-atlas-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h2 className="text-sm font-semibold text-gray-900">Try the Interactive Demo</h2>
              <p className="text-xs text-gray-500 mt-0.5">
                Explore as Ms. Sarah Chen at Lincoln High School with 28 students across 5 classes. All features are fully interactive.
              </p>
            </div>
          </div>
          <button
            onClick={handleDemoLogin}
            className="btn bg-atlas-primary text-white hover:bg-blue-900 w-full py-2.5 text-sm font-semibold shadow-sm"
          >
            Launch Demo
          </button>
          <div className="flex items-center justify-center gap-4 mt-3 text-xs text-gray-400">
            <span className="flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-green-400" />
              28 students
            </span>
            <span className="flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-blue-400" />
              5 classes
            </span>
            <span className="flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-purple-400" />
              Full data
            </span>
          </div>
        </div>

        {/* Regular Login */}
        <div className="card p-5">
          <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-3">Staff Login</p>
          <form onSubmit={handleSubmit} className="space-y-3">
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
              <div className="flex items-center gap-2 text-sm text-atlas-danger bg-red-50 rounded-md px-3 py-2">
                <svg className="h-4 w-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <div className="mt-4 pt-3 border-t border-atlas-border">
            <button
              className="btn-secondary w-full text-sm"
              onClick={() => setEmail('teacher@demo.edu')}
            >
              <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              Sign in with SSO
            </button>
            <p className="text-xs text-gray-400 text-center mt-2">
              Google Workspace, Microsoft Azure AD, or Clever
            </p>
          </div>
        </div>

        <p className="text-center text-xs text-gray-400 mt-6">
          AtlasED Classroom v1.0 &middot; FERPA Compliant
        </p>
      </div>
    </div>
  );
}
