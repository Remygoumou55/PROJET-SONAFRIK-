export default function OnboardingLoading() {
  return (
    <div className="app-page-shell min-h-dvh animate-pulse" aria-busy="true" aria-label="Chargement">
      <div className="app-page-main max-w-lg mx-auto px-6 py-12 space-y-6">
        <div className="h-8 w-2/3 rounded-lg" style={{ backgroundColor: "var(--color-card)" }} />
        <div className="h-4 w-full rounded" style={{ backgroundColor: "var(--color-card)" }} />
        <div className="h-4 w-5/6 rounded" style={{ backgroundColor: "var(--color-card)" }} />
        <div className="h-12 w-full rounded-xl mt-8" style={{ backgroundColor: "var(--color-card)" }} />
        <div className="h-12 w-full rounded-xl" style={{ backgroundColor: "var(--color-card)" }} />
      </div>
    </div>
  );
}
