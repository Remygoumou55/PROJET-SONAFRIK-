export default function LibraryLoading() {
  return (
    <div className="p-6 max-w-3xl animate-pulse">
      <div className="h-8 w-32 rounded-lg mb-6" style={{ backgroundColor: "var(--color-card)" }} />
      <div className="space-y-3">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="flex items-center gap-3 p-3 rounded-xl" style={{ animationDelay: `${i * 50}ms` }}>
            <div className="w-12 h-12 rounded-lg flex-shrink-0" style={{ backgroundColor: "var(--color-card)" }} />
            <div className="flex-1 space-y-2">
              <div className="h-3 w-40 rounded" style={{ backgroundColor: "var(--color-card)" }} />
              <div className="h-2 w-24 rounded" style={{ backgroundColor: "var(--color-elevated)" }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
