"use client";
<<<<<<< HEAD
import React, { useMemo, useState, useEffect } from "react";
<<<<<<< HEAD
import { asMoney, clampInt, fmtDate, possibleWinnings, toNumber } from "@/lib/game";
// NOTE: App.css not used in this sandbox; styles are inlined below.
=======
import styles from "./App.module.css";
import gridStyles from "./GroupGrid.module.css";
>>>>>>> main

// ----------------------------- Types -----------------------------
export type Matchup = { id: string; home: string; away: string; kickoff: string };
export type Stick = { id: string; buyer: string; number: number; price: number; fee: number; createdAt: string };
export type Group = { id: string; sticks: Stick[] };
export type OrdersMap = Record<string, Group[]>;
export type ResultsEntry = { homeScore: number; awayScore: number; digit: number } | null;
export type ResultsMap = Record<string, ResultsEntry>;
export type Config = { potPerStick: number };

type BackupData = Partial<{
  matchups: Matchup[];
  activeId: string | null;
  config: Config;
  orders: OrdersMap;
  results: ResultsMap;
}>;

// ----------------------------- Storage Helpers -----------------------------
const uid = (): string => Math.random().toString(36).slice(2, 9);
const save = <T,>(key: string, val: T): void => localStorage.setItem(key, JSON.stringify(val));
const load = <T,>(key: string, fallback: T): T => {
  try {
    const v = localStorage.getItem(key);
    return v ? (JSON.parse(v) as T) : fallback;
  } catch {
    return fallback;
  }
};
=======
>>>>>>> main

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

<<<<<<< HEAD
  const active = useMemo<Matchup | null>(() => matchups.find(m => m.id === activeId) ?? null, [matchups, activeId]);
  const activeGroups = useMemo<Group[]>(() => (activeId ? (orders[activeId] ?? []) : []), [orders, activeId]);

  // -------------------------- Matchups --------------------------
  const addMatchup = (home: string, away: string, kickoff: string) => {
    if (!isAdmin) { alert('Admins only.'); return; }
    const m: Matchup = { id: uid(), home, away, kickoff };
    setMatchups(v => [m, ...v]);
    setActiveId(m.id);
    setView('game');
  };

  const removeMatchup = (id: string) => {
    if (!isAdmin) { alert('Admins only.'); return; }
    setMatchups(prev => {
      const next = prev.filter(m => m.id !== id);
      setActiveId(a => (a === id ? (next[0]?.id ?? null) : a));
      if (id === activeId) setView('home');
      return next;
    });
    setOrders(prev => { const c = { ...prev }; delete c[id]; return c; });
    setResults(prev => { const c = { ...prev }; delete c[id]; return c; });
  };

  // ---------------------- Buying sticks ----------------------
  // Assign numbers 0–9 unique within the current group.
  const buySticks = (buyerName: string, quantity: number) => {
    if (!active) return;
    const q = clampInt(quantity, 1, 10); // cap at 10
    const buyer = (buyerName && buyerName.trim()) || "Guest";

    setOrders(prev => {
      const matchId = active.id;
      const groups: Group[] = [...(prev[matchId] ?? [])];
      const nowIso = new Date().toISOString();

      let remaining = q;
      while (remaining > 0) {
        if (groups.length === 0 || groups[groups.length - 1].sticks.length >= 10) {
          groups.push({ id: uid(), sticks: [] });
        }
        const g = groups[groups.length - 1];
        const takenNums = new Set(g.sticks.map(s => s.number));
        const available = Array.from({ length: 10 }, (_, i) => i).filter(n => !takenNums.has(n));
        if (available.length === 0) continue; // defensive

        const toPlace = Math.min(available.length, remaining);
        for (let i = 0; i < toPlace; i++) {
          const nIdx = Math.floor(Math.random() * available.length);
          const num = available.splice(nIdx, 1)[0];
          g.sticks.push({
            id: uid(),
            buyer,
            number: num,
            price: asMoney(config.potPerStick), // stored as number
            fee: 0, // platform fee disabled for now
            createdAt: nowIso,
          });
          remaining--;
        }
      }
      return { ...prev, [matchId]: groups } as OrdersMap;
    });
  };

  // ------------------------- Results -------------------------
  const setScores = (homeScore: number, awayScore: number) => {
    if (!active) return;
    const hs = clampInt(homeScore, 0, Number.MAX_SAFE_INTEGER);
    const as = clampInt(awayScore, 0, Number.MAX_SAFE_INTEGER);
    const digit = (hs + as) % 10;
    setResults(prev => ({ ...prev, [active.id]: { homeScore: hs, awayScore: as, digit } }));
  };

  const clearScores = () => {
    if (!active) return;
    setResults(prev => ({ ...prev, [active.id]: null }));
  };

  // -------------------------- Totals --------------------------
  const totals = useMemo(() => {
    const sticks = activeGroups.reduce((s, g) => s + g.sticks.length, 0);
    const groups = activeGroups.length;
    const totalCharged = activeGroups.reduce(
      (sum, g) => sum + g.sticks.reduce((inner, st) => inner + toNumber(st.price), 0),
      0
    );
    const possibleW = possibleWinnings(groups);
    return { sticks, groups, totalCharged, possibleW } as const;
  }, [activeGroups]);

  const winDigit = active ? (results[active.id]?.digit ?? null) : null;

  // --------------------- Backup / Restore ---------------------
  const exportJson = () => {
=======
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
<<<<<<< HEAD
      console.assert(t4.groups === 0 && t4.totalCharged === 0 && t4.possibleW === 0, 'calcTotalsForTest empty');
      const d = fmtDate('2025-01-01T00:00:00Z');
      console.assert(typeof d === 'string' && d.length > 0, 'fmtDate returns string');
    } catch { /* ignore in prod */ }
=======
      console.assert(t4.groups === 0 && t4.totalCharged === 0 && t4.possibleW === 0, "calcTotalsForTest empty");
      const d = fmtDate("2025-01-01T00:00:00Z");
      console.assert(typeof d === "string" && d.length > 0, "fmtDate returns string");
    } catch {
      // ignore in production
    }
>>>>>>> main
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
>>>>>>> main
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
<<<<<<< HEAD
      const raw = JSON.parse(text) as unknown;
      const candidate = (raw as { data?: unknown } | null)?.data ?? raw;
      if (!candidate || typeof candidate !== 'object') throw new Error('Invalid file');
      const data = candidate as BackupData;
      setMatchups(Array.isArray(data.matchups) ? data.matchups : []);
      setActiveId(
        typeof data.activeId === 'string' || data.activeId === null
          ? data.activeId ?? null
          : null
      );
      setConfig(
        data.config && typeof data.config.potPerStick === 'number'
          ? { potPerStick: data.config.potPerStick }
          : defaultConfig
      );
      setOrders(
        data.orders && typeof data.orders === 'object'
          ? (data.orders as OrdersMap)
          : {}
      );
      setResults(
        data.results && typeof data.results === 'object'
          ? (data.results as ResultsMap)
          : {}
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      alert('Import failed: ' + (message || 'Unknown error'));
=======
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
>>>>>>> main
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
    <div className={styles.app}>
      <div className={styles.container}>
        <Header />

        <AdminBar
          adminPin={adminPin}
          isAdmin={isAdmin}
          onSetPin={handleSetPin}
          onLogin={handleLogin}
          onLogout={handleLogout}
          onClearPin={handleClearPin}
        />

<<<<<<< HEAD
        {/* App Controls */}
        <div className={styles.controlRow}>
          <button className={styles.button} onClick={exportJson}>Export JSON</button>
          <label className={`${styles.buttonGhost} ${styles.uploadLabel}`}>
            Import JSON
            <input
              className={styles.hiddenInput}
              type="file"
              accept="application/json"
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => importJson(e.target.files?.[0])}
=======
        <div className="flex flex-wrap gap-2 mt-4">
          <button className="btn" onClick={exportJson}>Export JSON</button>
          <label className="btn-ghost cursor-pointer">
            Import JSON
            <input
              type="file"
              accept="application/json"
              style={{ display: "none" }}
              onChange={(event) => importJson(event.target.files?.[0])}
>>>>>>> main
            />
          </label>
          <button className={styles.buttonGhost} onClick={resetAll}>Reset Data</button>
        </div>

<<<<<<< HEAD
        {/* ROUTES */}
        {view === 'home' ? (
          <div className={styles.gridHome}>
            {/* Left: Matchup Manager only */}
=======
        {view === "home" ? (
          <div className="grid lg:grid-cols-3 gap-6 mt-6">
>>>>>>> main
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
                <div className={`${styles.panel} ${styles.textSmall} ${styles.opacity70}`}>
                  Admin required to add a matchup.
                </div>
              )}
            </Card>
          </div>
        ) : (
<<<<<<< HEAD
          // GAME VIEW
          <div className={styles.backSpacer}>
            <div className={styles.gameHeader}>
              <button className={styles.buttonGhost} onClick={() => setView('home')}>
                ← Back to Matchups
              </button>
              {active ? (
                <div className={styles.pill}>{active.home} vs {active.away}</div>
              ) : <span />}
            </div>

            <div className={styles.gridGame}>
              {/* Game & Sticks */}
              <Card title="Game & Sticks">
                {active ? (
                  <div className={styles.stackLarge}>
                    <div className={styles.panel}>
                      <div className={styles.cardInfoTitle}>{active.home} vs {active.away}</div>
                      <div className={`${styles.textSmall} ${styles.opacity70}`}>
                        Kickoff: {fmtDate(active.kickoff)}
                      </div>
                    </div>

                    {/* Pot per stick: label only */}
                    <div className={`${styles.panel} ${styles.stackMedium}`}>
                      <div className={styles.labelRow}>
                        <span className={styles.textSmall}>Pot per stick</span>
                        <span className={`${styles.textSmall} ${styles.fontSemibold}`}>
                          ${toNumber(config.potPerStick).toFixed(2)}
                        </span>
=======
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
>>>>>>> main
                      </div>
                    </div>

                    <BuyPanel onBuy={handleBuy} />

<<<<<<< HEAD
                    {/* Scores */}
                    <div className={`${styles.panel} ${styles.stackSmall}`}>
                      <div className={styles.fontSemibold}>Final Score → Winning Digit</div>
=======
                    <div className="rounded-xl border p-3 bg-white space-y-2">
                      <div className="font-semibold">Final Score → Winning Digit</div>
>>>>>>> main
                      {isAdmin ? (
                        <ScoreSetter matchup={activeMatchup} result={activeResult} onSet={handleSetScores} onClear={handleClearScores} />
                      ) : (
                        <div className={`${styles.textSmall} ${styles.opacity70}`}>
                          Admin required to set scores.
                        </div>
                      )}
                      <div className={`${styles.textSmall} ${styles.opacity70}`}>
                        Winning digit: <b>{winDigit ?? "—"}</b>
                      </div>
                    </div>

<<<<<<< HEAD
                    {/* Totals */}
                    <div className={styles.panel}>
                      <div className={styles.sectionTitle}>Totals</div>
                      <ul className={`${styles.list} ${styles.textSmall}`}>
=======
                    <div className="rounded-xl border p-3 bg-white">
                      <div className="font-semibold mb-2">Totals</div>
                      <ul className="text-sm space-y-1">
>>>>>>> main
                        <li>Groups: <b>{totals.groups}</b></li>
                        <li>Total charged: <b>${totals.totalCharged.toFixed(2)}</b></li>
                        <li>Possible winnings: <b>${totals.possibleW.toFixed(2)}</b></li>
                      </ul>
                    </div>
                  </div>
                ) : (
                  <div className={styles.opacity70}>No matchup selected.</div>
                )}
              </Card>

              <Card title="Groups (0–9) & Results">
<<<<<<< HEAD
                {active ? (
                  <div className={styles.stackLarge}>
=======
                {activeMatchup ? (
                  <div className="space-y-4">
>>>>>>> main
                    {activeGroups.length === 0 ? (
                      <div className={`${styles.textSmall} ${styles.opacity70}`}>
                        No sticks yet. Sell some!
                      </div>
                    ) : (
<<<<<<< HEAD
                      activeGroups.map((g, idx) => (
                        <div key={g.id} className={styles.panel}>
                          <div className={styles.panelHeader}>
                            <div className={styles.fontSemibold}>Group #{idx + 1}</div>
                            <div className={`${styles.textXs} ${styles.opacity70}`}>
                              {g.sticks.length}/10 filled
                            </div>
=======
                      activeGroups.map((group, index) => (
                        <div key={group.id} className="rounded-xl border p-3 bg-white">
                          <div className="flex items-center justify-between mb-2">
                            <div className="font-semibold">Group #{index + 1}</div>
                            <div className="text-xs opacity-70">{group.sticks.length}/10 filled</div>
>>>>>>> main
                          </div>
                          <GroupGrid sticks={group.sticks} winDigit={winDigit} />
                        </div>
                      ))
                    )}
                  </div>
                ) : (
                  <div className={styles.opacity70}>Pick a matchup to view sticks and results.</div>
                )}
              </Card>
            </div>
          </div>
        )}

        <Footer />
      </div>
<<<<<<< HEAD
    </div>
  );
}

function Header() {
  return (
    <div className={styles.header}>
      <div>
        <h1 className={styles.headerTitle}>Sports Sticks – Mini MVP</h1>
        <p className={styles.muted}>Each group holds numbers 0–9. (home+away) % 10 decides the winner.</p>
      </div>
    </div>
  );
}

type AdminBarProps = {
  adminPin: string | null;
  isAdmin: boolean;
  onSetPin: (pin: string) => void;
  onLogin: (pin: string) => void;
  onLogout: () => void;
  onClearPin: () => void;
};

function AdminBar({ adminPin, isAdmin, onSetPin, onLogin, onLogout, onClearPin }: AdminBarProps) {
  const [pinInput, setPinInput] = useState("");
  const [newPin, setNewPin] = useState("");

  return (
    <div className={styles.adminBar}>
      <div className={styles.fontSemibold}>Admin</div>
      {adminPin ? (
        <div className={styles.adminSection}>
          <span className={styles.textSmall}>
            Status: <b>{isAdmin ? 'Logged in' : 'Logged out'}</b>
          </span>
          {isAdmin ? (
            <>
              <button className={styles.buttonGhost} onClick={onLogout}>Logout</button>
              <button className={styles.buttonGhost} onClick={onClearPin}>Remove PIN</button>
            </>
          ) : (
            <>
              <input
                className={`${styles.input} ${styles.inputSm}`}
                placeholder="Enter PIN"
                value={pinInput}
                onChange={e => setPinInput(e.target.value.replace(/[^0-9]/g, ''))}
              />
              <button
                className={styles.button}
                onClick={() => { onLogin(pinInput); setPinInput(""); }}
              >
                Login
              </button>
            </>
          )}
        </div>
      ) : (
        <div className={styles.adminSection}>
          <input
            className={`${styles.input} ${styles.inputSm}`}
            placeholder="Set new PIN (4+ digits)"
            value={newPin}
            onChange={e => setNewPin(e.target.value.replace(/[^0-9]/g, ''))}
          />
          <button
            className={styles.button}
            onClick={() => { onSetPin(newPin); setNewPin(""); }}
          >
            Set PIN
          </button>
          <span className={`${styles.textXs} ${styles.opacity70}`}>
            (This PIN stays only on this device)
          </span>
        </div>
      )}
    </div>
  );
}

function Footer() {
  return (
    <div className={styles.footer}>
      Built fast. Iterate later with auth, payments, live NFL feeds.
    </div>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className={styles.card}>
      <h3 className={styles.cardTitle}>{title}</h3>
      {children}
    </div>
  );
}

function MatchupPicker({ matchups, activeId, setActiveId, onRemove }: {
  matchups: Matchup[];
  activeId: string | null;
  setActiveId: (id: string) => void;
  onRemove?: (id: string) => void;
}) {
  return (
    <div className={styles.matchupPicker}>
      {matchups.length === 0 ? (
        <div className={`${styles.textSmall} ${styles.opacity70} ${styles.matchupEmpty}`}>
          No matchups yet.
        </div>
      ) : (
        <ul className={styles.matchupList}>
          {matchups.map((m) => (
            <li key={m.id} className={styles.matchupItem}>
              <button
                onClick={() => setActiveId(m.id)}
                className={`${styles.matchupButton} ${activeId === m.id ? styles.matchupButtonActive : ""}`}
                title={m.kickoff}
              >
                {m.home} vs {m.away}
                <span className={styles.matchupMeta}>{fmtDate(m.kickoff)}</span>
              </button>
              {onRemove ? (
                <button className={`${styles.pill} ${styles.pillGhost}`} onClick={() => onRemove(m.id)}>
                  Remove
                </button>
              ) : (
                <span className={`${styles.textMicro} ${styles.opacity50}`}>Admin only</span>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function AddMatchup({ onAdd }: { onAdd: (home: string, away: string, kickoff: string) => void }) {
  const [home, setHome] = useState("");
  const [away, setAway] = useState("");
  const [kickoff, setKickoff] = useState("");

  return (
    <div className={styles.addMatchup}>
      <div className={styles.addMatchupTitle}>Add a matchup</div>
      <div className={styles.twoColGrid}>
        <input
          className={`${styles.input} ${styles.inputLeft}`}
          placeholder="Home"
          value={home}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setHome(e.target.value)}
        />
        <input
          className={`${styles.input} ${styles.inputLeft}`}
          placeholder="Away"
          value={away}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setAway(e.target.value)}
        />
      </div>
      <input
        className={`${styles.input} ${styles.inputWide} ${styles.inputLeft}`}
        type="datetime-local"
        value={kickoff}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setKickoff(e.target.value)}
      />
      <button className={`${styles.button} ${styles.fullWidth}`} onClick={() => {
        if (!home || !away) { alert("Enter home & away team names"); return; }
        onAdd(home.trim(), away.trim(), kickoff || new Date().toISOString());
        setHome(""); setAway(""); setKickoff("");
      }}>Add</button>
    </div>
  );
}

function BuyPanel({ onBuy }: { onBuy: (buyer: string, quantity: number) => void }) {
  const [buyer, setBuyer] = useState("");
  const [qty, setQty] = useState<number>(1);
  return (
    <div className={styles.panel}>
      <div className={styles.sectionTitle}>Sell sticks</div>
      <div className={styles.threeColGrid}>
        <input
          className={`${styles.input} ${styles.inputLeft} ${styles.buyerName}`}
          placeholder="Buyer name (optional)"
          value={buyer}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setBuyer(e.target.value)}
        />
        <input
          className={`${styles.input} ${styles.inputSm}`}
          type="number"
          min={1}
          max={10}
          value={qty}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setQty(clampInt(e.target.value, 1, 10))}
        />
      </div>
      <div className={styles.buttonRow}>
        <button className={`${styles.button} ${styles.flexGrow}`} onClick={() => onBuy(buyer, qty)}>Buy</button>
        <button className={styles.buttonGhost} onClick={() => { setBuyer(""); setQty(1); }}>Clear</button>
      </div>
    </div>
  );
}

function ScoreSetter({ active, results, onSet, onClear }: {
  active: Matchup;
  results: ResultsMap;
  onSet: (homeScore: number, awayScore: number) => void;
  onClear: () => void;
}) {
  const r = results[active.id] ?? null;
  const [hs, setHs] = useState<string | number>(r?.homeScore ?? "");
  const [as, setAs] = useState<string | number>(r?.awayScore ?? "");

  useEffect(() => { // sync when switching games
    const rr = results[active.id] ?? null;
    setHs(rr?.homeScore ?? "");
    setAs(rr?.awayScore ?? "");
  }, [active.id, results]);

  return (
    <div className={styles.threeColGrid}>
      <input
        className={`${styles.input} ${styles.inputSm}`}
        placeholder={`${active.home} score`}
        value={hs}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setHs(e.target.value.replace(/[^0-9]/g, ""))}
      />
      <input
        className={`${styles.input} ${styles.inputSm}`}
        placeholder={`${active.away} score`}
        value={as}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setAs(e.target.value.replace(/[^0-9]/g, ""))}
      />
      <div className={styles.inlineRow}>
        <button className={styles.button} onClick={() => onSet(Number(hs || 0), Number(as || 0))}>Set</button>
        <button className={styles.buttonGhost} onClick={onClear}>Clear</button>
      </div>
    </div>
  );
}

function GroupGrid({ sticks, winDigit }: { sticks: Stick[]; winDigit: number | null }) {
  const slotMap = new Map(sticks.map(s => [s.number, s] as const));
  const slots = Array.from({ length: 10 }, (_, i) => ({ num: i, s: slotMap.get(i) || null }));
  return (
    <div className={gridStyles.grid}>
      {slots.map(({ num, s }) => (
        <div
          key={num}
          className={`${gridStyles.slot} ${winDigit !== null && num === winDigit ? gridStyles.win : ""}`}
          title={s ? `Buyer: ${s.buyer}\nPaid: $${Number(s.price).toFixed(2)}\nAt: ${fmtDate(s.createdAt)}` : ""}
        >
          <div className={gridStyles.slotHeader}>#{num}</div>
          <div className={gridStyles.slotBody}>{s ? s.buyer : "—"}</div>
        </div>
      ))}
    </div>
  );
}

<<<<<<< HEAD
=======
// ----------------------------- Utils -----------------------------
function fmtDate(iso: string): string {
  if (!iso) return "";
  try {
    const d = new Date(iso);
    const opts: Intl.DateTimeFormatOptions = { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" };
    return d.toLocaleString(undefined, opts);
  } catch { return iso; }
}

function toNumber(v: unknown): number {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

function possibleWinnings(groups: number): number { return Math.max(0, Math.floor(Number(groups) || 0)) * 100; }

function toMoney(v: unknown): number {
  const n = Number(v);
  if (!Number.isFinite(n) || n < 0) return 0;
  return Math.round(n * 100) / 100;
}

function asMoney(n: unknown): number {
  return Math.round(Number(n || 0) * 100) / 100;
}

function clampInt(v: number | string, min: number, max: number): number {
  const n = Math.floor(Number(v));
  if (!Number.isFinite(n)) return min;
  return Math.max(min, Math.min(max, n));
}

// Pure helper for testing totals logic without touching React state
function calcTotalsForTest({ groups, sticks, pot, prices }: { groups: number; sticks?: number; pot?: number; prices?: number[] }) {
  const totalCharged = Array.isArray(prices)
    ? prices.reduce((a, b) => a + (Number(b) || 0), 0)
    : ((Number(sticks) || 0) * (Number(pot) || 0));
  const possibleW = possibleWinnings(Number(groups) || 0);
  return { groups: Number(groups) || 0, totalCharged, possibleW } as const;
}
=======

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
>>>>>>> main
>>>>>>> main
