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

  async function handleDemoLogin() {
    setError('');
    setLoading(true);
    try {
      await login('teacher@demo.edu');
      navigate('/briefing');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-atlas-background px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-atlas-primary">AtlasED</h1>
          <p className="text-lg text-gray-600 mt-1">Classroom</p>
          <p className="text-sm text-gray-500 mt-2">
            The daily operating system for classroom teachers
          </p>
        </div>

        {/* Demo Banner */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4 text-center">
          <p className="text-sm font-medium text-blue-800 mb-2">
            See it in action with sample data
          </p>
          <button
            onClick={handleDemoLogin}
            disabled={loading}
            className="btn-primary w-full"
          >
            {loading ? 'Loading demo...' : 'Try the Demo'}
          </button>
          <p className="text-xs text-blue-600 mt-2">
            Log in as Sarah Martinez, Algebra I & Geometry teacher
          </p>
        </div>

        <div className="card p-6">
          <p className="text-xs text-gray-400 uppercase tracking-wider font-semibold mb-3">
            Or sign in with your account
          </p>
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
              className="btn-secondary w-full"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <div className="mt-4 pt-4 border-t border-atlas-border">
            <button
              className="btn-secondary w-full"
              onClick={() => setEmail('teacher@demo.edu')}
            >
              Sign in with SSO
            </button>
            <p className="text-xs text-gray-400 text-center mt-2">
              Google Workspace, Microsoft Azure AD, or Clever
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
