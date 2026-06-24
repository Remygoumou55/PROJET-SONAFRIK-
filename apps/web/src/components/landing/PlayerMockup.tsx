/** Mockup player mobile — visuel statique, aucune logique audio. */
export function PlayerMockup() {
  return (
    <div
      className="landing-player-mockup mx-auto w-full"
      style={{
        maxWidth: "380px",
        backgroundColor: "var(--color-surface)",
        borderRadius: "24px",
        border: "1px solid rgba(255,255,255,0.08)",
        padding: "24px",
        boxShadow:
          "0 40px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(0,210,106,0.1)",
      }}
    >
      <p
        style={{
          fontSize: "10px",
          textTransform: "uppercase",
          letterSpacing: "2px",
          color: "var(--color-vert-energie)",
          margin: "0 0 16px",
          fontWeight: 600,
        }}
      >
        En cours de lecture
      </p>

      <div
        style={{
          width: "100%",
          aspectRatio: "1",
          maxWidth: "280px",
          margin: "0 auto 20px",
          borderRadius: "16px",
          background:
            "linear-gradient(145deg, rgba(0,210,106,0.35) 0%, var(--color-noir-profond) 55%, rgba(255,194,14,0.2) 100%)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <span
          style={{
            fontSize: "48px",
            fontWeight: 700,
            color: "var(--color-texte-principal)",
            opacity: 0.9,
          }}
        >
          AD
        </span>
      </div>

      <h3
        style={{
          fontSize: "22px",
          fontWeight: 700,
          color: "var(--color-texte-principal)",
          margin: "0 0 4px",
          textAlign: "center",
        }}
      >
        Mouna
      </h3>
      <p
        style={{
          fontSize: "16px",
          color: "rgba(255,255,255,0.6)",
          margin: "0 0 20px",
          textAlign: "center",
        }}
      >
        Alpha Diallo
      </p>

      <div style={{ marginBottom: "8px" }}>
        <div
          className="landing-player-progress-track"
          style={{
            height: "4px",
            borderRadius: "2px",
            backgroundColor: "rgba(255,255,255,0.1)",
            overflow: "hidden",
          }}
        >
          <div className="landing-player-progress-fill" />
        </div>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            marginTop: "6px",
            fontSize: "12px",
            color: "rgba(255,255,255,0.4)",
          }}
        >
          <span>2:14</span>
          <span>3:42</span>
        </div>
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "24px",
          margin: "20px 0",
        }}
      >
        <span style={{ color: "rgba(255,255,255,0.5)", fontSize: "20px" }} aria-hidden="true">
          ⏮
        </span>
        <div
          style={{
            width: "56px",
            height: "56px",
            borderRadius: "50%",
            backgroundColor: "var(--color-vert-energie)",
            color: "var(--color-noir-profond)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "22px",
          }}
          aria-hidden="true"
        >
          ▶
        </div>
        <span style={{ color: "rgba(255,255,255,0.5)", fontSize: "20px" }} aria-hidden="true">
          ⏭
        </span>
      </div>

      <div
        style={{
          display: "flex",
          justifyContent: "center",
          gap: "28px",
          color: "rgba(255,255,255,0.4)",
          fontSize: "18px",
          marginBottom: "16px",
        }}
        aria-hidden="true"
      >
        <span>♥</span>
        <span>↗</span>
        <span>⬇</span>
      </div>

      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        <span
          style={{
            fontSize: "11px",
            color: "var(--color-or-solaire)",
            backgroundColor: "rgba(255,194,14,0.12)",
            border: "1px solid rgba(255,194,14,0.25)",
            borderRadius: "8px",
            padding: "4px 10px",
          }}
        >
          📶 Économie de données activée
        </span>
      </div>
    </div>
  );
}
