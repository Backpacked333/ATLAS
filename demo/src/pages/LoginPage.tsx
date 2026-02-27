import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export function LoginPage() {
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (isAuthenticated) {
    navigate('/briefing', { replace: true });
    return null;
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
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-atlas-primary">AtlasED</h1>
          <p className="text-xl text-gray-600 mt-1">Classroom</p>
          <p className="text-sm text-gray-500 mt-3 max-w-xs mx-auto">
            The daily operating system for classroom teachers.
            One place to know every student, every day.
          </p>
        </div>

        <div className="card p-8 text-center">
          <div className="mb-6">
            <p className="text-sm text-gray-600 mb-1">Interactive Product Demo</p>
            <p className="text-xs text-gray-400">
              Explore as Sarah Martinez, a 9th-grade math teacher with 3 sections and 13 students
            </p>
          </div>

          <button
            onClick={handleDemoLogin}
            disabled={loading}
            className="btn-primary w-full text-base py-3"
          >
            {loading ? 'Loading...' : 'Enter the Demo'}
          </button>

          {error && <p className="text-sm text-atlas-danger mt-3">{error}</p>}

          <div className="mt-6 pt-6 border-t border-atlas-border text-left">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">What you'll see</p>
            <div className="grid grid-cols-2 gap-3 text-xs text-gray-600">
              <div className="flex items-start gap-2">
                <span className="text-atlas-primary mt-0.5">&#9654;</span>
                <span>Morning Briefing with action buttons on every alert</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-atlas-primary mt-0.5">&#9654;</span>
                <span>Closed-loop action tracking with outcome reviews</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-atlas-primary mt-0.5">&#9654;</span>
                <span>Student profiles with grades, attendance, and accommodations</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-atlas-primary mt-0.5">&#9654;</span>
                <span>Smart grouping, sub briefs, and professional insights</span>
              </div>
            </div>
          </div>
        </div>

        <p className="text-center text-xs text-gray-400 mt-4">
          All data is synthetic. No real student information is used.
        </p>
      </div>
    </div>
  );
}
