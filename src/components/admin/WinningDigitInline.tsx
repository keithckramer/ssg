"use client";

import { useEffect, useMemo, useState } from "react";

import { useAdminGuard, useSportsSticks } from "@/components/providers/SportsSticksProvider";

type WinningDigitInlineProps = {
  matchupId: string;
  homeTeam: string;
  awayTeam: string;
  homeScore?: number | null;
  awayScore?: number | null;
  winningDigit?: number | null;
};

export function WinningDigitInline({
  matchupId,
  homeTeam,
  awayTeam,
  homeScore,
  awayScore,
  winningDigit,
}: WinningDigitInlineProps) {
  const { setScores, clearScores, isAdmin } = useSportsSticks();
  const { ensureAdmin } = useAdminGuard("Admin access required to update scores.");

  const [homeInput, setHomeInput] = useState<string>(homeScore != null ? String(homeScore) : "");
  const [awayInput, setAwayInput] = useState<string>(awayScore != null ? String(awayScore) : "");
  const [feedback, setFeedback] = useState<string | null>(null);

  useEffect(() => {
    setHomeInput(homeScore != null ? String(homeScore) : "");
  }, [homeScore]);

  useEffect(() => {
    setAwayInput(awayScore != null ? String(awayScore) : "");
  }, [awayScore]);

  useEffect(() => {
    if (!feedback) return;
    const timeout = window.setTimeout(() => setFeedback(null), 2400);
    return () => window.clearTimeout(timeout);
  }, [feedback]);

  const computedDigit = useMemo(() => {
    const homeVal = Number.parseInt(homeInput || "0", 10) || 0;
    const awayVal = Number.parseInt(awayInput || "0", 10) || 0;
    return ((homeVal + awayVal) % 10 + 10) % 10;
  }, [homeInput, awayInput]);

  const handleSet = () => {
    if (!ensureAdmin()) return;
    const homeVal = Number.parseInt(homeInput || "0", 10) || 0;
    const awayVal = Number.parseInt(awayInput || "0", 10) || 0;
    setScores(matchupId, homeVal, awayVal);
    setFeedback(`Winning digit ${((homeVal + awayVal) % 10 + 10) % 10} saved`);
  };

  const handleClear = () => {
    if (!ensureAdmin()) return;
    clearScores(matchupId);
    setHomeInput("");
    setAwayInput("");
    setFeedback("Final score cleared");
  };

  const displayDigit = winningDigit ?? null;

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <input
            type="number"
            min={0}
            inputMode="numeric"
            pattern="[0-9]*"
            className="ssg-input w-20 text-center"
            placeholder="0"
            value={homeInput}
            onChange={(event) => setHomeInput(event.target.value.replace(/[^0-9]/g, ""))}
            aria-label={`${homeTeam} final score`}
          />
          <span className="text-sm font-semibold text-slate-500">–</span>
          <input
            type="number"
            min={0}
            inputMode="numeric"
            pattern="[0-9]*"
            className="ssg-input w-20 text-center"
            placeholder="0"
            value={awayInput}
            onChange={(event) => setAwayInput(event.target.value.replace(/[^0-9]/g, ""))}
            aria-label={`${awayTeam} final score`}
          />
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="ssg-btn-dark ssg-btn-sm"
            onClick={handleSet}
            disabled={!isAdmin}
          >
            Set
          </button>
          <button
            type="button"
            className="ssg-btn ssg-btn-sm"
            onClick={handleClear}
            disabled={!isAdmin}
          >
            Clear
          </button>
        </div>
        <div className="text-sm text-slate-600">
          Winning digit: <span className="font-semibold text-slate-900">{displayDigit ?? "—"}</span>
        </div>
      </div>
      {!isAdmin ? (
        <p className="text-xs text-slate-500">Unlock admin access to update the final score.</p>
      ) : (
        <p className="text-xs text-slate-500">Preview digit: {computedDigit}</p>
      )}
      {feedback ? <p className="text-xs font-medium text-slate-500">{feedback}</p> : null}
    </div>
  );
}

export default WinningDigitInline;
