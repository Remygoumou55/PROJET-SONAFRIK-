export default function AlbumDetailLoading() {
  return (
    <div className="p-6 max-w-3xl">
      <div className="flex gap-5 mb-8 animate-pulse">
        <div className="w-36 h-36 rounded-xl flex-shrink-0" style={{ backgroundColor: "var(--color-card)" }} />
        <div className="flex flex-col justify-end gap-2 flex-1">
          <div className="h-3 w-12 rounded" style={{ backgroundColor: "var(--color-elevated)" }} />
          <div className="h-6 w-48 rounded" style={{ backgroundColor: "var(--color-elevated)" }} />
          <div className="h-3 w-24 rounded" style={{ backgroundColor: "var(--color-elevated)" }} />
          <div className="h-3 w-16 rounded" style={{ backgroundColor: "var(--color-elevated)" }} />
        </div>
      </div>
      <div className="space-y-2 animate-pulse">
        {[...Array(5)].map((_, i) => (
          <div
            key={i}
            className="h-14 rounded-xl"
            style={{ backgroundColor: "var(--color-card)", animationDelay: `${i * 60}ms` }}
          />
        ))}
      </div>
    </div>
  );
}
