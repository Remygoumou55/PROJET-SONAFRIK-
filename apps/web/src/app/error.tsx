"use client";

export default function RootError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center gap-4 px-4"
      style={{ backgroundColor: "#0D0D0D" }}
    >
      <p className="text-sm text-center" style={{ color: "#A0A0A0" }}>
        {error.message || "Une erreur inattendue est survenue."}
      </p>
      <button
        onClick={reset}
        className="px-5 py-2.5 rounded-xl text-sm font-semibold"
        style={{ backgroundColor: "#00D26A", color: "#0D0D0D" }}
      >
        Réessayer
      </button>
    </div>
  );
}
