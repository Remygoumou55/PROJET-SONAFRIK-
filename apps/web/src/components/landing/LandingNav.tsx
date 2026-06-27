"use client";

import Link from "next/link";
import { useSyncExternalStore } from "react";
import { SonafrikLogo } from "./SonafrikLogo";

const NAV_LINKS = [
  { label: "Comment ça marche", href: "#comment-ca-marche" },
  { label: "Tarifs", href: "#tarifs" },
  { label: "FAQ", href: "#faq" },
] as const;

function subscribeScroll(onStoreChange: () => void) {
  window.addEventListener("scroll", onStoreChange, { passive: true });
  return () => window.removeEventListener("scroll", onStoreChange);
}

function getScrollSnapshot() {
  return window.scrollY > 8;
}

function getServerScrollSnapshot() {
  return false;
}

export function LandingNav() {
  const scrolled = useSyncExternalStore(
    subscribeScroll,
    getScrollSnapshot,
    getServerScrollSnapshot,
  );

  return (
    <div className={`landing-nav${scrolled ? " landing-nav--scrolled" : ""}`}>
      <nav className="landing-nav__inner">
        <SonafrikLogo variant="nav" size="sm" href="/" priority className="landing-nav__brand" />

        <div className="landing-nav-links landing-nav__links">
          {NAV_LINKS.map(({ label, href }) => (
            <Link key={href} href={href} className="landing-nav-anchor landing-nav__anchor">
              {label}
            </Link>
          ))}
        </div>

        <div className="landing-nav__actions">
          <Link href="/auth/connexion" className="landing-nav-login landing-nav__login">
            Se connecter
          </Link>
          <Link href="/auth/connexion" className="landing-nav__join">
            Rejoindre
          </Link>
        </div>
      </nav>
    </div>
  );
}
