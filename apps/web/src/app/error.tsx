"use client";

import { useEffect } from "react";
import * as Sentry from "@sentry/nextjs";
import Link from "next/link";

export default function RootError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);
  const isNoCreator = error.message === "CREATOR_NOT_FOUND";

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center gap-4 px-4"
      style={{ backgroundColor: "var(--color-noir-profond)" }}
    >
      {isNoCreator ? (
        <>
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center mb-2"
            style={{ background: "rgba(0, 210, 106, 0.08)", border: "1px solid rgba(0, 210, 106, 0.19)" }}
          >
            <svg width={28} height={28} viewBox="0 0 24 24" fill="none" stroke="var(--color-vert-energie)" strokeWidth={1.5}>
              <path d="M9 19V6l12-3v13" strokeLinecap="round" strokeLinejoin="round" />
              <circle cx="6" cy="19" r="3" fill="var(--color-vert-energie)" stroke="none" />
              <circle cx="18" cy="16" r="3" fill="var(--color-vert-energie)" stroke="none" />
            </svg>
          </div>
          <div className="text-center space-y-1">
            <p className="text-base font-semibold" style={{ color: "var(--color-texte-principal)" }}>
              Profil artiste introuvable
            </p>
            <p className="text-sm max-w-xs" style={{ color: "var(--color-texte-secondaire)" }}>
              Vous n&apos;avez pas encore de profil artiste sur SONAFRIK.
              Configurez votre compte depuis votre profil.
            </p>
          </div>
          <Link
            href="/profile"
            className="px-5 py-2.5 rounded-xl text-sm font-semibold"
            style={{ backgroundColor: "var(--color-vert-energie)", color: "var(--color-noir-profond)" }}
          >
            Accéder à mon profil
          </Link>
        </>
      ) : (
        <>
          <p className="text-sm text-center" style={{ color: "var(--color-texte-secondaire)" }}>
            {"Une erreur inattendue est survenue."}
          </p>
          <button
            onClick={reset}
            className="px-5 py-2.5 rounded-xl text-sm font-semibold"
            style={{ backgroundColor: "var(--color-vert-energie)", color: "var(--color-noir-profond)" }}
          >
            Réessayer
          </button>
        </>
      )}
    </div>
  );
}
