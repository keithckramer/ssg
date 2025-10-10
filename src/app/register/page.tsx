"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import styles from "../auth.module.css";
import { Input } from "@/components/ui/Input";
import { useAuth } from "@/context/AuthContext";

export default function RegisterPage() {
  const { login } = useAuth();
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState<{ type: "error" | "success"; text: string } | null>(null);
  const [isSubmitting, setSubmitting] = useState(false);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage(null);

    if (!name.trim() || !email.trim()) {
      setMessage({ type: "error", text: "Name and email are required." });
      return;
    }

    setSubmitting(true);
    try {
      login(email, name);
      setMessage({ type: "success", text: "Welcome aboard! Redirecting…" });
      router.push("/me");
    } catch (error) {
      setMessage({ type: "error", text: error instanceof Error ? error.message : "Registration failed" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.heading}>
        <h1 className={styles.title}>Create your account</h1>
        <p className={styles.subtitle}>A name and email is all you need to start managing your stick games.</p>
      </div>

      <form className={styles.form} onSubmit={handleSubmit}>
        <label className={styles.label} htmlFor="name">
          Name
          <Input
            id="name"
            type="text"
            autoComplete="name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Jordan Stickhandler"
            required
          />
        </label>

        <label className={styles.label} htmlFor="email">
          Email
          <Input
            id="email"
            type="email"
            inputMode="email"
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="you@example.com"
            required
          />
        </label>

        <button type="submit" className={styles.submit} disabled={isSubmitting}>
          {isSubmitting ? "Creating account…" : "Register"}
        </button>
      </form>

      {message ? (
        <p className={message.type === "error" ? styles.error : styles.success}>{message.text}</p>
      ) : null}

      <p className={styles.linkRow}>
        Already have an account? <Link href="/login">Log in</Link>.
      </p>
    </div>
  );
}
