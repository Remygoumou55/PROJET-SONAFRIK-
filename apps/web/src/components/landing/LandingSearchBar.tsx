/** Barre de recherche hero — redirige vers /search (route publique). */
export function LandingSearchBar() {
  return (
    <form
      action="/search"
      method="get"
      className="landing-search-form"
      style={{
        display: "flex",
        maxWidth: "480px",
        margin: "24px auto 0",
        gap: "8px",
      }}
    >
      <input
        type="search"
        name="q"
        placeholder="Rechercher un artiste, un album…"
        aria-label="Rechercher un artiste ou un album"
        className="landing-search-input"
        style={{
          flex: 1,
          minHeight: "48px",
          padding: "0 16px",
          borderRadius: "10px",
          border: "1px solid var(--color-bordure)",
          backgroundColor: "var(--color-surface)",
          color: "var(--color-texte-principal)",
          fontSize: "15px",
        }}
      />
      <button
        type="submit"
        style={{
          minHeight: "48px",
          padding: "0 20px",
          borderRadius: "10px",
          border: "none",
          backgroundColor: "var(--color-vert-energie)",
          color: "var(--color-noir-profond)",
          fontSize: "14px",
          fontWeight: 600,
          cursor: "pointer",
        }}
      >
        Rechercher
      </button>
    </form>
  );
}
