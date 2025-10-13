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
import { useRouter } from "next/navigation";

import { apiClient } from "@/lib/apiClient";
import {
  clearAccessToken,
  ensureAccessToken,
  getAccessToken,
  setAccessToken,
  subscribeToAccessToken,
} from "@/lib/authClient";
import { feature } from "@/lib/features";
import type { User } from "@/types/user";

type LoginParams = {
  accessToken?: string | null;
  user?: User | null;
};

type LogoutOptions = {
  redirectToLogin?: boolean;
};

export type AuthContextValue = {
  accessToken: string | null;
  user: User | null;
  setUser: (user: User | null) => void;
  login: (params?: LoginParams) => Promise<User | null>;
  refreshUser: () => Promise<User | null>;
  logout: (options?: LogoutOptions) => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

async function fetchCurrentUser() {
  const response = await apiClient<{ user?: User } | User>("/auth/me");
  if ("user" in response && response.user) {
    return response.user;
  }
  return response as User;
}

function navigateToLogin(router: ReturnType<typeof useRouter>) {
  if (typeof window === "undefined") return;
  if (window.location.pathname === "/login") return;
  router.replace("/login");
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [accessToken, setAccessTokenState] = useState<string | null>(() => getAccessToken());
  const [user, setUserState] = useState<User | null>(null);
  const isInitialised = useRef(false);
  const isAuthEnabled = feature.auth;

  const setUser = useCallback((next: User | null) => {
    setUserState(next);
  }, []);

  useEffect(() => {
    if (!isAuthEnabled) {
      setAccessTokenState(null);
      setUserState(null);
      return;
    }

    const unsubscribe = subscribeToAccessToken((token) => {
      setAccessTokenState(token ?? null);
    });

    return unsubscribe;
  }, [isAuthEnabled]);

  useEffect(() => {
    if (!isAuthEnabled) return;
    if (!accessToken) {
      setUserState(null);
    }
  }, [accessToken, isAuthEnabled]);

  const refreshUser = useCallback(async () => {
    if (!isAuthEnabled) {
      setUserState(null);
      return null;
    }

    try {
      const token = await ensureAccessToken();
      if (!token) {
        clearAccessToken();
        setUserState(null);
        navigateToLogin(router);
        return null;
      }

      setAccessTokenState(token);
      const account = await fetchCurrentUser();
      setUserState(account);
      return account;
    } catch {
      clearAccessToken();
      setUserState(null);
      navigateToLogin(router);
      return null;
    }
  }, [isAuthEnabled, router]);

  useEffect(() => {
    if (isInitialised.current) return;
    isInitialised.current = true;

    if (!isAuthEnabled) return;

    refreshUser().catch(() => {
      setUserState(null);
    });
  }, [isAuthEnabled, refreshUser]);

  const login = useCallback(
    async (params: LoginParams = {}) => {
      const { accessToken: nextToken, user: nextUser } = params;

      if (!isAuthEnabled) {
        if (nextUser) {
          setUserState(nextUser);
          return nextUser;
        }
        return null;
      }

      if (typeof nextToken !== "undefined") {
        setAccessToken(nextToken);
      }

      if (nextUser) {
        setUserState(nextUser);
        return nextUser;
      }

      return refreshUser();
    },
    [isAuthEnabled, refreshUser],
  );

  const logout = useCallback(async () => {
    try {
      if (isAuthEnabled) {
        await apiClient("/auth/logout", { method: "POST" });
      }
    } catch {
      // Ignore errors during logout to avoid blocking the UI
    } finally {
      clearAccessToken();
      setUserState(null);
    }
  }, [isAuthEnabled]);

  const handleLogout = useCallback(
    async (options: LogoutOptions = {}) => {
      const { redirectToLogin = false } = options;
      await logout();
      if (redirectToLogin) {
        navigateToLogin(router);
      }
    },
    [logout, router],
  );

  const value = useMemo<AuthContextValue>(
    () => ({
      accessToken,
      user,
      setUser,
      login,
      refreshUser,
      logout: handleLogout,
    }),
    [accessToken, user, setUser, login, refreshUser, handleLogout],
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
