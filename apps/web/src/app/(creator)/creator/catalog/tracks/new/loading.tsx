export default function CatalogPublishLoading() {
  return (
    <div className="pub-wiz" aria-busy="true" aria-label="Chargement de l'assistant de publication">
      <div className="pub-wiz__progress" style={{ display: "flex", gap: "0.75rem", padding: "1rem 1.25rem" }}>
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className="pub-skeleton"
            style={{
              width: "2rem",
              height: "2rem",
              borderRadius: "50%",
              animationDelay: `${i * 80}ms`,
            }}
          />
        ))}
      </div>
      <div
        className="pub-skeleton pub-skeleton--card"
        style={{ minHeight: "28rem", margin: "0 1.25rem 1.5rem", animationDelay: "120ms" }}
      />
    </div>
  );
}
