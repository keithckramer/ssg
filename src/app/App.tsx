"use client";

import { useCallback } from "react";
import SiteShell, { Card } from "@/components/layout/SiteShell";
import { AddMatchup } from "@/components/matchups/AddMatchup";
import { MatchupPicker } from "@/components/matchups/MatchupPicker";
import {
  SportsSticksProvider,
  useAdminGuard,
  useSportsSticks,
} from "@/components/providers/SportsSticksProvider";

function AppContent() {
  const { matchups, addMatchup, removeMatchup, lastMatchupId, setLastMatchupId, isAdmin } = useSportsSticks();
  const { ensureAdmin } = useAdminGuard();

  const handleSelect = useCallback((id: string) => {
    setLastMatchupId(id);
  }, [setLastMatchupId]);

  const handleRemove = useCallback((id: string) => {
    if (!ensureAdmin()) return;
    removeMatchup(id);
  }, [ensureAdmin, removeMatchup]);

  const handleAdd = useCallback((home: string, away: string, kickoff: string) => {
    if (!ensureAdmin()) return;
    const id = addMatchup(home, away, kickoff);
    setLastMatchupId(id);
  }, [addMatchup, ensureAdmin, setLastMatchupId]);

  return (
    <SiteShell>
      <div className="grid lg:grid-cols-3 gap-6 mt-6">
        <Card title="Matchups">
          <MatchupPicker
            matchups={matchups}
            activeId={lastMatchupId}
            onSelect={handleSelect}
            onRemove={isAdmin ? handleRemove : undefined}
          />
          {isAdmin ? (
            <AddMatchup onAdd={handleAdd} />
          ) : (
            <div className="rounded-xl border p-3 bg-white text-sm opacity-70">
              Admin required to add a matchup.
            </div>
          )}
          {lastMatchupId ? (
            <div className="mt-3 rounded-xl border p-3 bg-white text-sm flex flex-col gap-2">
              <span className="opacity-70">Selected matchup actions</span>
              <a className="btn" href={`/game/${lastMatchupId}`}>
                Open game view
              </a>
            </div>
          ) : null}
        </Card>
      </div>
    </SiteShell>
  );
}

export default function App() {
  return (
    <SportsSticksProvider>
      <AppContent />
    </SportsSticksProvider>
  );
}

export { AppContent };
