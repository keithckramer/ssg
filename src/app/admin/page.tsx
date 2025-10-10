"use client";

import Link from "next/link";
import styles from "./admin.module.css";
import { useAuth } from "@/context/AuthContext";

export default function AdminPage() {
  const { user } = useAuth();

  if (!user || user.role !== "admin") {
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
      <section className={styles.card}>
        <span className={styles.badge}>Admin</span>
        <h1 className={styles.title}>Admin Dashboard</h1>
        <p className={styles.description}>
          Keep the SSG universe running smoothly. This space will grow into analytics, matchup
          management, and invite approvals.
        </p>
        <div className={styles.actions}>
          <Link href="/invites" className={styles.actionLink}>
            Manage Invites
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path fill="currentColor" d="M5 11h10.59l-3.3-3.29L13 6l5 5-5 5-0.71-1.71L15.59 13H5z" />
            </svg>
          </Link>
          <Link href="/game" className={styles.actionLink}>
            Matchups
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path fill="currentColor" d="M5 11h10.59l-3.3-3.29L13 6l5 5-5 5-0.71-1.71L15.59 13H5z" />
            </svg>
          </Link>
        </div>
      </section>
    </div>
  );
}
