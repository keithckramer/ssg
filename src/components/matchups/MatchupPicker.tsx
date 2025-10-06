"use client";

import { Matchup } from "../../lib/types";
import { fmtDate } from "../../lib/game";

type MatchupPickerProps = {
  matchups: Matchup[];
  activeId: string | null;
  onSelect: (id: string) => void;
  onRemove?: (id: string) => void;
};

export function MatchupPicker({ matchups, activeId, onSelect, onRemove }: MatchupPickerProps) {
  return (
    <div className="rounded-xl border p-2 bg-white mb-3 max-h-[240px] overflow-auto"> 
      {matchups.length === 0 ? (
        <div className="text-sm opacity-70 p-2">No matchups yet.</div>
      ) : (
        <ul className="space-y-1">
          {matchups.map((matchup) => (
            <li key={matchup.id} className="flex items-center justify-between gap-2 p-2 rounded-lg hover:bg-slate-50">
              <button
                onClick={() => onSelect(matchup.id)}
                className={`kckStyle text-sm text-left flex-1 ${activeId === matchup.id ? "font-semibold" : ""}`}
                title={matchup.kickoff}
              >
                {matchup.home} vs {matchup.away}
                <span className="block text-[11px] opacity-60">{fmtDate(matchup.kickoff)}</span>
              </button>
              {onRemove ? (
                <button className="kckStyle pill pill-ghost" onClick={() => onRemove(matchup.id)}>Remove</button>
              ) : (
                <span className="text-[11px] opacity-50">Admin only</span>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
