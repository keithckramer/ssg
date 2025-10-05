"use client";
import React, { useMemo, useState, useEffect } from "react";
import styles from "./App.module.css";
import gridStyles from "./GroupGrid.module.css";

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

const STORAGE_KEYS = {
  matchups: 'ss_matchups',
  activeId: 'ss_activeId',
  config: 'ss_config_v2',
  orders: 'ss_orders_v2',
  results: 'ss_results_v2',
  adminPin: 'ss_admin_pin_v1',
  adminSession: 'ss_admin_session_v1',
  view: 'ss_view_v1',
} as const;

const SAMPLE_MATCHUPS: Matchup[] = [
  { id: uid(), home: "Bengals", away: "Steelers", kickoff: "2025-09-07T13:00:00" },
  { id: uid(), home: "Chiefs", away: "Ravens", kickoff: "2025-09-07T16:25:00" },
  { id: uid(), home: "49ers", away: "Cowboys", kickoff: "2025-09-08T20:20:00" },
];

// Config: pot per stick is fixed (label only for now)
const defaultConfig: Config = {
  potPerStick: 10,
};

/** Data shape
 * ordersByMatchup: { [matchupId]: Array<Group> }
 * resultsByMatchup: { [matchupId]: ResultsEntry }
 */

export default function App() {
  const [matchups, setMatchups] = useState<Matchup[]>(() => load(STORAGE_KEYS.matchups, SAMPLE_MATCHUPS));
  const [activeId, setActiveId] = useState<string | null>(() => load(STORAGE_KEYS.activeId, (matchups[0]?.id ?? null)));
  const [config, setConfig] = useState<Config>(() => load(STORAGE_KEYS.config, defaultConfig));
  const [orders, setOrders] = useState<OrdersMap>(() => load(STORAGE_KEYS.orders, {})); // groups per matchup
  const [results, setResults] = useState<ResultsMap>(() => load(STORAGE_KEYS.results, {})); // scores per matchup

  // Admin: PIN (optional) + session flag
  const [adminPin, setAdminPin] = useState<string | null>(() => load(STORAGE_KEYS.adminPin, null));
  const [isAdmin, setIsAdmin] = useState<boolean>(() => !!load(STORAGE_KEYS.adminSession, false)); 

  // Simple view routing: 'home' (only matchups) or 'game' (detail page)
  const [view, setView] = useState<'home' | 'game'>(() => load(STORAGE_KEYS.view, 'home'));

  useEffect(() => save(STORAGE_KEYS.matchups, matchups), [matchups]);
  useEffect(() => save(STORAGE_KEYS.activeId, activeId), [activeId]);
  useEffect(() => save(STORAGE_KEYS.config, config), [config]);
  useEffect(() => save(STORAGE_KEYS.orders, orders), [orders]);
  useEffect(() => save(STORAGE_KEYS.results, results), [results]);
  useEffect(() => save(STORAGE_KEYS.adminPin, adminPin), [adminPin]);
  useEffect(() => save(STORAGE_KEYS.adminSession, isAdmin), [isAdmin]);
  useEffect(() => save(STORAGE_KEYS.view, view), [view]);

  // Quick runtime sanity checks ("tests") for utilities
  useEffect(() => {
    try {
      console.assert(clampInt("5", 1, 10) === 5, 'clampInt basic');
      console.assert(clampInt(99, 1, 10) === 10, 'clampInt upper bound');
      console.assert(clampInt(-3, 0, 5) === 0, 'clampInt lower bound');
      console.assert(toMoney('1.239') === 1.24 && toMoney(-5) === 0, 'toMoney rounding + non-negative');
      console.assert(possibleWinnings(0) === 0 && possibleWinnings(3) === 300, 'possibleWinnings basic');
      const t = calcTotalsForTest({ groups: 3, sticks: 27, pot: 10 });
      console.assert(t.groups === 3 && t.totalCharged === 270 && t.possibleW === 300, 'calcTotalsForTest sanity');
      const t2 = calcTotalsForTest({ groups: 1, prices: [10, 10] });
      console.assert(t2.groups === 1 && t2.totalCharged === 20 && t2.possibleW === 100, 'calcTotalsForTest prices array (2×$10)');
      const t3 = calcTotalsForTest({ groups: 2, prices: [10, 12] });
      console.assert(t3.groups === 2 && t3.totalCharged === 22 && t3.possibleW === 200, 'calcTotalsForTest prices array (mixed)');
      const t4 = calcTotalsForTest({ groups: 0, prices: [] });
      console.assert(t4.groups === 0 && t4.totalCharged === 0 && t4.possibleW === 0, 'calcTotalsForTest empty');
      const d = fmtDate('2025-01-01T00:00:00Z');
      console.assert(typeof d === 'string' && d.length > 0, 'fmtDate returns string');
    } catch { /* ignore in prod */ }
  }, []);

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
    const payload = {
      version: 1,
      exportedAt: new Date().toISOString(),
      data: {
        matchups,
        activeId,
        config,
        orders,
        results,
        adminPin: !!adminPin,
      },
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sports-sticks-backup-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const importJson = async (file?: File) => {
    if (!file) return;
    try {
      const text = await file.text();
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
    }
  };

  const resetAll = () => {
    if (!confirm('Reset ALL local game data? This cannot be undone.')) return;
    for (const k of Object.values(STORAGE_KEYS)) localStorage.removeItem(k);
    setMatchups(SAMPLE_MATCHUPS);
    setActiveId(SAMPLE_MATCHUPS[0].id);
    setConfig(defaultConfig);
    setOrders({});
    setResults({});
    setAdminPin(null);
    setIsAdmin(false);
    setView('home');
  };

  // Admin login helpers
  const handleSetPin = (pin: string) => {
    if (!pin || pin.length < 4) { alert('Choose a 4+ digit PIN.'); return; }
    setAdminPin(String(pin));
    setIsAdmin(true);
  };
  const handleLogin = (pin: string) => {
    if (String(pin) === String(adminPin)) { setIsAdmin(true); }
    else alert('Wrong PIN');
  };
  const handleLogout = () => setIsAdmin(false);
  const handleClearPin = () => {
    if (!confirm('Remove the Admin PIN?')) return; setAdminPin(null); setIsAdmin(false);
  };

  // ------------------------------ Render ------------------------------
  return (
    <div className={styles.app}>
      <div className={styles.container}>
        <Header />

        {/* Admin Bar */}
        <AdminBar
          adminPin={adminPin}
          isAdmin={isAdmin}
          onSetPin={handleSetPin}
          onLogin={handleLogin}
          onLogout={handleLogout}
          onClearPin={handleClearPin}
        />

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
            />
          </label>
          <button className={styles.buttonGhost} onClick={resetAll}>Reset Data</button>
        </div>

        {/* ROUTES */}
        {view === 'home' ? (
          <div className={styles.gridHome}>
            {/* Left: Matchup Manager only */}
            <Card title="Matchups">
              <MatchupPicker
                matchups={matchups}
                activeId={activeId}
                setActiveId={(id: string) => { setActiveId(id); setView('game'); }}
                onRemove={isAdmin ? removeMatchup : undefined}
              />
              {isAdmin ? (
                <AddMatchup onAdd={addMatchup} />
              ) : (
                <div className={`${styles.panel} ${styles.textSmall} ${styles.opacity70}`}>
                  Admin required to add a matchup.
                </div>
              )}
            </Card>
          </div>
        ) : (
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
                      </div>
                    </div>

                    {/* Buy flow */}
                    <BuyPanel onBuy={buySticks} />

                    {/* Scores */}
                    <div className={`${styles.panel} ${styles.stackSmall}`}>
                      <div className={styles.fontSemibold}>Final Score → Winning Digit</div>
                      {isAdmin ? (
                        <ScoreSetter active={active} results={results} onSet={setScores} onClear={clearScores} />
                      ) : (
                        <div className={`${styles.textSmall} ${styles.opacity70}`}>
                          Admin required to set scores.
                        </div>
                      )}
                      <div className={`${styles.textSmall} ${styles.opacity70}`}>
                        Winning digit: <b>{winDigit ?? "—"}</b>
                      </div>
                    </div>

                    {/* Totals */}
                    <div className={styles.panel}>
                      <div className={styles.sectionTitle}>Totals</div>
                      <ul className={`${styles.list} ${styles.textSmall}`}>
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

              {/* Groups & Results */}
              <Card title="Groups (0–9) & Results">
                {active ? (
                  <div className={styles.stackLarge}>
                    {activeGroups.length === 0 ? (
                      <div className={`${styles.textSmall} ${styles.opacity70}`}>
                        No sticks yet. Sell some!
                      </div>
                    ) : (
                      activeGroups.map((g, idx) => (
                        <div key={g.id} className={styles.panel}>
                          <div className={styles.panelHeader}>
                            <div className={styles.fontSemibold}>Group #{idx + 1}</div>
                            <div className={`${styles.textXs} ${styles.opacity70}`}>
                              {g.sticks.length}/10 filled
                            </div>
                          </div>
                          <GroupGrid sticks={g.sticks} winDigit={winDigit} />
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
