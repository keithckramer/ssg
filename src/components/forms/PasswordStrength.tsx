import { useMemo } from "react";
import styles from "@/app/auth.module.css";

type Requirement = {
  id: string;
  label: string;
  met: boolean;
};

type PasswordStrengthProps = {
  password: string;
  id: string;
};

function evaluatePassword(password: string) {
  const requirements: Requirement[] = [
    {
      id: "length",
      label: "At least 12 characters",
      met: password.length >= 12,
    },
    {
      id: "uppercase",
      label: "Contains an uppercase letter",
      met: /[A-Z]/.test(password),
    },
    {
      id: "lowercase",
      label: "Contains a lowercase letter",
      met: /[a-z]/.test(password),
    },
    {
      id: "number",
      label: "Contains a number",
      met: /[0-9]/.test(password),
    },
    {
      id: "symbol",
      label: "Contains a symbol",
      met: /[^A-Za-z0-9]/.test(password),
    },
  ];

  const metCount = requirements.filter((item) => item.met).length;
  const score = Math.min(requirements.length, Math.max(0, metCount + (password.length >= 16 ? 1 : 0)));

  const labels = ["Very weak", "Weak", "Fair", "Good", "Strong", "Excellent"];
  const label = password
    ? labels[Math.min(labels.length - 1, Math.max(0, score))]
    : "Use a long, complex password to keep your account secure.";

  return { label, score, requirements };
}

export function PasswordStrength({ password, id }: PasswordStrengthProps) {
  const { label, score, requirements } = useMemo(() => evaluatePassword(password), [password]);

  return (
    <div className={styles.passwordStrength} aria-live="polite">
      <div className={styles.passwordStrengthMeter} aria-hidden="true">
        {Array.from({ length: 5 }).map((_, index) => (
          <span
            key={index}
            className={
              index < Math.min(5, score)
                ? `${styles.passwordStrengthSegment} ${styles.passwordStrengthSegmentActive}`
                : styles.passwordStrengthSegment
            }
          />
        ))}
      </div>
      <p id={id} className={styles.passwordStrengthLabel}>
        {label}
      </p>
      <ul className={styles.passwordChecklist}>
        {requirements.map((requirement) => (
          <li
            key={requirement.id}
            className={
              requirement.met
                ? `${styles.passwordRequirement} ${styles.passwordRequirementMet}`
                : styles.passwordRequirement
            }
          >
            <span aria-hidden="true" className={styles.passwordRequirementIcon}>
              {requirement.met ? "✔" : "•"}
            </span>
            <span>{requirement.label}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
