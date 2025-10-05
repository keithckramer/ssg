import "@testing-library/jest-dom";
import { afterEach, beforeEach, vi } from "vitest";
import { cleanup } from "@testing-library/react";

const createMemoryStorage = (): Storage => {
  const store = new Map<string, string>();
  return {
    get length() {
      return store.size;
    },
    clear: () => store.clear(),
    getItem: (key: string) => (store.has(key) ? store.get(key)! : null),
    key: (index: number) => Array.from(store.keys())[index] ?? null,
    removeItem: (key: string) => {
      store.delete(key);
    },
    setItem: (key: string, value: string) => {
      store.set(key, String(value));
    },
  } satisfies Storage;
};

beforeEach(() => {
  const storage = createMemoryStorage();
  Object.defineProperty(window, "localStorage", {
    configurable: true,
    value: storage,
  });

  window.alert = vi.fn();
  window.confirm = vi.fn(() => true);
});

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});
