import { API_BASE_URL } from "./config";
import { fetchWithAuth } from "./fetchWithAuth";

export type ApiRequestOptions = RequestInit & {
  skipAuth?: boolean;
  onUnauthorized?: () => void;
};

export type ApiErrorPayload = {
  message?: string;
  error?: string;
  errors?: Record<string, string[] | string>;
  [key: string]: unknown;
};

export class ApiError extends Error {
  readonly status: number;
  readonly data?: ApiErrorPayload | null;
  readonly fieldErrors?: Record<string, string[]>;

  constructor(message: string, options: { status: number; data?: ApiErrorPayload | null }) {
    super(message);
    this.name = "ApiError";
    this.status = options.status;
    this.data = options.data;

    const rawErrors = options.data?.errors;
    if (rawErrors && typeof rawErrors === "object") {
      const entries: Record<string, string[]> = {};
      for (const [key, value] of Object.entries(rawErrors)) {
        if (Array.isArray(value)) {
          entries[key] = value.map((item) => String(item));
        } else if (typeof value === "string") {
          entries[key] = [value];
        }
      }
      this.fieldErrors = Object.keys(entries).length > 0 ? entries : undefined;
    }
  }
}

function isJsonResponse(response: Response) {
  const contentType = response.headers.get("content-type") ?? "";
  return contentType.includes("application/json");
}

async function parseResponseBody<T>(response: Response): Promise<T | null> {
  if (response.status === 204) {
    return null;
  }

  if (!isJsonResponse(response)) {
    const text = await response.text();
    return text ? ({ message: text } as unknown as T) : null;
  }

  return (await response.json()) as T;
}

async function handleResponse<T>(response: Response): Promise<T> {
  const data = await parseResponseBody<T | ApiErrorPayload | null>(response);

  if (response.ok) {
    return (data ?? ({} as T)) as T;
  }

  const payload = (data ?? null) as ApiErrorPayload | null;
  let message = payload?.message || payload?.error;

  if (!message && payload?.errors) {
    const entries = Object.values(payload.errors);
    const first = entries[0];
    if (Array.isArray(first)) {
      message = String(first[0]);
    } else if (typeof first === "string") {
      message = first;
    }
  }

  if (!message) {
    message = `Request failed with status ${response.status}`;
  }

  throw new ApiError(message, { status: response.status, data: payload });
}

export async function apiClient<T>(path: string, options: ApiRequestOptions = {}): Promise<T> {
  const { skipAuth, onUnauthorized, headers, ...rest } = options;
  const finalHeaders = new Headers(headers);

  const isFormData = rest.body instanceof FormData;
  if (!isFormData && !finalHeaders.has("Content-Type")) {
    finalHeaders.set("Content-Type", "application/json");
  }

  const requestInit: RequestInit = {
    ...rest,
    headers: finalHeaders,
    credentials: "include",
  };

  const response = await fetchWithAuth(`${API_BASE_URL}${path}`, requestInit, {
    skipAuth,
    onUnauthorized,
  });

  return handleResponse<T>(response);
}
