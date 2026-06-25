"use client";

export default function AuthError({
  error: _error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="app-page-content flex flex-col items-center gap-4 px-4 text-center">
      <p className="text-sm text-texte-secondaire">
        {"Une erreur est survenue lors de l'authentification."}
      </p>
      <button
        type="button"
        onClick={reset}
        className="rounded-xl bg-vert-energie px-5 py-2.5 text-sm font-semibold text-noir-profond"
      >
        Réessayer
      </button>
    </div>
  );
}
