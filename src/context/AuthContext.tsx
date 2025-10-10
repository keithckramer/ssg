"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { getStoredUser, loginMock, logout as logoutUser, USER_STORAGE_KEY, type User } from "@/lib/auth";

export type AuthContextValue = {
  user: User | null;
  login: (email: string, name?: string) => User;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    if (typeof window === "undefined") return null;
    return getStoredUser();
  });

  const isInitialised = useRef(false);

  useEffect(() => {
    if (isInitialised.current) return;
    const stored = getStoredUser();
    setUser(stored);
    isInitialised.current = true;
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleStorage = (event: StorageEvent) => {
      if (event.key === USER_STORAGE_KEY) {
        setUser(getStoredUser());
      }
    };

    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  const login = useCallback((email: string, name?: string) => {
    const nextUser = loginMock(email, name);
    setUser(nextUser);
    return nextUser;
  }, []);

  const logout = useCallback(() => {
    logoutUser();
    setUser(null);
  }, []);

  const value = useMemo<AuthContextValue>(() => ({ user, login, logout }), [user, login, logout]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
