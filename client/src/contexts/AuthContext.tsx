import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { api } from '../services/api';
import { Teacher } from '../types';
import { DEMO_TEACHER } from '../demo/mockData';
import { demoApiHandler, resetDemoState } from '../demo/demoApiHandler';

interface AuthContextType {
  teacher: Teacher | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isDemoMode: boolean;
  login: (email: string) => Promise<void>;
  loginDemo: () => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [teacher, setTeacher] = useState<Teacher | null>(null);
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('atlas_token'));
  const [isLoading, setIsLoading] = useState(true);
  const [isDemoMode, setIsDemoMode] = useState(() => localStorage.getItem('atlas_demo') === 'true');

  useEffect(() => {
    // If demo mode was previously active, restore it
    if (isDemoMode) {
      api.setDemoMode(true, demoApiHandler);
      setTeacher(DEMO_TEACHER);
      setToken('demo-jwt-token');
      setIsLoading(false);
      return;
    }

    const currentToken = localStorage.getItem('atlas_token');
    if (currentToken) {
      api.setToken(currentToken);
      api.get<{ id: string; email: string; firstName: string; lastName: string; photoUrl: string; school: { name: string }; sections: { id: string; courseName: string; period: string }[] }>('/auth/me')
        .then((data) => {
          setTeacher({
            id: data.id,
            email: data.email,
            firstName: data.firstName,
            lastName: data.lastName,
            photoUrl: data.photoUrl,
            schoolId: '',
            school: data.school,
            sections: data.sections,
          });
        })
        .catch(() => {
          setToken(null);
          localStorage.removeItem('atlas_token');
          api.setToken(null);
        })
        .finally(() => setIsLoading(false));
    } else {
      setIsLoading(false);
    }
  }, [isDemoMode]);

  const login = useCallback(async (email: string) => {
    const result = await api.post<{ token: string; teacher: Teacher }>('/auth/login', { email });
    setToken(result.token);
    setTeacher(result.teacher);
    localStorage.setItem('atlas_token', result.token);
    api.setToken(result.token);
  }, []);

  const loginDemo = useCallback(() => {
    resetDemoState();
    api.setDemoMode(true, demoApiHandler);
    setIsDemoMode(true);
    setTeacher(DEMO_TEACHER);
    setToken('demo-jwt-token');
    localStorage.setItem('atlas_demo', 'true');
    localStorage.setItem('atlas_token', 'demo-jwt-token');
  }, []);

  const logout = useCallback(() => {
    setToken(null);
    setTeacher(null);
    setIsDemoMode(false);
    localStorage.removeItem('atlas_token');
    localStorage.removeItem('atlas_demo');
    api.setToken(null);
    api.setDemoMode(false);
    resetDemoState();
  }, []);

  return (
    <AuthContext.Provider
      value={{
        teacher,
        token,
        isAuthenticated: !!teacher,
        isLoading,
        isDemoMode,
        login,
        loginDemo,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
