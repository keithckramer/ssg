"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import Link from "next/link";

import SiteShell from "@/components/layout/SiteShell";
import { AdminTools } from "@/components/admin/AdminTools";
import { DataTools } from "@/components/admin/DataTools";
import { WinningDigitInline } from "@/components/admin/WinningDigitInline";
import { fmtDate, useSportsSticks } from "@/components/providers/SportsSticksProvider";
import { useAuth } from "@/context/AuthContext";

type Feedback = {
  type: "success" | "error";
  message: string;
};

const kickoffPlaceholder = (): string => {
  const now = new Date();
  now.setMinutes(0, 0, 0);
  return now.toISOString().slice(0, 16);
};

export default function AdminPage() {
  const { user } = useAuth();
  const { matchups, addMatchup, removeMatchup, results } = useSportsSticks();

  const [homeTeam, setHomeTeam] = useState("");
  const [awayTeam, setAwayTeam] = useState("");
  const [kickoff, setKickoff] = useState(() => kickoffPlaceholder());
  const [feedback, setFeedback] = useState<Feedback | null>(null);

  useEffect(() => {
    if (!feedback) return;
    const timer = setTimeout(() => setFeedback(null), 3200);
    return () => clearTimeout(timer);
  }, [feedback]);

  const isAdminUser = user?.role === "admin";

  const handleCreate = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmedHome = homeTeam.trim();
    const trimmedAway = awayTeam.trim();

    if (!trimmedHome || !trimmedAway) {
      setFeedback({ type: "error", message: "Enter both home and away teams." });
      return;
    }

    if (!kickoff) {
      setFeedback({ type: "error", message: "Select a kickoff date and time." });
      return;
    }

    const kickoffDate = new Date(kickoff);
    if (Number.isNaN(kickoffDate.getTime())) {
      setFeedback({ type: "error", message: "Kickoff must be a valid date." });
      return;
    }

    addMatchup(trimmedHome, trimmedAway, kickoffDate.toISOString());
    setHomeTeam("");
    setAwayTeam("");
    setKickoff(kickoffPlaceholder());
    setFeedback({ type: "success", message: "Matchup created successfully." });
  };

  const handleRemove = (id: string) => {
    removeMatchup(id);
    setFeedback({ type: "success", message: "Matchup removed." });
  };

  const matchupEntries = useMemo(
    () =>
      matchups.map((matchup) => ({
        matchup,
        result: results[matchup.id] ?? null,
      })),
    [matchups, results],
  );

  if (!isAdminUser) {
    return (
      <SiteShell>
        <div className="mt-6 space-y-4">
          <section className="ssg-card space-y-3">
            <h1 className="text-xl font-semibold">403 – Friendly stick block</h1>
            <p className="text-sm text-slate-600">
              You need an admin account to access this dashboard.
            </p>
            <Link href="/" className="ssg-btn ssg-btn-sm" aria-label="Return to matchups">
              Return home
            </Link>
          </section>
        </div>
      </SiteShell>
    );
  }

  return (
    <SiteShell>
      <div className="mt-6 space-y-4">
        <AdminTools />
        <DataTools />

        <section className="ssg-card space-y-4">
          <header className="space-y-1">
            <h2 className="text-lg font-semibold">Matchups</h2>
            <p className="text-sm text-slate-500">Create new games and set winning digits once scores are final.</p>
          </header>

          <form onSubmit={handleCreate} className="space-y-3">
            <div className="flex flex-wrap gap-3">
              <label className="flex-1 space-y-2" style={{ minWidth: "180px" }}>
                <span className="text-sm font-medium text-slate-600">Home team</span>
                <input
                  className="ssg-input"
                  value={homeTeam}
                  onChange={(event) => setHomeTeam(event.target.value)}
                  placeholder="Home team"
                  aria-label="Home team"
                />
              </label>
              <label className="flex-1 space-y-2" style={{ minWidth: "180px" }}>
                <span className="text-sm font-medium text-slate-600">Away team</span>
                <input
                  className="ssg-input"
                  value={awayTeam}
                  onChange={(event) => setAwayTeam(event.target.value)}
                  placeholder="Away team"
                  aria-label="Away team"
                />
              </label>
            </div>
            <label className="flex flex-col space-y-2" style={{ minWidth: "220px" }}>
              <span className="text-sm font-medium text-slate-600">Kickoff</span>
              <input
                type="datetime-local"
                className="ssg-input"
                value={kickoff}
                onChange={(event) => setKickoff(event.target.value)}
                aria-label="Kickoff date and time"
              />
            </label>
            <div className="flex justify-end">
              <button type="submit" className="ssg-btn-dark">
                Create matchup
              </button>
            </div>
          </form>

          {feedback ? (
            <div
              className="rounded-xl border p-3 text-sm font-medium"
              style={{
                background: feedback.type === "success" ? "rgba(16, 185, 129, 0.12)" : "rgba(239, 68, 68, 0.12)",
                borderColor: feedback.type === "success" ? "rgba(16, 185, 129, 0.4)" : "rgba(239, 68, 68, 0.45)",
                color: feedback.type === "success" ? "#047857" : "#b91c1c",
              }}
            >
              {feedback.message}
            </div>
          ) : null}

          <div className="space-y-3">
            {matchupEntries.length === 0 ? (
              <div className="text-sm text-slate-500">No matchups yet. Add one above to get started.</div>
            ) : (
              <ul className="space-y-3" aria-label="Matchup list">
                {matchupEntries.map(({ matchup, result }) => (
                  <li
                    key={matchup.id}
                    className="rounded-2xl border bg-white p-4 space-y-3"
                    style={{ borderColor: "rgba(148, 163, 184, 0.45)" }}
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="space-y-1">
                        <div className="text-base font-semibold text-slate-900">
                          {matchup.home} vs {matchup.away}
                        </div>
                        <div className="text-sm text-slate-500">Kickoff: {fmtDate(matchup.kickoff)}</div>
                      </div>
                      <button
                        type="button"
                        className="ssg-btn ssg-btn-sm"
                        onClick={() => handleRemove(matchup.id)}
                        aria-label={`Remove ${matchup.home} vs ${matchup.away}`}
                      >
                        Remove
                      </button>
                    </div>
                    <WinningDigitInline
                      matchupId={matchup.id}
                      homeTeam={matchup.home}
                      awayTeam={matchup.away}
                      homeScore={result?.homeScore ?? null}
                      awayScore={result?.awayScore ?? null}
                      winningDigit={result?.digit ?? null}
                    />
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>
      </div>
    </SiteShell>
  );
}
