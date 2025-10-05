export const STORAGE_KEYS = {
  matchups: "ss_matchups",
  activeId: "ss_activeId",
  config: "ss_config_v2",
  orders: "ss_orders_v2",
  results: "ss_results_v2",
  adminPin: "ss_admin_pin_v1",
  adminSession: "ss_admin_session_v1",
  view: "ss_view_v1",
} as const;

export const uid = (): string => Math.random().toString(36).slice(2, 9);

export const save = <T,>(key: string, val: T): void => {
  if (typeof window === "undefined") return;
  localStorage.setItem(key, JSON.stringify(val));
};

export const load = <T,>(key: string, fallback: T): T => {
  if (typeof window === "undefined") return fallback;
  try {
    const value = localStorage.getItem(key);
    return value ? (JSON.parse(value) as T) : fallback;
  } catch {
    return fallback;
  }
};
