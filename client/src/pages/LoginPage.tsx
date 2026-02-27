import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const FEATURES = [
  {
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386-1.591 1.591M21 12h-2.25m-.386 6.364-1.591-1.591M12 18.75V21m-4.773-4.227-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0Z" />
      </svg>
    ),
    title: 'Morning Briefing',
    desc: 'Absences, grade drops, and action items before the first bell',
  },
  {
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
      </svg>
    ),
    title: 'Closed-Loop Actions',
    desc: 'Track every intervention from trigger to outcome',
  },
  {
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z" />
      </svg>
    ),
    title: 'Know Every Student',
    desc: 'Grades, attendance, accommodations, and family contacts in one view',
  },
  {
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z" />
      </svg>
    ),
    title: 'Professional Insights',
    desc: 'Section comparisons, grading patterns, and growth analytics',
  },
];

export function LoginPage() {
  const { login, demoLogin, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showLogin, setShowLogin] = useState(false);

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
    demoLogin();
    navigate('/briefing');
  }

  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      {/* Left panel — brand & value prop */}
      <div className="relative flex-1 bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 text-white flex flex-col justify-center px-8 py-12 lg:px-16 overflow-hidden">
        {/* Background pattern */}
        <div className="absolute inset-0 opacity-[0.04]" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }} />

        {/* Gradient orbs */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-72 h-72 bg-blue-400/10 rounded-full blur-3xl" />

        <div className="relative z-10 max-w-lg">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-blue-600 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-blue-500/30">
              A
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">AtlasED</h1>
              <p className="text-blue-300 text-xs font-medium tracking-widest uppercase">Classroom</p>
            </div>
          </div>

          <h2 className="text-3xl lg:text-4xl font-bold leading-tight mb-4">
            Know every student.
            <br />
            <span className="text-blue-400">Every day.</span>
          </h2>

          <p className="text-blue-200/80 text-base lg:text-lg mb-10 leading-relaxed">
            The daily operating system for classroom teachers. One place for attendance, grades, interventions, and parent communication.
          </p>

          <div className="space-y-4">
            {FEATURES.map((f, i) => (
              <div key={i} className="flex items-start gap-3 group">
                <div className="mt-0.5 flex-shrink-0 w-9 h-9 rounded-lg bg-white/10 flex items-center justify-center text-blue-300 group-hover:bg-white/15 transition-colors">
                  {f.icon}
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">{f.title}</p>
                  <p className="text-sm text-blue-200/60">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right panel — demo CTA & login */}
      <div className="flex-1 flex items-center justify-center bg-atlas-background px-6 py-12 lg:px-16">
        <div className="w-full max-w-sm animate-fade-in">
          {/* Demo CTA */}
          <div className="mb-8">
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-600 to-blue-800 p-6 text-white shadow-xl shadow-blue-500/20">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-8 translate-x-8" />
              <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full translate-y-6 -translate-x-6" />

              <div className="relative z-10">
                <p className="text-blue-100 text-xs font-semibold uppercase tracking-wider mb-1">Interactive Demo</p>
                <h3 className="text-xl font-bold mb-1">See it in action</h3>
                <p className="text-blue-200 text-sm mb-5">
                  Explore as Sarah Martinez, 9th-grade math teacher with 3 sections and 13 students
                </p>

                <button
                  onClick={handleDemoLogin}
                  disabled={loading}
                  className="w-full py-3 px-4 rounded-xl bg-white text-blue-700 font-bold text-sm hover:bg-blue-50 transition-all shadow-lg shadow-black/10 active:scale-[0.98] disabled:opacity-50"
                >
                  {loading ? 'Loading...' : 'Try the Demo'}
                </button>

                <div className="mt-4 grid grid-cols-2 gap-2 text-xs text-blue-200/80">
                  <div className="flex items-center gap-1.5">
                    <span className="w-1 h-1 rounded-full bg-blue-300" />
                    Morning briefing
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-1 h-1 rounded-full bg-blue-300" />
                    Action tracking
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-1 h-1 rounded-full bg-blue-300" />
                    Student profiles
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-1 h-1 rounded-full bg-blue-300" />
                    Parent comms
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Login section */}
          {!showLogin ? (
            <button
              onClick={() => setShowLogin(true)}
              className="w-full text-center text-sm text-gray-500 hover:text-gray-700 py-2 transition-colors"
            >
              Already have an account? <span className="font-semibold text-atlas-primary">Sign in</span>
            </button>
          ) : (
            <div className="card p-6 animate-slide-up">
              <p className="text-xs text-gray-400 uppercase tracking-wider font-semibold mb-4">
                Sign in to your account
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
                  className="btn-primary w-full"
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
          )}

          <p className="text-center text-xs text-gray-400 mt-6">
            All demo data is synthetic. No real student information is used.
          </p>
        </div>
      </div>
    </div>
  );
}
