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
      style={{ backgroundColor: "#0D0D0D" }}
    >
      {isNoCreator ? (
        <>
          <p className="text-sm text-center" style={{ color: "#A0A0A0" }}>
            Vous n&apos;avez pas encore de profil artiste sur SONAFRIK.
          </p>
          <Link
            href="/profile"
            className="px-5 py-2.5 rounded-xl text-sm font-semibold"
            style={{ backgroundColor: "#00D26A", color: "#0D0D0D" }}
          >
            Configurer mon profil artiste
          </Link>
        </>
      ) : (
        <>
          <p className="text-sm text-center" style={{ color: "#A0A0A0" }}>
            {error.message || "Impossible de charger l'espace créateur."}
          </p>
          <button
            onClick={reset}
            className="px-5 py-2.5 rounded-xl text-sm font-semibold"
            style={{ backgroundColor: "#00D26A", color: "#0D0D0D" }}
          >
            Réessayer
          </button>
        </>
      )}
    </div>
  );
}
