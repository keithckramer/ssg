"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import SiteShell, { Card } from "@/components/layout/SiteShell";
import {
  Group,
  Matchup,
  OrdersMap,
  ResultsMap,
  Stick,
  fmtDate,
  possibleWinnings,
  toMoney,
  clampInt,
  useAdminGuard,
  useSportsSticks,
} from "@/components/providers/SportsSticksProvider";

export default function MatchupDetailPage() {
  const params = useParams<{ matchupId: string }>();
  const router = useRouter();
  const matchupId = params.matchupId;
  const {
    matchups,
    orders,
    results,
    config,
    buySticks,
    setScores,
    clearScores,
    isAdmin,
    setLastMatchupId,
  } = useSportsSticks();
  const { ensureAdmin } = useAdminGuard();

  const matchup = useMemo<Matchup | undefined>(() => matchups.find((m) => m.id === matchupId), [matchups, matchupId]);

  useEffect(() => {
    if (matchupId) {
      setLastMatchupId(matchupId);
    }
  }, [matchupId, setLastMatchupId]);

  if (!matchup) {
    const error = new Error("MATCHUP_NOT_FOUND");
    error.name = "MatchupNotFound";
    throw error;
  }

  const groups = useMemo(() => ((orders as OrdersMap)[matchup.id] ?? []), [matchup.id, orders]);
  const totals = useMemo(() => computeTotals(groups), [groups]);
  const resultEntry = (results as ResultsMap)[matchup.id] ?? null;
  const winDigit = resultEntry?.digit ?? null;

  const handleBuy = (buyer: string, qty: number) => {
    buySticks(matchup.id, buyer, qty);
  };

  const handleSetScores = (homeScore: number, awayScore: number) => {
    if (!ensureAdmin()) return;
    setScores(matchup.id, homeScore, awayScore);
  };

  const handleClearScores = () => {
    if (!ensureAdmin()) return;
    clearScores(matchup.id);
  };

  return (
    <SiteShell>
      <div className="mt-6 space-y-4">
        <div className="flex items-center justify-between">
          <button className="btn-ghost" onClick={() => router.push("/")}>← Back to Matchups</button>
          <div className="pill">{matchup.home} vs {matchup.away}</div>
        </div>
        <div className="grid lg:grid-cols-2 gap-6">
          <Card title="Game & Sticks">
            <div className="space-y-4">
              <div className="rounded-xl border p-3 bg-white">
                <div className="font-semibold text-lg">{matchup.home} vs {matchup.away}</div>
                <div className="text-sm opacity-70">Kickoff: {fmtDate(matchup.kickoff)}</div>
              </div>
              <div className="rounded-xl border p-3 bg-white space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-sm">Pot per stick</span>
                  <span className="text-sm font-semibold">${toMoney(config.potPerStick).toFixed(2)}</span>
                </div>
              </div>
              <BuyPanel onBuy={handleBuy} />
              <div className="rounded-xl border p-3 bg-white space-y-2">
                <div className="font-semibold">Final Score → Winning Digit</div>
                {isAdmin ? (
                  <ScoreSetter
                    matchup={matchup}
                    results={results}
                    onSet={handleSetScores}
                    onClear={handleClearScores}
                  />
                ) : (
                  <div className="text-sm opacity-70">Admin required to set scores.</div>
                )}
                <div className="text-sm opacity-70">Winning digit: <b>{winDigit ?? "—"}</b></div>
              </div>
              <div className="rounded-xl border p-3 bg-white">
                <div className="font-semibold mb-2">Totals</div>
                <ul className="text-sm space-y-1">
                  <li>Groups: <b>{totals.groups}</b></li>
                  <li>Total charged: <b>${totals.totalCharged.toFixed(2)}</b></li>
                  <li>Possible winnings: <b>${totals.possibleW.toFixed(2)}</b></li>
                </ul>
              </div>
            </div>
          </Card>
          <Card title="Groups (0–9) & Results">
            <div className="space-y-4">
              {groups.length === 0 ? (
                <div className="text-sm opacity-70">No sticks yet. Sell some!</div>
              ) : (
                groups.map((group, idx) => (
                  <div key={group.id} className="rounded-xl border p-3 bg-white">
                    <div className="flex items-center justify-between mb-2">
                      <div className="font-semibold">Group #{idx + 1}</div>
                      <div className="text-xs opacity-70">{group.sticks.length}/10 filled</div>
                    </div>
                    <GroupGrid sticks={group.sticks} winDigit={winDigit} />
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>
      </div>
    </SiteShell>
  );
}

function BuyPanel({ onBuy }: { onBuy: (buyer: string, quantity: number) => void }) {
  const [buyer, setBuyer] = useState("");
  const [qty, setQty] = useState<number>(1);
  return (
    <div className="rounded-xl border p-3 bg-white">
      <div className="font-semibold mb-2">Sell sticks</div>
      <div className="grid grid-cols-3 gap-2 items-center">
        <input
          className="input col-span-2 text-left"
          placeholder="Buyer name (optional)"
          value={buyer}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setBuyer(e.target.value)}
        />
        <input
          className="input input-sm"
          type="number"
          min={1}
          max={10}
          value={qty}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setQty(clampInt(e.target.value, 1, 10))}
        />
      </div>
      <div className="flex gap-2 mt-2">
        <button className="btn flex-1" onClick={() => onBuy(buyer, qty)}>Buy</button>
        <button className="btn-ghost" onClick={() => { setBuyer(""); setQty(1); }}>Clear</button>
      </div>
    </div>
  );
}

function ScoreSetter({
  matchup,
  results,
  onSet,
  onClear,
}: {
  matchup: Matchup;
  results: ResultsMap;
  onSet: (homeScore: number, awayScore: number) => void;
  onClear: () => void;
}) {
  const entry = results[matchup.id] ?? null;
  const [homeScore, setHomeScore] = useState<string | number>(entry?.homeScore ?? "");
  const [awayScore, setAwayScore] = useState<string | number>(entry?.awayScore ?? "");

  useEffect(() => {
    const latest = results[matchup.id] ?? null;
    setHomeScore(latest?.homeScore ?? "");
    setAwayScore(latest?.awayScore ?? "");
  }, [matchup.id, results]);

  return (
    <div className="grid grid-cols-3 gap-2 items-center">
      <input
        className="input input-sm"
        placeholder={`${matchup.home} score`}
        value={homeScore}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setHomeScore(e.target.value.replace(/[^0-9]/g, ""))}
      />
      <input
        className="input input-sm"
        placeholder={`${matchup.away} score`}
        value={awayScore}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setAwayScore(e.target.value.replace(/[^0-9]/g, ""))}
      />
      <div className="flex gap-2">
        <button className="btn" onClick={() => onSet(Number(homeScore || 0), Number(awayScore || 0))}>Set</button>
        <button className="btn-ghost" onClick={onClear}>Clear</button>
      </div>
    </div>
  );
}

function GroupGrid({ sticks, winDigit }: { sticks: Stick[]; winDigit: number | null }) {
  const slotMap = new Map(sticks.map((s) => [s.number, s] as const));
  const slots = Array.from({ length: 10 }, (_, i) => ({ num: i, s: slotMap.get(i) || null }));
  return (
    <div className="grid grid-cols-5 gap-2">
      {slots.map(({ num, s }) => (
        <div
          key={num}
          className={`slot ${winDigit !== null && num === winDigit ? "win" : ""}`}
          title={s ? `Buyer: ${s.buyer}\nPaid: $${Number(s.price).toFixed(2)}\nAt: ${fmtDate(s.createdAt)}` : ""}
        >
          <div className="text-[11px] opacity-60">#{num}</div>
          <div className="text-sm">{s ? s.buyer : "—"}</div>
        </div>
      ))}
    </div>
  );
}

function computeTotals(groups: Group[]) {
  const sticks = groups.reduce((sum, group) => sum + group.sticks.length, 0);
  const totalCharged = groups.reduce(
    (sum, group) => sum + group.sticks.reduce((inner, stick) => inner + toMoney(stick.price), 0),
    0,
  );
  const possibleW = possibleWinnings(groups.length);
  return {
    sticks,
    groups: groups.length,
    totalCharged,
    possibleW,
  } as const;
}
