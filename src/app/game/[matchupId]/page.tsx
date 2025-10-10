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
  toMoney,
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
    setStickPaid,
    isAdmin,
    setLastMatchupId,
  } = useSportsSticks();
  const { ensureAdmin } = useAdminGuard();

  const matchup = useMemo<Matchup | undefined>(() => matchups.find((m) => m.id === matchupId), [matchups, matchupId]);

  const matchupKey = matchup?.id ?? "";

  useEffect(() => {
    if (matchupKey) {
      setLastMatchupId(matchupKey);
    }
  }, [matchupKey, setLastMatchupId]);

  const groups = useMemo(() => ((orders as OrdersMap)[matchupKey] ?? []), [matchupKey, orders]);
  const [isBuyOpen, setIsBuyOpen] = useState(false);
  const pricePerStick = toMoney(config.potPerStick);
  const resultEntry = matchupKey ? (results as ResultsMap)[matchupKey] ?? null : null;
  const winDigit = resultEntry?.digit ?? null;

  if (!matchup) {
    return (
      <SiteShell>
        <div className="mt-6 space-y-4">
          <div className="flex items-center justify-between">
            <button className="btn-ghost" onClick={() => router.push("/")}>← Back to Matchups</button>
            <div className="pill">Matchup unavailable</div>
          </div>
          <Card title="Matchup not found">
            <div className="space-y-2 text-sm opacity-70">
              <p>The matchup you&rsquo;re looking for doesn&rsquo;t exist anymore or has been removed.</p>
              <button className="ssg-btn-dark" onClick={() => router.push("/")}>Browse all matchups</button>
            </div>
          </Card>
        </div>
      </SiteShell>
    );
  }

  const handleBuy = (buyer: string, qty: number, separateBoards: boolean) => {
    buySticks(matchup.id, buyer, qty, { separateBoards });
  };

  const handleTogglePaid = (stickId: string, paid: boolean) => {
    if (!ensureAdmin()) return;
    setStickPaid(matchup.id, stickId, paid);
  };

  return (
    <SiteShell>
      <BuyFlowModal
        open={isBuyOpen}
        onClose={() => setIsBuyOpen(false)}
        matchup={matchup}
        pricePerStick={pricePerStick}
        onBuy={(buyerName, quantity, separateBoards) => {
          handleBuy(buyerName, quantity, separateBoards);
        }}
      />
      <div className="mt-6 space-y-4">
        <div className="flex items-center justify-between">
          <button className="ssg-btn" onClick={() => router.push("/")}>← Back to Matchups</button>
          <div className="pill">{matchup.home} vs {matchup.away}</div>
        </div>
        <div className="grid lg:grid-cols-2 gap-6">
          <Card title="Game & Sticks">
            <div className="space-y-4">
              <div className="rounded-xl border bg-white p-4" style={{ borderColor: "rgba(148, 163, 184, 0.45)" }}>
                <div className="flex md:flex-row md:items-center md:justify-between gap-3">
                  <div>
                    <div className="font-semibold text-lg">{matchup.home} vs {matchup.away}</div>
                    <div className="text-sm opacity-70">Kickoff: {fmtDate(matchup.kickoff)}</div>
                  </div>
                  <button
                    style={{ width: "130px" }}
                    className="ssg-btn-dark"
                    onClick={() => setIsBuyOpen(true)}
                  >
                    Buy sticks
                  </button>
                </div>
              </div>
            </div>
          </Card>
          <Card title="Boards">
            <div className="space-y-4">
              <div className="rounded-xl border bg-white p-3" style={{ borderColor: "rgba(148, 163, 184, 0.45)" }}>
                <div className="text-sm font-medium text-slate-600">Winning digit</div>
                <div className="text-2xl font-semibold mt-1">{winDigit ?? "—"}</div>
                <p className="text-xs opacity-70 mt-2">
                  Admins confirm the final score on the Admin page. Boards update automatically.
                </p>
              </div>
              {groups.length === 0 ? (
                <div className="text-sm opacity-70">No sticks yet. Sell some!</div>
              ) : (
                groups.map((group, idx) => (
                  <div key={group.id} className="rounded-xl border p-3 bg-white">
                    <div className="flex items-center justify-between mb-2">
                      <div className="font-semibold">Board #{idx + 1}</div>
                      <div className="text-xs opacity-70">{group.sticks.length}/10 filled</div>
                    </div>
                    <GroupGrid
                      sticks={group.sticks}
                      winDigit={winDigit}
                      isAdmin={isAdmin}
                      onTogglePaid={handleTogglePaid}
                    />
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
  onBuy: (buyer: string, quantity: number, separateBoards: boolean) => void;
};

function BuyFlowModal({ open, onClose, matchup, pricePerStick, onBuy }: BuyFlowModalProps) {
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
  const sticks = qty;
  const boards = separateBoards && sticks > 1 ? sticks : 1;
  const totalCharged = toMoney(sticks * 10);
  const possibleW = toMoney(boards * 100);
  const totalAmount = toMoney(price * qty);
  const stepperButtonStyle = (isDisabled: boolean): React.CSSProperties => ({
    width: "2.25rem",
    height: "2.25rem",
    borderRadius: "0.85rem",
    border: "1px solid #e2e8f0",
    background: isDisabled ? "#f1f5f9" : "#ffffff",
    fontSize: "1.25rem",
    lineHeight: 1,
  });

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
          <h2 id="buy-modal-title" className="text-lg font-semibold">Buy Sticks</h2>
          <div className="text-sm opacity-70 mt-1">
            {matchup.home} vs {matchup.away} • Kickoff: {fmtDate(matchup.kickoff)}
          </div>
        </div>
        <div className="rounded-2xl border bg-white p-4" style={{ borderColor: "rgba(148, 163, 184, 0.45)" }}>
          <div className="font-semibold text-sm">Cost per stick</div>
          <div className="text-lg font-semibold mt-1">${price.toFixed(2)}</div>
        </div>
        <div className="rounded-2xl border bg-white p-4 space-y-3" style={{ borderColor: "rgba(148, 163, 184, 0.45)" }}>
          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="buy-buyer">
              Name <span aria-hidden="true" style={{ color: "#dc2626" }}>*</span>
            </label>
            <input
              id="buy-buyer"
              className="ssg-input text-left"
              placeholder="Enter buyer name"
              value={buyer}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setBuyer(e.target.value)}
              autoFocus
              required
              aria-label="Buyer name"
            />
          </div>
          <div className="space-y-2">
            <span id="buy-qty-label" className="text-sm font-medium">
              Number of sticks
            </span>
            <div className="flex items-center gap-3" role="group" aria-labelledby="buy-qty-label">
              <div
                className="flex items-center gap-2"
                style={{
                  border: "1px solid #e2e8f0",
                  borderRadius: "0.85rem",
                  padding: "0.25rem",
                  background: "#fff",
                }}
              >
                <button
                  type="button"
                  onClick={() => setQty((current) => Math.max(1, current - 1))}
                  aria-label="Decrease number of sticks"
                  disabled={qty <= 1}
                  className="ssg-btn ssg-btn-sm"
                  style={stepperButtonStyle(qty <= 1)}
                >
                  −
                </button>
                <span
                  className="text-lg font-semibold"
                  style={{ minWidth: "2.5rem", textAlign: "center" }}
                >
                  {qty}
                </span>
                <button
                  type="button"
                  onClick={() => setQty((current) => Math.min(10, current + 1))}
                  aria-label="Increase number of sticks"
                  disabled={qty >= 10}
                  className="ssg-btn ssg-btn-sm"
                  style={stepperButtonStyle(qty >= 10)}
                >
                  +
                </button>
              </div>
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
        <div className="rounded-2xl border bg-white p-4" style={{ borderColor: "rgba(148, 163, 184, 0.45)" }}>
          <div className="font-semibold mb-2">Summary</div>
          <ul style={{ listStyleType: "none" }} className="text-sm space-y-1">
            <li>
              Boards: <b>{boards}</b>
            </li>
            <li>
              Total charged: <b>${totalCharged.toFixed(2)}</b>
            </li>
            <li>
              Possible winnings: <b>${possibleW.toFixed(2)}</b>
            </li>
          </ul>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="text-lg font-semibold">Total: {qty} × ${price.toFixed(2)} = ${totalAmount.toFixed(2)}</div>
          <div className="flex gap-2">
            <button type="button" className="ssg-btn" onClick={onClose}>Cancel</button>
            <button type="submit" className="ssg-btn-dark">Confirm Purchase</button>
          </div>
        </div>
      </form>
    </div>
  );
}

function GroupGrid({
  sticks,
  winDigit,
  isAdmin,
  onTogglePaid,
}: {
  sticks: Stick[];
  winDigit: number | null;
  isAdmin: boolean;
  onTogglePaid: (stickId: string, paid: boolean) => void;
}) {
  const slotMap = new Map(sticks.map((s) => [s.number, s] as const));
  const slots = Array.from({ length: 10 }, (_, i) => ({ num: i, s: slotMap.get(i) || null }));
  return (
    <div className="grid grid-cols-5 gap-2">
      {slots.map(({ num, s }) => (
        <div
          key={num}
          className={`slot ${winDigit !== null && num === winDigit ? "win" : ""} ${s ? (s.paid ? "slot-paid" : "slot-unpaid") : ""}`}
          title={
            s
              ? `Buyer: ${s.buyer}\nPrice: $${Number(s.price).toFixed(2)}\nPaid: ${s.paid ? "Yes" : "No"}\nAt: ${fmtDate(s.createdAt)}`
              : ""
          }
        >
          <div className="text-[11px] opacity-60 flex items-center justify-between gap-1">
            <span>#{num}</span>
            {isAdmin && s ? (
              <label className="flex items-center gap-1">
                <input
                  type="checkbox"
                  checked={!!s.paid}
                  onChange={(event) => onTogglePaid(s.id, event.target.checked)}
                />
                <span>Paid</span>
              </label>
            ) : null}
          </div>
          <div className="text-sm">{s ? s.buyer : "—"}</div>
        </div>
      ))}
    </div>
  );
}
