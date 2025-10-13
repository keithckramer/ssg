import { clearAccessToken, getAccessToken, refreshAccessToken } from "./authClient";

type FetchWithAuthOptions = {
  skipAuth?: boolean;
  onUnauthorized?: () => void;
};

function defaultOnUnauthorized() {
  if (typeof window !== "undefined") {
    window.location.replace("/login");
  }
}

export async function fetchWithAuth(
  input: RequestInfo | URL,
  init: RequestInit = {},
  options: FetchWithAuthOptions = {},
) {
  const { skipAuth = false, onUnauthorized } = options;
  const headers = new Headers(init.headers ?? (input instanceof Request ? input.headers : undefined));

  if (!skipAuth) {
    const token = getAccessToken();
    if (token && !headers.has("Authorization")) {
      headers.set("Authorization", `Bearer ${token}`);
    }
  }

  const requestInit: RequestInit = {
    ...init,
    headers,
  };

  const execute = () => fetch(input, requestInit);
  let response = await execute();

  if (response.status === 401 && !skipAuth) {
    const refreshed = await refreshAccessToken().catch(() => null);

    if (refreshed) {
      headers.set("Authorization", `Bearer ${refreshed}`);
      response = await execute();
    } else {
      clearAccessToken();
      (onUnauthorized ?? defaultOnUnauthorized)();
    }
  }

  return response;
}
