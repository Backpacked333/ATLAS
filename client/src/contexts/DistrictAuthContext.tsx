import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { api } from '../services/api';
import { DistrictAdmin } from '../types/command';

interface DistrictAuthContextType {
  admin: DistrictAdmin | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string) => Promise<void>;
  logout: () => void;
}

const DistrictAuthContext = createContext<DistrictAuthContextType | null>(null);

export function DistrictAuthProvider({ children }: { children: React.ReactNode }) {
  const [admin, setAdmin] = useState<DistrictAdmin | null>(null);
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('atlas_command_token'));
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (token) {
      api.setToken(token);
      api.get<DistrictAdmin>('/command/auth/me')
        .then((data) => {
          setAdmin(data);
        })
        .catch(() => {
          setToken(null);
          localStorage.removeItem('atlas_command_token');
          api.setToken(null);
        })
        .finally(() => setIsLoading(false));
    } else {
      setIsLoading(false);
    }
  }, [token]);

  const login = useCallback(async (email: string) => {
    const result = await api.post<{ token: string; admin: DistrictAdmin }>('/command/auth/login', { email });
    setToken(result.token);
    setAdmin(result.admin);
    localStorage.setItem('atlas_command_token', result.token);
    api.setToken(result.token);
  }, []);

  const logout = useCallback(() => {
    setToken(null);
    setAdmin(null);
    localStorage.removeItem('atlas_command_token');
    api.setToken(null);
  }, []);

  return (
    <DistrictAuthContext.Provider
      value={{
        admin,
        token,
        isAuthenticated: !!admin,
        isLoading,
        login,
        logout,
      }}
    >
      {children}
    </DistrictAuthContext.Provider>
  );
}

export function useDistrictAuth(): DistrictAuthContextType {
  const context = useContext(DistrictAuthContext);
  if (!context) throw new Error('useDistrictAuth must be used within DistrictAuthProvider');
  return context;
}
