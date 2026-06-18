import Link from "next/link";

export function LandingNav() {
  return (
    <nav
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "24px 0 28px",
        borderBottom: "0.5px solid rgba(255,255,255,0.08)",
        marginBottom: "52px",
      }}
    >
      {/* Logo + slogans */}
      <div style={{ display: "flex", flexDirection: "column", gap: "3px" }}>
        <div
          style={{
            fontSize: "22px",
            fontWeight: 600,
            letterSpacing: "4px",
            lineHeight: 1,
          }}
        >
          <span style={{ color: "#ffffff" }}>SON</span>
          <span style={{ color: "#FFC20E" }}>A</span>
          <span style={{ color: "#00D26A" }}>FRIK</span>
        </div>
        <div
          style={{
            fontSize: "10px",
            color: "#FFC20E",
            letterSpacing: "2.5px",
            textTransform: "uppercase",
          }}
        >
          Notre Bien Commun
        </div>
        <div
          style={{
            fontSize: "9px",
            color: "rgba(255,255,255,0.3)",
            letterSpacing: "2px",
            textTransform: "uppercase",
          }}
        >
          Écoute · Participe · Prospère
        </div>
      </div>

      {/* Boutons */}
      <div style={{ display: "flex", gap: "12px" }}>
        <Link
          href="/auth/connexion"
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
          href="/auth/inscription"
          style={{
            backgroundColor: "#00D26A",
            color: "#0D0D0D",
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
  );
}
