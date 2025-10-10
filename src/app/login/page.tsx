"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import styles from "../auth.module.css";
import { useAuth } from "@/context/AuthContext";

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState<{ type: "error" | "success"; text: string } | null>(null);
  const [isSubmitting, setSubmitting] = useState(false);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage(null);
    if (!email.trim()) {
      setMessage({ type: "error", text: "Please enter an email address." });
      return;
    }

    setSubmitting(true);
    try {
      login(email);
      setMessage({ type: "success", text: "You are logged in. Redirecting…" });
      router.push("/");
    } catch (error) {
      setMessage({ type: "error", text: error instanceof Error ? error.message : "Login failed" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.heading}>
        <h1 className={styles.title}>Log in</h1>
        <p className={styles.subtitle}>Enter your email to hop back into the action.</p>
      </div>

      <form className={styles.form} onSubmit={handleSubmit}>
        <label className={styles.label} htmlFor="email">
          Email
          <input
            id="email"
            type="email"
            inputMode="email"
            autoComplete="email"
            className={styles.input}
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="you@example.com"
            required
          />
        </label>

        <button type="submit" className={styles.submit} disabled={isSubmitting}>
          {isSubmitting ? "Logging in…" : "Log In"}
        </button>

        <p className={styles.hint}>Use any email containing “admin” to preview admin access.</p>
      </form>

      {message ? (
        <p className={message.type === "error" ? styles.error : styles.success}>{message.text}</p>
      ) : null}

      <p className={styles.linkRow}>
        Need an account? <Link href="/register">Register instead</Link>.
      </p>
    </div>
  );
}
