"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Logo from "./Logo";
import NavLink from "./NavLink";
import styles from "./Navbar.module.css";
import { useAuth } from "@/context/AuthContext";
import { getInitials } from "@/lib/ui";

export default function Navbar() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const closeMenu = useCallback(() => setMenuOpen(false), []);
  const closeMobile = useCallback(() => setMobileOpen(false), []);

  useEffect(() => {
    if (!mobileOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setMobileOpen(false);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [mobileOpen]);

  useEffect(() => {
    if (!menuOpen) return;
    const menuEl = menuRef.current;
    const buttonEl = menuButtonRef.current;

    const focusableElements = Array.from(
      menuEl?.querySelectorAll<HTMLElement>("a, button, [tabindex]:not([tabindex='-1'])") ?? [],
    );
    focusableElements[0]?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        setMenuOpen(false);
        buttonEl?.focus();
        return;
      }

      if (event.key === "Tab" && focusableElements.length > 0) {
        const first = focusableElements[0];
        const last = focusableElements[focusableElements.length - 1];
        const active = document.activeElement as HTMLElement | null;

        if (!event.shiftKey && active === last) {
          event.preventDefault();
          first.focus();
        } else if (event.shiftKey && active === first) {
          event.preventDefault();
          last.focus();
        }
      }
    };

    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      if (!menuEl) return;
      if (menuEl.contains(event.target as Node)) return;
      if (buttonEl?.contains(event.target as Node)) return;
      setMenuOpen(false);
    };

    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("touchstart", handleClickOutside);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, [menuOpen]);

  useEffect(() => {
    if (!menuOpen) return;
    const handleScroll = () => setMenuOpen(false);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [menuOpen]);

  const handleLogout = useCallback(() => {
    logout();
    closeMenu();
    closeMobile();
    router.push("/");
  }, [logout, closeMenu, closeMobile, router]);

  const navItems = useMemo(() => {
    const items = [{ href: "/", label: "Home" }];

    if (user?.role === "admin") {
      items.push({ href: "/admin", label: "Admin" });
    }

    if (user) {
      items.push({ href: "/me", label: "Me" });
    } else {
      items.push({ href: "/login", label: "Login" });
      items.push({ href: "/register", label: "Register" });
    }

    return items;
  }, [user]);

  const avatar = useMemo(() => {
    if (!user) return null;
    if (user.image) {
      return <img src={user.image} alt="" className={styles.avatarImage} />;
    }
    return <span>{getInitials(user.name, user.email)}</span>;
  }, [user]);

  return (
    <header className={styles.header}>
      <div className={styles.inner}>
        <div className={styles.left}>
          <Logo />
        </div>

        <button
          type="button"
          className={styles.mobileToggle}
          aria-label="Toggle navigation menu"
          aria-expanded={mobileOpen}
          aria-controls="primary-navigation"
          onClick={() => setMobileOpen((open) => !open)}
        >
          <svg viewBox="0 0 24 24" className={styles.mobileIcon} aria-hidden="true">
            {mobileOpen ? (
              <path
                fill="currentColor"
                d="M18.3 5.71 12 12l6.3 6.29-1.41 1.42L10.17 12l6.72-7.71z"
              />
            ) : (
              <path
                fill="currentColor"
                d="M4 6h16v2H4zm0 5h16v2H4zm0 5h16v2H4z"
              />
            )}
          </svg>
          <span className={styles.srOnly}>Menu</span>
        </button>

        <nav
          id="primary-navigation"
          className={`${styles.nav} ${mobileOpen ? styles.navOpen : ""}`}
          aria-label="Primary"
        >
          <ul className={styles.navList}>
            {navItems.map(({ href, label }) => (
              <li key={href}>
                <NavLink href={href} onNavigate={closeMobile}>
                  {label}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        <div className={styles.actions}>
          {user ? (
            <>
              <button
                type="button"
                className={styles.avatarButton}
                aria-haspopup="menu"
                aria-expanded={menuOpen}
                aria-controls="user-menu"
                onClick={() => setMenuOpen((open) => !open)}
                ref={menuButtonRef}
              >
                <span className={styles.avatar} aria-hidden="true">
                  {avatar}
                </span>
                <span className={styles.srOnly}>Open account menu</span>
              </button>
              <div
                id="user-menu"
                className={`${styles.menu} ${menuOpen ? styles.menuOpen : ""}`}
                role="menu"
                ref={menuRef}
              >
                <div className={styles.menuHeader}>
                  <div className={styles.menuName}>{user.name}</div>
                  <div className={styles.menuEmail}>{user.email}</div>
                  {user.role ? <span className={styles.roleTag}>{user.role}</span> : null}
                </div>
                <div className={styles.menuList}>
                  <Link
                    href="/me"
                    className={`${styles.menuItem} ${styles.menuLink}`}
                    role="menuitem"
                    tabIndex={menuOpen ? 0 : -1}
                    onClick={() => {
                      closeMenu();
                      closeMobile();
                    }}
                  >
                    Profile
                  </Link>
                  <div className={styles.menuDivider} aria-hidden="true" />
                  <button
                    type="button"
                    className={styles.menuItem}
                    role="menuitem"
                    onClick={handleLogout}
                  >
                    Logout
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className={styles.authLinks}>
              <Link href="/login" className={styles.authButton} onClick={closeMobile}>
                Log In
              </Link>
              <Link href="/register" className={styles.authButton} onClick={closeMobile}>
                Register
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
