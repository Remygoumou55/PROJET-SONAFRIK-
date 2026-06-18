import type { ReactNode } from "react";
import Link from "next/link";

interface LandingHeroProps {
  children?: ReactNode;
}

export function LandingHero({ children }: LandingHeroProps) {
  return (
    <section style={{ textAlign: "center", paddingBottom: "64px" }}>
      {/* Pill animée */}
      <div
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "6px",
          backgroundColor: "rgba(0,210,106,0.08)",
          border: "0.5px solid rgba(0,210,106,0.25)",
          color: "#00D26A",
          fontSize: "12px",
          padding: "5px 14px",
          borderRadius: "20px",
          marginBottom: "28px",
        }}
      >
        <span
          className="landing-pulse-dot"
          style={{
            width: "6px",
            height: "6px",
            borderRadius: "50%",
            backgroundColor: "#00D26A",
            flexShrink: 0,
          }}
        />
        Lancement en cours — Guinée Conakry
      </div>

      {/* Titre H1 */}
      <h1
        className="landing-hero-h1"
        style={{
          fontSize: "44px",
          fontWeight: 600,
          lineHeight: 1.2,
          color: "#ffffff",
          margin: "0 0 16px",
        }}
      >
        La musique guinéenne
        <br />
        <em style={{ color: "#00D26A", fontStyle: "normal" }}>
          mérite sa plateforme
        </em>
      </h1>

      {/* Sous-titre */}
      <p
        style={{
          fontSize: "16px",
          color: "rgba(255,255,255,0.5)",
          maxWidth: "500px",
          margin: "16px auto 36px",
          lineHeight: 1.6,
        }}
      >
        SONAFRIK rémunère directement les artistes. Chaque écoute compte.
        Rejoignez la communauté qui débloque le lancement.
      </p>

      {/* Boutons CTA */}
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          gap: "12px",
          marginBottom: "16px",
          flexWrap: "wrap",
        }}
      >
        <Link
          href="/auth/inscription?role=artist"
          style={{
            backgroundColor: "#00D26A",
            color: "#0D0D0D",
            fontSize: "15px",
            fontWeight: 600,
            padding: "13px 28px",
            borderRadius: "8px",
            textDecoration: "none",
            display: "inline-block",
          }}
        >
          Rejoindre comme artiste →
        </Link>
        <Link
          href="/auth/inscription?role=listener"
          style={{
            backgroundColor: "transparent",
            border: "0.5px solid rgba(255,255,255,0.2)",
            color: "#ffffff",
            fontSize: "15px",
            fontWeight: 500,
            padding: "13px 28px",
            borderRadius: "8px",
            textDecoration: "none",
            display: "inline-block",
          }}
        >
          Rejoindre comme auditeur
        </Link>
      </div>

      {/* Hint */}
      <p
        style={{
          fontSize: "12px",
          color: "rgba(255,255,255,0.28)",
          margin: "0 0 0",
        }}
      >
        Gratuit · Aucune carte requise · 2 minutes
      </p>

      {/* Carte de progression (injectée par LandingProgress) */}
      {children}
    </section>
  );
}
