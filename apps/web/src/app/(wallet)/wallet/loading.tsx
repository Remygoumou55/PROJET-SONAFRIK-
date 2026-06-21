export default function WalletLoading() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
      {/* Solde card */}
      <div className="h-36 w-full rounded-2xl animate-pulse" style={{ backgroundColor: "var(--color-card)" }} />
      {/* Action buttons */}
      <div className="grid grid-cols-3 gap-3">
        {[...Array(3)].map((_, i) => (
          <div
            key={i}
            className="h-20 rounded-2xl animate-pulse"
            style={{ backgroundColor: "var(--color-card)", animationDelay: `${i * 60}ms` }}
          />
        ))}
      </div>
      {/* Transaction list */}
      <div className="space-y-3">
        <div className="h-5 w-32 rounded animate-pulse" style={{ backgroundColor: "var(--color-card)", animationDelay: "180ms" }} />
        {[...Array(5)].map((_, i) => (
          <div
            key={i}
            className="flex items-center gap-3 animate-pulse"
            style={{ animationDelay: `${240 + i * 60}ms` }}
          >
            <div className="w-10 h-10 rounded-full flex-shrink-0" style={{ backgroundColor: "var(--color-card)" }} />
            <div className="flex-1 space-y-1.5">
              <div className="h-3 w-1/2 rounded" style={{ backgroundColor: "var(--color-card)" }} />
              <div className="h-2.5 w-1/3 rounded" style={{ backgroundColor: "var(--color-card)" }} />
            </div>
            <div className="h-4 w-14 rounded" style={{ backgroundColor: "var(--color-card)" }} />
          </div>
        ))}
      </div>
    </div>
  );
}
