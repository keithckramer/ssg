"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { AdminBar } from "../components/admin/AdminBar";
import { Footer } from "../components/layout/Footer";
import { Header } from "../components/layout/Header";
import { Card } from "../components/layout/Card";
import { AddMatchup } from "../components/matchups/AddMatchup";
import { MatchupPicker } from "../components/matchups/MatchupPicker";
import { BuyPanel } from "../components/orders/BuyPanel";
import { GroupGrid } from "../components/orders/GroupGrid";
import { ScoreSetter } from "../components/orders/ScoreSetter";
import { useMatchups } from "../hooks/useMatchups";
import { useOrders } from "../hooks/useOrders";
import { load, save, STORAGE_KEYS } from "../lib/storage";
import { Config, Matchup, OrdersMap, ResultsEntry, ResultsMap } from "../lib/types";
import { calcTotalsForTest, clampInt, fmtDate, possibleWinnings, toMoney } from "../lib/game";

const defaultConfig: Config = {
  potPerStick: 10,
};

export default function App() {
  const { matchups, activeId, view, activeMatchup, setActiveId, setView, addMatchup, removeMatchup, hydrate: hydrateMatchups, reset: resetMatchups } = useMatchups();
  const { orders, results, groupsForMatchup, totalsForMatchup, buySticks, setScores, clearScores, clearMatchupData, hydrate: hydrateOrders, reset: resetOrders, winDigitForMatchup } = useOrders();

  const [config, setConfig] = useState<Config>(() => load(STORAGE_KEYS.config, defaultConfig));
  const [adminPin, setAdminPin] = useState<string | null>(() => load(STORAGE_KEYS.adminPin, null));
  const [isAdmin, setIsAdmin] = useState<boolean>(() => !!load(STORAGE_KEYS.adminSession, false));

  useEffect(() => save(STORAGE_KEYS.config, config), [config]);
  useEffect(() => save(STORAGE_KEYS.adminPin, adminPin), [adminPin]);
  useEffect(() => save(STORAGE_KEYS.adminSession, isAdmin), [isAdmin]);

  const activeGroups = useMemo(() => groupsForMatchup(activeId), [groupsForMatchup, activeId]);
  const totals = useMemo(() => totalsForMatchup(activeId), [totalsForMatchup, activeId]);
  const winDigit = useMemo(() => winDigitForMatchup(activeId), [winDigitForMatchup, activeId]);

  useEffect(() => {
    try {
      console.assert(clampInt("5", 1, 10) === 5, "clampInt basic");
      console.assert(clampInt(99, 1, 10) === 10, "clampInt upper bound");
      console.assert(clampInt(-3, 0, 5) === 0, "clampInt lower bound");
      console.assert(toMoney("1.239") === 1.24 && toMoney(-5) === 0, "toMoney rounding + non-negative");
      console.assert(possibleWinnings(0) === 0 && possibleWinnings(3) === 300, "possibleWinnings basic");
      const t = calcTotalsForTest({ groups: 3, sticks: 27, pot: 10 });
      console.assert(t.groups === 3 && t.totalCharged === 270 && t.possibleW === 300, "calcTotalsForTest sanity");
      const t2 = calcTotalsForTest({ groups: 1, prices: [10, 10] });
      console.assert(t2.groups === 1 && t2.totalCharged === 20 && t2.possibleW === 100, "calcTotalsForTest prices array (2×$10)");
      const t3 = calcTotalsForTest({ groups: 2, prices: [10, 12] });
      console.assert(t3.groups === 2 && t3.totalCharged === 22 && t3.possibleW === 200, "calcTotalsForTest prices array (mixed)");
      const t4 = calcTotalsForTest({ groups: 0, prices: [] });
      console.assert(t4.groups === 0 && t4.totalCharged === 0 && t4.possibleW === 0, "calcTotalsForTest empty");
      const d = fmtDate("2025-01-01T00:00:00Z");
      console.assert(typeof d === "string" && d.length > 0, "fmtDate returns string");
    } catch {
      // ignore in production
    }
  }, []);

  const handleSelectMatchup = useCallback((id: string) => {
    setActiveId(id);
    setView("game");
  }, [setActiveId, setView]);

  const handleAddMatchup = useCallback((home: string, away: string, kickoff: string) => {
    if (!isAdmin) {
      alert("Admins only.");
      return;
    }
    addMatchup({ home, away, kickoff });
  }, [addMatchup, isAdmin]);

  const handleRemoveMatchup = useCallback((id: string) => {
    if (!isAdmin) {
      alert("Admins only.");
      return;
    }
    removeMatchup(id);
    clearMatchupData(id);
  }, [clearMatchupData, isAdmin, removeMatchup]);

  const handleBuy = useCallback((buyer: string, quantity: number) => {
    if (!activeMatchup) return;
    buySticks({ matchupId: activeMatchup.id, buyer, quantity, pricePerStick: config.potPerStick });
  }, [activeMatchup, buySticks, config.potPerStick]);

  const handleSetScores = useCallback((homeScore: number, awayScore: number) => {
    if (!activeMatchup) return;
    if (!isAdmin) {
      alert("Admins only.");
      return;
    }
    setScores(activeMatchup.id, homeScore, awayScore);
  }, [activeMatchup, isAdmin, setScores]);

  const handleClearScores = useCallback(() => {
    if (!activeMatchup) return;
    if (!isAdmin) {
      alert("Admins only.");
      return;
    }
    clearScores(activeMatchup.id);
  }, [activeMatchup, clearScores, isAdmin]);

  const exportJson = useCallback(() => {
    const payload = {
      version: 1,
      exportedAt: new Date().toISOString(),
      data: {
        matchups,
        activeId,
        view,
        config,
        orders,
        results,
        adminPin: !!adminPin,
      },
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `sports-sticks-backup-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [activeId, adminPin, config, matchups, orders, results, view]);

  const importJson = useCallback(async (file?: File) => {
    if (!file) return;
    try {
      const text = await file.text();
      const parsed = JSON.parse(text) as unknown;
      const root = typeof parsed === "object" && parsed !== null ? parsed : {};
      const maybeData = (root as { data?: unknown }).data ?? root;
      if (typeof maybeData !== "object" || maybeData === null) {
        throw new Error("Invalid file");
      }
      const data = maybeData as Record<string, unknown>;
      const nextMatchups = Array.isArray(data.matchups) ? (data.matchups as Matchup[]) : [];
      const rawActive = data.activeId;
      const nextActiveId = typeof rawActive === "string" || rawActive === null ? (rawActive as string | null) : null;
      const nextView = data.view === "game" ? "game" : "home";
      hydrateMatchups({
        matchups: nextMatchups,
        activeId: nextActiveId,
        view: nextView,
      });
      const nextOrders =
        data.orders && typeof data.orders === "object" && data.orders !== null ? (data.orders as OrdersMap) : {};
      const nextResults =
        data.results && typeof data.results === "object" && data.results !== null ? (data.results as ResultsMap) : {};
      hydrateOrders({
        orders: nextOrders,
        results: nextResults,
      });
      const configSource = data.config;
      const nextConfig: Config =
        typeof configSource === "object" && configSource !== null
          ? { potPerStick: Number((configSource as { potPerStick?: unknown }).potPerStick) || defaultConfig.potPerStick }
          : defaultConfig;
      setConfig(nextConfig);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Unknown error";
      alert("Import failed: " + message);
    }
  }, [hydrateMatchups, hydrateOrders]);

  const resetAll = useCallback(() => {
    if (!confirm("Reset ALL local game data? This cannot be undone.")) return;
    if (typeof window !== "undefined") {
      Object.values(STORAGE_KEYS).forEach((key) => localStorage.removeItem(key));
    }
    resetMatchups();
    resetOrders();
    setConfig(defaultConfig);
    setAdminPin(null);
    setIsAdmin(false);
    setView("home");
  }, [resetMatchups, resetOrders, setView]);

  const handleSetPin = useCallback((pin: string) => {
    if (!pin || pin.length < 4) {
      alert("Choose a 4+ digit PIN.");
      return;
    }
    setAdminPin(String(pin));
    setIsAdmin(true);
  }, []);

  const handleLogin = useCallback((pin: string) => {
    if (String(pin) === String(adminPin)) {
      setIsAdmin(true);
    } else {
      alert("Wrong PIN");
    }
  }, [adminPin]);

  const handleLogout = useCallback(() => setIsAdmin(false), []);

  const handleClearPin = useCallback(() => {
    if (!confirm("Remove the Admin PIN?")) return;
    setAdminPin(null);
    setIsAdmin(false);
  }, []);

  const activeResult: ResultsEntry = activeMatchup ? results[activeMatchup.id] ?? null : null;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <div className="max-w-6xl mx-auto p-4 md:p-8">
        <Header />

        <AdminBar
          adminPin={adminPin}
          isAdmin={isAdmin}
          onSetPin={handleSetPin}
          onLogin={handleLogin}
          onLogout={handleLogout}
          onClearPin={handleClearPin}
        />

        <div className="flex flex-wrap gap-2 mt-4">
          <button className="btn" onClick={exportJson}>Export JSON</button>
          <label className="btn-ghost cursor-pointer">
            Import JSON
            <input
              type="file"
              accept="application/json"
              style={{ display: "none" }}
              onChange={(event) => importJson(event.target.files?.[0])}
            />
          </label>
          <button className="btn-ghost" onClick={resetAll}>Reset Data</button>
        </div>

        {view === "home" ? (
          <div className="grid lg:grid-cols-3 gap-6 mt-6">
            <Card title="Matchups">
              <MatchupPicker
                matchups={matchups}
                activeId={activeId}
                onSelect={handleSelectMatchup}
                onRemove={isAdmin ? handleRemoveMatchup : undefined}
              />
              {isAdmin ? (
                <AddMatchup onAdd={handleAddMatchup} />
              ) : (
                <div className="rounded-xl border p-3 bg-white text-sm opacity-70">Admin required to add a matchup.</div>
              )}
            </Card>
          </div>
        ) : (
          <div className="mt-6 space-y-4">
            <div className="flex items-center justify-between">
              <button className="btn-ghost" onClick={() => setView("home")}>← Back to Matchups</button>
              {activeMatchup ? (
                <div className="pill">{activeMatchup.home} vs {activeMatchup.away}</div>
              ) : <span />}
            </div>

            <div className="grid lg:grid-cols-2 gap-6">
              <Card title="Game & Sticks">
                {activeMatchup ? (
                  <div className="space-y-4">
                    <div className="rounded-xl border p-3 bg-white">
                      <div className="font-semibold text-lg">{activeMatchup.home} vs {activeMatchup.away}</div>
                      <div className="text-sm opacity-70">Kickoff: {fmtDate(activeMatchup.kickoff)}</div>
                    </div>

                    <div className="rounded-xl border p-3 bg-white space-y-3">
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-sm">Pot per stick</span>
                        <span className="text-sm font-semibold">${Number(config.potPerStick).toFixed(2)}</span>
                      </div>
                    </div>

                    <BuyPanel onBuy={handleBuy} />

                    <div className="rounded-xl border p-3 bg-white space-y-2">
                      <div className="font-semibold">Final Score → Winning Digit</div>
                      {isAdmin ? (
                        <ScoreSetter matchup={activeMatchup} result={activeResult} onSet={handleSetScores} onClear={handleClearScores} />
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
                ) : (
                  <div className="opacity-70">No matchup selected.</div>
                )}
              </Card>

              <Card title="Groups (0–9) & Results">
                {activeMatchup ? (
                  <div className="space-y-4">
                    {activeGroups.length === 0 ? (
                      <div className="text-sm opacity-70">No sticks yet. Sell some!</div>
                    ) : (
                      activeGroups.map((group, index) => (
                        <div key={group.id} className="rounded-xl border p-3 bg-white">
                          <div className="flex items-center justify-between mb-2">
                            <div className="font-semibold">Group #{index + 1}</div>
                            <div className="text-xs opacity-70">{group.sticks.length}/10 filled</div>
                          </div>
                          <GroupGrid sticks={group.sticks} winDigit={winDigit} />
                        </div>
                      ))
                    )}
                  </div>
                ) : (
                  <div className="opacity-70">Pick a matchup to view sticks and results.</div>
                )}
              </Card>
            </div>
          </div>
        )}

        <Footer />
      </div>

      <style>{`
        .btn { padding: 0.5rem 0.75rem; border-radius: 1rem; background:#0f172a; color:#fff; font-size:0.9rem; box-shadow:0 2px 6px rgba(0,0,0,.12); border: none; cursor:pointer }
        .btn:hover { opacity:.95 }
        .btn-ghost { padding: 0.5rem 0.75rem; border-radius: 1rem; background:#fff; color:#0f172a; font-size:0.9rem; box-shadow:0 2px 6px rgba(0,0,0,.06); border:1px solid #e2e8f0; cursor:pointer }
        .pill { padding: 0.25rem 0.5rem; border-radius: 999px; background:#0f172a; color:#fff; font-size:0.75rem; border:none; cursor:pointer }
        .pill-ghost { background:#fff; color:#0f172a; border:1px solid #e2e8f0 }
        .input { padding:0.25rem 0.5rem; border-radius:0.75rem; border:1px solid #e2e8f0; text-align:right }
        .input-sm { width: 6rem }
        .input-wide { width: 100% }
        .slot { padding: 0.25rem 0.5rem; border-radius:0.5rem; border:1px solid #e2e8f0; font-size:0.8rem }
        .win { background:#d1fae5; border-color:#6ee7b7 }
        .card { background:#fff; border:1px solid #e2e8f0; border-radius:1rem; padding:1rem; box-shadow:0 2px 8px rgba(0,0,0,.04) }
        .card h3 { margin:0 0 .5rem 0; font-size:1.05rem }
        .muted { color:#64748b; font-size:0.9rem }
        .kckStyle { font: inherit }
        .kckStyle2 { font: inherit }
      `}</style>
    </div>
  );
}
