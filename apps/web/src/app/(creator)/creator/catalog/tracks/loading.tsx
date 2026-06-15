export default function TracksLoading() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="h-6 w-28 rounded-xl animate-pulse" style={{ backgroundColor: "#1F1F1F" }} />
        <div className="h-9 w-28 rounded-xl animate-pulse" style={{ backgroundColor: "#1F1F1F", animationDelay: "60ms" }} />
      </div>
      {/* Track rows */}
      {[...Array(6)].map((_, i) => (
        <div
          key={i}
          className="flex items-center gap-3 p-3 rounded-xl animate-pulse"
          style={{ backgroundColor: "#141414", animationDelay: `${i * 60}ms` }}
        >
          <div className="w-8 h-5 rounded flex-shrink-0" style={{ backgroundColor: "#1F1F1F" }} />
          <div className="w-10 h-10 rounded-lg flex-shrink-0" style={{ backgroundColor: "#1F1F1F" }} />
          <div className="flex-1 space-y-1.5">
            <div className="h-3.5 w-1/2 rounded" style={{ backgroundColor: "#1F1F1F" }} />
            <div className="h-2.5 w-1/3 rounded" style={{ backgroundColor: "#1F1F1F" }} />
          </div>
          <div className="h-3 w-10 rounded" style={{ backgroundColor: "#1F1F1F" }} />
        </div>
      ))}
    </div>
  );
}
