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
        /* Force light theme regardless of Next.js globals.css variables */
        :root { --background: 248 250 252; --foreground: 15 23 42; }
        html, body { background: rgb(248, 250, 252) !important; color: #0f172a !important; }
        body { font-family: "Inter", "Segoe UI", -apple-system, BlinkMacSystemFont, sans-serif; }
        button, input, label { font: inherit; }
        .min-h-screen { min-height: 100vh; }
        .bg-slate-50 { background-color: #f8fafc; }
        .text-slate-900 { color: #0f172a; }
        .bg-white { background-color: #ffffff; }
        .text-slate-500 { color: #64748b; }
        .text-sm { font-size: 0.875rem; line-height: 1.25rem; }
        .text-xs { font-size: 0.75rem; line-height: 1rem; }
        .text-lg { font-size: 1.125rem; line-height: 1.75rem; }
        .text-2xl { font-size: 1.5rem; line-height: 2rem; }
        @media (min-width: 768px) {
          .md\:text-3xl { font-size: 1.875rem; line-height: 2.25rem; }
        }
        .font-bold { font-weight: 700; }
        .font-semibold { font-weight: 600; }
        .font-medium { font-weight: 500; }
        .flex { display: flex; }
        .grid { display: grid; }
        .block { display: block; }
        .flex-col { flex-direction: column; }
        .flex-wrap { flex-wrap: wrap; }
        .flex-1 { flex: 1 1 0%; }
        .items-start { align-items: flex-start; }
        .items-center { align-items: center; }
        .justify-between { justify-content: space-between; }
        .text-center { text-align: center; }
        .text-left { text-align: left !important; }
        .w-full { width: 100%; }
        .mx-auto { margin-left: auto; margin-right: auto; }
        .cursor-pointer { cursor: pointer; }
        .overflow-auto { overflow: auto; }
        .max-w-6xl { max-width: 72rem; }
        .max-w-2xl { max-width: 42rem; }
        .p-2 { padding: 0.5rem; }
        .p-3 { padding: 0.75rem; }
        .p-4 { padding: 1rem; }
        .mt-2 { margin-top: 0.5rem; }
        .mt-3 { margin-top: 0.75rem; }
        .mt-4 { margin-top: 1rem; }
        .mt-6 { margin-top: 1.5rem; }
        .mt-8 { margin-top: 2rem; }
        .mb-2 { margin-bottom: 0.5rem; }
        .mb-3 { margin-bottom: 0.75rem; }
        .gap-2 { gap: 0.5rem; }
        .gap-3 { gap: 0.75rem; }
        .gap-6 { gap: 1.5rem; }
        .rounded-lg { border-radius: 0.5rem; }
        .rounded-xl { border-radius: 0.75rem; }
        .border { border: 1px solid #e2e8f0; }
        .grid-cols-2 { grid-template-columns: repeat(2, minmax(0, 1fr)); }
        .grid-cols-3 { grid-template-columns: repeat(3, minmax(0, 1fr)); }
        .grid-cols-5 { grid-template-columns: repeat(5, minmax(0, 1fr)); }
        .col-span-2 { grid-column: span 2 / span 2; }
        .max-h-\[240px\] { max-height: 240px; }
        .text-\[11px\] { font-size: 11px; line-height: 1rem; }
        .opacity-50 { opacity: 0.5; }
        .opacity-60 { opacity: 0.6; }
        .opacity-70 { opacity: 0.7; }
        .opacity-80 { opacity: 0.8; }
        .text-slate-500 { color: #64748b; }
        .hover\:bg-slate-50:hover { background-color: #f8fafc; }
        @media (min-width: 768px) {
          .md\:p-8 { padding: 2rem; }
          .md\:flex-row { flex-direction: row; }
          .md\:items-center { align-items: center; }
          .md\:gap-6 { gap: 1.5rem; }
          .md\:justify-between { justify-content: space-between; }
        }
        @media (min-width: 1024px) {
          .lg\:grid-cols-2 { grid-template-columns: repeat(2, minmax(0, 1fr)); }
          .lg\:grid-cols-3 { grid-template-columns: repeat(3, minmax(0, 1fr)); }
        }
        .btn, .btn-ghost, .pill, .pill-ghost { display: inline-flex; align-items: center; justify-content: center; gap: 0.35rem; font-weight: 600; transition: transform 0.15s ease, box-shadow 0.2s ease, opacity 0.2s ease; text-decoration: none; }
        .btn { padding: 0.5rem 0.75rem; border-radius: 999px; background:#0f172a; color:#fff; font-size:0.9rem; box-shadow:0 2px 6px rgba(15,23,42,.18); border: none; cursor:pointer }
        .btn:hover { opacity:.95; transform: translateY(-1px); box-shadow:0 6px 20px rgba(15,23,42,.15); }
        .btn:focus-visible { outline: 2px solid rgba(15,23,42,.35); outline-offset: 2px; }
        .btn-ghost { padding: 0.5rem 0.75rem; border-radius: 999px; background:#fff; color:#0f172a; font-size:0.9rem; box-shadow:0 2px 8px rgba(15,23,42,.06); border:1px solid #e2e8f0; cursor:pointer }
        .btn-ghost:hover { background:#f8fafc; box-shadow:0 6px 20px rgba(15,23,42,.08); transform: translateY(-1px); }
        .btn-ghost:focus-visible { outline: 2px solid rgba(148,163,184,.7); outline-offset: 2px; }
        .pill { padding: 0.25rem 0.75rem; border-radius: 999px; background:#0f172a; color:#fff; font-size:0.75rem; border:none; cursor:pointer; letter-spacing: 0.02em; }
        .pill-ghost { background:#fff; color:#0f172a; border:1px solid #e2e8f0; box-shadow:0 2px 6px rgba(15,23,42,.05); }
        .input { padding:0.35rem 0.6rem; border-radius:0.75rem; border:1px solid #e2e8f0; text-align:right; background:#fff; color:#0f172a; transition: border-color 0.2s ease, box-shadow 0.2s ease; }
        .input:focus { border-color:#94a3b8; box-shadow:0 0 0 3px rgba(148,163,184,0.2); outline: none; }
        .input-sm { width: 6rem }
        .input-wide { width: 100% }
        .slot { padding: 0.5rem; border-radius:0.75rem; border:1px solid #e2e8f0; font-size:0.8rem; display:flex; flex-direction:column; gap:0.35rem; justify-content:center; background:#f8fafc; min-height:3.5rem; transition: border-color 0.2s ease, background 0.2s ease, box-shadow 0.2s ease; }
        .slot-paid { background:#dcfce7; border-color:#86efac; }
        .slot-unpaid { background:#fee2e2; border-color:#fca5a5; }
        .slot label { font-size:0.65rem; font-weight:600; color:#0f172a; }
        .slot input[type="checkbox"] { width:0.85rem; height:0.85rem; }
        .win { box-shadow:0 0 0 2px rgba(22,163,74,0.35); border-color:#16a34a; }
        .slot .text-sm { font-weight: 600; }
        .card { background:#fff; border:1px solid #e2e8f0; border-radius:1rem; padding:1rem; box-shadow:0 24px 60px rgba(15,23,42,.08); backdrop-filter: blur(6px); }
        .card h3 { margin:0 0 .5rem 0; font-size:1.05rem }
        .muted { color:#64748b; font-size:0.9rem }
        .kckStyle { font: inherit }
        .kckStyle2 { font: inherit }
        .space-y-4 > :not([hidden]) ~ :not([hidden]) { margin-top: 1rem; }
        .space-y-3 > :not([hidden]) ~ :not([hidden]) { margin-top: 0.75rem; }
        .space-y-2 > :not([hidden]) ~ :not([hidden]) { margin-top: 0.5rem; }
        .space-y-1 > :not([hidden]) ~ :not([hidden]) { margin-top: 0.25rem; }
        .modal-overlay { position: fixed; inset: 0; background: rgba(15,23,42,0.45); display: flex; justify-content: center; align-items: flex-end; padding: 1rem; z-index: 50; }
        @media (min-width: 768px) { .modal-overlay { align-items: center; padding: 2rem; } }
        .modal-panel { position: relative; background: #fff; border-radius: 1.5rem; width: 100%; max-width: 42rem; box-shadow: 0 30px 70px rgba(15,23,42,0.22); max-height: calc(100vh - 2rem); overflow-y: auto; padding: 1.5rem; display: flex; flex-direction: column; }
        @media (max-width: 767px) { .modal-panel { border-radius: 0; height: 100%; max-height: none; padding: 1.25rem; } }
        .modal-close { position: absolute; top: 1rem; right: 1rem; background: none; border: none; color: #64748b; font-size: 1.5rem; line-height: 1; cursor: pointer; }
        .modal-close:hover { color: #0f172a; }
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
