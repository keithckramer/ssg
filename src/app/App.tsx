"use client";
import React, { useMemo, useState, useEffect } from "react";
import { asMoney, clampInt, fmtDate, possibleWinnings, toNumber } from "@/lib/game";
// NOTE: App.css not used in this sandbox; styles are inlined below.

// ----------------------------- Types -----------------------------
export type Matchup = { id: string; home: string; away: string; kickoff: string };
export type Stick = { id: string; buyer: string; number: number; price: number; fee: number; createdAt: string };
export type Group = { id: string; sticks: Stick[] };
export type OrdersMap = Record<string, Group[]>;
export type ResultsEntry = { homeScore: number; awayScore: number; digit: number } | null;
export type ResultsMap = Record<string, ResultsEntry>;
export type Config = { potPerStick: number };

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
      const parsed = JSON.parse(text) as any;
      const d = parsed?.data ?? parsed; // accept either wrapper or raw
      if (!d) throw new Error('Invalid file');
      setMatchups(Array.isArray(d.matchups) ? (d.matchups as Matchup[]) : []);
      setActiveId((d.activeId as string | null) ?? null);
      setConfig((d.config as Config) ?? defaultConfig);
      setOrders((d.orders as OrdersMap) ?? {});
      setResults((d.results as ResultsMap) ?? {});
    } catch (e: any) {
      alert('Import failed: ' + (e?.message || 'Unknown error'));
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
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <div className="max-w-6xl mx-auto p-4 md:p-8">
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
        <div className="flex flex-wrap gap-2 mt-4">
          <button className="btn" onClick={exportJson}>Export JSON</button>
          <label className="btn-ghost cursor-pointer">
            Import JSON
            <input type="file" accept="application/json" style={{ display: 'none' }}
                   onChange={(e: React.ChangeEvent<HTMLInputElement>) => importJson(e.target.files?.[0])} />
          </label>
          <button className="btn-ghost" onClick={resetAll}>Reset Data</button>
        </div>

        {/* ROUTES */}
        {view === 'home' ? (
          <div className="grid lg:grid-cols-3 gap-6 mt-6">
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
                <div className="rounded-xl border p-3 bg-white text-sm opacity-70">Admin required to add a matchup.</div>
              )}
            </Card>
          </div>
        ) : (
          // GAME VIEW
          <div className="mt-6 space-y-4">
            <div className="flex items-center justify-between">
              <button className="btn-ghost" onClick={() => setView('home')}>← Back to Matchups</button>
              {active ? (
                <div className="pill">{active.home} vs {active.away}</div>
              ) : <span />}
            </div>

            <div className="grid lg:grid-cols-2 gap-6">
              {/* Game & Sticks */}
              <Card title="Game & Sticks">
                {active ? (
                  <div className="space-y-4">
                    <div className="rounded-xl border p-3 bg-white">
                      <div className="font-semibold text-lg">{active.home} vs {active.away}</div>
                      <div className="text-sm opacity-70">Kickoff: {fmtDate(active.kickoff)}</div>
                    </div>

                    {/* Pot per stick: label only */}
                    <div className="rounded-xl border p-3 bg-white space-y-3">
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-sm">Pot per stick</span>
                        <span className="text-sm font-semibold">${toNumber(config.potPerStick).toFixed(2)}</span>
                      </div>
                    </div>

                    {/* Buy flow */}
                    <BuyPanel onBuy={buySticks} />

                    {/* Scores */}
                    <div className="rounded-xl border p-3 bg-white space-y-2">
                      <div className="font-semibold">Final Score → Winning Digit</div>
                      {isAdmin ? (
                        <ScoreSetter active={active} results={results} onSet={setScores} onClear={clearScores} />
                      ) : (
                        <div className="text-sm opacity-70">Admin required to set scores.</div>
                      )}
                      <div className="text-sm opacity-70">Winning digit: <b>{winDigit ?? "—"}</b></div>
                    </div>

                    {/* Totals */}
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

              {/* Groups & Results */}
              <Card title="Groups (0–9) & Results">
                {active ? (
                  <div className="space-y-4">
                    {activeGroups.length === 0 ? (
                      <div className="text-sm opacity-70">No sticks yet. Sell some!</div>
                    ) : (
                      activeGroups.map((g, idx) => (
                        <div key={g.id} className="rounded-xl border p-3 bg-white">
                          <div className="flex items-center justify-between mb-2">
                            <div className="font-semibold">Group #{idx + 1}</div>
                            <div className="text-xs opacity-70">{g.sticks.length}/10 filled</div>
                          </div>
                          <GroupGrid sticks={g.sticks} winDigit={winDigit} />
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

      {/* Styles */}
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

function Header() {
  return (
    <div className="flex flex-col md:flex-row items-start md:items-center gap-3 md:gap-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold">Sports Sticks – Mini MVP</h1>
        <p className="muted">Each group holds numbers 0–9. (home+away) % 10 decides the winner.</p>
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
    <div className="mt-3 rounded-xl border p-3 bg-white flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
      <div className="font-semibold">Admin</div>
      {adminPin ? (
        <div className="flex gap-2 items-center flex-wrap">
          <span className="text-sm">Status: <b>{isAdmin ? 'Logged in' : 'Logged out'}</b></span>
          {isAdmin ? (
            <>
              <button className="btn-ghost" onClick={onLogout}>Logout</button>
              <button className="btn-ghost" onClick={onClearPin}>Remove PIN</button>
            </>
          ) : (
            <>
              <input className="input input-sm" placeholder="Enter PIN" value={pinInput}
                     onChange={e => setPinInput(e.target.value.replace(/[^0-9]/g, ''))} />
              <button className="btn" onClick={() => { onLogin(pinInput); setPinInput(""); }}>Login</button>
            </>
          )}
        </div>
      ) : (
        <div className="flex gap-2 items-center flex-wrap">
          <input className="input input-sm" placeholder="Set new PIN (4+ digits)" value={newPin}
                 onChange={e => setNewPin(e.target.value.replace(/[^0-9]/g, ''))} />
          <button className="btn" onClick={() => { onSetPin(newPin); setNewPin(""); }}>Set PIN</button>
          <span className="text-xs opacity-70">(This PIN stays only on this device)</span>
        </div>
      )}
    </div>
  );
}

function Footer() {
  return (
    <div className="mt-8 text-center text-xs text-slate-500">
      Built fast. Iterate later with auth, payments, live NFL feeds.
    </div>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="card">
      <h3 className="font-semibold">{title}</h3>
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
    <div className="rounded-xl border p-2 bg-white mb-3 max-h-[240px] overflow-auto">
      {matchups.length === 0 ? (
        <div className="text-sm opacity-70 p-2">No matchups yet.</div>
      ) : (
        <ul className="space-y-1">
          {matchups.map((m) => (
            <li key={m.id} className="flex items-center justify-between gap-2 p-2 rounded-lg hover:bg-slate-50">
              <button onClick={() => setActiveId(m.id)}
                className={"kckStyle text-sm text-left flex-1 " + (activeId === m.id ? "font-semibold" : "")}
                title={m.kickoff}>
                {m.home} vs {m.away}
                <span className="block text-[11px] opacity-60">{fmtDate(m.kickoff)}</span>
              </button>
              {onRemove ? (
                <button className="kckStyle pill pill-ghost" onClick={() => onRemove(m.id)}>Remove</button>
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

function AddMatchup({ onAdd }: { onAdd: (home: string, away: string, kickoff: string) => void }) {
  const [home, setHome] = useState("");
  const [away, setAway] = useState("");
  const [kickoff, setKickoff] = useState("");

  return (
    <div className="rounded-xl border p-3 bg-white space-y-2">
      <div className="kckStyle2 text-sm font-medium">Add a matchup</div>
      <div className="grid grid-cols-2 gap-2">
        <input className="kckStyle input text-left" placeholder="Home" value={home} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setHome(e.target.value)} />
        <input className="kckStyle input text-left" placeholder="Away" value={away} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setAway(e.target.value)} />
      </div>
      <input className="input input-wide text-left" type="datetime-local" value={kickoff} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setKickoff(e.target.value)} />
      <button className="btn w-full" onClick={() => {
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
    <div className="rounded-xl border p-3 bg-white">
      <div className="font-semibold mb-2">Sell sticks</div>
      <div className="grid grid-cols-3 gap-2 items-center">
        <input className="input col-span-2 text-left" placeholder="Buyer name (optional)" value={buyer}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setBuyer(e.target.value)} />
        <input className="input input-sm" type="number" min={1} max={10} value={qty}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setQty(clampInt(e.target.value, 1, 10))} />
      </div>
      <div className="flex gap-2 mt-2">
        <button className="btn flex-1" onClick={() => onBuy(buyer, qty)}>Buy</button>
        <button className="btn-ghost" onClick={() => { setBuyer(""); setQty(1); }}>Clear</button>
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
    <div className="grid grid-cols-3 gap-2 items-center">
      <input className="input input-sm" placeholder={`${active.home} score`} value={hs}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setHs(e.target.value.replace(/[^0-9]/g, ""))} />
      <input className="input input-sm" placeholder={`${active.away} score`} value={as}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setAs(e.target.value.replace(/[^0-9]/g, ""))} />
      <div className="flex gap-2">
        <button className="btn" onClick={() => onSet(Number(hs||0), Number(as||0))}>Set</button>
        <button className="btn-ghost" onClick={onClear}>Clear</button>
      </div>
    </div>
  );
}

function GroupGrid({ sticks, winDigit }: { sticks: Stick[]; winDigit: number | null }) {
  const slotMap = new Map(sticks.map(s => [s.number, s] as const));
  const slots = Array.from({ length: 10 }, (_, i) => ({ num: i, s: slotMap.get(i) || null }));
  return (
    <div className="grid grid-cols-5 gap-2">
      {slots.map(({ num, s }) => (
        <div
          key={num}
          className={"slot " + (winDigit !== null && num === winDigit ? "win" : "")}
          title={s ? `Buyer: ${s.buyer}\nPaid: $${Number(s.price).toFixed(2)}\nAt: ${fmtDate(s.createdAt)}` : ""}
        >
          <div className="text-[11px] opacity-60">#{num}</div>
          <div className="text-sm">{s ? s.buyer : "—"}</div>
        </div>
      ))}
    </div>
  );
}

