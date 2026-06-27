export default function StreamingLoading() {
  return (
    <div
      className="min-h-screen pb-28"
      style={{ backgroundColor: "var(--color-noir-profond)" }}
    >
      <div className="px-4 pt-6 pb-4">
        <div className="h-11 w-full rounded-2xl animate-pulse" style={{ backgroundColor: "var(--color-card)" }} />
      </div>
      <div className="px-4 space-y-3">
        {[...Array(8)].map((_, i) => (
          <div
            key={i}
            className="flex items-center gap-3 animate-pulse"
            style={{ animationDelay: `${i * 60}ms` }}
          >
            <div className="w-12 h-12 rounded-xl flex-shrink-0" style={{ backgroundColor: "var(--color-card)" }} />
            <div className="flex-1 space-y-2">
              <div className="h-3.5 w-3/4 rounded" style={{ backgroundColor: "var(--color-card)" }} />
              <div className="h-3 w-1/2 rounded" style={{ backgroundColor: "var(--color-card)" }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
