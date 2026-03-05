import { Outlet, Navigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { SectionInfo } from '../../types';
import { AnimatePresence, motion } from 'framer-motion';
import {
  SunIcon,
  UsersIcon,
  ChartBarIcon,
  BellIcon,
  Bars3Icon,
  ArrowRightStartOnRectangleIcon,
} from '@heroicons/react/24/outline';

export function AppLayout() {
  const { isAuthenticated, isLoading, teacher, logout } = useAuth();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (isAuthenticated) {
      api.get<{ count: number }>('/notifications/unread-count')
        .then((data) => setUnreadCount(data.count))
        .catch(() => {});
    }
  }, [isAuthenticated, location.pathname]);

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-atlas-bg">
        <div className="text-center">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-atlas-indigo-600 border-t-transparent mx-auto" />
          <p className="mt-3 text-sm text-atlas-text-secondary">Loading AtlasED Classroom...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  const navItems = [
    { path: '/briefing', label: 'Command Center', icon: SunIcon },
    { path: '/roster', label: 'My Students', icon: UsersIcon },
    { path: '/insights', label: 'Insights', icon: ChartBarIcon },
  ];

  const isActive = (path: string) => location.pathname === path;

  const sidebarContent = (
    <>
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.path}
              to={item.path}
              onClick={() => setSidebarOpen(false)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 ${
                isActive(item.path)
                  ? 'bg-atlas-indigo-50 text-atlas-indigo-700 shadow-sm'
                  : 'text-atlas-text-secondary hover:bg-gray-50 hover:text-atlas-text-primary'
              }`}
            >
              <Icon className="h-5 w-5 flex-shrink-0" />
              {item.label}
            </Link>
          );
        })}

        <div className="pt-5 pb-2 px-3">
          <p className="section-title mb-0">Sections</p>
        </div>
        {teacher?.sections?.map((section: SectionInfo) => (
          <Link
            key={section.id}
            to={`/sections/${section.id}`}
            onClick={() => setSidebarOpen(false)}
            className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all duration-150 ${
              location.pathname === `/sections/${section.id}`
                ? 'bg-atlas-indigo-50 text-atlas-indigo-700'
                : 'text-atlas-text-secondary hover:bg-gray-50 hover:text-atlas-text-primary'
            }`}
          >
            <span className="text-[10px] font-semibold bg-atlas-indigo-100 text-atlas-indigo-700 rounded px-1.5 py-0.5">
              {section.period}
            </span>
            <span className="truncate">{section.courseName}</span>
          </Link>
        ))}
      </nav>

      <div className="border-t border-atlas-border p-4">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-full bg-atlas-indigo-100 flex items-center justify-center text-sm font-semibold text-atlas-indigo-700">
            {teacher?.firstName?.[0]}{teacher?.lastName?.[0]}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-atlas-text-primary truncate">
              {teacher?.firstName} {teacher?.lastName}
            </p>
            <p className="text-xs text-atlas-text-tertiary truncate">{teacher?.school?.name}</p>
          </div>
          <button
            onClick={logout}
            className="p-1.5 rounded-lg text-atlas-text-tertiary hover:text-atlas-text-primary hover:bg-gray-100 transition-colors"
            title="Sign out"
          >
            <ArrowRightStartOnRectangleIcon className="h-4 w-4" />
          </button>
        </div>
      </div>
    </>
  );

  return (
    <div className="flex h-screen bg-atlas-bg">
      {/* Sidebar - Desktop */}
      <aside className="hidden md:flex md:w-64 md:flex-col bg-atlas-surface border-r border-atlas-border">
        <div className="flex h-14 items-center px-5 border-b border-atlas-border">
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-lg bg-atlas-indigo-600 flex items-center justify-center">
              <span className="text-xs font-bold text-white">A</span>
            </div>
            <h1 className="text-base font-bold text-atlas-text-primary">AtlasED</h1>
          </div>
        </div>
        {sidebarContent}
      </aside>

      {/* Mobile sidebar overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <div className="fixed inset-0 z-40 md:hidden">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-atlas-overlay"
              onClick={() => setSidebarOpen(false)}
            />
            <motion.aside
              initial={{ x: -256 }}
              animate={{ x: 0 }}
              exit={{ x: -256 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="relative w-64 bg-atlas-surface h-full shadow-modal flex flex-col"
            >
              <div className="flex h-14 items-center px-5 border-b border-atlas-border">
                <div className="flex items-center gap-2">
                  <div className="h-7 w-7 rounded-lg bg-atlas-indigo-600 flex items-center justify-center">
                    <span className="text-xs font-bold text-white">A</span>
                  </div>
                  <h1 className="text-base font-bold text-atlas-text-primary">AtlasED</h1>
                </div>
              </div>
              {sidebarContent}
            </motion.aside>
          </div>
        )}
      </AnimatePresence>

      {/* Main content */}
      <div className="flex flex-1 flex-col min-w-0">
        {/* Top header */}
        <header className="flex h-14 items-center justify-between border-b border-atlas-border bg-atlas-surface px-4 md:px-6">
          <button
            className="md:hidden p-2 rounded-lg text-atlas-text-secondary hover:bg-gray-100 transition-colors"
            onClick={() => setSidebarOpen(true)}
          >
            <Bars3Icon className="h-5 w-5" />
          </button>

          <div className="flex-1" />

          <Link
            to="/notifications"
            className="relative p-2 rounded-lg text-atlas-text-secondary hover:bg-gray-100 hover:text-atlas-text-primary transition-colors"
          >
            <BellIcon className="h-5 w-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 h-4 w-4 rounded-full bg-atlas-rose-500 text-white text-[10px] font-semibold flex items-center justify-center ring-2 ring-white">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </Link>
        </header>

        {/* Page content with animation */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.15 }}
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}
