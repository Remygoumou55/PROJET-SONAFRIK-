"use client";

export default function StreamingError({
  error: _error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div
      className="flex flex-col items-center justify-center min-h-[60vh] gap-4 px-4"
      style={{ backgroundColor: "var(--color-noir-profond)" }}
    >
      <p className="text-sm text-center" style={{ color: "var(--color-texte-secondaire)" }}>
        {"Impossible de charger le lecteur."}
      </p>
      <button
        onClick={reset}
        className="px-5 py-2.5 rounded-xl text-sm font-semibold"
        style={{ backgroundColor: "var(--color-vert-energie)", color: "var(--color-noir-profond)" }}
      >
        Réessayer
      </button>
    </div>
  );
}
