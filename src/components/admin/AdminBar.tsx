"use client";

import { useState } from "react";

type AdminBarProps = {
  adminPin: string | null;
  isAdmin: boolean;
  onSetPin: (pin: string) => void;
  onLogin: (pin: string) => void;
  onLogout: () => void;
  onClearPin: () => void;
};

export function AdminBar({ adminPin, isAdmin, onSetPin, onLogin, onLogout, onClearPin }: AdminBarProps) {
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
