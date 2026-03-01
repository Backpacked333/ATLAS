import { Outlet, Navigate, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import React, { useState, useEffect, useRef } from 'react';
import { api } from '../../services/api';
import { SectionInfo } from '../../types';
import { DemoBanner } from './DemoBanner';

const NAV_ITEMS = [
  { path: '/dashboard', label: 'Command Center', icon: 'grid' },
  { path: '/briefing', label: 'Morning Briefing', icon: 'sun' },
  { path: '/roster', label: 'My Students', icon: 'users' },
  { path: '/attendance', label: 'Attendance', icon: 'clipboard' },
  { path: '/behavioral', label: 'Behavioral', icon: 'alert' },
  { path: '/analytics', label: 'Analytics', icon: 'chart' },
  { path: '/communications', label: 'Parent Comms', icon: 'mail' },
];

function NavIcon({ name }: { name: string }) {
  const icons: Record<string, React.ReactNode> = {
    grid: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" /></svg>,
    sun: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" /></svg>,
    users: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>,
    clipboard: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /></svg>,
    alert: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4.5c-.77-.833-2.694-.833-3.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" /></svg>,
    chart: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>,
    mail: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>,
  };
  return icons[name] || null;
}

export function AppLayout() {
  const { isAuthenticated, isLoading, teacher, logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<{id: string; firstName: string; lastName: string}[]>([]);
  const searchRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  // Keyboard shortcut: Cmd+K to open search
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setSearchOpen(true);
        setTimeout(() => searchInputRef.current?.focus(), 50);
      }
      if (e.key === 'Escape') {
        setSearchOpen(false);
        setSearchQuery('');
        setSearchResults([]);
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Search students
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }
    const timeout = setTimeout(() => {
      api.get<{id: string; firstName: string; lastName: string}[]>(`/roster?search=${encodeURIComponent(searchQuery)}`)
        .then(data => setSearchResults(data.slice(0, 8)))
        .catch(() => setSearchResults([]));
    }, 200);
    return () => clearTimeout(timeout);
  }, [searchQuery]);

  // Close search on click outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setSearchOpen(false);
        setSearchQuery('');
        setSearchResults([]);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      api.get<{ count: number }>('/notifications/unread-count')
        .then((data) => setUnreadCount(data.count))
        .catch(() => {});
    }
  }, [isAuthenticated, location.pathname]);

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-atlas-background dark:bg-dark-bg">
        <div className="text-center">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-atlas-primary border-t-transparent mx-auto" />
          <p className="mt-3 text-sm text-gray-500 dark:text-dark-muted font-medium">Loading AtlasED Classroom...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="flex flex-col h-screen bg-atlas-background dark:bg-dark-bg">
      <DemoBanner />
      <div className="flex flex-1 min-h-0">
        {/* Sidebar - Desktop */}
        <aside className={`hidden md:flex md:flex-col transition-all duration-300 border-r bg-white dark:bg-dark-surface border-atlas-border dark:border-dark-border ${sidebarCollapsed ? 'md:w-16' : 'md:w-60'}`}>
          <div className={`flex h-14 items-center border-b border-atlas-border dark:border-dark-border ${sidebarCollapsed ? 'justify-center px-2' : 'px-4 gap-2.5'}`}>
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-blue-700 shadow-lg shadow-blue-500/25">
              <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" /><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20" /><path d="M2 12h20" />
              </svg>
            </div>
            {!sidebarCollapsed && (
              <div className="flex items-center gap-1">
                <h1 className="text-lg font-bold text-atlas-primary dark:text-blue-400">Atlas</h1>
                <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-300 uppercase tracking-wider">ED</span>
              </div>
            )}
          </div>

          <nav className={`flex-1 overflow-y-auto py-3 space-y-0.5 ${sidebarCollapsed ? 'px-1.5' : 'px-2'}`}>
            {NAV_ITEMS.map((item) => (
              <Link key={item.path} to={item.path} title={sidebarCollapsed ? item.label : undefined}
                className={`flex items-center gap-2.5 rounded-lg text-sm font-medium transition-all duration-150 ${sidebarCollapsed ? 'justify-center p-2.5' : 'px-3 py-2'} ${isActive(item.path) ? 'nav-active' : 'text-gray-600 dark:text-dark-muted hover:text-gray-900 dark:hover:text-dark-text hover:bg-gray-100 dark:hover:bg-dark-hover'}`}>
                <NavIcon name={item.icon} />
                {!sidebarCollapsed && item.label}
              </Link>
            ))}
            {!sidebarCollapsed && (
              <div className="pt-4 pb-1 px-3">
                <p className="text-[10px] font-semibold text-gray-400 dark:text-dark-muted uppercase tracking-widest">Sections</p>
              </div>
            )}
            {teacher?.sections?.map((section: SectionInfo) => (
              <Link key={section.id} to={`/sections/${section.id}`} title={sidebarCollapsed ? `${section.period} - ${section.courseName}` : undefined}
                className={`flex items-center gap-2.5 rounded-lg text-sm transition-all duration-150 ${sidebarCollapsed ? 'justify-center p-2.5' : 'px-3 py-1.5'} ${location.pathname === `/sections/${section.id}` ? 'nav-active' : 'text-gray-500 dark:text-dark-muted hover:text-gray-700 dark:hover:text-dark-text hover:bg-gray-100 dark:hover:bg-dark-hover'}`}>
                <span className="text-[10px] font-bold rounded px-1.5 py-0.5 bg-gray-200 dark:bg-dark-hover text-gray-600 dark:text-dark-muted">{section.period}</span>
                {!sidebarCollapsed && <span className="truncate">{section.courseName}</span>}
              </Link>
            ))}
          </nav>

          <div className={`border-t border-atlas-border dark:border-dark-border ${sidebarCollapsed ? 'p-2' : 'px-3 py-3'}`}>
            <button onClick={() => setSidebarCollapsed(!sidebarCollapsed)} className="w-full flex items-center justify-center p-1.5 rounded-lg transition-colors mb-2 text-gray-400 dark:text-dark-muted hover:bg-gray-100 dark:hover:bg-dark-hover">
              <svg className={`w-4 h-4 transition-transform ${sidebarCollapsed ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" /></svg>
            </button>
            {!sidebarCollapsed && (
              <div className="flex items-center justify-between">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{teacher?.firstName} {teacher?.lastName}</p>
                  <p className="text-xs text-gray-500 dark:text-dark-muted truncate">{teacher?.school?.name}</p>
                </div>
                <button onClick={logout} className="text-xs text-gray-400 dark:text-dark-muted hover:text-gray-600 dark:hover:text-dark-text">Sign out</button>
              </div>
            )}
          </div>
        </aside>

        {/* Mobile sidebar */}
        {sidebarOpen && (
          <div className="fixed inset-0 z-40 md:hidden">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
            <aside className="relative w-64 h-full shadow-2xl bg-white dark:bg-dark-surface">
              <div className="flex items-center justify-between px-4 h-14 border-b border-atlas-border dark:border-dark-border">
                <h1 className="text-lg font-bold text-atlas-primary dark:text-blue-400">AtlasED</h1>
                <button onClick={() => setSidebarOpen(false)} className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>
              <nav className="px-2 py-3 space-y-0.5">
                {NAV_ITEMS.map((item) => (
                  <Link key={item.path} to={item.path} onClick={() => setSidebarOpen(false)}
                    className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${isActive(item.path) ? 'nav-active' : 'text-gray-600 dark:text-dark-muted hover:text-gray-900 dark:hover:text-dark-text hover:bg-gray-100 dark:hover:bg-dark-hover'}`}>
                    <NavIcon name={item.icon} />{item.label}
                  </Link>
                ))}
              </nav>
            </aside>
          </div>
        )}

        {/* Main content */}
        <div className="flex flex-1 flex-col min-w-0">
          <header className="flex h-14 items-center justify-between border-b px-4 bg-white dark:bg-dark-surface border-atlas-border dark:border-dark-border">
            <button className="md:hidden p-2 rounded-lg text-gray-600 dark:text-dark-muted hover:bg-gray-100 dark:hover:bg-dark-hover" onClick={() => setSidebarOpen(true)}>
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
            </button>

            {/* Global Search */}
            <div className="relative flex-1 max-w-md mx-4" ref={searchRef}>
              <button onClick={() => { setSearchOpen(true); setTimeout(() => searchInputRef.current?.focus(), 50); }}
                className={`flex items-center gap-2 w-full px-3 py-1.5 rounded-lg border text-sm transition-all ${searchOpen ? 'border-atlas-primary dark:border-dark-accent bg-white dark:bg-dark-card' : 'border-gray-200 dark:border-dark-border bg-gray-50 dark:bg-dark-card text-gray-500 dark:text-dark-muted hover:border-gray-300 dark:hover:border-dark-accent/50'}`}>
                <svg className="w-4 h-4 text-gray-400 dark:text-dark-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                {searchOpen ? (
                  <input ref={searchInputRef} type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search students..."
                    className="flex-1 bg-transparent outline-none text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-dark-muted" />
                ) : (
                  <span className="flex-1 text-left">Search students...</span>
                )}
                <kbd className="hidden sm:inline-flex items-center gap-0.5 rounded border px-1.5 py-0.5 text-[10px] font-medium border-gray-200 dark:border-dark-border bg-gray-100 dark:bg-dark-hover text-gray-500 dark:text-dark-muted">
                  <span className="text-xs">{"\u2318"}</span>K
                </kbd>
              </button>
              {searchOpen && searchResults.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1 rounded-xl border shadow-xl overflow-hidden z-50 bg-white dark:bg-dark-card border-atlas-border dark:border-dark-border">
                  {searchResults.map(s => (
                    <button key={s.id} onClick={() => { navigate(`/students/${s.id}`); setSearchOpen(false); setSearchQuery(''); setSearchResults([]); }}
                      className="flex items-center gap-3 w-full px-3 py-2.5 text-left transition-colors hover:bg-gray-50 dark:hover:bg-dark-hover">
                      <div className="h-7 w-7 rounded-full bg-atlas-primary/10 dark:bg-blue-500/20 flex items-center justify-center text-xs font-bold text-atlas-primary dark:text-blue-400">
                        {s.firstName[0]}{s.lastName[0]}
                      </div>
                      <span className="text-sm text-gray-900 dark:text-white">{s.firstName} {s.lastName}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Right actions */}
            <div className="flex items-center gap-1">
              <button onClick={toggleTheme} className="p-2 rounded-lg transition-colors text-gray-500 dark:text-dark-muted hover:bg-gray-100 dark:hover:bg-dark-hover hover:text-gray-700 dark:hover:text-dark-text"
                title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}>
                {isDark ? (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>
                )}
              </button>
              <Link to="/notifications" className="relative p-2 rounded-lg transition-colors text-gray-500 dark:text-dark-muted hover:bg-gray-100 dark:hover:bg-dark-hover hover:text-gray-700 dark:hover:text-dark-text">
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 h-4 w-4 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center shadow-lg shadow-red-500/30">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </Link>
            </div>
          </header>

          {/* Page content */}
          <main className="flex-1 overflow-y-auto p-4 md:p-6">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
}
