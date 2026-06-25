import { AuthPageShell } from "./AuthPageShell";

/** Fallback Suspense — même arbre DOM que ConnexionPageClient pour éviter hydration mismatch. */
export function AuthPageLoading() {
  return (
    <AuthPageShell title="Créer votre compte" subtitle="Écoute · Participe · Prospère">
      <div className="flex justify-center py-12" aria-busy="true" aria-label="Chargement">
        <div
          className="h-8 w-8 animate-spin rounded-full border-2"
          style={{ borderColor: "var(--color-vert-energie)", borderTopColor: "transparent" }}
        />
      </div>
    </AuthPageShell>
  );
}
