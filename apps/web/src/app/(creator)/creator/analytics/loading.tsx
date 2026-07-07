export default function AnalyticsLoading() {
  return (
    <div className="analytics-page" aria-busy="true" aria-label="Chargement des statistiques">
      <div className="analytics-page__header">
        <div>
          <div
            className="h-6 w-32 rounded animate-pulse"
            style={{ backgroundColor: "var(--color-card)" }}
          />
          <div
            className="mt-2 h-4 w-full max-w-md rounded animate-pulse"
            style={{ backgroundColor: "var(--color-card)", animationDelay: "80ms" }}
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className="h-7 w-16 rounded-full animate-pulse"
              style={{ backgroundColor: "var(--color-card)", animationDelay: `${i * 50}ms` }}
            />
          ))}
        </div>
      </div>

      <div className="analytics-kpis">
        {[...Array(4)].map((_, i) => (
          <div
            key={i}
            className="h-20 rounded-xl animate-pulse"
            style={{ backgroundColor: "var(--color-card)", animationDelay: `${120 + i * 60}ms` }}
          />
        ))}
      </div>

      <div
        className="h-52 rounded-2xl animate-pulse"
        style={{ backgroundColor: "var(--color-card)", animationDelay: "360ms" }}
      />

      <div className="analytics-page__rankings">
        {[...Array(2)].map((_, i) => (
          <div
            key={i}
            className="h-56 rounded-xl animate-pulse"
            style={{ backgroundColor: "var(--color-card)", animationDelay: `${420 + i * 80}ms` }}
          />
        ))}
      </div>
    </div>
  );
}
