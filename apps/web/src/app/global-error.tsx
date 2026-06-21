"use client";

import { useEffect } from "react";
import * as Sentry from "@sentry/nextjs";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);
  return (
    <html lang="fr" className="dark">
      <body style={{ backgroundColor: "var(--color-noir-profond)", margin: 0 }}>
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
              color: "var(--color-texte-principal)",
              margin: 0,
            }}
          >
            SONA<span style={{ color: "var(--color-vert-energie)" }}>FRIK</span>
          </h1>
          <p style={{ fontSize: "0.875rem", color: "var(--color-texte-secondaire)", textAlign: "center", margin: 0 }}>
            Une erreur inattendue est survenue. Nos équipes en sont informées.
          </p>
          {process.env.NODE_ENV !== "production" && error.message && (
            <p style={{ fontSize: "0.75rem", color: "var(--color-texte-desactive)", textAlign: "center", margin: 0, fontFamily: "monospace" }}>
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
              backgroundColor: "var(--color-vert-energie)",
              color: "var(--color-noir-profond)",
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
