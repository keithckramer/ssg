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

import { apiClient } from "@/lib/apiClient";
import { clearAccessToken, ensureAccessToken } from "@/lib/authClient";
import type { User } from "@/types/user";

export type AuthContextValue = {
  user: User | null;
  setUser: (user: User | null) => void;
  refreshUser: () => Promise<User | null>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

async function fetchCurrentUser() {
  const response = await apiClient<{ user?: User } | User>("/auth/me");
  if ("user" in response && response.user) {
    return response.user;
  }
  return response as User;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUserState] = useState<User | null>(null);
  const isInitialised = useRef(false);

  const setUser = useCallback((next: User | null) => {
    setUserState(next);
  }, []);

  const refreshUser = useCallback(async () => {
    try {
      const token = await ensureAccessToken();
      if (!token) {
        setUserState(null);
        return null;
      }

      const account = await fetchCurrentUser();
      setUserState(account);
      return account;
    } catch (error) {
      clearAccessToken();
      setUserState(null);
      return null;
    }
  }, []);

  useEffect(() => {
    if (isInitialised.current) return;
    isInitialised.current = true;

    refreshUser().catch(() => {
      setUserState(null);
    });
  }, [refreshUser]);

  const logout = useCallback(async () => {
    try {
      await apiClient("/auth/logout", { method: "POST" });
    } catch (error) {
      // Ignore errors during logout to avoid blocking the UI
    } finally {
      clearAccessToken();
      setUserState(null);
    }
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      setUser,
      refreshUser,
      logout,
    }),
    [user, setUser, refreshUser, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
