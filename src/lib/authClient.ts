import { API_BASE_URL } from "./config";

type RefreshOptions = {
  signal?: AbortSignal;
};

type AccessTokenListener = (token: string | null) => void;

let accessToken: string | null = null;
let refreshPromise: Promise<string | null> | null = null;
const accessTokenListeners = new Set<AccessTokenListener>();

function notifyAccessTokenChange() {
  for (const listener of accessTokenListeners) {
    listener(accessToken);
  }
}

export function setAccessToken(token: string | null) {
  accessToken = token ?? null;
  notifyAccessTokenChange();
}

export function getAccessToken() {
  return accessToken;
}

export function clearAccessToken() {
  accessToken = null;
  notifyAccessTokenChange();
}

export function subscribeToAccessToken(listener: AccessTokenListener) {
  accessTokenListeners.add(listener);
  return () => {
    accessTokenListeners.delete(listener);
  };
}

export async function ensureAccessToken(options: RefreshOptions = {}) {
  if (accessToken) {
    return accessToken;
  }

  return refreshAccessToken(options);
}

export async function refreshAccessToken(options: RefreshOptions = {}) {
  if (!refreshPromise) {
    refreshPromise = fetch(`${API_BASE_URL}/auth/refresh`, {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      signal: options.signal,
    })
      .then(async (response) => {
        if (!response.ok) {
          clearAccessToken();
          if (response.status === 401 || response.status === 403) {
            return null;
          }
          throw new Error("Failed to refresh access token");
        }

        try {
          const data = await response.json();
          const token = typeof data?.accessToken === "string" ? data.accessToken : null;
          setAccessToken(token);
          return token;
        } catch (error) {
          clearAccessToken();
          throw error;
        }
      })
      .catch((error) => {
        if ((error as Error).name === "AbortError") {
          return null;
        }
        clearAccessToken();
        throw error;
      })
      .finally(() => {
        refreshPromise = null;
      });
  }

  try {
    return await refreshPromise;
  } catch (error) {
    clearAccessToken();
    throw error;
  }
}
