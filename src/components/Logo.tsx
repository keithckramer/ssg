import Link from "next/link";
import styles from "./Logo.module.css";

export function Logo() {
  return (
    <Link href="/" className={styles.logo} aria-label="Sports Stick Game home">
      <svg
        className={styles.icon}
        viewBox="0 0 48 48"
        role="presentation"
        aria-hidden="true"
      >
        <rect x="4" y="10" width="40" height="10" rx="5" className={styles.bar} />
        <rect x="10" y="26" width="28" height="12" rx="6" className={styles.barLight} />
      </svg>
      <span className={styles.wordmark}>
        <strong>SSG</strong>
        <span className={styles.subtitle}>Sports Stick Game</span>
      </span>
    </Link>
  );
}

export default Logo;
