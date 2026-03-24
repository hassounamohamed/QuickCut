import React, { createContext, useCallback, useContext, useState } from 'react';
import { setAuthToken } from '@/services/api';

function parseJwtPayload(token: string): {
  sub: string;
  email: string;
  username?: string;
  role: string;
} {
  try {
    const b64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    const json = globalThis.atob(b64);
    return JSON.parse(json);
  } catch {
    return { sub: '', email: '', username: '', role: 'user' };
  }
}

export interface AuthUser {
  id: string;
  email: string;
  username: string;
  role: 'user' | 'barber';
}

interface AuthContextType {
  token: string | null;
  user: AuthUser | null;
  isBarber: boolean;
  isAuthenticated: boolean;
  login: (token: string) => void;
  logout: () => void;
  syncProfile: (payload: Partial<Pick<AuthUser, 'email' | 'username'>>) => void;
}

const AuthContext = createContext<AuthContextType>({
  token: null,
  user: null,
  isBarber: false,
  isAuthenticated: false,
  login: () => {},
  logout: () => {},
  syncProfile: () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<AuthUser | null>(null);

  const login = useCallback((newToken: string) => {
    const payload = parseJwtPayload(newToken);
    setToken(newToken);
    setUser({
      id: payload.sub,
      email: payload.email,
      username: payload.username ?? payload.email.split('@')[0] ?? '',
      role: payload.role as 'user' | 'barber',
    });
    setAuthToken(newToken);
  }, []);

  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
    setAuthToken(null);
  }, []);

  const syncProfile = useCallback((payload: Partial<Pick<AuthUser, 'email' | 'username'>>) => {
    setUser((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        email: payload.email ?? prev.email,
        username: payload.username ?? prev.username,
      };
    });
  }, []);

  return (
    <AuthContext.Provider
      value={{
        token,
        user,
        isBarber: user?.role === 'barber',
        isAuthenticated: Boolean(token),
        login,
        logout,
        syncProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuthContext() {
  return useContext(AuthContext);
}
