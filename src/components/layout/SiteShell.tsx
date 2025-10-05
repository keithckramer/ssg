"use client";

import React, { useState } from "react";
import { useSportsSticks } from "@/components/providers/SportsSticksProvider";

type SiteShellProps = {
  children: React.ReactNode;
};

export default function SiteShell({ children }: SiteShellProps) {
  const {
    exportJson,
    importJson,
    resetAll,
    adminPin,
    isAdmin,
    handleSetPin,
    handleLogin,
    handleLogout,
    handleClearPin,
  } = useSportsSticks();

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
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) importJson(file);
                e.target.value = "";
              }}
            />
          </label>
          <button className="btn-ghost" onClick={resetAll}>Reset Data</button>
        </div>
        {children}
        <Footer />
      </div>
      <Styles />
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
          <span className="text-sm">Status: <b>{isAdmin ? "Logged in" : "Logged out"}</b></span>
          {isAdmin ? (
            <>
              <button className="btn-ghost" onClick={onLogout}>Logout</button>
              <button className="btn-ghost" onClick={onClearPin}>Remove PIN</button>
            </>
          ) : (
            <>
              <input
                className="input input-sm"
                placeholder="Enter PIN"
                value={pinInput}
                onChange={(e) => setPinInput(e.target.value.replace(/[^0-9]/g, ""))}
              />
              <button className="btn" onClick={() => { onLogin(pinInput); setPinInput(""); }}>Login</button>
            </>
          )}
        </div>
      ) : (
        <div className="flex gap-2 items-center flex-wrap">
          <input
            className="input input-sm"
            placeholder="Set new PIN (4+ digits)"
            value={newPin}
            onChange={(e) => setNewPin(e.target.value.replace(/[^0-9]/g, ""))}
          />
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

function Styles() {
  return (
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
  );
}

export function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="card">
      <h3 className="font-semibold">{title}</h3>
      {children}
    </div>
  );
}
