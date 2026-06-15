export default function VerificationLoading() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
      {/* Status badge */}
      <div className="h-16 w-full rounded-2xl animate-pulse" style={{ backgroundColor: "#1F1F1F" }} />
      {/* Steps */}
      {[...Array(3)].map((_, i) => (
        <div
          key={i}
          className="flex gap-4 p-4 rounded-2xl animate-pulse"
          style={{ backgroundColor: "#141414", animationDelay: `${i * 80}ms` }}
        >
          <div className="w-8 h-8 rounded-full flex-shrink-0" style={{ backgroundColor: "#1F1F1F" }} />
          <div className="flex-1 space-y-2">
            <div className="h-4 w-40 rounded" style={{ backgroundColor: "#1F1F1F" }} />
            <div className="h-3 w-full rounded" style={{ backgroundColor: "#1F1F1F" }} />
            <div className="h-3 w-3/4 rounded" style={{ backgroundColor: "#1F1F1F" }} />
          </div>
        </div>
      ))}
      <div className="h-11 w-40 rounded-xl animate-pulse" style={{ backgroundColor: "#1F1F1F", animationDelay: "280ms" }} />
    </div>
  );
}
