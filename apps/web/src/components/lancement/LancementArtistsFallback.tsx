export function LancementArtistsFallback() {
  return (
    <section className="lancement-artists-fallback px-6 py-10" aria-hidden="true">
      <div className="mx-auto mb-6 h-6 w-48 max-w-full rounded bg-[var(--t8-surface-03)]/50 animate-pulse" />
      <div className="mx-auto grid max-w-4xl grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
        {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
          <div
            key={i}
            className="aspect-square rounded-2xl bg-[var(--t8-surface-03)]/40 animate-pulse"
            style={{ animationDelay: `${i * 60}ms` }}
          />
        ))}
      </div>
    </section>
  );
}
