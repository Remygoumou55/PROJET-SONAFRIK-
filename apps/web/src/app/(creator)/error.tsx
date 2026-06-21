"use client";

import Link from "next/link";

export default function CreatorError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const isNoCreator = error.message === "CREATOR_NOT_FOUND";

  return (
    <div
      className="flex flex-col items-center justify-center min-h-[60vh] gap-4 px-4"
      style={{ backgroundColor: "var(--color-noir-profond)" }}
    >
      {isNoCreator ? (
        <>
          <p className="text-sm text-center" style={{ color: "var(--color-texte-secondaire)" }}>
            Vous n&apos;avez pas encore de profil artiste sur SONAFRIK.
          </p>
          <Link
            href="/profile"
            className="px-5 py-2.5 rounded-xl text-sm font-semibold"
            style={{ backgroundColor: "var(--color-vert-energie)", color: "var(--color-noir-profond)" }}
          >
            Configurer mon profil artiste
          </Link>
        </>
      ) : (
        <>
          <p className="text-sm text-center" style={{ color: "var(--color-texte-secondaire)" }}>
            {"Impossible de charger l'espace créateur."}
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
