import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { api, onUnauthorized, tokenStore } from '../api/client';
import type { AuthResponse, User } from '../api/types';

interface AuthState {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const qc = useQueryClient();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(() => !!tokenStore.get());

  const clearSession = useCallback(() => {
    tokenStore.clear();
    setUser(null);
    qc.clear();
  }, [qc]);

  useEffect(() => {
    onUnauthorized(clearSession);
    if (!tokenStore.get()) return;
    api<{ user: User }>('/auth/me')
      .then((r) => setUser(r.user))
      .catch(() => clearSession())
      .finally(() => setLoading(false));
  }, [clearSession]);

  const handleAuth = useCallback((r: AuthResponse) => {
    tokenStore.set(r.token);
    setUser(r.user);
  }, []);

  const value = useMemo<AuthState>(
    () => ({
      user,
      loading,
      login: async (email, password) =>
        handleAuth(await api<AuthResponse>('/auth/login', { method: 'POST', body: { email, password } })),
      register: async (name, email, password) =>
        handleAuth(await api<AuthResponse>('/auth/register', { method: 'POST', body: { name, email, password } })),
      logout: async () => {
        try {
          await api('/auth/logout', { method: 'POST' });
        } finally {
          clearSession();
        }
      },
    }),
    [user, loading, handleAuth, clearSession],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
