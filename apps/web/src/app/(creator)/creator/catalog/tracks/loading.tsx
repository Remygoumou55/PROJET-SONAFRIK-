export default function TracksLoading() {
  return (
    <div className="pub-library pub-library--loading" aria-busy="true" aria-label="Chargement des publications">
      <div className="pub-library__toolbar">
        <div className="pub-skeleton pub-skeleton--btn" />
      </div>
      <div className="pub-library__controls">
        <div className="pub-skeleton pub-skeleton--search" />
        <div className="pub-skeleton pub-skeleton--sort" />
      </div>
      <div className="pub-library__list">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="pub-skeleton pub-skeleton--card" style={{ animationDelay: `${i * 60}ms` }} />
        ))}
      </div>
    </div>
  );
}
