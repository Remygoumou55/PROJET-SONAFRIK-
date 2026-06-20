export default function PlaylistLoading() {
  return (
    <div className="p-6 max-w-3xl animate-pulse">
      <div className="flex items-start gap-3 mb-6">
        <div className="w-5 h-5 rounded mt-1" style={{ backgroundColor: "#1F1F1F" }} />
        <div className="space-y-2 flex-1">
          <div className="h-6 w-48 rounded" style={{ backgroundColor: "#1F1F1F" }} />
          <div className="h-3 w-32 rounded" style={{ backgroundColor: "#2A2A2A" }} />
        </div>
      </div>
      <div className="space-y-2">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="flex items-center gap-3 px-3 py-2.5 rounded-xl" style={{ animationDelay: `${i * 50}ms` }}>
            <div className="w-8 h-4 rounded" style={{ backgroundColor: "#2A2A2A" }} />
            <div className="w-10 h-10 rounded-lg flex-shrink-0" style={{ backgroundColor: "#1F1F1F" }} />
            <div className="flex-1 space-y-1.5">
              <div className="h-3 w-36 rounded" style={{ backgroundColor: "#1F1F1F" }} />
              <div className="h-2 w-24 rounded" style={{ backgroundColor: "#2A2A2A" }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
