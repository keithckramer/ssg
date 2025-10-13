"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import styles from "../auth.module.css";
import { AuthField } from "@/components/forms/AuthField";
import { Input } from "@/components/ui/Input";
import { useAuth } from "@/context/AuthContext";
import { apiClient } from "@/lib/apiClient";
import { setAccessToken } from "@/lib/authClient";
import { trackEvent } from "@/lib/analytics";
import type { User } from "@/types/user";

const loginSchema = z.object({
  email: z.string().trim().email("Enter a valid email address."),
  password: z.string().min(1, "Enter your password."),
});

type LoginFormValues = z.infer<typeof loginSchema>;

type SummaryItem = {
  id?: string;
  message: string;
};

export default function LoginPage() {
  const router = useRouter();
  const { setUser, refreshUser } = useAuth();
  const [formError, setFormError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [focusSummary, setFocusSummary] = useState(false);
  const errorSummaryRef = useRef<HTMLDivElement>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  });

  const errorItems = useMemo<SummaryItem[]>(() => {
    const items: SummaryItem[] = [];
    if (formError) {
      items.push({ message: formError });
    }

    ("email,password".split(",") as Array<keyof LoginFormValues>).forEach((field) => {
      const message = errors[field]?.message;
      if (message) {
        items.push({ id: field, message });
      }
    });

    return items;
  }, [errors, formError]);

  useEffect(() => {
    if (!focusSummary || errorItems.length === 0) return;

    const frame = requestAnimationFrame(() => {
      errorSummaryRef.current?.focus();
      setFocusSummary(false);
    });

    return () => {
      cancelAnimationFrame(frame);
    };
  }, [focusSummary, errorItems]);

  useEffect(() => {
    if (!formError) return;
    if (Object.keys(errors).length === 0) {
      setFormError(null);
    }
  }, [errors, formError]);

  const onSubmit = handleSubmit(
    async (values) => {
      setFormError(null);
      try {
        const response = await apiClient<{ accessToken?: string; user?: User }>("/auth/login", {
          method: "POST",
          body: JSON.stringify(values),
          skipAuth: true,
        });

        if (response?.accessToken) {
          setAccessToken(response.accessToken);
        }

        const account = response?.user ?? (await refreshUser());
        if (account) {
          setUser(account);
        }

        trackEvent("login_success", {
          email: (response?.user ?? account)?.email ?? values.email,
        });

        router.replace("/");
      } catch (error) {
        setFormError("We couldn’t sign you in with those credentials. Please try again.");
        setFocusSummary(true);
      }
    },
    () => {
      setFormError("Please correct the highlighted fields before continuing.");
      setFocusSummary(true);
    },
  );

  return (
    <div className={styles.page}>
      <div className={styles.heading}>
        <h1 className={styles.title}>Log in</h1>
        <p className={styles.subtitle}>Enter your account details to hop back into the action.</p>
      </div>

      <form className={styles.form} noValidate onSubmit={onSubmit}>
        {errorItems.length > 0 ? (
          <div
            className={styles.errorSummary}
            role="alert"
            aria-live="assertive"
            tabIndex={-1}
            ref={errorSummaryRef}
          >
            <h2 className={styles.errorSummaryTitle}>We ran into a problem</h2>
            <ul className={styles.errorSummaryList}>
              {errorItems.map((item, index) => (
                <li key={`${item.id ?? "form"}-${index}`}>
                  {item.id ? (
                    <a
                      href={`#${item.id}`}
                      onClick={(event) => {
                        event.preventDefault();
                        document.getElementById(item.id!)?.focus();
                      }}
                    >
                      {item.message}
                    </a>
                  ) : (
                    item.message
                  )}
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        <AuthField
          id="email"
          label="Email"
          error={errors.email?.message}
          input={
            <Input
              type="email"
              inputMode="email"
              autoComplete="email"
              placeholder="you@example.com"
              {...register("email")}
            />
          }
        />

        <AuthField
          id="password"
          label="Password"
          error={errors.password?.message}
          input={
            <Input
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              placeholder="Enter your password"
              {...register("password")}
            />
          }
          inputAppend={
            <button
              type="button"
              className={styles.revealButton}
              aria-pressed={showPassword}
              onClick={() => setShowPassword((value) => !value)}
            >
              {showPassword ? "Hide" : "Show"}
            </button>
          }
        />

        <button type="submit" className={styles.submit} disabled={isSubmitting}>
          {isSubmitting ? "Logging in…" : "Log in"}
        </button>
      </form>

      <p className={styles.linkRow}>
        Need an account? <Link href="/register">Register instead</Link>.
      </p>
    </div>
  );
}
