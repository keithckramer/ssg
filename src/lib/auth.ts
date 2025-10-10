export type User = {
  id: string;
  name: string;
  email: string;
  image?: string;
  role?: "user" | "admin";
};

export const USER_STORAGE_KEY = "ssg:auth:user";

function isBrowser() {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

export function getStoredUser(): User | null {
  if (!isBrowser()) return null;
  const raw = window.localStorage.getItem(USER_STORAGE_KEY);
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as User;
    if (parsed && typeof parsed.email === "string") {
      return parsed;
    }
  } catch (error) {
    console.warn("Failed to parse stored user", error);
  }

  window.localStorage.removeItem(USER_STORAGE_KEY);
  return null;
}

function createMockUser(email: string, name?: string): User {
  const normalizedEmail = email.trim().toLowerCase();
  const displayName = name?.trim() || email.split("@")[0] || "Player";
  const role: User["role"] = normalizedEmail.includes("admin") ? "admin" : "user";

  const id = typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `user-${Date.now()}`;

  return {
    id,
    name: displayName.replace(/(^|\s)\S/g, (match) => match.toUpperCase()),
    email: normalizedEmail,
    role,
  };
}

export function loginMock(email: string, name?: string) {
  if (!email.trim()) {
    throw new Error("Email is required");
  }

  const user = createMockUser(email, name);

  if (isBrowser()) {
    window.localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
  }

  return user;
}

export function logout() {
  if (!isBrowser()) return;
  window.localStorage.removeItem(USER_STORAGE_KEY);
}
