"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { clearAuth, getAuth, setAuth } from "@/lib/auth/auth-store";

export type AuthContextValue = {
  username: string | null;
  password: string | null;
  role: string | null;
  setCredentials: (username: string, password: string, role: string) => void;
  logout: () => void;
};

type AuthState = {
  username: string | null;
  password: string | null;
  role: string | null;
};

const AuthContext = createContext<AuthContextValue | null>(null);
const emptyAuth: AuthState = { username: null, password: null, role: null };

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>(() => emptyAuth);

  useEffect(() => {
    setState(getAuth());
    const handleStorage = () => setState(getAuth());
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      username: state.username,
      password: state.password,
      role: state.role,
      setCredentials: (username: string, password: string, role: string) => {
        setAuth({ username, password, role });
        setState({ username, password, role });
      },
      logout: () => {
        clearAuth();
        setState({ username: null, password: null, role: null });
      }
    }),
    [state]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return ctx;
}
