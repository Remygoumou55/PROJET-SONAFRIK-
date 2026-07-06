export default function CreatorLoading() {
  return (
    <div className="creator-dashboard space-y-4 py-2" aria-busy="true" aria-label="Chargement">
      <div className="ahero animate-pulse rounded-2xl bg-card" style={{ minHeight: "12rem" }} />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-20 animate-pulse rounded-2xl bg-card"
            style={{ animationDelay: `${i * 60}ms` }}
          />
        ))}
      </div>
    </div>
  );
}
