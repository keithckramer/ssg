import { useCallback, useEffect, useMemo, useState } from "react";
import { STORAGE_KEYS, load, save, uid } from "../lib/storage";
import { Matchup } from "../lib/types";

export type ViewMode = "home" | "game";

type AddMatchupPayload = {
  home: string;
  away: string;
  kickoff: string;
};

const createSampleMatchups = (): Matchup[] => [
  { id: uid(), home: "Bengals", away: "Steelers", kickoff: "2025-09-07T13:00:00" },
  { id: uid(), home: "Chiefs", away: "Ravens", kickoff: "2025-09-07T16:25:00" },
  { id: uid(), home: "49ers", away: "Cowboys", kickoff: "2025-09-08T20:20:00" },
];

const SAMPLE_MATCHUPS = createSampleMatchups();

type HydratePayload = {
  matchups?: Matchup[];
  activeId?: string | null;
  view?: ViewMode;
};

export const useMatchups = () => {
  const [matchups, setMatchups] = useState<Matchup[]>(() => load(STORAGE_KEYS.matchups, SAMPLE_MATCHUPS));
  const [activeId, setActiveIdState] = useState<string | null>(() => load(STORAGE_KEYS.activeId, matchups[0]?.id ?? null));
  const [view, setViewState] = useState<ViewMode>(() => load(STORAGE_KEYS.view, "home"));

  useEffect(() => save(STORAGE_KEYS.matchups, matchups), [matchups]);
  useEffect(() => save(STORAGE_KEYS.activeId, activeId), [activeId]);
  useEffect(() => save(STORAGE_KEYS.view, view), [view]);

  const activeMatchup = useMemo<Matchup | null>(() => matchups.find((m) => m.id === activeId) ?? null, [matchups, activeId]);

  const setActiveId = useCallback((id: string | null) => {
    setActiveIdState(id);
  }, []);

  const setView = useCallback((next: ViewMode) => {
    setViewState(next);
  }, []);

  const addMatchup = useCallback(({ home, away, kickoff }: AddMatchupPayload) => {
    const matchup: Matchup = { id: uid(), home, away, kickoff };
    setMatchups((prev) => [matchup, ...prev]);
    setActiveIdState(matchup.id);
    setViewState("game");
    return matchup;
  }, []);

  const removeMatchup = useCallback((id: string) => {
    setMatchups((prev) => {
      const next = prev.filter((m) => m.id !== id);
      setActiveIdState((current) => {
        if (current === id) {
          return next[0]?.id ?? null;
        }
        return current;
      });
      setViewState((current) => {
        if (current === "game" && (activeId === id || !next.find((m) => m.id === activeId))) {
          return "home";
        }
        return current;
      });
      return next;
    });
  }, [activeId]);

  const hydrate = useCallback(({ matchups: nextMatchups, activeId: nextActiveId, view: nextView }: HydratePayload) => {
    if (nextMatchups) {
      setMatchups(nextMatchups);
    }
    if (typeof nextActiveId !== "undefined") {
      setActiveIdState(nextActiveId);
    }
    if (nextView) {
      setViewState(nextView);
    }
  }, []);

  const reset = useCallback(() => {
    const samples = createSampleMatchups();
    setMatchups(samples);
    setActiveIdState(samples[0]?.id ?? null);
    setViewState("home");
  }, []);

  return {
    matchups,
    activeId,
    view,
    activeMatchup,
    setActiveId,
    setView,
    addMatchup,
    removeMatchup,
    hydrate,
    reset,
  } as const;
};

export { SAMPLE_MATCHUPS };
