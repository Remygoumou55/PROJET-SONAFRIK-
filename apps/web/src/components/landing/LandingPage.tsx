import type { ReactNode } from "react";

interface LandingPageProps {
  children: ReactNode;
}

export function LandingPage({ children }: LandingPageProps) {
  return (
    <div
      style={{
        position: "relative",
        overflow: "hidden",
        backgroundColor: "var(--color-noir-profond)",
        minHeight: "100vh",
      }}
    >
      {/* Glow 1 — vert haut gauche */}
      <div
        style={{
          position: "fixed",
          top: "-150px",
          left: "-150px",
          width: "600px",
          height: "600px",
          background: "radial-gradient(circle, rgba(0,210,106,0.07) 0%, transparent 70%)",
          pointerEvents: "none",
          zIndex: 0,
        }}
      />
      {/* Glow 2 — doré haut droit */}
      <div
        style={{
          position: "fixed",
          top: "0",
          right: "-150px",
          width: "500px",
          height: "500px",
          background: "radial-gradient(circle, rgba(255,194,14,0.05) 0%, transparent 70%)",
          pointerEvents: "none",
          zIndex: 0,
        }}
      />
      {/* Glow 3 — vert centre (ellipse) */}
      <div
        style={{
          position: "fixed",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: "900px",
          height: "500px",
          background:
            "radial-gradient(ellipse, rgba(0,210,106,0.04) 0%, transparent 70%)",
          pointerEvents: "none",
          zIndex: 0,
        }}
      />
      {/* Glow 4 — doré bas droit (ellipse) */}
      <div
        style={{
          position: "fixed",
          bottom: "0",
          right: "-100px",
          width: "600px",
          height: "400px",
          background:
            "radial-gradient(ellipse, rgba(255,194,14,0.04) 0%, transparent 70%)",
          pointerEvents: "none",
          zIndex: 0,
        }}
      />
      {/* Glow 5 — bleu bas gauche */}
      <div
        style={{
          position: "fixed",
          bottom: "100px",
          left: "-100px",
          width: "500px",
          height: "500px",
          background: "radial-gradient(circle, rgba(55,138,221,0.05) 0%, transparent 70%)",
          pointerEvents: "none",
          zIndex: 0,
        }}
      />

      {/* Contenu principal */}
      <div
        style={{
          position: "relative",
          zIndex: 1,
          maxWidth: "960px",
          margin: "0 auto",
          padding: "0 24px 64px",
        }}
      >
        {children}
      </div>
    </div>
  );
}
