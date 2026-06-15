export default function AnalyticsLoading() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
      {/* KPI cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <div
            key={i}
            className="h-24 rounded-2xl animate-pulse"
            style={{ backgroundColor: "#1F1F1F", animationDelay: `${i * 60}ms` }}
          />
        ))}
      </div>
      {/* Chart skeleton */}
      <div className="h-48 w-full rounded-2xl animate-pulse" style={{ backgroundColor: "#1F1F1F", animationDelay: "200ms" }} />
      {/* Row list */}
      <div className="space-y-3">
        {[...Array(5)].map((_, i) => (
          <div
            key={i}
            className="flex items-center gap-3 animate-pulse"
            style={{ animationDelay: `${280 + i * 60}ms` }}
          >
            <div className="w-10 h-10 rounded-xl flex-shrink-0" style={{ backgroundColor: "#1F1F1F" }} />
            <div className="flex-1 space-y-1.5">
              <div className="h-3 w-2/3 rounded" style={{ backgroundColor: "#1F1F1F" }} />
              <div className="h-2.5 w-1/3 rounded" style={{ backgroundColor: "#1F1F1F" }} />
            </div>
            <div className="h-4 w-12 rounded" style={{ backgroundColor: "#1F1F1F" }} />
          </div>
        ))}
      </div>
    </div>
  );
}
