import Link from "next/link";
import styles from "./home.module.css";

const QUICK_LINKS = [
  {
    href: "/game",
    title: "Match Center",
    description: "Jump into live matchups, follow scores, and manage your picks.",
  },
  {
    href: "/admin",
    title: "Admin Dashboard",
    description: "Approve invites, curate matchups, and keep the community running.",
  },
  {
    href: "/invites",
    title: "Invites",
    description: "Share the fun—send game invites to friends and teammates.",
  },
  {
    href: "/health",
    title: "Status",
    description: "Check the pulse of the Sports Stick Game services at a glance.",
  },
];

export default function HomePage() {
  return (
    <div className={styles.page}>
      <section className={styles.hero}>
        <h1 className={styles.title}>Welcome to Sports Stick Game</h1>
        <p className={styles.description}>
          Rally your crew, manage stick matches, and celebrate the wins—all from one place. This
          portal is your hub for everything SSG, from friendly exhibitions to competitive leagues.
        </p>
        <div className={styles.ctaRow}>
          <Link href="/register" className={styles.primaryCta}>
            Get Started
          </Link>
          <Link href="/game" className={styles.secondaryCta}>
            Browse Matchups
          </Link>
        </div>
      </section>

      <section>
        <h2>Quick Links</h2>
        <div className={styles.cards}>
          {QUICK_LINKS.map((link) => (
            <article key={link.href} className={styles.card}>
              <h3 className={styles.cardTitle}>{link.title}</h3>
              <p className={styles.cardDescription}>{link.description}</p>
              <Link href={link.href} className={styles.cardLink}>
                Explore
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path
                    fill="currentColor"
                    d="M5 11h10.59l-3.3-3.29L13 6l5 5-5 5-0.71-1.71L15.59 13H5z"
                  />
                </svg>
              </Link>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
