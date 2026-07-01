import { AuthPageShell } from "./AuthPageShell";

/** Fallback Suspense — même arbre DOM que ConnexionPageClient pour éviter hydration mismatch. */
export function AuthPageLoading() {
  return (
    <AuthPageShell
      title="Bienvenue sur SONAFRIK"
      subtitle="Découvrez, écoutez, soutenez et développez la musique guinéenne, africaine et mondiale."
      className="auth-page-google-only"
    >
      <div className="flex justify-center py-12" aria-busy="true" aria-label="Chargement">
        <div
          className="h-8 w-8 animate-spin rounded-full border-2"
          style={{ borderColor: "var(--color-vert-energie)", borderTopColor: "transparent" }}
        />
      </div>
    </AuthPageShell>
  );
}
