import Link from "next/link";

export function LandingFinalCTA() {
  return (
    <div
      style={{
        backgroundColor: "rgba(255,255,255,0.03)",
        border: "0.5px solid rgba(255,255,255,0.08)",
        borderRadius: "14px",
        padding: "48px",
        textAlign: "center",
        marginBottom: "48px",
      }}
    >
      <h2
        style={{
          fontSize: "28px",
          fontWeight: 600,
          color: "var(--color-texte-principal)",
          marginBottom: "12px",
        }}
      >
        Votre place est ici.
      </h2>
      <p
        style={{
          fontSize: "15px",
          color: "rgba(255,255,255,0.45)",
          maxWidth: "500px",
          margin: "0 auto 28px",
          lineHeight: 1.65,
        }}
      >
        Chaque abonné fait avancer le compteur. Ensemble, on débloque le lancement et on change
        comment la musique guinéenne est valorisée.
      </p>

      <div
        style={{
          display: "flex",
          justifyContent: "center",
          gap: "12px",
          flexWrap: "wrap",
        }}
      >
        <Link
          href="/auth/inscription"
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
          Rejoindre maintenant →
        </Link>
        <Link
          href="/lancement"
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
    </div>
  );
}
