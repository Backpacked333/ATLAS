import { Outlet, Navigate, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useState, useEffect, useRef } from 'react';
import { api } from '../../services/api';
import { SectionInfo } from '../../types';
import { DemoBanner } from './DemoBanner';

export function AppLayout() {
  const { isAuthenticated, isLoading, teacher, logout } = useAuth();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
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
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-atlas-primary border-t-transparent mx-auto" />
          <p className="mt-2 text-sm text-gray-500">Loading AtlasED Classroom...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  const navItems = [
    { path: '/briefing', label: 'Morning Briefing', icon: '☀' },
    { path: '/roster', label: 'My Students', icon: '👥' },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="flex flex-col h-screen bg-atlas-background">
      <DemoBanner />
      <div className="flex flex-1 min-h-0">
      {/* Sidebar - Desktop */}
      <aside className="hidden md:flex md:w-64 md:flex-col bg-white border-r border-atlas-border">
        <div className="flex h-14 items-center gap-2.5 px-4 border-b border-atlas-border">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-atlas-primary">
            <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20" />
              <path d="M2 12h20" />
            </svg>
          </div>
          <h1 className="text-lg font-bold text-atlas-primary">AtlasED</h1>
        </div>

        <nav className="flex-1 overflow-y-auto px-2 py-4 space-y-1">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                isActive(item.path)
                  ? 'bg-blue-50 text-atlas-primary'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <span>{item.icon}</span>
              {item.label}
            </Link>
          ))}

          <div className="pt-4 pb-2 px-3">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Sections</p>
          </div>
          {teacher?.sections?.map((section: SectionInfo) => (
            <Link
              key={section.id}
              to={`/sections/${section.id}`}
              className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors ${
                location.pathname === `/sections/${section.id}`
                  ? 'bg-blue-50 text-atlas-primary'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <span className="text-xs bg-gray-200 rounded px-1.5 py-0.5">{section.period}</span>
              {section.courseName}
            </Link>
          ))}
        </nav>

        <div className="border-t border-atlas-border px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="text-sm">
              <p className="font-medium text-gray-900">{teacher?.firstName} {teacher?.lastName}</p>
              <p className="text-gray-500 text-xs">{teacher?.school?.name}</p>
            </div>
            <button onClick={logout} className="text-xs text-gray-400 hover:text-gray-600">
              Sign out
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setSidebarOpen(false)} />
          <aside className="relative w-64 bg-white h-full shadow-xl">
            <nav className="px-2 py-4 space-y-1">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setSidebarOpen(false)}
                  className="flex items-center gap-3 px-3 py-2 rounded-md text-sm text-gray-700 hover:bg-gray-100"
                >
                  <span>{item.icon}</span>
                  {item.label}
                </Link>
              ))}
            </nav>
          </aside>
        </div>
      )}

      {/* Main content */}
      <div className="flex flex-1 flex-col min-w-0">
        {/* Top header */}
        <header className="flex h-14 items-center justify-between border-b border-atlas-border bg-white px-4">
          <button
            className="md:hidden p-2 text-gray-600"
            onClick={() => setSidebarOpen(true)}
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>

          {/* Global Search */}
          <div className="relative flex-1 max-w-md mx-4" ref={searchRef}>
            <button
              onClick={() => { setSearchOpen(true); setTimeout(() => searchInputRef.current?.focus(), 50); }}
              className={`flex items-center gap-2 w-full px-3 py-1.5 rounded-lg border text-sm transition-colors ${
                searchOpen ? 'border-atlas-primary bg-white' : 'border-gray-200 bg-gray-50 text-gray-500 hover:border-gray-300'
              }`}
            >
              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              {searchOpen ? (
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Search students..."
                  className="flex-1 bg-transparent outline-none text-gray-900 placeholder:text-gray-400"
                />
              ) : (
                <span className="flex-1 text-left">Search students...</span>
              )}
              <kbd className="hidden sm:inline-flex items-center gap-0.5 rounded border border-gray-200 bg-gray-100 px-1.5 py-0.5 text-[10px] font-medium text-gray-500">
                <span className="text-xs">{"\u2318"}</span>K
              </kbd>
            </button>
            {searchOpen && searchResults.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-lg border border-atlas-border shadow-lg overflow-hidden z-50">
                {searchResults.map(s => (
                  <button
                    key={s.id}
                    onClick={() => {
                      navigate(`/students/${s.id}`);
                      setSearchOpen(false);
                      setSearchQuery('');
                      setSearchResults([]);
                    }}
                    className="flex items-center gap-3 w-full px-3 py-2 text-left hover:bg-gray-50 transition-colors"
                  >
                    <div className="h-7 w-7 rounded-full bg-atlas-accent/20 flex items-center justify-center text-xs font-medium text-atlas-primary">
                      {s.firstName[0]}{s.lastName[0]}
                    </div>
                    <span className="text-sm text-gray-900">{s.firstName} {s.lastName}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <Link
            to="/notifications"
            className="relative p-2 text-gray-600 hover:text-gray-900"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 h-4 w-4 rounded-full bg-atlas-danger text-white text-xs flex items-center justify-center">
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
    </div>
  );
}
