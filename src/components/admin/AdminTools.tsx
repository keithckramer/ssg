"use client";

import { useEffect, useState } from "react";

import { useSportsSticks } from "@/components/providers/SportsSticksProvider";

type AdminToolsProps = {
  className?: string;
};

export function AdminTools({ className }: AdminToolsProps) {
  const { adminPin, isAdmin, handleSetPin, handleLogin, handleLogout, handleClearPin } = useSportsSticks();
  const [pinInput, setPinInput] = useState("");
  const [newPin, setNewPin] = useState("");
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(() => setMessage(null), 2500);
    return () => clearTimeout(timer);
  }, [message]);

  const cardClasses = ["ssg-card", "space-y-4"];
  if (className) cardClasses.push(className);

  return (
    <section className={cardClasses.join(" ")}>
      <header className="space-y-1">
        <h2 className="text-lg font-semibold">Admin access</h2>
        <p className="text-sm text-slate-500">
          Manage the local admin PIN to unlock board management tools.
        </p>
      </header>

      <div className="space-y-3">
        <div className="text-sm text-slate-600">
          Status: <span className="font-semibold text-slate-900">{isAdmin ? "Logged in" : "Logged out"}</span>
        </div>

        {adminPin ? (
          <div className="space-y-3">
            {!isAdmin ? (
              <div className="flex flex-wrap items-center gap-3">
                <input
                  className="ssg-input w-32"
                  placeholder="Enter PIN"
                  value={pinInput}
                  onChange={(event) => setPinInput(event.target.value.replace(/[^0-9]/g, ""))}
                  aria-label="Enter admin PIN"
                  inputMode="numeric"
                />
                <button
                  className="ssg-btn-dark ssg-btn-sm"
                  type="button"
                  onClick={() => {
                    if (!pinInput) {
                      setMessage("Enter your PIN to login.");
                      return;
                    }
                    handleLogin(pinInput);
                    setPinInput("");
                  }}
                >
                  Login
                </button>
              </div>
            ) : null}

            {isAdmin ? (
              <div className="flex flex-wrap items-center gap-3">
                <button
                  className="ssg-btn ssg-btn-sm"
                  type="button"
                  onClick={() => {
                    handleLogout();
                    setMessage("Admin logged out");
                  }}
                >
                  Logout
                </button>
                <button
                  className="ssg-btn ssg-btn-sm"
                  type="button"
                  onClick={() => {
                    handleClearPin();
                    setMessage("PIN removed");
                  }}
                >
                  Remove PIN
                </button>
              </div>
            ) : null}
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-slate-600">
              Set a 4+ digit PIN to secure admin-only controls on this device.
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <input
                className="ssg-input w-40"
                placeholder="Create new PIN"
                value={newPin}
                onChange={(event) => setNewPin(event.target.value.replace(/[^0-9]/g, ""))}
                aria-label="Create admin PIN"
                inputMode="numeric"
              />
              <button
                className="ssg-btn-dark ssg-btn-sm"
                type="button"
                onClick={() => {
                  if (!newPin || newPin.length < 4) {
                    setMessage("PIN must be at least 4 digits.");
                    return;
                  }
                  handleSetPin(newPin);
                  setNewPin("");
                  setMessage("PIN saved");
                }}
              >
                Save PIN
              </button>
            </div>
            <p className="text-xs text-slate-500">PINs are stored locally and never leave this browser.</p>
          </div>
        )}
      </div>

      {message ? <div className="text-xs font-medium text-slate-500">{message}</div> : null}
    </section>
  );
}

export default AdminTools;
