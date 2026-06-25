import type { ReactNode } from "react";
import Link from "next/link";
import { LandingSearchBar } from "./LandingSearchBar";

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
          color: "var(--color-vert-energie)",
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
            backgroundColor: "var(--color-vert-energie)",
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
          color: "var(--color-texte-principal)",
          margin: "0 0 16px",
        }}
      >
        La musique guinéenne
        <br />
        <em style={{ color: "var(--color-vert-energie)", fontStyle: "normal" }}>
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
          marginBottom: "8px",
          flexWrap: "wrap",
        }}
      >
        <Link
          href="/auth/connexion"
          style={{
            backgroundColor: "var(--color-vert-energie)",
            color: "var(--color-noir-profond)",
            fontSize: "15px",
            fontWeight: 600,
            padding: "13px 28px",
            borderRadius: "8px",
            textDecoration: "none",
            display: "inline-block",
          }}
        >
          Commencer maintenant
        </Link>
        <Link
          href="#comment-ca-marche"
          style={{
            backgroundColor: "transparent",
            border: "0.5px solid rgba(255,255,255,0.2)",
            color: "var(--color-texte-principal)",
            fontSize: "15px",
            fontWeight: 500,
            padding: "13px 28px",
            borderRadius: "8px",
            textDecoration: "none",
            display: "inline-block",
          }}
        >
          En savoir plus
        </Link>
      </div>

      <LandingSearchBar />

      {/* Hint */}
      <p
        style={{
          fontSize: "12px",
          color: "rgba(255,255,255,0.28)",
          margin: "12px 0 0",
        }}
      >
        Gratuit · Aucune carte requise · 2 minutes
      </p>

      {/* Carte de progression (injectée par LandingProgress) */}
      {children}
    </section>
  );
}
