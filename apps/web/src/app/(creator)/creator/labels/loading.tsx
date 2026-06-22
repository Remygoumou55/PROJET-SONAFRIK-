export default function LabelsLoading() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-4">
      <div className="flex items-center justify-between mb-6">
        <div className="h-6 w-24 rounded-xl animate-pulse" style={{ backgroundColor: "var(--color-card)" }} />
        <div className="h-9 w-28 rounded-xl animate-pulse" style={{ backgroundColor: "var(--color-card)", animationDelay: "60ms" }} />
      </div>
      {[...Array(3)].map((_, i) => (
        <div
          key={i}
          className="flex items-center gap-4 p-4 rounded-2xl animate-pulse"
          style={{ backgroundColor: "var(--color-skeleton)", animationDelay: `${i * 80}ms` }}
        >
          <div className="w-12 h-12 rounded-xl flex-shrink-0" style={{ backgroundColor: "var(--color-card)" }} />
          <div className="flex-1 space-y-2">
            <div className="h-4 w-36 rounded" style={{ backgroundColor: "var(--color-card)" }} />
            <div className="h-3 w-20 rounded" style={{ backgroundColor: "var(--color-card)" }} />
          </div>
          <div className="h-7 w-16 rounded-lg" style={{ backgroundColor: "var(--color-card)" }} />
        </div>
      ))}
    </div>
  );
}
