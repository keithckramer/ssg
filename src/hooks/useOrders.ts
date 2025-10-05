import { useCallback, useEffect, useState } from "react";
import { STORAGE_KEYS, load, save, uid } from "../lib/storage";
import { Group, OrdersMap, ResultsMap } from "../lib/types";
import { asMoney, clampInt, countStickTotals } from "../lib/game";

type BuyStickPayload = {
  matchupId: string;
  buyer: string;
  quantity: number;
  pricePerStick: number;
};

type HydratePayload = {
  orders?: OrdersMap;
  results?: ResultsMap;
};

export const useOrders = () => {
  const [orders, setOrders] = useState<OrdersMap>(() => load(STORAGE_KEYS.orders, {}));
  const [results, setResults] = useState<ResultsMap>(() => load(STORAGE_KEYS.results, {}));

  useEffect(() => save(STORAGE_KEYS.orders, orders), [orders]);
  useEffect(() => save(STORAGE_KEYS.results, results), [results]);

  const groupsForMatchup = useCallback(
    (matchupId: string | null): Group[] => {
      if (!matchupId) return [];
      return orders[matchupId] ?? [];
    },
    [orders],
  );

  const totalsForMatchup = useCallback(
    (matchupId: string | null) => {
      const groups = groupsForMatchup(matchupId);
      return countStickTotals(groups);
    },
    [groupsForMatchup],
  );

  const buySticks = useCallback(
    ({ matchupId, buyer, quantity, pricePerStick }: BuyStickPayload) => {
      const normalizedBuyer = buyer.trim() || "Guest";
      const q = clampInt(quantity, 1, 10);
      const price = asMoney(pricePerStick);
      if (!matchupId) return;

      setOrders((prev) => {
        const groups: Group[] = [...(prev[matchupId] ?? [])];
        const nowIso = new Date().toISOString();
        let remaining = q;

        while (remaining > 0) {
          if (groups.length === 0 || groups[groups.length - 1].sticks.length >= 10) {
            groups.push({ id: uid(), sticks: [] });
          }
          const group = groups[groups.length - 1];
          const takenNums = new Set(group.sticks.map((s) => s.number));
          const available = Array.from({ length: 10 }, (_, i) => i).filter((n) => !takenNums.has(n));
          if (available.length === 0) {
            break;
          }
          const toPlace = Math.min(available.length, remaining);
          for (let i = 0; i < toPlace; i += 1) {
            const index = Math.floor(Math.random() * available.length);
            const num = available.splice(index, 1)[0];
            group.sticks.push({
              id: uid(),
              buyer: normalizedBuyer,
              number: num,
              price,
              fee: 0,
              createdAt: nowIso,
            });
            remaining -= 1;
          }
        }

        return { ...prev, [matchupId]: groups } as OrdersMap;
      });
    },
    [],
  );

  const setScores = useCallback((matchupId: string, homeScore: number, awayScore: number) => {
    setResults((prev) => {
      const hs = clampInt(homeScore, 0, Number.MAX_SAFE_INTEGER);
      const as = clampInt(awayScore, 0, Number.MAX_SAFE_INTEGER);
      const digit = (hs + as) % 10;
      return { ...prev, [matchupId]: { homeScore: hs, awayScore: as, digit } } as ResultsMap;
    });
  }, []);

  const clearScores = useCallback((matchupId: string) => {
    setResults((prev) => ({ ...prev, [matchupId]: null }));
  }, []);

  const clearMatchupData = useCallback((matchupId: string) => {
    setOrders((prev) => {
      if (!prev[matchupId]) return prev;
      const next = { ...prev };
      delete next[matchupId];
      return next;
    });
    setResults((prev) => {
      if (!(matchupId in prev)) return prev;
      const next = { ...prev } as ResultsMap;
      delete next[matchupId];
      return next;
    });
  }, []);

  const hydrate = useCallback(({ orders: nextOrders, results: nextResults }: HydratePayload) => {
    if (nextOrders) {
      setOrders(nextOrders);
    }
    if (nextResults) {
      setResults(nextResults);
    }
  }, []);

  const reset = useCallback(() => {
    setOrders({});
    setResults({});
  }, []);

  const winDigitForMatchup = useCallback(
    (matchupId: string | null) => {
      if (!matchupId) return null;
      return results[matchupId]?.digit ?? null;
    },
    [results],
  );

  return {
    orders,
    results,
    groupsForMatchup,
    totalsForMatchup,
    buySticks,
    setScores,
    clearScores,
    clearMatchupData,
    hydrate,
    reset,
    winDigitForMatchup,
  } as const;
};
