"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import styles from "../auth.module.css";
import { AuthField } from "@/components/forms/AuthField";
import { PasswordStrength } from "@/components/forms/PasswordStrength";
import { Input } from "@/components/ui/Input";
import { useAuth } from "@/context/AuthContext";
import { apiClient, ApiError } from "@/lib/apiClient";
import { setAccessToken } from "@/lib/authClient";
import { trackEvent } from "@/lib/analytics";
import type { User } from "@/types/user";

const registerSchema = z.object({
  name: z.string().trim().min(2, "Enter your full name."),
  email: z.string().trim().email("Enter a valid email address."),
  password: z
    .string()
    .min(12, "Use at least 12 characters.")
    .regex(/[A-Z]/, "Include at least one uppercase letter.")
    .regex(/[a-z]/, "Include at least one lowercase letter.")
    .regex(/[0-9]/, "Include at least one number.")
    .regex(/[^A-Za-z0-9]/, "Include at least one symbol."),
});

type RegisterFormValues = z.infer<typeof registerSchema>;

type SummaryItem = {
  id?: string;
  message: string;
};

export default function RegisterPage() {
  const router = useRouter();
  const { setUser, refreshUser } = useAuth();
  const [formError, setFormError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [focusSummary, setFocusSummary] = useState(false);
  const errorSummaryRef = useRef<HTMLDivElement>(null);

  const {
    register,
    handleSubmit,
    watch,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
  });

  const passwordValue = watch("password") ?? "";
  const passwordStrengthId = "password-strength";

  const errorItems = useMemo<SummaryItem[]>(() => {
    const items: SummaryItem[] = [];
    if (formError) {
      items.push({ message: formError });
    }

    ("name,email,password".split(",") as Array<keyof RegisterFormValues>).forEach((field) => {
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
    // Clear general form errors when all field errors have been resolved.
    if (Object.keys(errors).length === 0) {
      setFormError(null);
    }
  }, [errors, formError]);

  const onSubmit = handleSubmit(
    async (values) => {
      setFormError(null);
      try {
        const response = await apiClient<{ accessToken?: string; user?: User }>("/auth/register", {
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

        trackEvent("register_completed", {
          email: (response?.user ?? account)?.email ?? values.email,
        });

        router.replace("/");
      } catch (error) {
        if (error instanceof ApiError) {
          if (error.fieldErrors) {
            (Object.entries(error.fieldErrors) as Array<[
              keyof RegisterFormValues,
              string[],
            ]>).forEach(([field, messages]) => {
              if (messages.length > 0) {
                setError(field, { type: "server", message: messages[0] });
              }
            });
          }
          setFormError(error.message || "We couldn’t create your account. Please try again.");
        } else {
          setFormError("We couldn’t create your account. Please try again.");
        }
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
        <h1 className={styles.title}>Create your account</h1>
        <p className={styles.subtitle}>
          A name, email, and secure password are all you need to start managing your stick games.
        </p>
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
            <h2 className={styles.errorSummaryTitle}>There’s a problem</h2>
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
          id="name"
          label="Name"
          error={errors.name?.message}
          input={
            <Input
              type="text"
              autoComplete="name"
              placeholder="Jordan Stickhandler"
              {...register("name")}
            />
          }
        />

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
          describedBy={[passwordStrengthId]}
          input={
            <Input
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              placeholder="Create a strong password"
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
        >
          <PasswordStrength id={passwordStrengthId} password={passwordValue} />
        </AuthField>

        <button type="submit" className={styles.submit} disabled={isSubmitting}>
          {isSubmitting ? "Creating account…" : "Create account"}
        </button>
      </form>

      <p className={styles.linkRow}>
        Already have an account? <Link href="/login">Log in</Link>.
      </p>
    </div>
  );
}
