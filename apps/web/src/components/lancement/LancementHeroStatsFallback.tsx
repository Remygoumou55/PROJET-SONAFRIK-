export function LancementHeroStatsFallback() {
  return (
    <div className="lancement-hero-stats-fallback flex justify-center gap-8 py-6" aria-hidden="true">
      <div className="h-14 w-24 rounded-lg bg-[var(--t8-surface-03)]/50 animate-pulse" />
      <div className="h-14 w-24 rounded-lg bg-[var(--t8-surface-03)]/50 animate-pulse" style={{ animationDelay: "100ms" }} />
    </div>
  );
}
