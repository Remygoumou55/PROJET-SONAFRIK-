export default function AuthLoading() {
  return (
    <div
      className="min-h-screen flex items-center justify-center"
      style={{ backgroundColor: "var(--color-noir-profond)" }}
    >
      <div className="flex flex-col items-center gap-5 w-full max-w-sm px-6">
        {/* Logo skeleton */}
        <div className="w-32 h-8 rounded-lg animate-pulse" style={{ backgroundColor: "var(--color-card)" }} />
        {/* Form skeleton */}
        <div className="w-full space-y-3">
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className="w-full h-12 rounded-xl animate-pulse"
              style={{ backgroundColor: "var(--color-card)", animationDelay: `${i * 80}ms` }}
            />
          ))}
        </div>
        {/* Button skeleton */}
        <div className="w-full h-12 rounded-xl animate-pulse" style={{ backgroundColor: "rgba(0, 210, 106, 0.13)" }} />
      </div>
    </div>
  );
}
