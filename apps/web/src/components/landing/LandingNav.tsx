"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

export function LandingNav() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div
      style={{
        position: "sticky",
        top: 0,
        zIndex: 50,
        marginLeft: "-24px",
        marginRight: "-24px",
        marginBottom: "52px",
        padding: "16px 24px",
        background: scrolled ? "rgba(13, 13, 13, 0.95)" : "transparent",
        backdropFilter: scrolled ? "blur(12px)" : "none",
        WebkitBackdropFilter: scrolled ? "blur(12px)" : "none",
        borderBottom: scrolled ? "1px solid rgba(255,255,255,0.06)" : "0.5px solid rgba(255,255,255,0.08)",
        transition: "background 0.3s ease, border-color 0.3s ease",
      }}
    >
      <nav
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: "3px" }}>
          <div
            style={{
              fontSize: "22px",
              fontWeight: 600,
              letterSpacing: "4px",
              lineHeight: 1,
            }}
          >
            <span style={{ color: "var(--color-texte-principal)" }}>SON</span>
            <span style={{ color: "var(--color-or-solaire)" }}>A</span>
            <span style={{ color: "var(--color-vert-energie)" }}>FRIK</span>
          </div>
          <div
            style={{
              fontSize: "10px",
              color: "var(--color-or-solaire)",
              letterSpacing: "2.5px",
              textTransform: "uppercase",
            }}
          >
            Notre Bien Commun
          </div>
        </div>

        <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
          <Link
            href="/auth/connexion"
            className="landing-nav-login"
            style={{
              border: "0.5px solid rgba(255,255,255,0.18)",
              color: "rgba(255,255,255,0.65)",
              padding: "8px 18px",
              borderRadius: "8px",
              fontSize: "14px",
              textDecoration: "none",
              display: "inline-block",
            }}
          >
            Se connecter
          </Link>
          <Link
            href="/auth/connexion"
            style={{
              backgroundColor: "var(--color-vert-energie)",
              color: "var(--color-noir-profond)",
              fontWeight: 600,
              padding: "8px 18px",
              borderRadius: "8px",
              fontSize: "14px",
              textDecoration: "none",
              display: "inline-block",
            }}
          >
            Rejoindre
          </Link>
        </div>
      </nav>
    </div>
  );
}
