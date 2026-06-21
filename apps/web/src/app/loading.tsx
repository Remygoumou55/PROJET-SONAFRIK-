export default function RootLoading() {
  return (
    <div
      className="min-h-screen flex items-center justify-center"
      style={{ backgroundColor: "var(--color-noir-profond)" }}
    >
      <div className="flex flex-col items-center gap-6 w-full max-w-sm px-4">
        {/* Logo skeleton */}
        <div
          className="w-12 h-12 rounded-2xl animate-pulse"
          style={{ backgroundColor: "var(--color-card)" }}
        />
        {/* Cards skeleton */}
        {[...Array(3)].map((_, i) => (
          <div
            key={i}
            className="w-full h-16 rounded-2xl animate-pulse"
            style={{ backgroundColor: "var(--color-card)", animationDelay: `${i * 100}ms` }}
          />
        ))}
      </div>
    </div>
  );
}
