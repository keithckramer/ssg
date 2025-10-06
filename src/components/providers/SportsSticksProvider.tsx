"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

export type Matchup = { id: string; home: string; away: string; kickoff: string };
export type Stick = { id: string; buyer: string; number: number; price: number; fee: number; createdAt: string };
export type Group = { id: string; sticks: Stick[] };
export type OrdersMap = Record<string, Group[]>;
export type ResultsEntry = { homeScore: number; awayScore: number; digit: number } | null;
export type ResultsMap = Record<string, ResultsEntry>;
export type Config = { potPerStick: number };

type PersistedData = Partial<{
  matchups: Matchup[];
  lastMatchupId: string | null;
  config: Config;
  orders: OrdersMap;
  results: ResultsMap;
}>;

type PersistedPayload = PersistedData & {
  version?: number;
  exportedAt?: string;
  data?: PersistedData;
};

const uid = (): string => Math.random().toString(36).slice(2, 9);

const save = <T,>(key: string, val: T): void => {
  if (typeof window === "undefined") return;
  localStorage.setItem(key, JSON.stringify(val));
};

const load = <T,>(key: string, fallback: T): T => {
  if (typeof window === "undefined") return fallback;
  try {
    const v = localStorage.getItem(key);
    return v ? (JSON.parse(v) as T) : fallback;
  } catch {
    return fallback;
  }
};

const STORAGE_KEYS = {
  matchups: "ss_matchups",
  lastMatchupId: "ss_activeId",
  config: "ss_config_v2",
  orders: "ss_orders_v2",
  results: "ss_results_v2",
  adminPin: "ss_admin_pin_v1",
  adminSession: "ss_admin_session_v1",
} as const;

const SAMPLE_MATCHUPS: Matchup[] = [
  { id: uid(), home: "Bengals", away: "Steelers", kickoff: "2025-09-07T13:00:00" },
  { id: uid(), home: "Chiefs", away: "Ravens", kickoff: "2025-09-07T16:25:00" },
  { id: uid(), home: "49ers", away: "Cowboys", kickoff: "2025-09-08T20:20:00" },
];

const defaultConfig: Config = {
  potPerStick: 10,
};

type BuyStickOptions = {
  separateBoards?: boolean;
};

type SportsSticksContextValue = {
  matchups: Matchup[];
  config: Config;
  orders: OrdersMap;
  results: ResultsMap;
  adminPin: string | null;
  isAdmin: boolean;
  lastMatchupId: string | null;
  setLastMatchupId: (id: string | null) => void;
  addMatchup: (home: string, away: string, kickoff: string) => string;
  removeMatchup: (id: string) => void;
  buySticks: (matchupId: string, buyer: string, quantity: number, options?: BuyStickOptions) => void;
  setScores: (matchupId: string, homeScore: number, awayScore: number) => void;
  clearScores: (matchupId: string) => void;
  exportJson: () => void;
  importJson: (file?: File) => Promise<void>;
  resetAll: () => void;
  setConfig: React.Dispatch<React.SetStateAction<Config>>;
  setAdminPinState: React.Dispatch<React.SetStateAction<string | null>>;
  setIsAdmin: React.Dispatch<React.SetStateAction<boolean>>;
  handleSetPin: (pin: string) => void;
  handleLogin: (pin: string) => void;
  handleLogout: () => void;
  handleClearPin: () => void;
};

const SportsSticksContext = createContext<SportsSticksContextValue | undefined>(undefined);

export function SportsSticksProvider({ children }: { children: React.ReactNode }) {
  const [matchups, setMatchups] = useState<Matchup[]>(() => load(STORAGE_KEYS.matchups, SAMPLE_MATCHUPS));
  const [lastMatchupId, setLastMatchupId] = useState<string | null>(() => load(STORAGE_KEYS.lastMatchupId, null));
  const [config, setConfig] = useState<Config>(() => load(STORAGE_KEYS.config, defaultConfig));
  const [orders, setOrders] = useState<OrdersMap>(() => load(STORAGE_KEYS.orders, {}));
  const [results, setResults] = useState<ResultsMap>(() => load(STORAGE_KEYS.results, {}));
  const [adminPin, setAdminPinState] = useState<string | null>(() => load(STORAGE_KEYS.adminPin, null));
  const [isAdmin, setIsAdmin] = useState<boolean>(() => !!load(STORAGE_KEYS.adminSession, false));

  useEffect(() => save(STORAGE_KEYS.matchups, matchups), [matchups]);
  useEffect(() => save(STORAGE_KEYS.lastMatchupId, lastMatchupId), [lastMatchupId]);
  useEffect(() => save(STORAGE_KEYS.config, config), [config]);
  useEffect(() => save(STORAGE_KEYS.orders, orders), [orders]);
  useEffect(() => save(STORAGE_KEYS.results, results), [results]);
  useEffect(() => save(STORAGE_KEYS.adminPin, adminPin), [adminPin]);
  useEffect(() => save(STORAGE_KEYS.adminSession, isAdmin), [isAdmin]);

  useEffect(() => {
    try {
      console.assert(clampInt("5", 1, 10) === 5, "clampInt basic");
      console.assert(clampInt(99, 1, 10) === 10, "clampInt upper bound");
      console.assert(clampInt(-3, 0, 5) === 0, "clampInt lower bound");
      console.assert(toMoney("1.239") === 1.24 && toMoney(-5) === 0, "toMoney rounding + non-negative");
      console.assert(possibleWinnings(0) === 0 && possibleWinnings(3) === 300, "possibleWinnings basic");
      const t = calcTotalsForTest({ groups: 3, sticks: 27, pot: 10 });
      console.assert(t.groups === 3 && t.totalCharged === 270 && t.possibleW === 300, "calcTotalsForTest sanity");
      const t2 = calcTotalsForTest({ groups: 1, prices: [10, 10] });
      console.assert(t2.groups === 1 && t2.totalCharged === 20 && t2.possibleW === 100, "calcTotalsForTest prices array (2×$10)");
      const t3 = calcTotalsForTest({ groups: 2, prices: [10, 12] });
      console.assert(t3.groups === 2 && t3.totalCharged === 22 && t3.possibleW === 200, "calcTotalsForTest prices array (mixed)");
      const t4 = calcTotalsForTest({ groups: 0, prices: [] });
      console.assert(t4.groups === 0 && t4.totalCharged === 0 && t4.possibleW === 0, "calcTotalsForTest empty");
      const d = fmtDate("2025-01-01T00:00:00Z");
      console.assert(typeof d === "string" && d.length > 0, "fmtDate returns string");
    } catch {
      // no-op in production
    }
  }, []);

  useEffect(() => {
    if (!matchups.length) return;
    setLastMatchupId((current) => {
      if (current && matchups.some((m) => m.id === current)) return current;
      return matchups[0]?.id ?? null;
    });
  }, [matchups]);

  const addMatchup = useCallback((home: string, away: string, kickoff: string) => {
    const m: Matchup = { id: uid(), home, away, kickoff };
    setMatchups((v) => [m, ...v]);
    setLastMatchupId(m.id);
    return m.id;
  }, []);

  const removeMatchup = useCallback((id: string) => {
    setMatchups((prev) => prev.filter((m) => m.id !== id));
    setOrders((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
    setResults((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
    setLastMatchupId((current) => (current === id ? null : current));
  }, []);

  const buySticks = useCallback((matchupId: string, buyerName: string, quantity: number, options?: BuyStickOptions) => {
    setOrders((prev) => {
      const groups: Group[] = [...(prev[matchupId] ?? [])];
      const nowIso = new Date().toISOString();
      const q = clampInt(quantity, 1, 10);
      const buyer = (buyerName && buyerName.trim()) || "Guest";
      const separateBoards = !!options?.separateBoards;
      const usedGroups = new Set<string>();
      let remaining = q;
      while (remaining > 0) {
        const insertIntoGroup = (group: Group) => {
          const takenNums = new Set(group.sticks.map((s) => s.number));
          const available = Array.from({ length: 10 }, (_, i) => i).filter((n) => !takenNums.has(n));
          if (!available.length) {
            return false;
          }
          const index = Math.floor(Math.random() * available.length);
          const num = available.splice(index, 1)[0];
          group.sticks.push({
            id: uid(),
            buyer,
            number: num,
            price: asMoney(config.potPerStick),
            fee: 0,
            createdAt: nowIso,
          });
          return true;
        };

        const findOrCreateGroup = () => {
          if (separateBoards) {
            const existing = groups.find((g) => g.sticks.length < 10 && !usedGroups.has(g.id));
            if (existing) {
              usedGroups.add(existing.id);
              return existing;
            }
            const created = { id: uid(), sticks: [] } as Group;
            groups.push(created);
            usedGroups.add(created.id);
            return created;
          }

          let last = groups[groups.length - 1];
          if (!last || last.sticks.length >= 10) {
            last = { id: uid(), sticks: [] } as Group;
            groups.push(last);
          }
          return last;
        };

        const target = findOrCreateGroup();
        const placed = insertIntoGroup(target);

        if (!placed) {
          if (separateBoards) {
            usedGroups.add(target.id);
            continue;
          }

          const fallback = groups.find((g) => g.sticks.length < 10);
          if (!fallback || !insertIntoGroup(fallback)) {
            break;
          }
        } else {
          remaining -= 1;
        }
      }
      return { ...prev, [matchupId]: groups } as OrdersMap;
    });
  }, [config.potPerStick]);

  const setScores = useCallback((matchupId: string, homeScore: number, awayScore: number) => {
    const hs = clampInt(homeScore, 0, Number.MAX_SAFE_INTEGER);
    const as = clampInt(awayScore, 0, Number.MAX_SAFE_INTEGER);
    const digit = (hs + as) % 10;
    setResults((prev) => ({ ...prev, [matchupId]: { homeScore: hs, awayScore: as, digit } }));
  }, []);

  const clearScores = useCallback((matchupId: string) => {
    setResults((prev) => ({ ...prev, [matchupId]: null }));
  }, []);

  const exportJson = useCallback(() => {
    const payload = {
      version: 1,
      exportedAt: new Date().toISOString(),
      data: {
        matchups,
        lastMatchupId,
        config,
        orders,
        results,
        adminPin: !!adminPin,
      },
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `sports-sticks-backup-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [adminPin, config, lastMatchupId, matchups, orders, results]);

  const importJson = useCallback(async (file?: File) => {
    if (!file) return;
    try {
      const text = await file.text();
      const parsed = JSON.parse(text) as PersistedPayload;
      const data = parsed?.data ?? parsed;
      if (!data || typeof data !== "object") throw new Error("Invalid file");
      const snapshot = data as PersistedData;
      setMatchups(Array.isArray(snapshot.matchups) ? snapshot.matchups : []);
      setLastMatchupId(snapshot.lastMatchupId ?? null);
      setConfig(snapshot.config ?? defaultConfig);
      setOrders(snapshot.orders ?? {});
      setResults(snapshot.results ?? {});
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      alert("Import failed: " + message);
    }
  }, []);

  const resetAll = useCallback(() => {
    if (!confirm("Reset ALL local game data? This cannot be undone.")) return;
    for (const k of Object.values(STORAGE_KEYS)) localStorage.removeItem(k);
    setMatchups(SAMPLE_MATCHUPS);
    setLastMatchupId(SAMPLE_MATCHUPS[0]?.id ?? null);
    setConfig(defaultConfig);
    setOrders({});
    setResults({});
    setAdminPinState(null);
    setIsAdmin(false);
  }, []);

  const handleSetPin = useCallback((pin: string) => {
    if (!pin || pin.length < 4) {
      alert("Choose a 4+ digit PIN.");
      return;
    }
    setAdminPinState(String(pin));
    setIsAdmin(true);
  }, []);

  const handleLogin = useCallback((pin: string) => {
    if (String(pin) === String(adminPin)) {
      setIsAdmin(true);
    } else {
      alert("Wrong PIN");
    }
  }, [adminPin]);

  const handleLogout = useCallback(() => setIsAdmin(false), []);

  const handleClearPin = useCallback(() => {
    if (!confirm("Remove the Admin PIN?")) return;
    setAdminPinState(null);
    setIsAdmin(false);
  }, []);

  const value = useMemo<SportsSticksContextValue>(() => ({
    matchups,
    config,
    orders,
    results,
    adminPin,
    isAdmin,
    lastMatchupId,
    setLastMatchupId,
    addMatchup,
    removeMatchup,
    buySticks,
    setScores,
    clearScores,
    exportJson,
    importJson,
    resetAll,
    setConfig,
    setAdminPinState,
    setIsAdmin,
    handleSetPin,
    handleLogin,
    handleLogout,
    handleClearPin,
  }), [
    addMatchup,
    adminPin,
    buySticks,
    clearScores,
    config,
    exportJson,
    handleClearPin,
    handleLogin,
    handleLogout,
    handleSetPin,
    importJson,
    isAdmin,
    lastMatchupId,
    matchups,
    orders,
    removeMatchup,
    resetAll,
    results,
    setScores,
  ]);

  return (
    <SportsSticksContext.Provider value={value}>{children}</SportsSticksContext.Provider>
  );
}

export function useSportsSticks() {
  const ctx = useContext(SportsSticksContext);
  if (!ctx) throw new Error("useSportsSticks must be used within SportsSticksProvider");
  return ctx;
}

export function useAdminGuard(message = "Admins only.") {
  const { isAdmin } = useSportsSticks();
  const ensureAdmin = useCallback(() => {
    if (!isAdmin) {
      alert(message);
      return false;
    }
    return true;
  }, [isAdmin, message]);

  const withAdmin = useCallback(<Args extends unknown[], R>(fn: (...args: Args) => R) => {
    return (...args: Args): R | undefined => {
      if (!ensureAdmin()) return undefined;
      return fn(...args);
    };
  }, [ensureAdmin]);

  return { ensureAdmin, withAdmin, isAdmin };
}

export function fmtDate(iso: string): string {
  if (!iso) return "";
  try {
    const d = new Date(iso);
    const opts: Intl.DateTimeFormatOptions = { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" };
    return d.toLocaleString(undefined, opts);
  } catch {
    return iso;
  }
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

export function calcTotalsForTest({ groups, sticks, pot, prices }: {
  groups: number;
  sticks?: number;
  pot?: number;
  prices?: number[];
}) {
  const totalCharged = Array.isArray(prices)
    ? prices.reduce((a, b) => a + (Number(b) || 0), 0)
    : ((Number(sticks) || 0) * (Number(pot) || 0));
  const possibleW = possibleWinnings(Number(groups) || 0);
  return { groups: Number(groups) || 0, totalCharged, possibleW } as const;
}
