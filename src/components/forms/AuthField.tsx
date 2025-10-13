import { cloneElement, isValidElement, ReactElement, ReactNode } from "react";
import styles from "@/app/auth.module.css";

import type { InputProps } from "@/components/ui/Input";

export type AuthFieldProps = {
  id: string;
  label: ReactNode;
  input: ReactElement<InputProps>;
  error?: string;
  hint?: ReactNode;
  describedBy?: string[];
  inputAppend?: ReactNode;
  children?: ReactNode;
};

export function AuthField({
  id,
  label,
  input,
  error,
  hint,
  describedBy = [],
  inputAppend,
  children,
}: AuthFieldProps) {
  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const descriptionIds = [...describedBy];
  if (hintId) descriptionIds.push(hintId);
  if (errorId) descriptionIds.push(errorId);

  const mergedInput = isValidElement<InputProps>(input)
    ? cloneElement(input, {
        id,
        "aria-describedby": descriptionIds.length ? descriptionIds.join(" ") : undefined,
        "aria-invalid": error ? "true" : undefined,
        isInvalid: error ? true : input.props.isInvalid,
      })
    : input;

  return (
    <div className={styles.field}>
      <label className={styles.labelRow} htmlFor={id}>
        <span className={styles.labelText}>{label}</span>
      </label>
      {hint ? (
        <p id={hintId} className={styles.hint}>
          {hint}
        </p>
      ) : null}
      <div className={`${styles.inputWrapper} ${error ? styles.inputWrapperInvalid : ""}`}>
        {mergedInput}
        {inputAppend ? <div className={styles.inputAppend}>{inputAppend}</div> : null}
      </div>
      {children}
      {error ? (
        <p id={errorId} className={styles.errorMessage} aria-live="polite">
          {error}
        </p>
      ) : null}
    </div>
  );
}
