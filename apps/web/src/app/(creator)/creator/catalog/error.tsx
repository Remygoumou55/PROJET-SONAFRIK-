"use client";

export default function CatalogError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div
      className="flex min-h-[50vh] flex-col items-center justify-center gap-4 px-4"
      style={{ backgroundColor: "var(--color-noir-profond)" }}
    >
      <p className="text-center text-sm" style={{ color: "var(--color-texte-secondaire)" }}>
        Impossible de charger le catalogue. Vérifiez votre connexion puis réessayez.
      </p>
      {process.env.NODE_ENV === "development" && error.message ? (
        <p className="max-w-md text-center text-xs" style={{ color: "var(--color-texte-desactive)" }}>
          {error.message}
        </p>
      ) : null}
      <button
        type="button"
        onClick={reset}
        className="rounded-xl px-5 py-2.5 text-sm font-semibold"
        style={{ backgroundColor: "var(--color-vert-energie)", color: "var(--color-noir-profond)" }}
      >
        Réessayer
      </button>
    </div>
  );
}
