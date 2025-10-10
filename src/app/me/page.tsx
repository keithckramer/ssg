"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo } from "react";
import styles from "./me.module.css";
import { useAuth } from "@/context/AuthContext";
import { getInitials } from "@/lib/ui";

export default function MePage() {
  const { user, logout } = useAuth();
  const router = useRouter();

  const avatarContent = useMemo(() => {
    if (!user) return null;
    if (user.image) {
      return <img src={user.image} alt={user.name} />;
    }
    return <span>{getInitials(user.name, user.email)}</span>;
  }, [user]);

  if (!user) {
    return (
      <div className={styles.page}>
        <div className={styles.emptyState}>
          <h1>You're not logged in yet</h1>
          <p>Sign in to sync your stick stats, manage invites, and keep your streak alive.</p>
          <Link href="/login">Log in</Link>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <section className={styles.card}>
        <div className={styles.avatar}>{avatarContent}</div>
        <div className={styles.info}>
          <h1 className={styles.name}>{user.name}</h1>
          <p className={styles.email}>{user.email}</p>
          {user.role ? <span className={styles.badge}>{user.role}</span> : null}
        </div>
        <div className={styles.actions}>
          <button
            type="button"
            className={`${styles.button} ${styles.primary}`}
            onClick={() => router.push("/game")}
          >
            View Matchups
          </button>
          <button
            type="button"
            className={`${styles.button} ${styles.secondary}`}
            onClick={() => {
              logout();
              router.push("/");
            }}
          >
            Log out
          </button>
        </div>
      </section>
    </div>
  );
}
