import type { ReactNode } from "react";
import Link from "next/link";

export default function OnboardingLayout({ children }: { children: ReactNode }) {
  return (
    <div style={{ minHeight: "100vh", backgroundColor: "var(--color-noir-profond)" }}>
      <header
        style={{
          display: "flex",
          justifyContent: "center",
          padding: "24px 0 20px",
          borderBottom: "0.5px solid rgba(255,255,255,0.06)",
        }}
      >
        <Link href="/" style={{ textDecoration: "none" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "2px" }}>
            <span style={{ fontWeight: 700, fontSize: "18px", color: "var(--color-flag-rouge)" }}>S</span>
            <span style={{ fontWeight: 700, fontSize: "18px", color: "var(--color-flag-jaune)" }}>O</span>
            <span style={{ fontWeight: 700, fontSize: "18px", color: "var(--color-flag-vert)" }}>N</span>
            <span style={{ fontWeight: 700, fontSize: "18px", color: "var(--color-texte-principal)" }}>AFRIK</span>
          </div>
        </Link>
      </header>
      <main>{children}</main>
    </div>
  );
}
