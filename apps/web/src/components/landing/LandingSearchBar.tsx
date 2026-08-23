/** Barre de recherche hero — redirige vers /search (route publique). */
export function LandingSearchBar() {
  return (
    <form action="/search" method="get" className="landing-search-form mx-auto mt-6 flex max-w-[480px] gap-2">
      <input
        type="search"
        name="q"
        placeholder="Rechercher un artiste, un album…"
        aria-label="Rechercher un artiste ou un album"
        className="landing-search-input min-h-12 flex-1 rounded-[10px] border border-[var(--t8-border-default)] bg-[var(--t8-surface-01)] px-4 text-[15px] text-[var(--t8-pearl)]"
      />
      <button
        type="submit"
        className="min-h-12 cursor-pointer rounded-[10px] border-none bg-[var(--t8-primary-lavender)] px-5 text-sm font-semibold text-[var(--t8-deep-black)]"
      >
        Rechercher
      </button>
    </form>
  );
}
