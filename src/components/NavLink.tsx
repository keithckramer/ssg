"use client";

import Link, { LinkProps } from "next/link";
import { usePathname } from "next/navigation";
import { forwardRef } from "react";
import styles from "./Navbar.module.css";

type NavLinkProps = LinkProps & {
  children: React.ReactNode;
  onNavigate?: () => void;
  className?: string;
};

const NavLink = forwardRef<HTMLAnchorElement, NavLinkProps>(function NavLink(
  { href, children, onNavigate, className, ...rest },
  ref,
) {
  const pathname = usePathname();
  const currentPath = typeof href === "string" ? href : href.pathname ?? "";
  const isActive = currentPath === "/" ? pathname === currentPath : pathname.startsWith(String(currentPath));

  const classes = [styles.navLink];
  if (className) classes.push(className);
  if (isActive) classes.push(styles.navLinkActive);

  return (
    <Link
      {...rest}
      href={href}
      className={classes.join(" ")}
      onClick={onNavigate}
      ref={ref}
    >
      {children}
    </Link>
  );
});

export default NavLink;
