export default function AuthLoading() {
  return (
    <div
      className="min-h-screen flex items-center justify-center"
      style={{ backgroundColor: "#0D0D0D" }}
    >
      <div className="flex flex-col items-center gap-5 w-full max-w-sm px-6">
        {/* Logo skeleton */}
        <div className="w-32 h-8 rounded-lg animate-pulse" style={{ backgroundColor: "#1F1F1F" }} />
        {/* Form skeleton */}
        <div className="w-full space-y-3">
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className="w-full h-12 rounded-xl animate-pulse"
              style={{ backgroundColor: "#1F1F1F", animationDelay: `${i * 80}ms` }}
            />
          ))}
        </div>
        {/* Button skeleton */}
        <div className="w-full h-12 rounded-xl animate-pulse" style={{ backgroundColor: "#00D26A22" }} />
      </div>
    </div>
  );
}
