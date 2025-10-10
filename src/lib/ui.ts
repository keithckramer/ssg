export function getInitials(name?: string, email?: string) {
  const source = name?.trim() || email?.split("@")[0] || "";
  if (!source) return "?";

  const parts = source
    .replace(/[_-]+/g, " ")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2);

  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();

  return (parts[0][0] + parts[1][0]).toUpperCase();
}
