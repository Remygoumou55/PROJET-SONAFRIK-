export default function SessionsLoading() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-3">
      <div className="h-5 w-44 rounded-lg animate-pulse" style={{ backgroundColor: "#1F1F1F" }} />
      {[...Array(3)].map((_, i) => (
        <div
          key={i}
          className="flex items-center justify-between rounded-2xl p-4 animate-pulse"
          style={{ backgroundColor: "#1F1F1F", animationDelay: `${i * 80}ms` }}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex-shrink-0" style={{ backgroundColor: "#2A2A2A" }} />
            <div className="space-y-1.5">
              <div className="h-3.5 w-32 rounded" style={{ backgroundColor: "#2A2A2A" }} />
              <div className="h-3 w-24 rounded" style={{ backgroundColor: "#2A2A2A" }} />
            </div>
          </div>
          <div className="h-7 w-20 rounded-lg" style={{ backgroundColor: "#2A2A2A" }} />
        </div>
      ))}
    </div>
  );
}
