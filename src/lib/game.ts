export function fmtDate(iso: string): string {
  if (!iso) return "";
  try {
    const d = new Date(iso);
    const opts: Intl.DateTimeFormatOptions = {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    };
    return d.toLocaleString(undefined, opts);
  } catch {
    return iso;
  }
}

export function toNumber(v: unknown): number {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

export function possibleWinnings(groups: number): number {
  return Math.max(0, Math.floor(Number(groups) || 0)) * 100;
}

export function toMoney(v: unknown): number {
  const n = Number(v);
  if (!Number.isFinite(n) || n < 0) return 0;
  return Math.round(n * 100) / 100;
}

export function asMoney(n: unknown): number {
  return Math.round(Number(n || 0) * 100) / 100;
}

export function clampInt(v: number | string, min: number, max: number): number {
  const n = Math.floor(Number(v));
  if (!Number.isFinite(n)) return min;
  return Math.max(min, Math.min(max, n));
}

export function calcTotalsForTest({
  groups,
  sticks,
  pot,
  prices,
}: {
  groups: number;
  sticks?: number;
  pot?: number;
  prices?: number[];
}) {
  const totalCharged = Array.isArray(prices)
    ? prices.reduce((a, b) => a + (Number(b) || 0), 0)
    : (Number(sticks) || 0) * (Number(pot) || 0);
  const possibleW = possibleWinnings(Number(groups) || 0);
  return { groups: Number(groups) || 0, totalCharged, possibleW } as const;
}
