"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import Link from "next/link";

import { MatchupPicker } from "@/components/matchups/MatchupPicker";
import { useSportsSticks } from "@/components/providers/SportsSticksProvider";
import { useAuth } from "@/context/AuthContext";

import styles from "./admin.module.css";

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
  const { matchups, addMatchup, removeMatchup } = useSportsSticks();

  const [homeTeam, setHomeTeam] = useState("");
  const [awayTeam, setAwayTeam] = useState("");
  const [kickoff, setKickoff] = useState(() => kickoffPlaceholder());
  const [activeMatchupId, setActiveMatchupId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<Feedback | null>(null);

  useEffect(() => {
    setActiveMatchupId((current) => {
      if (!matchups.length) return null;
      if (current && matchups.some((m) => m.id === current)) return current;
      return matchups[0]?.id ?? null;
    });
  }, [matchups]);

  useEffect(() => {
    if (!feedback) return;
    const timer = setTimeout(() => setFeedback(null), 4000);
    return () => clearTimeout(timer);
  }, [feedback]);

  const isAdmin = user && user.role === "admin";

  const handleCreate = useCallback(
    (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      const nextFeedback: Feedback = { type: "error", message: "" };

      const home = homeTeam.trim();
      const away = awayTeam.trim();
      if (!home || !away) {
        nextFeedback.message = "Enter both home and away teams to create a matchup.";
        setFeedback(nextFeedback);
        return;
      }

      if (!kickoff) {
        nextFeedback.message = "Select a kickoff date and time.";
        setFeedback(nextFeedback);
        return;
      }

      const kickoffDate = new Date(kickoff);
      if (Number.isNaN(kickoffDate.getTime())) {
        nextFeedback.message = "Kickoff must be a valid date.";
        setFeedback(nextFeedback);
        return;
      }

      const createdId = addMatchup(home, away, kickoffDate.toISOString());
      setHomeTeam("");
      setAwayTeam("");
      setKickoff(kickoffPlaceholder());
      setActiveMatchupId(createdId);
      setFeedback({ type: "success", message: "Matchup created successfully." });
    },
    [addMatchup, homeTeam, awayTeam, kickoff],
  );

  const handleRemove = useCallback(
    (id: string) => {
      removeMatchup(id);
      setFeedback({ type: "success", message: "Matchup removed." });
    },
    [removeMatchup],
  );

  if (!isAdmin) {
    return (
      <div className={styles.page}>
        <section className={`${styles.card} ${styles.denied}`}>
          <h1>403 – Friendly stick block</h1>
          <p>You need an admin account to access this dashboard.</p>
          <Link href="/">Return home</Link>
        </section>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <section className={`${styles.card} ${styles.heroCard}`}>
        <span className={styles.badge}>Admin</span>
        <h1 className={styles.title}>Admin Dashboard</h1>
        <p className={styles.description}>
          Keep the SSG universe running smoothly. This space will grow into analytics, matchup management, and invite
          approvals.
        </p>
        <div className={styles.actions}>
          <Link href="/game" className={styles.actionLink}>
            Matchups
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path fill="currentColor" d="M5 11h10.59l-3.3-3.29L13 6l5 5-5 5-0.71-1.71L15.59 13H5z" />
            </svg>
          </Link>
        </div>
      </section>

      <section className={`${styles.card} ${styles.matchupCard}`}>
        <header className={styles.cardHeader}>
          <div>
            <h2 className={styles.cardTitle}>Matchup Control</h2>
            <p className={styles.cardSubtitle}>Add fresh games and retire old ones to keep the board current.</p>
          </div>
        </header>

        <form onSubmit={handleCreate} className={styles.form}>
          <div className={styles.fieldRow}>
            <label className={styles.field}>
              <span>Home team</span>
              <input
                className={styles.input}
                value={homeTeam}
                onChange={(event) => setHomeTeam(event.target.value)}
                placeholder="Home team"
              />
            </label>
            <label className={styles.field}>
              <span>Away team</span>
              <input
                className={styles.input}
                value={awayTeam}
                onChange={(event) => setAwayTeam(event.target.value)}
                placeholder="Away team"
              />
            </label>
          </div>
          <label className={`${styles.field} ${styles.fullWidth}`}>
            <span>Kickoff</span>
            <input
              type="datetime-local"
              className={styles.input}
              value={kickoff}
              onChange={(event) => setKickoff(event.target.value)}
            />
          </label>
          <div className={styles.formActions}>
            <button type="submit" className={styles.submit}>
              Create matchup
            </button>
          </div>
        </form>

        {feedback && (
          <div className={`${styles.feedback} ${feedback.type === "success" ? styles.feedbackSuccess : styles.feedbackError}`}>
            {feedback.message}
          </div>
        )}

        <div className={styles.listWrapper}>
          <MatchupPicker
            matchups={matchups}
            activeId={activeMatchupId}
            onSelect={setActiveMatchupId}
            onRemove={handleRemove}
          />
        </div>
      </section>

      <section className={`${styles.card} ${styles.inviteCard}`}>
        <header className={styles.cardHeader}>
          <div>
            <h2 className={styles.cardTitle}>Invite Manager</h2>
            <p className={styles.cardSubtitle}>
              Send new invitations, monitor outstanding tokens, and revoke access when plans change.
            </p>
          </div>
        </header>
        <div className={styles.inviteContent}>
          <p>
            Head to the invite console to issue new tokens or follow up on pending invites. It&apos;s the easiest way to
            welcome players into the latest stick battles.
          </p>
          <Link href="/invites" className={styles.primaryLink}>
            Open invite console
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path fill="currentColor" d="M5 11h10.59l-3.3-3.29L13 6l5 5-5 5-0.71-1.71L15.59 13H5z" />
            </svg>
          </Link>
        </div>
      </section>
    </div>
  );
}
