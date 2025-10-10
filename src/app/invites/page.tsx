"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";

import styles from "./invites.module.css";

type Invite = {
  id?: string;
  emailOrPhone?: string;
  token?: string;
  createdAt?: string;
  status?: string;
};

type Feedback = {
  type: "success" | "error";
  message: string;
};

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

export default function InvitesPage() {
  const [emailOrPhone, setId] = useState("");
  const [token, setToken] = useState("");
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [invites, setInvites] = useState<Invite[]>([]);

  const adminKey = process.env.NEXT_PUBLIC_ADMIN_KEY || "";

  const sortedInvites = useMemo(() => {
    return [...invites].sort((a, b) => {
      const aDate = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const bDate = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return bDate - aDate;
    });
  }, [invites]);

  useEffect(() => {
    if (!feedback) return;
    const timer = window.setTimeout(() => setFeedback(null), 4000);
    return () => window.clearTimeout(timer);
  }, [feedback]);

  const loadInvites = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`${API}/invites`, {
        headers: adminKey ? { "x-admin-key": adminKey } : undefined,
      });
      if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
      const json = await res.json();
      const nextInvites: Invite[] = Array.isArray(json)
        ? json
        : Array.isArray(json?.invites)
        ? json.invites
        : [];
      setInvites(nextInvites);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to load invites.";
      setFeedback({ type: "error", message });
    } finally {
      setIsLoading(false);
    }
  }, [adminKey]);

  useEffect(() => {
    loadInvites();
  }, [loadInvites]);

  const createInvite = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      const identifier = emailOrPhone.trim();
      if (!identifier) {
        setFeedback({ type: "error", message: "Enter an email or phone number before creating an invite." });
        return;
      }

      setIsSubmitting(true);
      try {
        const res = await fetch(`${API}/invites`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(adminKey ? { "x-admin-key": adminKey } : {}),
          },
          body: JSON.stringify({ emailOrPhone: identifier }),
        });
        if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
        const json = await res.json();
        setToken(json.token ?? "");
        setFeedback({ type: "success", message: "Invite created. Copy the token and share it with the recipient." });
        setId("");
        loadInvites();
      } catch (error) {
        const message = error instanceof Error ? error.message : "Failed to create invite.";
        setFeedback({ type: "error", message });
      } finally {
        setIsSubmitting(false);
      }
    },
    [adminKey, emailOrPhone, loadInvites],
  );

  const handleCopyToken = useCallback((value: string) => {
    if (!value) return;
    if (typeof navigator === "undefined" || !navigator.clipboard) {
      setFeedback({ type: "error", message: "Clipboard access is not available in this environment." });
      return;
    }
    navigator.clipboard
      .writeText(value)
      .then(() => setFeedback({ type: "success", message: "Token copied to clipboard." }))
      .catch(() => setFeedback({ type: "error", message: "Unable to copy token." }));
  }, []);

  const revokeInvite = useCallback(
    async (invite: Invite) => {
      const identifier = invite.id ?? invite.token;
      if (!identifier) {
        setFeedback({ type: "error", message: "This invite is missing an identifier." });
        return;
      }
      try {
        const res = await fetch(`${API}/invites/${identifier}`, {
          method: "DELETE",
          headers: adminKey ? { "x-admin-key": adminKey } : undefined,
        });
        if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
        setFeedback({ type: "success", message: "Invite revoked." });
        setInvites((prev) => prev.filter((item) => (item.id ?? item.token) !== identifier));
      } catch (error) {
        const message = error instanceof Error ? error.message : "Failed to revoke invite.";
        setFeedback({ type: "error", message });
      }
    },
    [adminKey],
  );

  return (
    <div className={styles.page}>
      <section className={styles.card}>
        <header className={styles.header}>
          <h1 className={styles.title}>Invite Console</h1>
          <p className={styles.subtitle}>
            Create new access tokens for the Sports Stick Game and review outstanding invites. Tokens can be sent via
            email or text.
          </p>
        </header>

        <form onSubmit={createInvite} className={styles.form}>
          <div className={styles.fieldRow}>
            <label className={styles.field}>
              <span>Email or phone</span>
              <input
                className={styles.input}
                value={emailOrPhone}
                onChange={(event) => setId(event.target.value)}
                placeholder="player@example.com"
              />
            </label>
          </div>
          <div className={styles.actions}>
            <button type="submit" className={styles.submit} disabled={isSubmitting}>
              {isSubmitting ? "Creating..." : "Create invite"}
            </button>
          </div>
        </form>

        {feedback && (
          <div className={`${styles.feedback} ${feedback.type === "success" ? styles.success : styles.error}`}>
            {feedback.message}
          </div>
        )}

        {token && (
          <div className={styles.tokenBox}>
            Invite Token: {token}
            <div className={styles.actions}>
              <button type="button" className={styles.secondaryButton} onClick={() => handleCopyToken(token)}>
                Copy token
              </button>
            </div>
          </div>
        )}
      </section>

      <section className={styles.card}>
        <header className={styles.header}>
          <h2 className={styles.sectionTitle}>Active invites</h2>
          <p className={styles.subtitle}>
            Track who still needs to join and revoke tokens when you need to free up a slot.
          </p>
        </header>

        {isLoading ? (
          <div className={styles.emptyState}>Loading invites…</div>
        ) : sortedInvites.length === 0 ? (
          <div className={styles.emptyState}>No invites yet. Create one above to get started.</div>
        ) : (
          <div className={styles.inviteList}>
            {sortedInvites.map((invite) => {
              const identifier = invite.id ?? invite.token ?? "";
              return (
                <article key={identifier} className={styles.inviteRow}>
                  <div className={styles.inviteMeta}>
                    <span>{invite.emailOrPhone ?? "Unknown recipient"}</span>
                    {invite.createdAt && (
                      <span>{new Date(invite.createdAt).toLocaleString()}</span>
                    )}
                    {invite.status && <span>Status: {invite.status}</span>}
                  </div>
                  {invite.token && <div className={styles.inviteToken}>Token: {invite.token}</div>}
                  <div className={styles.inviteActions}>
                    {invite.token && (
                      <button
                        type="button"
                        className={styles.secondaryButton}
                        onClick={() => handleCopyToken(invite.token ?? "")}
                      >
                        Copy token
                      </button>
                    )}
                    <button type="button" className={styles.dangerButton} onClick={() => revokeInvite(invite)}>
                      Revoke invite
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
