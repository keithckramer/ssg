export type UserRole = "user" | "admin" | (string & {});

export type User = {
  id: string;
  name: string;
  email: string;
  image?: string | null;
  role?: UserRole;
};
