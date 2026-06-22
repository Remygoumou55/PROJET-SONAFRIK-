export default function TeamLoading() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-4">
      <div className="flex items-center justify-between mb-6">
        <div className="h-6 w-28 rounded-xl animate-pulse" style={{ backgroundColor: "var(--color-card)" }} />
        <div className="h-9 w-32 rounded-xl animate-pulse" style={{ backgroundColor: "var(--color-card)", animationDelay: "60ms" }} />
      </div>
      {[...Array(4)].map((_, i) => (
        <div
          key={i}
          className="flex items-center gap-3 p-4 rounded-2xl animate-pulse"
          style={{ backgroundColor: "var(--color-skeleton)", animationDelay: `${i * 70}ms` }}
        >
          <div className="w-10 h-10 rounded-full flex-shrink-0" style={{ backgroundColor: "var(--color-card)" }} />
          <div className="flex-1 space-y-1.5">
            <div className="h-3.5 w-32 rounded" style={{ backgroundColor: "var(--color-card)" }} />
            <div className="h-2.5 w-20 rounded" style={{ backgroundColor: "var(--color-card)" }} />
          </div>
          <div className="h-6 w-16 rounded-full" style={{ backgroundColor: "var(--color-card)" }} />
        </div>
      ))}
    </div>
  );
}
