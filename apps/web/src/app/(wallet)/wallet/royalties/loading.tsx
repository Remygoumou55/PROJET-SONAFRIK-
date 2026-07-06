export default function RoyaltiesLoading() {
  return (
    <div className="space-y-6">
      <div
        className="rounded-xl p-4 animate-pulse"
        style={{
          backgroundColor: "var(--color-card)",
          border: "1px solid color-mix(in srgb, var(--color-or-solaire) 20%, transparent)",
        }}
      >
        <div className="h-3.5 w-36 rounded mb-2" style={{ backgroundColor: "var(--color-elevated)" }} />
        <div className="h-8 w-16 rounded mb-2" style={{ backgroundColor: "var(--color-elevated)" }} />
        <div className="h-3 w-full rounded" style={{ backgroundColor: "var(--color-elevated)" }} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        {[...Array(2)].map((_, i) => (
          <div
            key={i}
            className="rounded-xl p-4 animate-pulse"
            style={{ backgroundColor: "var(--color-card)", animationDelay: `${i * 80}ms` }}
          >
            <div className="h-3.5 w-24 rounded mb-2" style={{ backgroundColor: "var(--color-elevated)" }} />
            <div className="h-7 w-20 rounded" style={{ backgroundColor: "var(--color-elevated)" }} />
          </div>
        ))}
      </div>
      {[...Array(4)].map((_, i) => (
        <div
          key={i}
          className="rounded-xl p-4 animate-pulse"
          style={{ backgroundColor: "var(--color-card)", animationDelay: `${i * 70}ms` }}
        >
          <div className="flex items-center justify-between">
            <div className="space-y-1.5">
              <div className="h-3.5 w-32 rounded" style={{ backgroundColor: "var(--color-elevated)" }} />
              <div className="h-3 w-48 rounded" style={{ backgroundColor: "var(--color-elevated)" }} />
            </div>
            <div className="h-6 w-16 rounded-full" style={{ backgroundColor: "var(--color-elevated)" }} />
          </div>
        </div>
      ))}
    </div>
  );
}
