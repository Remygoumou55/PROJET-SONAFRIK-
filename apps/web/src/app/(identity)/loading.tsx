export default function IdentityLoading() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
      {/* Avatar + nom */}
      <div className="flex items-center gap-4">
        <div
          className="w-16 h-16 rounded-full animate-pulse flex-shrink-0"
          style={{ backgroundColor: "#1F1F1F" }}
        />
        <div className="flex-1 space-y-2">
          <div className="h-4 w-40 rounded-lg animate-pulse" style={{ backgroundColor: "#1F1F1F" }} />
          <div className="h-3 w-24 rounded-lg animate-pulse" style={{ backgroundColor: "#1F1F1F" }} />
        </div>
      </div>
      {/* Cards */}
      {[...Array(4)].map((_, i) => (
        <div
          key={i}
          className="h-20 w-full rounded-2xl animate-pulse"
          style={{ backgroundColor: "#1F1F1F", animationDelay: `${i * 80}ms` }}
        />
      ))}
    </div>
  );
}
