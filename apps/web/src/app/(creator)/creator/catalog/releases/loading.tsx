export default function ReleasesLoading() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-4">
      {/* Header + add button */}
      <div className="flex items-center justify-between mb-6">
        <div className="h-6 w-32 rounded-xl animate-pulse" style={{ backgroundColor: "#1F1F1F" }} />
        <div className="h-9 w-28 rounded-xl animate-pulse" style={{ backgroundColor: "#1F1F1F", animationDelay: "60ms" }} />
      </div>
      {/* Album rows */}
      {[...Array(4)].map((_, i) => (
        <div
          key={i}
          className="flex items-center gap-4 p-4 rounded-2xl animate-pulse"
          style={{ backgroundColor: "#141414", animationDelay: `${i * 80}ms` }}
        >
          <div className="w-16 h-16 rounded-xl flex-shrink-0" style={{ backgroundColor: "#1F1F1F" }} />
          <div className="flex-1 space-y-2">
            <div className="h-4 w-40 rounded" style={{ backgroundColor: "#1F1F1F" }} />
            <div className="h-3 w-24 rounded" style={{ backgroundColor: "#1F1F1F" }} />
          </div>
          <div className="h-8 w-20 rounded-xl" style={{ backgroundColor: "#1F1F1F" }} />
        </div>
      ))}
    </div>
  );
}
