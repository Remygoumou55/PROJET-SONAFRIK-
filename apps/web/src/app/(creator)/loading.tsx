export default function CreatorLoading() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
      {/* Header stats */}
      <div className="grid grid-cols-3 gap-4">
        {[...Array(3)].map((_, i) => (
          <div
            key={i}
            className="h-24 rounded-2xl animate-pulse"
            style={{ backgroundColor: "var(--color-card)", animationDelay: `${i * 80}ms` }}
          />
        ))}
      </div>
      {/* Nav tabs skeleton */}
      <div className="flex gap-2">
        {[...Array(5)].map((_, i) => (
          <div
            key={i}
            className="h-9 w-24 rounded-xl animate-pulse"
            style={{ backgroundColor: "var(--color-card)", animationDelay: `${i * 60}ms` }}
          />
        ))}
      </div>
      {/* Content */}
      {[...Array(3)].map((_, i) => (
        <div
          key={i}
          className="h-16 w-full rounded-2xl animate-pulse"
          style={{ backgroundColor: "var(--color-card)", animationDelay: `${i * 80}ms` }}
        />
      ))}
    </div>
  );
}
