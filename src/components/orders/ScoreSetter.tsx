"use client";

import { useEffect, useState } from "react";
import { Matchup, ResultsEntry } from "../../lib/types";

type ScoreSetterProps = {
  matchup: Matchup;
  result: ResultsEntry;
  onSet: (homeScore: number, awayScore: number) => void;
  onClear: () => void;
};

export function ScoreSetter({ matchup, result, onSet, onClear }: ScoreSetterProps) {
  const [homeScore, setHomeScore] = useState<string | number>(result?.homeScore ?? "");
  const [awayScore, setAwayScore] = useState<string | number>(result?.awayScore ?? "");

  useEffect(() => {
    setHomeScore(result?.homeScore ?? "");
    setAwayScore(result?.awayScore ?? "");
  }, [result?.homeScore, result?.awayScore]);

  return (
    <div className="grid grid-cols-3 gap-2 items-center">
      <input
        className="input input-sm"
        placeholder={`${matchup.home} score`}
        value={homeScore}
        onChange={(e) => setHomeScore(e.target.value.replace(/[^0-9]/g, ""))}
      />
      <input
        className="input input-sm"
        placeholder={`${matchup.away} score`}
        value={awayScore}
        onChange={(e) => setAwayScore(e.target.value.replace(/[^0-9]/g, ""))}
      />
      <div className="flex gap-2">
        <button className="btn" onClick={() => onSet(Number(homeScore || 0), Number(awayScore || 0))}>Set</button>
        <button className="btn-ghost" onClick={onClear}>Clear</button>
      </div>
    </div>
  );
}
