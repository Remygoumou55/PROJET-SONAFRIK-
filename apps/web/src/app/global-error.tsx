"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="fr" className="dark">
      <body style={{ backgroundColor: "#0D0D0D", margin: 0 }}>
        <div
          style={{
            minHeight: "100vh",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: "1rem",
            padding: "1rem",
          }}
        >
          <h1
            style={{
              fontSize: "1.5rem",
              fontWeight: 800,
              color: "#FFFFFF",
              margin: 0,
            }}
          >
            SONA<span style={{ color: "#00D26A" }}>FRIK</span>
          </h1>
          <p style={{ fontSize: "0.875rem", color: "#A0A0A0", textAlign: "center", margin: 0 }}>
            Une erreur inattendue est survenue. Nos équipes en sont informées.
          </p>
          {process.env.NODE_ENV !== "production" && error.message && (
            <p style={{ fontSize: "0.75rem", color: "#555555", textAlign: "center", margin: 0, fontFamily: "monospace" }}>
              {error.message}
            </p>
          )}
          <button
            onClick={reset}
            style={{
              padding: "0.625rem 1.25rem",
              borderRadius: "0.75rem",
              fontSize: "0.875rem",
              fontWeight: 600,
              backgroundColor: "#00D26A",
              color: "#0D0D0D",
              border: "none",
              cursor: "pointer",
            }}
          >
            Réessayer
          </button>
        </div>
      </body>
    </html>
  );
}
