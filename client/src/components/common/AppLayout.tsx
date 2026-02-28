import { Outlet, Navigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { SectionInfo } from '../../types';

type DemoView = 'teacher' | 'counselor' | 'admin';
const DEMO_VIEW_LABELS: Record<DemoView, { label: string; description: string }> = {
  teacher: { label: 'Teacher View', description: 'Daily classroom management' },
  counselor: { label: 'Counselor View', description: 'Student support overview' },
  admin: { label: 'Admin View', description: 'School-wide analytics' },
};

export function AppLayout() {
  const { isAuthenticated, isLoading, teacher, isDemoMode, logout } = useAuth();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [demoView, setDemoView] = useState<DemoView>('teacher');
  const [showViewSwitcher, setShowViewSwitcher] = useState(false);
  const [showDemoTooltip, setShowDemoTooltip] = useState(true);

  useEffect(() => {
    if (isAuthenticated) {
      api.get<{ count: number }>('/notifications/unread-count')
        .then((data) => setUnreadCount(data.count))
        .catch(() => {});
    }
  }, [isAuthenticated, location.pathname]);

  // Auto-dismiss demo tooltip
  useEffect(() => {
    if (showDemoTooltip && isDemoMode) {
      const timer = setTimeout(() => setShowDemoTooltip(false), 6000);
      return () => clearTimeout(timer);
    }
  }, [showDemoTooltip, isDemoMode]);

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-atlas-background">
        <div className="text-center">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-atlas-primary border-t-transparent mx-auto" />
          <p className="mt-3 text-sm text-gray-500">Loading AtlasED Classroom...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  const navItems = [
    { path: '/briefing', label: 'Morning Briefing', icon: (
      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
      </svg>
    )},
    { path: '/roster', label: 'My Students', icon: (
      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
      </svg>
    )},
    { path: '/notifications', label: 'Notifications', icon: (
      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
      </svg>
    ), badge: unreadCount },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="flex h-screen bg-atlas-background">
      {/* Sidebar - Desktop */}
      <aside className="hidden md:flex md:w-64 md:flex-col bg-white border-r border-atlas-border">
        {/* Sidebar Header */}
        <div className="flex h-14 items-center px-4 border-b border-atlas-border">
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-lg bg-atlas-primary flex items-center justify-center">
              <svg className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
            <h1 className="text-base font-bold text-atlas-primary">AtlasED</h1>
          </div>
        </div>

        {/* Demo View Switcher */}
        {isDemoMode && (
          <div className="px-3 pt-3">
            <div className="relative">
              <button
                onClick={() => setShowViewSwitcher(!showViewSwitcher)}
                className="w-full flex items-center justify-between gap-2 px-3 py-2 rounded-lg bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 text-sm font-medium text-atlas-primary hover:from-blue-100 hover:to-indigo-100 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-atlas-primary animate-pulse" />
                  {DEMO_VIEW_LABELS[demoView].label}
                </div>
                <svg className={`h-4 w-4 transition-transform ${showViewSwitcher ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {showViewSwitcher && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-lg shadow-lg border border-atlas-border z-30 overflow-hidden">
                  {(Object.entries(DEMO_VIEW_LABELS) as [DemoView, { label: string; description: string }][]).map(([key, val]) => (
                    <button
                      key={key}
                      onClick={() => { setDemoView(key); setShowViewSwitcher(false); }}
                      className={`w-full text-left px-3 py-2.5 hover:bg-gray-50 transition-colors ${demoView === key ? 'bg-blue-50' : ''}`}
                    >
                      <div className="flex items-center gap-2">
                        {demoView === key && <span className="h-1.5 w-1.5 rounded-full bg-atlas-primary" />}
                        <div>
                          <p className={`text-sm font-medium ${demoView === key ? 'text-atlas-primary' : 'text-gray-700'}`}>{val.label}</p>
                          <p className="text-xs text-gray-500">{val.description}</p>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-1">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                isActive(item.path)
                  ? 'bg-atlas-primary text-white shadow-sm'
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
              }`}
            >
              <span className={isActive(item.path) ? 'text-white' : 'text-gray-400'}>{item.icon}</span>
              <span className="flex-1">{item.label}</span>
              {item.badge ? (
                <span className={`h-5 min-w-[20px] rounded-full text-xs font-medium flex items-center justify-center ${
                  isActive(item.path) ? 'bg-white/20 text-white' : 'bg-atlas-danger text-white'
                }`}>
                  {item.badge > 9 ? '9+' : item.badge}
                </span>
              ) : null}
            </Link>
          ))}

          <div className="pt-4 pb-2 px-3">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">My Classes</p>
          </div>
          {teacher?.sections?.map((section: SectionInfo) => (
            <Link
              key={section.id}
              to={`/sections/${section.id}`}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all ${
                location.pathname === `/sections/${section.id}`
                  ? 'bg-blue-50 text-atlas-primary font-medium'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <span className={`text-xs rounded px-1.5 py-0.5 font-medium ${
                location.pathname === `/sections/${section.id}`
                  ? 'bg-atlas-primary/10 text-atlas-primary'
                  : 'bg-gray-100 text-gray-500'
              }`}>{section.period.replace('Period ', 'P')}</span>
              <span className="truncate">{section.courseName}</span>
            </Link>
          ))}
        </nav>

        {/* Sidebar Footer */}
        <div className="border-t border-atlas-border px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-full bg-atlas-primary/10 flex items-center justify-center text-sm font-bold text-atlas-primary">
              {teacher?.firstName?.[0]}{teacher?.lastName?.[0]}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">{teacher?.firstName} {teacher?.lastName}</p>
              <p className="text-xs text-gray-500 truncate">{teacher?.school?.name}</p>
            </div>
            <button
              onClick={logout}
              className="p-1.5 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
              title="Sign out"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setSidebarOpen(false)} />
          <aside className="relative w-72 bg-white h-full shadow-xl overflow-y-auto">
            <div className="flex h-14 items-center justify-between px-4 border-b border-atlas-border">
              <div className="flex items-center gap-2">
                <div className="h-7 w-7 rounded-lg bg-atlas-primary flex items-center justify-center">
                  <svg className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                </div>
                <h1 className="text-base font-bold text-atlas-primary">AtlasED</h1>
              </div>
              <button onClick={() => setSidebarOpen(false)} className="p-1 text-gray-400 hover:text-gray-600">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <nav className="px-3 py-3 space-y-1">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                    isActive(item.path)
                      ? 'bg-atlas-primary text-white'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <span className={isActive(item.path) ? 'text-white' : 'text-gray-400'}>{item.icon}</span>
                  <span className="flex-1">{item.label}</span>
                  {item.badge ? (
                    <span className="h-5 min-w-[20px] rounded-full bg-atlas-danger text-white text-xs font-medium flex items-center justify-center">
                      {item.badge > 9 ? '9+' : item.badge}
                    </span>
                  ) : null}
                </Link>
              ))}
              <div className="pt-4 pb-2 px-3">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">My Classes</p>
              </div>
              {teacher?.sections?.map((section: SectionInfo) => (
                <Link
                  key={section.id}
                  to={`/sections/${section.id}`}
                  onClick={() => setSidebarOpen(false)}
                  className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-gray-600 hover:bg-gray-50"
                >
                  <span className="text-xs bg-gray-100 rounded px-1.5 py-0.5 text-gray-500 font-medium">{section.period.replace('Period ', 'P')}</span>
                  {section.courseName}
                </Link>
              ))}
            </nav>
          </aside>
        </div>
      )}

      {/* Main content */}
      <div className="flex flex-1 flex-col min-w-0">
        {/* Demo Banner */}
        {isDemoMode && (
          <div className="bg-gradient-to-r from-atlas-primary via-blue-700 to-indigo-700 text-white px-4 py-2 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-green-400 animate-pulse" />
                <span className="text-xs font-semibold uppercase tracking-wider">Demo Mode</span>
              </div>
              <span className="hidden sm:inline text-xs text-blue-200">
                Viewing as Ms. Sarah Chen &middot; Lincoln High School &middot; {DEMO_VIEW_LABELS[demoView].label}
              </span>
            </div>
            <div className="flex items-center gap-2">
              {showDemoTooltip && (
                <span className="hidden sm:inline text-xs bg-white/20 rounded-full px-3 py-1 animate-pulse">
                  Click around — everything is interactive
                </span>
              )}
              <button
                onClick={logout}
                className="text-xs bg-white/10 hover:bg-white/20 rounded-md px-3 py-1 transition-colors"
              >
                Exit Demo
              </button>
            </div>
          </div>
        )}

        {/* Top header */}
        <header className="flex h-14 items-center justify-between border-b border-atlas-border bg-white px-4">
          <button
            className="md:hidden p-2 text-gray-600 hover:text-gray-900 rounded-md hover:bg-gray-100"
            onClick={() => setSidebarOpen(true)}
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>

          <div className="flex-1" />

          {/* Quick Action Buttons — Demo mode */}
          {isDemoMode && (
            <div className="hidden md:flex items-center gap-2 mr-4">
              <Link
                to="/briefing"
                className={`text-xs px-3 py-1.5 rounded-md font-medium transition-colors ${
                  isActive('/briefing') ? 'bg-blue-100 text-atlas-primary' : 'text-gray-500 hover:bg-gray-100'
                }`}
              >
                Briefing
              </Link>
              <Link
                to="/roster"
                className={`text-xs px-3 py-1.5 rounded-md font-medium transition-colors ${
                  isActive('/roster') ? 'bg-blue-100 text-atlas-primary' : 'text-gray-500 hover:bg-gray-100'
                }`}
              >
                Roster
              </Link>
              <Link
                to="/students/stu-001"
                className="text-xs px-3 py-1.5 rounded-md font-medium text-gray-500 hover:bg-gray-100 transition-colors"
              >
                Sample Student
              </Link>
            </div>
          )}

          <Link
            to="/notifications"
            className="relative p-2 text-gray-500 hover:text-gray-900 rounded-md hover:bg-gray-100 transition-colors"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 h-4 w-4 rounded-full bg-atlas-danger text-white text-xs flex items-center justify-center font-medium">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </Link>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
