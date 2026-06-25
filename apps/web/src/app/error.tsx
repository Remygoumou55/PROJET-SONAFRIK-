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
    <div className="app-page-shell">
      <div className="app-page-main">
        <div className="app-page-content flex flex-col items-center gap-4 px-4 text-center">
          {isNoCreator ? (
            <>
              <div className="mb-2 flex size-16 items-center justify-center rounded-2xl border border-vert-energie/20 bg-vert-energie/10">
                <svg
                  width={28}
                  height={28}
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="var(--color-vert-energie)"
                  strokeWidth={1.5}
                >
                  <path d="M9 19V6l12-3v13" strokeLinecap="round" strokeLinejoin="round" />
                  <circle cx="6" cy="19" r="3" fill="var(--color-vert-energie)" stroke="none" />
                  <circle cx="18" cy="16" r="3" fill="var(--color-vert-energie)" stroke="none" />
                </svg>
              </div>
              <div className="space-y-1 text-center">
                <p className="text-base font-semibold text-texte-principal">
                  Profil artiste introuvable
                </p>
                <p className="max-w-xs text-sm text-texte-secondaire">
                  Vous n&apos;avez pas encore de profil artiste sur SONAFRIK.
                  Configurez votre compte depuis votre profil.
                </p>
              </div>
              <Link
                href="/profile"
                className="rounded-xl bg-vert-energie px-5 py-2.5 text-sm font-semibold text-noir-profond"
              >
                Accéder à mon profil
              </Link>
            </>
          ) : (
            <>
              <p className="text-sm text-texte-secondaire">
                {"Une erreur inattendue est survenue."}
              </p>
              <button
                type="button"
                onClick={reset}
                className="rounded-xl bg-vert-energie px-5 py-2.5 text-sm font-semibold text-noir-profond"
              >
                Réessayer
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
