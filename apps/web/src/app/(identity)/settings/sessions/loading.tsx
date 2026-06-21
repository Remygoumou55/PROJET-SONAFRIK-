export default function SessionsLoading() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-3">
      <div className="h-5 w-44 rounded-lg animate-pulse" style={{ backgroundColor: "var(--color-card)" }} />
      {[...Array(3)].map((_, i) => (
        <div
          key={i}
          className="flex items-center justify-between rounded-2xl p-4 animate-pulse"
          style={{ backgroundColor: "var(--color-card)", animationDelay: `${i * 80}ms` }}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex-shrink-0" style={{ backgroundColor: "var(--color-elevated)" }} />
            <div className="space-y-1.5">
              <div className="h-3.5 w-32 rounded" style={{ backgroundColor: "var(--color-elevated)" }} />
              <div className="h-3 w-24 rounded" style={{ backgroundColor: "var(--color-elevated)" }} />
            </div>
          </div>
          <div className="h-7 w-20 rounded-lg" style={{ backgroundColor: "var(--color-elevated)" }} />
        </div>
      ))}
    </div>
  );
}
