export default function WalletLoading() {
  return (
    <div className="max-w-xl mx-auto px-4 py-6 space-y-6">
      {/* Balance card */}
      <div
        className="h-40 w-full rounded-3xl animate-pulse"
        style={{ backgroundColor: "var(--color-card)" }}
      />
      {/* Nav tabs */}
      <div className="flex gap-2">
        {[...Array(3)].map((_, i) => (
          <div
            key={i}
            className="h-9 flex-1 rounded-xl animate-pulse"
            style={{ backgroundColor: "var(--color-card)", animationDelay: `${i * 60}ms` }}
          />
        ))}
      </div>
      {/* Transaction rows */}
      {[...Array(5)].map((_, i) => (
        <div
          key={i}
          className="flex items-center justify-between animate-pulse"
          style={{ animationDelay: `${i * 70}ms` }}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full" style={{ backgroundColor: "var(--color-card)" }} />
            <div className="space-y-1.5">
              <div className="h-3.5 w-32 rounded" style={{ backgroundColor: "var(--color-card)" }} />
              <div className="h-3 w-20 rounded" style={{ backgroundColor: "var(--color-card)" }} />
            </div>
          </div>
          <div className="h-3.5 w-16 rounded" style={{ backgroundColor: "var(--color-card)" }} />
        </div>
      ))}
    </div>
  );
}
