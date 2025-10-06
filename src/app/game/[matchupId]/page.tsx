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
  const [isBuyOpen, setIsBuyOpen] = useState(false);
  const pricePerStick = toMoney(config.potPerStick);
  const resultEntry = (results as ResultsMap)[matchup.id] ?? null;
  const winDigit = resultEntry?.digit ?? null;

  const handleBuy = (buyer: string, qty: number, separateBoards: boolean) => {
    buySticks(matchup.id, buyer, qty, { separateBoards });
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
      <BuyFlowModal
        open={isBuyOpen}
        onClose={() => setIsBuyOpen(false)}
        matchup={matchup}
        pricePerStick={pricePerStick}
        totals={totals}
        onBuy={(buyerName, quantity, separateBoards) => {
          handleBuy(buyerName, quantity, separateBoards);
        }}
      />
      <div className="mt-6 space-y-4">
        <div className="flex items-center justify-between">
          <button className="btn-ghost" onClick={() => router.push("/")}>← Back to Matchups</button>
          <div className="pill">{matchup.home} vs {matchup.away}</div>
        </div>
        <div className="grid lg:grid-cols-2 gap-6">
          <Card title="Game & Sticks">
            <div className="space-y-4">
              <div className="rounded-xl border p-3 bg-white">
                <div className="flex md:flex-row md:items-center md:justify-between gap-3">
                  <div>
                    <div className="font-semibold text-lg">{matchup.home} vs {matchup.away}</div>
                    <div className="text-sm opacity-70">Kickoff: {fmtDate(matchup.kickoff)}</div>
                  </div>
                  <button style={{width:"130px"}} className="btn" onClick={() => setIsBuyOpen(true)}>Buy sticks</button>
                </div>
              </div>
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

type BuyFlowModalProps = {
  open: boolean;
  onClose: () => void;
  matchup: Matchup;
  pricePerStick: number;
  totals: ReturnType<typeof computeTotals>;
  onBuy: (buyer: string, quantity: number, separateBoards: boolean) => void;
};

function BuyFlowModal({ open, onClose, matchup, pricePerStick, totals, onBuy }: BuyFlowModalProps) {
  const [buyer, setBuyer] = useState("");
  const [qty, setQty] = useState<number>(1);
  const [separateBoards, setSeparateBoards] = useState(false);

  useEffect(() => {
    if (!open) {
      setBuyer("");
      setQty(1);
      setSeparateBoards(false);
    }
  }, [open]);

  useEffect(() => {
    if (qty <= 1 && separateBoards) {
      setSeparateBoards(false);
    }
  }, [qty, separateBoards]);

  useEffect(() => {
    if (!open) return;
    const handler = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onClose]);

  if (!open) return null;

  const price = toMoney(pricePerStick);
  const totalAmount = toMoney(price * qty);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onBuy(buyer, qty, separateBoards);
    onClose();
  };

  return (
    <div
      className="modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="buy-modal-title"
      onClick={onClose}
    >
      <form className="modal-panel space-y-4" onClick={(e) => e.stopPropagation()} onSubmit={handleSubmit}>
        <button type="button" className="modal-close" onClick={onClose} aria-label="Close buy sticks modal">×</button>
        <div>
          <h2 id="buy-modal-title" className="text-lg font-semibold">Buy sticks</h2>
          <div className="text-sm opacity-70 mt-1">
            {matchup.home} vs {matchup.away} • Kickoff: {fmtDate(matchup.kickoff)}
          </div>
        </div>
        <div className="rounded-xl border p-3 bg-white">
          <div className="font-semibold text-sm">Cost per stick</div>
          <div className="text-lg font-semibold mt-1">${price.toFixed(2)}</div>
        </div>
        <div className="rounded-xl border p-3 bg-white space-y-3">
          <div className="font-semibold">Sell sticks</div>
          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="buy-buyer">Buyer name (optional)</label>
            <input
              id="buy-buyer"
              className="input input-wide text-left"
              placeholder="Buyer name (optional)"
              value={buyer}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setBuyer(e.target.value)}
              autoFocus
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="buy-qty">How many sticks?</label>
            <div className="flex items-center gap-2">
              <input
                id="buy-qty"
                className="input input-sm"
                type="number"
                min={1}
                max={10}
                inputMode="numeric"
                value={qty}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setQty(clampInt(e.target.value, 1, 10))}
              />
              <span className="text-sm opacity-70">× ${price.toFixed(2)}</span>
            </div>
          </div>
          {qty > 1 ? (
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={separateBoards}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSeparateBoards(e.target.checked)}
              />
              All Separate Boards
            </label>
          ) : null}
        </div>
        <div className="rounded-xl border p-3 bg-white">
          <div className="font-semibold mb-2">Totals</div>
          <ul className="text-sm space-y-1">
            <li>Groups: <b>{totals.groups}</b></li>
            <li>Total charged: <b>${totals.totalCharged.toFixed(2)}</b></li>
            <li>Possible winnings: <b>${totals.possibleW.toFixed(2)}</b></li>
          </ul>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="text-lg font-semibold">Total: {qty} × ${price.toFixed(2)} = ${totalAmount.toFixed(2)}</div>
          <div className="flex gap-2">
            <button type="button" className="btn-ghost" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn">Confirm Purchase</button>
          </div>
        </div>
      </form>
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
